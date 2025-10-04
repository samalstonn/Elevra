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
import { EmptyState } from "@/components/ui/empty-state";
import { unchanged } from "@/lib/content-blocks";
import { colorClass } from "@/lib/constants";

function resolveColorClass(block: ContentBlock) {
  if (block.color === "PURPLE") {
    return colorClass.PURPLE;
  }
  if (block.color === "BLACK") {
    return colorClass.BLACK;
  }
  if (block.color === "GRAY") {
    return colorClass.BLACK;
  }
  return colorClass.BLACK;
}

export type ElectionProfileTabProps = {
  link: ElectionLink & { ContentBlock: ContentBlock[] };
};

function mdToHtml(markdown: string): string {
  marked.setOptions({ async: false });
  const raw = marked.parse(markdown) as string;
  return DOMPurify.sanitize(raw).replace(/\u00A0/g, " ");
}

export function ElectionProfileTab({ link }: ElectionProfileTabProps) {
  const sortedBlocks = [...link.ContentBlock].sort((a, b) => a.order - b.order);

  const blocksToRender = sortedBlocks.filter((b) => !unchanged(b));

  return (
    <div className="space-y-6 mx-auto max-w-4xl px-4">
      {blocksToRender.length === 0 && (
        <EmptyState
          primary="Candidate overview is not available yet for this election."
          secondary="Check back soon as the candidate adds details."
        />
      )}
      {blocksToRender.map((block) => {
        const color = resolveColorClass(block);

        switch (block.type) {
          case BlockType.HEADING:
            const headingClass =
              block.level === 1
                ? `text-4xl font-bold ${color}`
                : `text-2xl font-semibold ${color}`;
            return (
              <h2 key={block.id} className={headingClass + " break-words whitespace-pre-line overflow-wrap break-all hyphens-auto"}>
                {block.text?.replace(/\u00A0/g, " ")}
              </h2>
            );

          case BlockType.TEXT:
            return (
              <div
                key={block.id}
                className={`text-sm ${color}`}
                dangerouslySetInnerHTML={{
                  __html: mdToHtml((block.body ?? "").replace(/\u00A0/g, " ")),
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
                {(block.items ?? []).map((item, idx) => (
                  <li key={idx}>{item.replace(/\u00A0/g, " ")}</li> //Added to fix weird space issue
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
                    className="w-1/2 mx-auto rounded"
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
