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
import DOMPurify from "dompurify";
import Image from "next/image";

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
  return (
    <div className="pl-2 space-y-2">
      {[...link.ContentBlock]
        .sort((a, b) => a.order - b.order)
        .map((block) => {
          const color = block.color ? colorClass[block.color] : "";

          switch (block.type) {
            case BlockType.HEADING:
              const headingClass =
                block.level === 1
                  ? `text-xl font-bold ${color}`
                  : `text-lg font-semibold ${color}`;
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
              const ListTag =
                block.listStyle === ListStyle.NUMBER ? "ol" : "ul";
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
                      width={600}
                      height={600}
                      className="w-1/2"
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
                      className="w-3/4 rounded-lg shadow"
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
