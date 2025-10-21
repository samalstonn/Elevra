/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  getStructurePrompt,
  getStructureResponseSchema,
} from "@/lib/gemini/prompts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ensure Node runtime (Edge has short limits)
export const maxDuration = 800; // extend serverless timeout (plan-dependent)

export async function POST(req: NextRequest) {
  try {
    const { previousOutput, promptPath, schemaPath, originalRows } =
      (await req.json()) as {
        previousOutput: string;
        promptPath?: string;
        schemaPath?: string;
        originalRows?: unknown[];
      };

    if (!previousOutput || typeof previousOutput !== "string") {
      return new Response("Missing previousOutput", { status: 400 });
    }

    const promptText = promptPath
      ? await fs.readFile(path.resolve(process.cwd(), promptPath), "utf8")
      : await getStructurePrompt();

    const customSchema = schemaPath
      ? JSON.parse(
          await fs.readFile(path.resolve(process.cwd(), schemaPath), "utf8")
        )
      : null;

    // Convert JSON schema (subset) to SDK Schema using Type enum
    function mapType(t?: string): Type | undefined {
      if (!t) return undefined;
      const v = t.toLowerCase();
      switch (v) {
        case "object":
          return Type.OBJECT;
        case "array":
          return Type.ARRAY;
        case "string":
          return Type.STRING;
        case "number":
          return Type.NUMBER;
        case "integer":
          return Type.INTEGER;
        case "boolean":
          return Type.BOOLEAN;
        case "null":
          return Type.NULL;
        default:
          return undefined;
      }
    }

    function convertSchema(node: any): any {
      if (!node || typeof node !== "object") return {};
      const out: any = {};
      const t = mapType(node.type);
      if (t !== undefined) out.type = t;
      if (Array.isArray(node.enum)) out.enum = node.enum.map(String);
      if (Array.isArray(node.required)) out.required = node.required;
      if (node.properties && typeof node.properties === "object") {
        out.properties = {} as Record<string, any>;
        for (const [k, v] of Object.entries(node.properties)) {
          out.properties[k] = convertSchema(v);
        }
      }
      if (node.items) {
        out.items = convertSchema(node.items);
      }
      // We intentionally skip constraints like maxItems/minItems to avoid
      // exceeding allowed nesting/complexity on server side.
      return out;
    }
    const responseSchema = customSchema
      ? convertSchema(customSchema)
      : await getStructureResponseSchema();

    // Live-call toggle and model selection
    const isProd = process.env.NODE_ENV === "production";
    const geminiEnabled = process.env.GEMINI_ENABLED
      ? process.env.GEMINI_ENABLED === "true"
      : isProd; // default: enabled in prod, disabled elsewhere
    const model = process.env.GEMINI_MODEL || "gemini-2.5-pro";
    const maxOutputTokens = Number(
      process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "4096"
    );

    if (geminiEnabled && !process.env.GEMINI_API_KEY) {
      return new Response("Missing GEMINI_API_KEY", { status: 500 });
    }

    if (!geminiEnabled) {
      // Build a deterministic structured mock. Try to derive basic fields.
      let city = "Sample City";
      let state = "Sample State";
      try {
        const parsed = JSON.parse(previousOutput);
        const first = Array.isArray(parsed)
          ? parsed[0]
          : parsed?.elections?.[0];
        if (first) {
          city = first?.election?.city || first?.city || city;
          state = first?.election?.state || first?.state || state;
        }
      } catch {}
      const mock = {
        elections: [
          {
            election: {
              title: "Mock Election (Structured)",
              type: "LOCAL",
              date: "11/04/2025",
              city,
              state,
              number_of_seats: "N/A",
              description:
                "Structured mock output (Gemini disabled in this environment).",
            },
            candidates: [
              {
                name: "Jane Doe",
                currentRole: "Candidate",
                party: "",
                image_url: "",
                linkedin_url: "",
                campaign_website_url: "",
                bio: "Mock candidate for local testing.",
                key_policies: ["Transparency", "Community"],
                home_city: city,
                hometown_state: state,
                additional_notes: "",
                sources: ["Local mock"],
              },
            ],
          },
        ],
      };
      return new Response(JSON.stringify(mock, null, 2), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Gemini-Mock": "1",
          "X-Gemini-Model": model,
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const useThinking =
      (process.env.GEMINI_THINKING || "").toLowerCase() === "true";
    const thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? "0");
    const baseConfig: any = {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema,
      maxOutputTokens: isNaN(maxOutputTokens) ? 4096 : maxOutputTokens,
    };
    if (useThinking)
      baseConfig.thinkingConfig = {
        thinkingBudget: isNaN(thinkingBudget) ? 0 : thinkingBudget,
      };

    const contents = [
      {
        role: "user" as const,
        parts: [
          { text: promptText },
          {
            text: "\n\nAttached data (from previous step):\n" + previousOutput,
          },
          ...(Array.isArray(originalRows)
            ? [
                {
                  text:
                    "\n\nOriginal spreadsheet rows (may include email to preserve):\n" +
                    JSON.stringify(originalRows, null, 2),
                } as const,
              ]
            : []),
        ],
      },
    ];

    let response: any;
    try {
      response = await ai.models.generateContentStream({
        model,
        config: baseConfig,
        contents,
      } as any);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("exceeds the maximum allowed nesting depth")) {
        console.warn("Schema too deep. Falling back to simplified schema.");
        const fallbackConfig: any = {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT },
        };
        response = await ai.models.generateContentStream({
          model,
          config: fallbackConfig,
          contents,
        } as any);
      } else {
        // Fallback: try non-stream minimal with simplified schema
        console.warn("Gemini structured stream failed:", msg);
        try {
          const minimalConfig: any = {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT },
          };
          const resp = await ai.models.generateContent({
            model,
            contents,
            config: minimalConfig,
          } as any);
          const text = (resp as any)?.text ?? JSON.stringify(resp);
          return new Response(String(text || ""), {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Gemini-Model": model,
              "X-Gemini-Fallback": "non-stream",
            },
          });
        } catch (e2: any) {
          console.error(
            "Gemini structured non-stream fallback failed:",
            e2?.message || e2
          );
          throw e;
        }
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of response as any) {
            const text = (chunk?.text ?? "") as string;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          controller.error(err);
          return;
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Gemini-Model": model,
      },
    });
  } catch (err: any) {
    console.error("/api/gemini/structure error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
