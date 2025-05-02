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
import Image from "next/image";

function uploadMedia(
  file: File,
  slug: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("candidateSlug", slug);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/api/blob/signed-url");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (data.error) reject(data.error);
        else resolve(data.url);
      } else {
        reject(`Upload failed with status ${xhr.status}`);
      }
    };
    xhr.onerror = () => reject("Network error");
    xhr.send(formData);
  });
}

export type ContentBlockInput = Omit<
  ContentBlock,
  "id" | "candidateId" | "electionId" | "createdAt" | "updatedAt"
>;

type Props = {
  candidateSlug: string;
  initialBlocks: ContentBlock[];
  onSave: (blocks: ContentBlockInput[]) => Promise<void>;
};

const DEFAULT_COLOR: TextColor = "BLACK";

export default function ContentBlocksEditor({
  candidateSlug,
  initialBlocks,
  onSave,
}: Props) {
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
  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({});
  const [uploadProgressMap, setUploadProgressMap] = useState<
    Record<number, number>
  >({});
  const anyUploading = Object.values(uploadingMap).some(Boolean);
  function setUploading(order: number, isUploading: boolean) {
    setUploadingMap((prev) => ({ ...prev, [order]: isUploading }));
  }
  function setProgress(order: number, percent: number) {
    setUploadProgressMap((prev) => ({ ...prev, [order]: percent }));
  }

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
        <Button size="sm" variant="secondary" onClick={() => addBlock("IMAGE")}>
          + Image
        </Button>
        <Button size="sm" variant="secondary" onClick={() => addBlock("VIDEO")}>
          + Video
        </Button>
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
              candidateSlug={candidateSlug}
              onChange={(patch) => updateBlock(block.order, patch)}
              onDelete={() => deleteBlock(block.order)}
              uploading={uploadingMap[block.order] || false}
              setUploading={setUploading}
              progress={uploadProgressMap[block.order] ?? 0}
              setProgress={setProgress}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button onClick={handleSave} disabled={isSaving || anyUploading}>
        {isSaving ? "Saving..." : anyUploading ? "Uploading..." : "Save"}
      </Button>
    </div>
  );
}

/* =========== Sortable individual block =========== */
function SortableBlock({
  block,
  onChange,
  onDelete,
  candidateSlug,
  uploading,
  setUploading,
  progress,
  setProgress,
}: {
  block: ContentBlockInput;
  onChange: (patch: Partial<ContentBlockInput>) => void;
  onDelete: () => void;
  candidateSlug: string;
  uploading: boolean;
  setUploading: (order: number, isUploading: boolean) => void;
  progress: number;
  setProgress: (order: number, percent: number) => void;
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
      if (uploading) {
        inner = <progress value={progress} max={100} className="w-full" />;
        break;
      }
      inner = block.imageUrl ? (
        <Image
          src={block.imageUrl}
          alt={block.caption ?? ""}
          className="w-1/2 rounded"
          width={600}
          height={600}
          priority={false}
        />
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(block.order, true);
            setProgress(block.order, 0);
            try {
              const url = await uploadMedia(file, candidateSlug, (p) =>
                setProgress(block.order, p)
              );
              onChange({ imageUrl: url });
            } finally {
              setUploading(block.order, false);
              setProgress(block.order, 0);
            }
          }}
        />
      );
      break;

    case "VIDEO":
      if (uploading) {
        inner = <progress value={progress} max={100} className="w-full" />;
        break;
      }
      inner = block.videoUrl ? (
        <video
          src={block.videoUrl}
          controls
          preload="metadata"
          className="w-1/2 rounded"
        />
      ) : (
        <input
          type="file"
          accept="video/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(block.order, true);
            setProgress(block.order, 0);
            try {
              const url = await uploadMedia(file, candidateSlug, (p) =>
                setProgress(block.order, p)
              );
              onChange({ videoUrl: url, thumbnailUrl: "" });
            } finally {
              setUploading(block.order, false);
              setProgress(block.order, 0);
            }
          }}
        />
      );
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
