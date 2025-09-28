import { BlockType, ContentBlock } from "@prisma/client";

function hasMeaningfulContent(block: ContentBlock): boolean {
  switch (block.type) {
    case BlockType.HEADING:
      return Boolean(block.text?.trim());
    case BlockType.TEXT:
      return Boolean(block.body?.trim());
    case BlockType.LIST:
      return (block.items ?? []).some((item) => Boolean(item?.trim()));
    case BlockType.IMAGE:
      return Boolean(block.imageUrl || block.caption?.trim());
    case BlockType.VIDEO:
      return Boolean(
        block.videoUrl || block.thumbnailUrl || block.caption?.trim()
      );
    case BlockType.DIVIDER:
      return true;
    default:
      return false;
  }
}

export const unchanged = (block: ContentBlock) => {
  const createdAt = new Date(block.createdAt);
  const updatedAt = new Date(block.updatedAt);

  if (
    Number.isNaN(createdAt.getTime()) ||
    Number.isNaN(updatedAt.getTime()) ||
    createdAt.getTime() !== updatedAt.getTime()
  ) {
    return false;
  }

  return !hasMeaningfulContent(block);
};
