"use client";

import { ContentBlock, BlockType, ListStyle, TextColor } from "@prisma/client";
import type { DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";

async function uploadImage(file: File): Promise<string> {
  const { uploadUrl, url } = await fetch("/api/blob/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "image", filename: file.name }),
  }).then((r) => r.json());
  await fetch(uploadUrl, { method: "PUT", body: file });
  return url as string;
}

export type ContentBlockInput = Omit<
  ContentBlock,
  "id" | "candidateId" | "electionId" | "createdAt" | "updatedAt"
>;

type Props = {
  initialBlocks: ContentBlock[];
  onSave: (blocks: ContentBlockInput[]) => Promise<void>;
};

const DEFAULT_COLOR: TextColor = "BLACK";

export default function ContentBlocksEditor({ initialBlocks, onSave }: Props) {
  console.log("initialBlocks", initialBlocks);
  const [blocks, setBlocks] = useState<ContentBlockInput[]>(
    [...initialBlocks]
      .sort((a, b) => a.order - b.order)
      .map(
        ({
          id: _id,
          candidateId: _candidateId,
          electionId: _electionId,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...rest
        }) => rest
      )
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(blocks);
    } finally {
      setIsSaving(false);
    }
  };

  /* ----------------- Drag-and-drop sensors ----------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 10 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex((b) => b.order === active.id);
      const newIndex = blocks.findIndex((b) => b.order === over?.id);
      const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, idx) => ({
        ...b,
        order: idx,
      }));
      setBlocks(reordered);
    }
  };

  /* ----------------- Helpers ----------------- */
  const addBlock = (type: BlockType) => {
    setBlocks((prev) => [
      ...prev,
      { type, order: prev.length, color: DEFAULT_COLOR } as ContentBlockInput,
    ]);
  };

  const updateBlock = (order: number, patch: Partial<ContentBlockInput>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.order === order ? { ...b, ...patch } : b))
    );
  };

  const deleteBlock = (orderToDelete: number) => {
    setBlocks((prev) => {
      const filtered = prev.filter((b) => b.order !== orderToDelete);
      return filtered.map((b, idx) => ({ ...b, order: idx })); // re-index orders
    });
  };

  /* ----------------- Render ----------------- */
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => addBlock("HEADING")}
        >
          + Heading
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addBlock("TEXT")}>
          + Text
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addBlock("LIST")}>
          + Bullet List
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => addBlock("DIVIDER")}
        >
          + Divider
        </Button>
        {/* <Button size="sm" variant="secondary" onClick={() => addBlock("IMAGE")}>
          + Image
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addBlock("VIDEO")}>
          + Video
        </Button> */}
      </div>

      {/* Drag list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b.order)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block) => (
            <SortableBlock
              key={block.order}
              block={block}
              onChange={(patch) => updateBlock(block.order, patch)}
              onDelete={() => deleteBlock(block.order)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

/* =========== Sortable individual block =========== */
function SortableBlock({
  block,
  onChange,
  onDelete,
}: {
  block: ContentBlockInput;
  onChange: (patch: Partial<ContentBlockInput>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.order });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /* ----- Render each block type inline-editable ----- */
  let inner: React.ReactNode;
  switch (block.type) {
    case "HEADING":
      inner = (
        <>
          <select
            value={block.level ?? 1}
            onChange={(e) => onChange({ level: parseInt(e.target.value) })}
            className="text-sm mb-1"
          >
            <option value={1}>Title</option>
            <option value={2}>Sub-Header</option>
          </select>
          <input
            className="w-full text-xl font-semibold outline-none"
            placeholder="Heading…"
            value={block.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </>
      );
      break;

    case "TEXT":
      inner = (
        <textarea
          className="w-full border-none outline-none resize-none"
          placeholder="Write text…"
          rows={3}
          value={block.body ?? ""}
          onChange={(e) => onChange({ body: e.target.value })}
        />
      );
      break;

    case "LIST": {
      const items = (block.items ?? []) as string[];
      inner = (
        <div className="space-y-2">
          <select
            value={block.listStyle ?? ListStyle.BULLET}
            onChange={(e) =>
              onChange({ listStyle: e.target.value as ListStyle })
            }
            className="text-sm mb-1"
          >
            <option value={ListStyle.BULLET}>Bulleted</option>
            <option value={ListStyle.NUMBER}>Numbered</option>
          </select>
          <div className="ml-6 space-y-1">
            {items.map((item, idx) => (
              <input
                key={idx}
                className="w-full border-b border-gray-200 py-1 outline-none"
                placeholder="List item…"
                value={item}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx] = e.target.value;
                  onChange({ items: newItems });
                }}
              />
            ))}
            <button
              onClick={() => onChange({ items: [...items, ""] })}
              className="text-sm text-purple-600 hover:underline"
              type="button"
            >
              + Add item
            </button>
          </div>
        </div>
      );
      break;
    }

    case "DIVIDER":
      inner = <hr />;
      break;

    case "IMAGE":
      inner = block.imageUrl ? (
        <img src={block.imageUrl} className="w-full rounded" />
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadImage(file);
            onChange({ imageUrl: url });
          }}
        />
      );
      break;

    case "VIDEO":
      inner = <p className="text-sm text-gray-500">[video placeholder]</p>;
      break;

    default:
      inner = null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border rounded p-3 bg-white shadow-sm space-y-2 cursor-grab"
    >
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400 uppercase">{block.type}</span>
        <select
          value={block.color ?? DEFAULT_COLOR}
          onChange={(e) => onChange({ color: e.target.value as TextColor })}
          className="text-xs bg-transparent border border-gray-300 rounded px-1 py-0.5"
        >
          <option value="BLACK">Black</option>
          <option value="GRAY">Gray</option>
          <option value="PURPLE">Purple</option>
        </select>
        <button
          onClick={onDelete}
          className="text-red-500 text-xs hover:text-red-700"
          title="Delete block"
        >
          ✕
        </button>
      </div>
      {inner}
    </div>
  );
}
