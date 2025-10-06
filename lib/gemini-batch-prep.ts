/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GeminiBatchRequest } from "@/lib/gemini-batch";

export type GeminiIncomingGroup = {
  key?: string;
  municipality?: string;
  state?: string;
  position?: string;
  rows: unknown[];
};

export type GeminiPreparedGroup = GeminiIncomingGroup & {
  key: string;
  rows: unknown[];
};

export type GeminiMockGroupResult = {
  key: string;
  index: number;
  analyzeText: string;
  structureText: string;
};

export function normalizeGroupKey(input: string | undefined, index: number) {
  if (typeof input === "string" && input.trim().length > 0) {
    return input.trim();
  }
  return `group-${index}`;
}

export function prepareGroups(groups: GeminiIncomingGroup[]): GeminiPreparedGroup[] {
  return groups.map((group, idx) => ({
    ...group,
    key: normalizeGroupKey(group.key, idx),
    rows: Array.isArray(group.rows) ? group.rows : [],
  }));
}

export function limitRows(
  rows: unknown[],
  limitConfig: number,
  fallback: number
): unknown[] {
  if (!Array.isArray(rows)) return [];
  const limit = Number.isFinite(limitConfig) ? Number(limitConfig) : fallback;
  return rows.slice(0, limit > 0 ? limit : fallback);
}

export function buildAnalyzeRequest(
  prompt: string,
  group: GeminiPreparedGroup,
  config: Record<string, unknown>
): GeminiBatchRequest {
  const rowsBlock = `\n\nElection details input (JSON rows):\n${JSON.stringify(
    group.rows,
    null,
    2
  )}\n`;
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${prompt}${rowsBlock}`,
          },
        ],
      },
    ],
    config: { ...config },
  };
}

export function buildStructureRequest(
  prompt: string,
  previousOutput: string,
  group: GeminiPreparedGroup,
  config: Record<string, unknown>
): GeminiBatchRequest {
  const parts: Array<{ text: string }> = [
    { text: prompt },
    {
      text: `\n\nAttached data (from previous step):\n${previousOutput}`,
    },
  ];
  if (Array.isArray(group.rows)) {
    parts.push({
      text:
        "\n\nOriginal spreadsheet rows (may include email to preserve):\n" +
        JSON.stringify(group.rows, null, 2),
    });
  }
  return {
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    config: { ...config },
  };
}

export function buildMockOutput(
  group: GeminiPreparedGroup,
  index: number
): GeminiMockGroupResult {
  const rows = Array.isArray(group.rows) && group.rows.length
    ? group.rows
    : [{}];
  const first = rows[0] as Record<string, any>;
  const city = first?.municipality || group.municipality || "Sample City";
  const state = first?.state || group.state || "Sample State";
  const year = first?.year || "2025";
  const candidateName = `${first?.firstName || "Jane"} ${
    first?.lastName || "Doe"
  }`.trim();

  const analyzeText = JSON.stringify(
    [
      {
        election: {
          title: "Mock Election",
          type: "LOCAL",
          date: `11/05/${String(year).slice(-4)}`,
          city,
          state,
          number_of_seats: "N/A",
          description: "Mock analysis (Gemini disabled).",
        },
        candidates: [
          {
            name: candidateName,
            currentRole: first?.position || "Candidate",
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
    ],
    null,
    2
  );

  const structureText = JSON.stringify(
    {
      elections: [
        {
          election: {
            title: "Mock Election (Structured)",
            type: "LOCAL",
            date: `11/05/${String(year).slice(-4)}`,
            city,
            state,
            number_of_seats: "N/A",
            description: "Structured mock output (Gemini disabled).",
          },
          candidates: [
            {
              name: candidateName,
              currentRole: first?.position || "Candidate",
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
    },
    null,
    2
  );

  return {
    key: group.key,
    index,
    analyzeText,
    structureText,
  };
}
