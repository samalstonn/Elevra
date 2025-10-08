import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/prisma/prisma";
import type { ChatRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_FALLBACK = "gemini-1.5-flash";
const HISTORY_LIMIT = 8;
const isProd = process.env.NODE_ENV === "production";
const assistantFlag = process.env.CANDIDATE_ASSISTANT_ENABLED;
const assistantEnabled =
  assistantFlag === "true" || (!isProd && assistantFlag !== "false");
const assistantSearchFlag =
  process.env.CANDIDATE_ASSISTANT_USE_SEARCH ??
  process.env.GEMINI_TOOLS_GOOGLE_SEARCH ??
  "";
const assistantSearchEnabled = assistantSearchFlag.toLowerCase() === "true";

type GeminiPart = string | { text?: string };

type GeminiCandidate = {
  finishReason?: string;
  index?: number;
  safetyRatings?: unknown;
  groundingMetadata?: unknown;
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiUsageMetadata = {
  totalTokenCount?: number;
};

type GeminiContentResponse = {
  candidates?: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
  promptFeedback?: unknown;
};

type CandidateProfileContext = {
  name: string;
  currentRole: string | null;
  currentCity: string | null;
  currentState: string | null;
  bio: string | null;
  website: string | null;
  linkedin: string | null;
  history: string[];
  donationCount: number;
  status: string;
  verified: boolean;
  email: string | null;
  phone: string | null;
};

type ElectionContextEntry = {
  party: string;
  policies: string[];
  sources: string[];
  votinglink: string | null;
  additionalNotes: string | null;
  election: {
    position: string;
    date: Date;
    city: string;
    state: string;
    type: string;
  };
};

type AssistantResult = {
  answer: string;
  citations?: { id: string; label?: string; url?: string }[];
  followUps?: string[];
};

function extractJsonPayload(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }

  return trimmed.startsWith("{") && trimmed.endsWith("}") ? trimmed : null;
}

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
  return parts.join("\n");
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "Unknown";
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

function truncateText(text: string, maxLength = 800) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function buildCandidateDataSection(
  candidate: CandidateProfileContext,
  elections: ElectionContextEntry[]
) {
  const sections: string[] = [];

  const snapshot: string[] = [];
  snapshot.push(
    `- Status: ${candidate.status}${candidate.verified ? " (verified)" : ""}`
  );
  if (candidate.currentRole) {
    snapshot.push(`- Current role: ${candidate.currentRole}`);
  }
  const locationParts = [candidate.currentCity, candidate.currentState].filter(
    Boolean
  );
  if (locationParts.length) {
    snapshot.push(`- Location: ${locationParts.join(", ")}`);
  }
  snapshot.push(`- Donations tracked: ${candidate.donationCount}`);

  const email = candidate.email?.trim();
  if (email) {
    snapshot.push(`- Email: ${email}`);
  }

  const phone = candidate.phone?.trim();
  if (phone) {
    snapshot.push(`- Phone: ${phone}`);
  }

  const website = candidate.website?.trim();
  if (website) {
    snapshot.push(`- Website: ${website}`);
  }

  const linkedin = candidate.linkedin?.trim();
  if (linkedin) {
    snapshot.push(`- LinkedIn: ${linkedin}`);
  }
  sections.push(`Candidate snapshot:\n${snapshot.join("\n")}`);

  if (candidate.bio) {
    sections.push(`Bio excerpt:\n${truncateText(candidate.bio)}`);
  }

  const history = candidate.history
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (history.length) {
    sections.push(
      `Campaign history (latest first):\n${history
        .map((entry) => `- ${entry}`)
        .join("\n")}`
    );
  }

  if (elections.length === 0) {
    sections.push(
      "Election participation:\n- No active elections recorded for this candidate."
    );
  } else {
    const electionDetails = elections.map((entry, index) => {
      const detailLines: string[] = [];
      const {
        election: { position, date, city, state, type },
        party,
        policies,
        votinglink,
        additionalNotes,
        sources,
      } = entry;

      detailLines.push(
        `Election ${index + 1}: ${position} (${type}) - ${city}, ${state}`
      );
      detailLines.push(`- Election date: ${formatDate(date)}`);
      const trimmedParty = party?.trim();
      if (trimmedParty) {
        detailLines.push(`- Party affiliation: ${trimmedParty}`);
      }
      if (policies.length) {
        const highlightedPolicies = policies.slice(0, 3);
        detailLines.push(
          `- Platform highlights: ${highlightedPolicies.join("; ")}${
            policies.length > highlightedPolicies.length
              ? " (more in dashboard)"
              : ""
          }`
        );
      }
      const trimmedVotingLink = votinglink?.trim();
      if (trimmedVotingLink) {
        detailLines.push(`- Voting resource: ${trimmedVotingLink}`);
      }
      const trimmedNotes = additionalNotes?.trim();
      if (trimmedNotes) {
        detailLines.push(`- Notes: ${truncateText(trimmedNotes, 300)}`);
      }
      const cleanedSources = sources
        .map((source) => source.trim())
        .filter(Boolean);
      if (cleanedSources.length) {
        detailLines.push(`- Supporting sources: ${cleanedSources.join(", ")}`);
      }
      return detailLines.join("\n");
    });

    sections.push(`Election participation:\n${electionDetails.join("\n\n")}`);
  }

  return sections.join("\n\n");
}

function formatConversation(
  messages: {
    role: ChatRole;
    content: string;
  }[]
) {
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
  candidateData,
  conversation,
  latestQuestion,
}: {
  candidateContext: string;
  candidateData: string;
  conversation: string;
  latestQuestion: string;
}) {
  const searchRule = assistantSearchEnabled
    ? "If additional information is needed, run a web search for official government or trusted election compliance resources. Prioritize reputable domains (e.g., *.gov, *.us, state and county election offices, recognized civic organizations)."
    : "If additional information is needed and no reliable source is available, say you do not have authoritative information and direct the candidate to their county or state elections office.";

  const instructionLines = [
    "Base every factual statement on a verifiable external source and include a citation.",
    searchRule,
    "When a topic is still unclear, remind the candidate to contact their county or state elections office for confirmation.",
    "Highlight when rules vary by jurisdiction and encourage reaching out to the relevant elections office for confirmation.",
    "Provide practical next steps and reminders for campaign compliance or outreach.",
    "Never provide legal advice; instead direct the candidate to the appropriate authority.",
    "Keep answers concise but actionable. Use bullet lists or numbered steps where helpful.",
    'Interpret first-person references (e.g., "my election," "my campaign," "my filing") as referring to this candidate and the elections listed in their context.',
    "Use the candidate and election data provided below for personalization. Do not cite this section; cite only external sources.",
    "For each citation create a concise id based on the source domain or publication (e.g., [kingcounty-wa-gov]) and include the exact URL.",
    'Respond in JSON with the structure: {"answer": string, "citations": Citation[], "followUps"?: string[]} where Citation = {"id": string, "label": string, "url": string}.',
    "The answer can include Markdown formatting (headings, bold, bullet lists).",
    "Close with a reminder that this is informational guidance, not legal advice.",
  ];

  if (assistantSearchEnabled) {
    instructionLines.splice(
      2,
      0,
      "When the candidate asks about a specific county, city, deadline, or regulation, run a web search before answering. Summarize any new findings and cite those sources alongside any previously referenced materials."
    );
  }

  const instructions = `You are Elevra's Candidate Assistant, a virtual teammate helping local election candidates plan and stay compliant.\n\nFollow these rules:\n${instructionLines
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n")}`;

  const searchHint =
    assistantSearchEnabled &&
    /\b(county|city|town|district|deadline|pamphlet|filing|submission)\b/i.test(
      latestQuestion
    )
      ? "\n\nSearch hint: the candidate referenced a specific location or deadline. Use the web search tool to locate the most recent official guidance before answering."
      : "";

  return `${instructions}${searchHint}\n\nCandidate profile:\n${candidateContext}\n\nCandidate and election data (internal, do not cite):\n${candidateData}\n\nConversation so far:\n${conversation}\n\nCandidate question:\n${latestQuestion}`;
}

