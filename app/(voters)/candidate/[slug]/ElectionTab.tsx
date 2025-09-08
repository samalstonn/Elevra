import {
  ElectionLink,
  ContentBlock,
  BlockType,
  ListStyle,
} from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MdHowToVote } from "react-icons/md";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import Image from "next/image";
import { davidWeinsteinTemplate } from "@/app/(templates)/basicwebpage";

type TemplateBlock = (typeof davidWeinsteinTemplate)[number];

export type ElectionProfileTabProps = {
  link: ElectionLink & { ContentBlock: ContentBlock[] };
};

const colorClass = {
  BLACK: "text-black",
  GRAY: "text-gray-700",
  PURPLE: "text-purple-700",
} as const;

function mdToHtml(markdown: string): string {
  marked.setOptions({ async: false });
  const raw = marked.parse(markdown) as string;
  return DOMPurify.sanitize(raw);
}

export function ElectionProfileTab({ link }: ElectionProfileTabProps) {
  // Normalize blocks for comparison against template
  const normalize = (b: ContentBlock) => ({
    order: b.order,
    type: b.type,
    level: b.level ?? null,
    text: (b.text ?? "").trim(),
    body: (b.body ?? "").trim(),
    listStyle: b.listStyle ?? null,
    items: b.items ?? [],
    imageUrl: b.imageUrl ?? null,
    videoUrl: b.videoUrl ?? null,
    caption: (b.caption ?? "").trim() || null,
    color: b.color ?? null,
  });
  const normalizeTemplate = (t: TemplateBlock) => ({
    order: t.order,
    type: t.type,
    level: (t as { level?: number }).level ?? null,
    text: (t as { text?: string }).text?.trim() ?? "",
    body: (t as { body?: string }).body?.trim() ?? "",
    listStyle: (t as { listStyle?: ListStyle }).listStyle ?? null,
    items: (t as { items?: string[] }).items ?? [],
    imageUrl: (t as { imageUrl?: string }).imageUrl ?? null,
    videoUrl: (t as { videoUrl?: string }).videoUrl ?? null,
    caption:
      ((t as { caption?: string }).caption?.trim() ?? "") === ""
        ? null
        : (t as { caption?: string }).caption!.trim(),
    color: (t as { color?: keyof typeof colorClass }).color ?? null,
  });

  const sortedBlocks = [...link.ContentBlock].sort((a, b) => a.order - b.order);
  const templateNormalized = davidWeinsteinTemplate.map(normalizeTemplate);
  const templateMap = new Map(templateNormalized.map((t) => [t.order, t]));

  const unchanged = (b: ContentBlock) => {
    const bn = normalize(b);
    const t = templateMap.get(bn.order);
    if (!t) return false; // no template counterpart → treat as custom, show
    return (
      bn.type === t.type &&
      bn.level === t.level &&
      bn.text === t.text &&
      bn.body === t.body &&
      bn.listStyle === t.listStyle &&
      bn.color === t.color &&
      bn.imageUrl === t.imageUrl &&
      bn.videoUrl === t.videoUrl &&
      bn.caption === t.caption &&
      bn.items.length === t.items.length &&
      bn.items.every((it, i2) => it === t.items[i2])
    );
  };

  const blocksToRender = sortedBlocks.filter((b) => !unchanged(b));

  return (
    <div className="space-y-6 mx-auto max-w-4xl px-4">
      {blocksToRender.length === 0 && (
        <div className="border border-dashed rounded p-6 bg-white/70 text-center">
          <p className="text-gray-600 text-sm">
            Candidate overview is not available yet for this election.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Check back soon as the candidate adds details.
          </p>
        </div>
      )}
      {blocksToRender.map((block) => {
        const color = block.color ? colorClass[block.color] : "";

        switch (block.type) {
          case BlockType.HEADING:
            const headingClass =
              block.level === 1
                ? `text-4xl font-bold ${color}`
                : `text-2xl font-semibold ${color}`;
            return (
              <h2 key={block.id} className={headingClass}>
                {block.text}
              </h2>
            );

          case BlockType.TEXT:
            return (
              <div
                key={block.id}
                className={`text-sm ${color}`}
                dangerouslySetInnerHTML={{
                  __html: mdToHtml(block.body ?? ""),
                }}
              />
            );

          case BlockType.LIST:
            const ListTag = block.listStyle === ListStyle.NUMBER ? "ol" : "ul";
            const listClass =
              block.listStyle === ListStyle.NUMBER
                ? `list-decimal text-sm ml-6 ${color}`
                : `list-disc text-sm ml-6 ${color}`;
            return (
              <ListTag key={block.id} className={listClass}>
                {block.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ListTag>
            );

          case BlockType.DIVIDER:
            return <hr key={block.id} className="border-gray-200" />;

          case BlockType.IMAGE:
            return (
              <figure key={block.id} className="flex flex-col items-center">
                {block.imageUrl && (
                  <Image
                    src={block.imageUrl!}
                    alt={block.caption ?? ""}
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: "50%", height: "auto" }}
                    className="w-1/2 rounded"
                    priority={false}
                  />
                )}
                {block.caption && (
                  <figcaption className={`text-sm mt-1 ${color}`}>
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          case BlockType.VIDEO:
            return (
              <figure key={block.id} className="flex flex-col items-center">
                {block.videoUrl && (
                  <video
                    src={block.videoUrl}
                    controls
                    preload="metadata"
                    className="w-full max-w-2xl rounded"
                  />
                )}
                {block.caption && (
                  <figcaption className={`text-sm mt-1 ${color}`}>
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          default:
            return null;
        }
      })}

      {/* Vote button */}
      {link.votinglink && (
        <Link
          href={link.votinglink}
          passHref
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button asChild variant="purple" size="md">
            <span className="flex items-center gap-2">
              <MdHowToVote />
              <span>Vote</span>
            </span>
          </Button>
        </Link>
      )}
    </div>
  );
}
