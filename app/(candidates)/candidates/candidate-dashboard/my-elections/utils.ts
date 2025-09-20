import type { ContentBlock } from "@prisma/client";

const SNIPPET_LIMIT = 4 ;

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
