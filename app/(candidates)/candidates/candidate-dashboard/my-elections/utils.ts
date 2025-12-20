import type { ContentBlock } from "@prisma/client";
import { ElectionLinkWithElection } from "@/lib/useCandidate";

const SNIPPET_LIMIT = 2;

export type BlockSnippet = { label: string; text: string };

export function buildEditorLinkKey(candidateSlug: string, electionId: number) {
  return `${candidateSlug}--${electionId}`;
}

export function buildEditorPath(candidateSlug: string, electionId: number) {
  return `/candidates/candidate-dashboard/my-elections/${encodeURIComponent(
    buildEditorLinkKey(candidateSlug, electionId)
  )}`;
}

export function decodeEditorLinkKey(linkKey: string) {
  const separator = linkKey.lastIndexOf("--");
  if (separator === -1) return null;

  const candidateSlug = linkKey.slice(0, separator);
  const electionIdPart = linkKey.slice(separator + 2);
  const electionId = Number(electionIdPart);

  if (!candidateSlug || Number.isNaN(electionId)) {
    return null;
  }

  return { candidateSlug, electionId } as const;
}

export function summarizeBlocks(
  blocks: ContentBlock[] | undefined
): BlockSnippet[] {
  if (!blocks || blocks.length === 0) return [];

  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const snippets: BlockSnippet[] = [];

  for (const block of sorted) {
    if (snippets.length >= SNIPPET_LIMIT) break;

    switch (block.type) {
      case "HEADING": {
        if (block.text) {
          snippets.push({ label: "Heading", text: block.text });
        }
        break;
      }
      case "TEXT": {
        if (block.body) {
          snippets.push({ label: "Text", text: truncate(block.body, 180) });
        }
        break;
      }
      case "LIST": {
        if (block.items && block.items.length > 0) {
          snippets.push({
            label: "List",
            text: block.items.filter(Boolean).slice(0, 3).join(" • "),
          });
        }
        break;
      }
      case "IMAGE": {
        if (block.caption) {
          snippets.push({ label: "Image", text: block.caption });
        } else if (block.imageUrl) {
          snippets.push({ label: "Image", text: "Image uploaded" });
        }
        break;
      }
      case "VIDEO": {
        if (block.caption) {
          snippets.push({ label: "Video", text: block.caption });
        } else if (block.videoUrl) {
          snippets.push({ label: "Video", text: "Video embedded" });
        }
        break;
      }
      default:
        break;
    }
  }

  return snippets;
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export type TemplateChoice =
  | "current"
  | "custom"
  | "elevraStarterTemplate"
  | "simpleTemplate";

export type TemplateCardDefinition = {
  key: TemplateChoice;
  title: string;
  description: string;
  snippets: BlockSnippet[];
};

export const ELEVRA_STARTER_TEMPLATE_PREVIEW: BlockSnippet[] = [
  {
    label: "Heading",
    text: "Lead with a bold introduction that highlights your campaign and story.",
  },
  {
    label: "Description",
    text: "Describe yourself and your campaign.",
  },
  {
    label: "Candidate Image",
    text: "Share a picture of yourself to give voters a face to associate with your campaign.",
  },
  {
    label: "What I Bring",
    text: "Detail what you would bring to the table if elected.",
  },
  {
    label: "What I Believe",
    text: "Express your core beliefs related to the position you are running for.",
  },
  {
    label: "Why I'm Running",
    text: "Spotlight your motivation and priorities for campaigning.",
  },
  {
    label: "Campaign Image",
    text: "Feature visuals for your campaign signs, portrait, or videos.",
  },
];
export const CUSTOM_TEMPLATE_PREVIEW: BlockSnippet[] = [
  {
    label: "Heading",
    text: "Craft a unique headline that captures the essence of your campaign.",
  },
  {
    label: "Vision Statement",
    text: "Share your vision for the future and the impact you aim to create.",
  },
  {
    label: "Personal Story",
    text: "Tell a compelling story about your journey and what drives you.",
  },
  {
    label: "Key Issues",
    text: "Highlight the top issues you are passionate about addressing.",
  },
  {
    label: "Call to Action",
    text: "Encourage voters to support your campaign and get involved.",
  },
];

export const SIMPLE_TEMPLATE_PREVIEW: BlockSnippet[] = [
  {
    label: "Heading",
    text: "Lead with a bold introduction that highlights your campaign and story.",
  },
  // {
  //   label: "Candidate Image",
  //   text: "A picture tells 1000 words.",
  // },
  {
    label: "Description",
    text: "Describe yourself and your campaign.",
  },
];

export function buildResultsHref(link: ElectionLinkWithElection) {
  const { election, electionId } = link;

  if (!election?.city || !election?.state) {
    return null;
  }

  const search = new URLSearchParams({
    city: election.city,
    state: election.state,
    electionID: String(electionId),
  });

  return `/results?${search.toString()}`;
}