function sanitizeCitations(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const seenUrls = new Set<string>();

  function deriveId(url: string, fallbackIndex: number) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, "");
      const pathSlug = parsed.pathname
        .split("/")
        .filter(Boolean)
        .slice(0, 2)
        .join("-")
        .replace(/[^a-z0-9\-]+/gi, "-");
      const base = `${host}${pathSlug ? `-${pathSlug}` : ""}`
        .replace(/[^a-z0-9\-]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      return base || `source-${fallbackIndex}`;
    } catch {
      return `source-${fallbackIndex}`;
    }
  }

  const result: { id: string; label: string; url: string }[] = [];

  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const { id, label, url } = entry as {
      id?: string;
      label?: string;
      url?: string;
    };
    const trimmedUrl = typeof url === "string" ? url.trim() : "";
    if (!trimmedUrl || !/^https?:\/\//i.test(trimmedUrl)) return;
    if (seenUrls.has(trimmedUrl)) return;
    seenUrls.add(trimmedUrl);

    const candidateId =
      typeof id === "string" && id.trim().length > 0
        ? id.trim()
        : deriveId(trimmedUrl, index + 1);
    const safeLabel =
      typeof label === "string" && label.trim().length > 0
        ? label.trim().slice(0, 120)
        : candidateId.replace(/-/g, " ");

    result.push({
      id: candidateId,
      label: safeLabel,
      url: trimmedUrl,
    });
  });

  return result;
}

