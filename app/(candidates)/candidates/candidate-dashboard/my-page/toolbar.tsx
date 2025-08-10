"use client";

import { BlockType, ListStyle, TextColor } from "@prisma/client";
import { Button } from "@/components/ui/button";

type ToolbarProps = {
  selectedColor: TextColor;
  onColorChange: (color: TextColor) => void;
  convertBlock: (
    type: BlockType,
    extra?: Record<string, number | string>
  ) => void;
  addBlock: (type: BlockType, extra?: Record<string, number>) => void;
};

export default function Toolbar({
  selectedColor,
  onColorChange,
  convertBlock,
  addBlock,
}: ToolbarProps) {
  return (
    <div className="sticky top-2 z-10 mb-4 bg-gray-100 border rounded-full p-2 flex flex-wrap items-center gap-2">
      {/* Plain‑text dropdown */}
      <select
        defaultValue=""
        className="border rounded-xl px-2 py-1 text-sm"
        onChange={(e) => {
          const v = e.target.value;
          if (v === "H1") convertBlock("HEADING", { level: 1 });
          else if (v === "H2") convertBlock("HEADING", { level: 2 });
          else if (v === "TEXT") convertBlock("TEXT");
          e.target.value = "";
        }}
      >
        <option value="" disabled>
          Normal Text
        </option>
        <option value="H1">Heading 1</option>
        <option value="H2">Heading 2</option>
        <option value="TEXT">Normal</option>
      </select>

      {/* List dropdown */}
      <select
        defaultValue=""
        className="border rounded-xl px-2 py-1 text-sm"
        onChange={(e) => {
          const v = e.target.value;
          if (v === "BULLET")
            convertBlock("LIST", { listStyle: ListStyle.BULLET });
          else if (v === "NUMBER")
            convertBlock("LIST", { listStyle: ListStyle.NUMBER });
          e.target.value = "";
        }}
      >
        <option value="" disabled>
          List
        </option>
        <option value="BULLET">Bulleted list</option>
        <option value="NUMBER">Numbered list</option>
      </select>

      {/* Color picker */}
      <select
        value={selectedColor}
        onChange={(e) => onColorChange(e.target.value as TextColor)}
        className="border rounded-xl px-2 py-1 text-sm"
      >
        <option value="PURPLE">Purple</option>
        <option value="GRAY">Grey</option>
        <option value="BLACK">Black</option>
      </select>

      {/* Media & divider buttons */}
      <Button size="sm" variant="secondary" onClick={() => addBlock("IMAGE")}>
        Image
      </Button>
      <Button size="sm" variant="secondary" onClick={() => addBlock("VIDEO")}>
        Video
      </Button>
      <Button size="sm" variant="secondary" onClick={() => addBlock("DIVIDER")}>
        Divider
      </Button>
    </div>
  );
}
