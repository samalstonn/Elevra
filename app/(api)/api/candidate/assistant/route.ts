import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/prisma/prisma";
import { WA_ASSISTANT_SOURCES } from "@/lib/assistant/wa-sources";
import type { ChatRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_FALLBACK = "gemini-1.5-flash";
const HISTORY_LIMIT = 8;
const isProd = process.env.NODE_ENV === "production";
const assistantFlag = process.env.CANDIDATE_ASSISTANT_ENABLED;
const assistantEnabled =
  assistantFlag === "true" || (!isProd && assistantFlag !== "false");

type AssistantResult = {
  answer: string;
  citations?: { id: string; label?: string; url?: string }[];
  followUps?: string[];
};

function buildCandidateContext(candidate: {
  name: string;
  currentCity: string | null;
  currentState: string | null;
  currentRole: string | null;
}) {
  const parts: string[] = [];
  parts.push(`Candidate name: ${candidate.name}`);
  if (candidate.currentRole) {
    parts.push(`Current role: ${candidate.currentRole}`);
  }
  if (candidate.currentCity || candidate.currentState) {
    parts.push(
      `Location: ${[candidate.currentCity, candidate.currentState]
        .filter(Boolean)
        .join(", ")}`
    );
  }
  parts.push(
    "Jurisdiction focus: Washington State local government elections (county, city, special district)."
  );
  return parts.join("\n");
}

function buildSourceContext() {
  return WA_ASSISTANT_SOURCES.map((source, index) => {
    const ordinal = index + 1;
    return `Source ${ordinal} [${source.id}]\nTitle: ${source.title}\nURL: ${source.url}\nTopics: ${source.topics.join(", ")}\nSummary: ${source.summary}`;
  }).join("\n\n");
}

function formatConversation(messages: {
  role: ChatRole;
  content: string;
}[]) {
  if (!messages.length) return "No prior conversation.";
  return messages
    .map((message) => {
      const speaker = message.role === "assistant" ? "Assistant" : "Candidate";
      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");
}

function buildPrompt({
  candidateContext,
  conversation,
  latestQuestion,
}: {
  candidateContext: string;
  conversation: string;
  latestQuestion: string;
}) {
  const instructions = `You are Elevra's Candidate Assistant, an elections guide for Washington State local candidates. \n\nFollow these rules:\n1. Answer using only the provided source summaries when giving factual guidance.\n2. If a topic is not covered by the sources, say you do not have reliable information and point the candidate to their county elections office directory.\n3. Highlight when rules vary by county or city. Encourage the user to contact their county elections office for confirmation.\n4. Provide practical next steps and reminders for campaign compliance.\n5. Never provide legal advice; instead direct the candidate to the appropriate authority.\n6. Keep answers concise but actionable. Use bullet lists or numbered steps where helpful.\n7. Always include citations. Reference sources by their id (e.g., [wa-sos-filing]) and include the URL in the citation.\n8. Respond in JSON with the structure: {"answer": string, "citations": Citation[], "followUps"?: string[]} where Citation = {"id": string, "label": string, "url": string}.\n9. The answer can include Markdown formatting (headings, bold, bullet lists).\n10. Close with a reminder that this is informational guidance, not legal advice.`;

  return `${instructions}\n\nCandidate profile:\n${candidateContext}\n\nAvailable sources:\n${buildSourceContext()}\n\nConversation so far:\n${conversation}\n\nCandidate question:\n${latestQuestion}`;
}

function sanitizeCitations(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const allowedIds = new Set(WA_ASSISTANT_SOURCES.map((source) => source.id));
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const { id, label, url } = entry as {
        id?: string;
        label?: string;
        url?: string;
      };
      if (!id || !allowedIds.has(id)) return null;
      const source = WA_ASSISTANT_SOURCES.find((item) => item.id === id);
      const safeLabel = label?.trim() || source?.title || id;
      const safeUrl = url?.trim() || source?.url || "";
      return {
        id,
        label: safeLabel,
        url: safeUrl,
      };
    })
    .filter(Boolean);
}

function buildFallbackAnswer(): AssistantResult {
  const defaults = [
    "wa-sos-filing",
    "pdc-registration",
    "pdc-reporting",
    "wa-sos-calendar",
  ];
  const citations = defaults
    .map((id) => WA_ASSISTANT_SOURCES.find((source) => source.id === id))
    .filter(Boolean)
    .map((source) => ({
      id: source!.id,
      label: source!.title,
      url: source!.url,
    }));

  const answer = `I can’t reach the live assistant right now, but here are the key Washington election resources to review directly:\n\n1. [Secretary of State – Candidate Filing Guide](https://www.sos.wa.gov/elections/candidatefiling) for filing week, fee, and withdrawal rules.\n2. [Public Disclosure Commission – Candidate Registration](https://www.pdc.wa.gov/registration/candidates) for opening a committee, C-1 registration, and bank account requirements.\n3. [PDC Reporting Deadlines](https://www.pdc.wa.gov/learn/compliance/candidate-filing-mini-reporting) for mini vs. full reporting timelines.\n4. Use the [County Elections Directory](https://www.sos.wa.gov/elections/calendar-counties) to confirm local dates, pamphlet submissions, and contact details.\n\nReach out to your county elections officer to verify deadlines. This information is for planning only and isn’t legal advice.`;

  return {
    answer,
    citations,
    followUps: [
      "How do I contact my county elections office?",
      "What does the PDC require after I file?",
    ],
  };
}

async function getOrCreateSession(params: {
  candidateId: number;
  clerkUserId: string;
}) {
  const existing = await prisma.chatSession.findFirst({
    where: {
      candidateId: params.candidateId,
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  return prisma.chatSession.create({
    data: {
      candidateId: params.candidateId,
      clerkUserId: params.clerkUserId,
      title: "Washington Election Assistant",
    },
  });
}

export async function GET(_request: NextRequest) {
  try {
    if (!assistantEnabled) {
      return NextResponse.json(
        { error: "Assistant feature is disabled" },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        name: true,
        currentCity: true,
        currentState: true,
        currentRole: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    const session = await getOrCreateSession({
      candidateId: candidate.id,
      clerkUserId: userId,
    });

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        role: true,
        content: true,
        citations: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ session, messages });
  } catch (error) {
    console.error("Assistant GET failed", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!assistantEnabled) {
      return NextResponse.json(
        { error: "Assistant feature is disabled" },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      message?: string;
      sessionId?: number;
    };

    const question = body.message?.trim();
    if (!question) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        name: true,
        currentRole: true,
        currentCity: true,
        currentState: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    const session = await getOrCreateSession({
      candidateId: candidate.id,
      clerkUserId: userId,
    });

    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: question,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
      select: {
        role: true,
        content: true,
      },
    });

    const candidateContext = buildCandidateContext(candidate);
    const conversation = formatConversation([...history].reverse());
    const prompt = buildPrompt({
      candidateContext,
      conversation,
      latestQuestion: question,
    });

    let parsed: AssistantResult | null = null;
    let usageTokens: number | null = null;

    if (!process.env.GEMINI_API_KEY) {
      parsed = buildFallbackAnswer();
    } else {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model =
        process.env.CANDIDATE_ASSISTANT_MODEL ||
        process.env.GEMINI_MODEL ||
        MODEL_FALLBACK;

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      });

      usageTokens = response.response?.usageMetadata?.totalTokenCount ?? null;
      const parts = response.response?.candidates?.[0]?.content?.parts ?? [];
      const rawText = parts
        .map((part) => {
          if (part && typeof part === "object" && "text" in part) {
            return String((part as { text?: string }).text ?? "");
          }
          return "";
        })
        .join("")
        .trim();

      if (rawText) {
        try {
          parsed = JSON.parse(rawText) as AssistantResult;
        } catch (error) {
          console.warn("Assistant response was not valid JSON", error, rawText);
        }
      }
    }

    if (!parsed) {
      parsed = buildFallbackAnswer();
    }

    const citations = sanitizeCitations(parsed.citations);

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: parsed.answer,
        citations,
        tokenUsage: usageTokens,
      },
      select: {
        id: true,
        role: true,
        content: true,
        citations: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      messages: [
        {
          id: userMessage.id,
          role: "user",
          content: question,
          createdAt: userMessage.createdAt,
        },
        assistantMessage,
      ],
      followUps: parsed.followUps ?? [],
    });
  } catch (error) {
    console.error("Assistant POST failed", error);
    const message =
      error instanceof Error ? error.message : "Unexpected assistant error";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