function buildFallbackAnswer(): AssistantResult {
  const answer =
    "I can’t reach the live assistant right now. Please check your state or county elections office website for filing calendars, voters’ pamphlet requirements, and campaign finance guidance. Reach out to the election officials directly to confirm deadlines. This information is for planning only and isn’t legal advice.";

  return {
    answer,
    citations: [],
    followUps: [
      "Where can I find my state elections office website?",
      "What requirements should I double-check with my local election officials?",
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
      title: "Candidate Assistant",
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
      return NextResponse.json(
        { error: "Candidate profile not found" },
        { status: 404 }
      );
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
        bio: true,
        website: true,
        linkedin: true,
        history: true,
        donationCount: true,
        status: true,
        verified: true,
        email: true,
        phone: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate profile not found" },
        { status: 404 }
      );
    }

    const electionContext = await prisma.electionLink.findMany({
      where: { candidateId: candidate.id },
      orderBy: { joinedAt: "asc" },
      select: {
        party: true,
        policies: true,
        sources: true,
        votinglink: true,
        additionalNotes: true,
        election: {
          select: {
            position: true,
            date: true,
            city: true,
            state: true,
            type: true,
          },
        },
      },
    });

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
    const candidateData = buildCandidateDataSection(candidate, electionContext);
    const conversation = formatConversation([...history].reverse());
    const prompt = buildPrompt({
      candidateContext,
      candidateData,
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

      const baseConfig: Record<string, unknown> = {
        temperature: 0.3,
        maxOutputTokens: 2048,
      };

      if (assistantSearchEnabled) {
        baseConfig.tools = [{ googleSearch: {} }];
      } else {
        baseConfig.responseMimeType = "application/json";
      }

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: baseConfig,
      });

      const typedResponse = response as GeminiContentResponse & {
        response?: GeminiContentResponse;
      };

      const usageMetadata =
        typedResponse.usageMetadata ?? typedResponse.response?.usageMetadata;
      usageTokens = usageMetadata?.totalTokenCount ?? null;

      const candidates =
        typedResponse.candidates ?? typedResponse.response?.candidates ?? [];

      const parts: GeminiPart[] = candidates[0]?.content?.parts ?? [];
      const rawText = parts
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }

          if (part && typeof part === "object" && "text" in part) {
            const candidateText = (part as { text?: string }).text;
            return typeof candidateText === "string" ? candidateText : "";
          }

          return "";
        })
        .join("")
        .trim();

      if (rawText) {
        try {
          const candidateJson = extractJsonPayload(rawText);
          if (candidateJson) {
            parsed = JSON.parse(candidateJson) as AssistantResult;
          }
        } catch (error) {
          console.warn("[assistant] invalid JSON", error, rawText);
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
