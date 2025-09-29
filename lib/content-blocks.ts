import { ContentBlock } from "@prisma/client";
import { elevraStarterTemplate } from "@/app/(templates)/basicwebpage";

export const unchanged = (b: ContentBlock) => {
  const createdAtDate = new Date(b.createdAt);
  const updatedAtDate = new Date(b.updatedAt);
  if (createdAtDate.getTime() !== updatedAtDate.getTime()) {
    return false;
  }
  return isDuplicateOfTemplate(b);
};

function isDuplicateOfTemplate(block: ContentBlock): boolean {
  return elevraStarterTemplate.some((templateBlock) =>
    blocksEqual(templateBlock, block)
  );
}
/**
 * Determines whether a block color violates the special color rule
 * based on the provided template color.
 *
 * The rule is violated if the template color is "GRAY" and the block color
 * is defined (not null or empty) but is not "BLACK".
 *
 * @param templateColor - The color of the template, which can be "GRAY", "BLACK", or null.
 * @param blockColor - The color of the block, which can be any string or null.
 * @returns `true` if the block color violates the special color rule, otherwise `false`.
 */
function violatesSpecialColorRule(
  templateColor: string | null | "GRAY" | undefined,
  blockColor: string | null
): boolean {
  return templateColor === "GRAY" && !!blockColor && blockColor !== "BLACK";
}

function blocksEqual(
  template: (typeof elevraStarterTemplate)[number],
  block: ContentBlock
): boolean {
  if (template.type !== block.type) return false;

  switch (template.type) {
    case "HEADING":
      const textsEqual = template.text === block.text;
      const levelsEqual = template.level === block.level;
      const colorsEqual = (template.color ?? null) === (block.color ?? null);
      const violates = violatesSpecialColorRule(template.color, block.color);

      return (textsEqual && levelsEqual && !violates) || colorsEqual;
    case "TEXT":
      const bodiesEqual = template.body === block.body;
      const colorsEqual1 = (template.color ?? null) === (block.color ?? null);
      const violates1 = violatesSpecialColorRule(template.color, block.color);
      const result = bodiesEqual && (!violates1 || colorsEqual1); // require body + (non-violating) color equality
      return result;
    case "IMAGE":
      return template.imageUrl === block.imageUrl;
    case "LIST":
      const filteredItems =
        Array.isArray(template.items) &&
        Array.isArray(block.items) &&
        template.items.filter((item, index) => item === block.items[index]);

      const itemsEqual =
        filteredItems &&
        filteredItems.length > 0 &&
        filteredItems.length === template.items!.length;

      const listStylesEqual = template.listStyle === block.listStyle;
      const colorsEqual2 = (template.color ?? null) === (block.color ?? null);
      const violates2 = violatesSpecialColorRule(template.color, block.color);

      const equality = itemsEqual && listStylesEqual;
      const colorEquality = !violates2 || colorsEqual2;

      const result2 = equality && colorEquality;
      return result2;
    default:
      return false;
  }
}
