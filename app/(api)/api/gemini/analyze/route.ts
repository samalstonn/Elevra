/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { promises as fs } from "node:fs";
import { getAnalyzePrompt } from "@/lib/gemini/prompts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ensure Node runtime (Edge has very short timeouts)
export const maxDuration = 800; // bump Vercel function timeout (requires plan support)

export async function POST(req: NextRequest) {
  try {
    const { rows, promptPath } = (await req.json()) as {
      rows: unknown[];
      promptPath?: string;
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return new Response("No rows provided", { status: 400 });
    }

    const promptText = promptPath
      ? await fs.readFile(path.resolve(process.cwd(), promptPath), "utf8")
      : await getAnalyzePrompt();

    // (row limit and input block built after runtime/env checks)

    // --- Live-call toggle and model selection ---
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

    // Determine row limit now that isProd is known
    const maxRows = Number(
      process.env.GEMINI_MAX_ROWS ?? (isProd ? "100" : "100")
    );
    const limitedRows = rows.slice(
      0,
      isNaN(maxRows) ? (isProd ? 100 : 100) : maxRows
    );

    if (!geminiEnabled) {
      // Return a deterministic mock based on input rows for local/dev usage
      const city = (limitedRows[0] as any)?.municipality || "Sample City";
      const state = (limitedRows[0] as any)?.state || "Sample State";
      const year = (limitedRows[0] as any)?.year || "2025";
      const candidateName = `${(limitedRows[0] as any)?.firstName || "Jane"} ${
        (limitedRows[0] as any)?.lastName || "Doe"
      }`.trim();
      const mock = [
        {
          election: {
            title: "Mock Election",
            type: "LOCAL",
            date: "11/04/" + String(year).slice(-4),
            city,
            state,
            number_of_seats: "N/A",
            description: "Mock analysis (Gemini disabled in this environment).",
          },
          candidates: [
            {
              name: candidateName,
              currentRole: (limitedRows[0] as any)?.position || "Candidate",
              party: "N/A",
              image_url: "N/A",
              linkedin_url: "N/A",
              campaign_website_url: "N/A",
              bio: "Mock candidate generated locally.",
              key_policies: ["Community engagement", "Transparency"],
              home_city: city,
              hometown_state: state,
              additional_notes: "N/A",
              sources: ["Local import test"],
            },
          ],
        },
      ];
      const body = JSON.stringify(mock, null, 2);
      return new Response(body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Gemini-Mock": "1",
          "X-Gemini-Model": model,
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const fallbackModel = process.env.GEMINI_MODEL_FALLBACK || "gemini-1.5-pro";
    const useThinking =
      (process.env.GEMINI_THINKING || "").toLowerCase() === "true";
    const thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? "0");
    const useSearch =
      (process.env.GEMINI_TOOLS_GOOGLE_SEARCH || "").toLowerCase() === "true";

    // Note: Do NOT set responseMimeType when tools are enabled; Gemini rejects
    // tool use combined with responseMimeType. We keep analyze as free‑form text
    // and let the next step (structure) enforce JSON.
    const baseConfig: any = {
      temperature: 0,
      maxOutputTokens: isNaN(maxOutputTokens) ? 4096 : maxOutputTokens,
    };
    if (useThinking)
      baseConfig.thinkingConfig = {
        thinkingBudget: isNaN(thinkingBudget) ? 0 : thinkingBudget,
      };
    if (useSearch) baseConfig.tools = [{ googleSearch: {} }];

    const inputBlock = `\n\nElection details input (JSON rows):\n${JSON.stringify(
      limitedRows,
      null,
      2
    )}\n`;
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${promptText}\n${inputBlock}`,
          },
        ],
      },
    ];

    async function tryStream(m: string, c: any) {
      return ai.models.generateContentStream({
        model: m,
        config: c,
        contents,
      } as any);
    }

    let response: any;
    try {
      response = await tryStream(model, baseConfig);
    } catch (err: any) {
      const msg = String(err?.message || err);
      console.warn("Gemini stream failed (primary)", msg);
      // Fallback: minimal config
      const minimalConfig: any = {
        temperature: 0,
        maxOutputTokens: isNaN(maxOutputTokens) ? 4096 : maxOutputTokens,
      };
      try {
        response = await tryStream(model, minimalConfig);
      } catch (err2: any) {
        const msg2 = String(err2?.message || err2);
        console.warn("Gemini stream failed (minimal, primary)", msg2);
        // Fallback: non-stream minimal, fallback model
        try {
          const resp = await ai.models.generateContent({
            model: fallbackModel,
            contents,
            config: minimalConfig,
          } as any);
          const text = (resp as any)?.text ?? JSON.stringify(resp);
          return new Response(String(text || ""), {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Gemini-Model": fallbackModel,
              "X-Gemini-Fallback": "non-stream",
            },
          });
        } catch (err3: any) {
          console.error(
            "Gemini non-stream fallback failed",
            err3?.message || err3
          );
          throw err3;
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
    console.error("/api/gemini/analyze error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
