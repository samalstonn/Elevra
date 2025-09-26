"use client";

import { ContentBlock, ListStyle, TextColor } from "@prisma/client";
import { useState, useRef, useMemo, useEffect } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Eye } from "lucide-react";
import { unchanged as isServerBlockUnchanged } from "@/lib/content-blocks";
import { colorClass } from "@/lib/constants";

const blockKey = (id: number | null | undefined, order: number) =>
  typeof id === "number" ? id : `order-${order}`;

function buildServerUnchangedMap(blocks: ContentBlock[]) {
  const map = new Map<number | string, boolean>();
  blocks.forEach((block) => {
    map.set(blockKey(block.id, block.order), isServerBlockUnchanged(block));
  });
  return map;
}

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

type Props = {
  candidateSlug: string;
  initialBlocks: ContentBlock[];
  onSave: (blocks: ContentBlock[], staticIds: Set<number>) => Promise<void>;
};

const DEFAULT_COLOR: TextColor = "BLACK";

export default function ContentBlocksEditor({
  candidateSlug,
  initialBlocks,
  onSave,
}: Props) {
  const sortedInitial = useMemo(
    () => [...initialBlocks].sort((a, b) => a.order - b.order),
    [initialBlocks]
  );

  const [blocks, setBlocks] = useState<ContentBlock[]>(sortedInitial);

  /** ------------- Toolbar state ------------- */
  const [_selectedColor, _setSelectedColor] =
    useState<TextColor>(DEFAULT_COLOR);
  /** Keeps track of the block currently being edited */
  const [_selectedOrder, setSelectedOrder] = useState<number | null>(null);

  // const handleColorChange = (c: TextColor) => {
  //   setSelectedColor(c);
  //   if (selectedOrder !== null) {
  //     updateBlock(selectedOrder, { color: c });
  //   }
  // };

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({});
  const [uploadProgressMap, setUploadProgressMap] = useState<
    Record<number, number>
  >({});
  const anyUploading = Object.values(uploadingMap).some(Boolean);
  // these are the IDs of blocks that were present when we loaded the editor
  const [staticIds, setStaticIds] = useState<Set<number>>(
    sortedInitial
      .map((b) => b.id)
      .filter((id): id is number => typeof id === "number")
      .reduce((set, id) => set.add(id), new Set<number>())
  );
  const serverUnchangedMapRef = useRef<Map<number | string, boolean>>(
    buildServerUnchangedMap(sortedInitial)
  );
  function setUploading(order: number, isUploading: boolean) {
    setUploadingMap((prev) => ({ ...prev, [order]: isUploading }));
  }
  function setProgress(order: number, percent: number) {
    setUploadProgressMap((prev) => ({ ...prev, [order]: percent }));
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(blocks, staticIds);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const sorted = [...initialBlocks].sort((a, b) => a.order - b.order);
    setBlocks(sorted);
    setStaticIds(
      sorted
        .map((b) => b.id)
        .filter((id): id is number => typeof id === "number")
        .reduce((set, id) => set.add(id), new Set<number>())
    );
    serverUnchangedMapRef.current = buildServerUnchangedMap(sorted);
  }, [initialBlocks]);

  /* ----------------- Helpers ----------------- */
  // const addBlock = (
  //   type: BlockType,
  //   extra: Partial<ContentBlock> = {}
  // ) => {
  //   setBlocks((prev) => [
  //     ...prev,
  //     {
  //       type,
  //       order: prev.length,
  //       color: selectedColor,
  //       ...extra,
  //     } as ContentBlock,
  //   ]);
  // };

  /** Convert the currently‑selected block, or create a new one if none selected.
   *  When converting we attempt to carry the user’s existing content forward in a sensible way.
   *  – TEXT ➜ LIST: split existing body on new‑lines into list items
   *  – LIST ➜ TEXT: join items back into a multi‑line body
   *  – TEXT/LIST ➜ HEADING: collapse text into a single line
   */
  // const convertblock = (type: BlockType, extra: Partial<ContentBlock> = {}) => {
  //   if (selectedOrder === null) {
  //     // nothing highlighted → just insert a new block
  //     addBlock(type, extra);
  //     return;
  //   }

  //   setBlocks((prev) =>
  //     prev.map((b) => {
  //       if (b.order !== selectedOrder) return b;

  //       const incoming: ContentBlock = { ...b, type, ...extra };

  //       /* ---------- TEXT → LIST ---------- */
  //       if (type === "LIST") {
  //         let seed = "";
  //         if (b.type === "TEXT") seed = b.body ?? "";
  //         else if (b.type === "HEADING") seed = b.text ?? "";
  //         else if (b.type === "LIST") seed = (b.items ?? []).join("\n");

  //         const items = seed
  //           .split(/\n+/)
  //           .map((s) => s.trim())
  //           .filter(Boolean);

  //         incoming.items = items;
  //         incoming.listStyle =
  //           extra.listStyle ??
  //           (b.type === "LIST" ? b.listStyle : ListStyle.BULLET);
  //         delete (incoming as any).body;
  //         delete (incoming as any).text;
  //       }

  //       /* ---------- LIST → TEXT ---------- */
  //       if (type === "TEXT") {
  //         if (b.type === "LIST") {
  //           incoming.body = (b.items ?? []).join("\n");
  //           delete (incoming as any).items;
  //           delete (incoming as any).listStyle;
  //         } else if (b.type === "HEADING") {
  //           incoming.body = b.text ?? "";
  //           delete (incoming as any).text;
  //         }
  //       }

  //       /* ---------- → HEADING ---------- */
  //       if (type === "HEADING") {
  //         if (b.type === "TEXT") {
  //           incoming.text = (b.body ?? "").split(/\n/)[0];
  //           delete (incoming as any).body;
  //         } else if (b.type === "LIST") {
  //           incoming.text = (b.items ?? []).join(" ");
  //           delete (incoming as any).items;
  //           delete (incoming as any).listStyle;
  //         }
  //       }

  //       return incoming;
  //     })
  //   );
  // };

  const updateBlock = (block: ContentBlock, patch: Partial<ContentBlock>) => {
    if (typeof block.id === "number") {
      setStaticIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(block.id!);
        return newSet;
      });
      serverUnchangedMapRef.current.set(blockKey(block.id, block.order), false);
    }
    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? { ...b, ...patch } : b))
    );
  };

  // const deleteBlock = (orderToDelete: number) => {
  //   setBlocks((prev) => {
  //     const filtered = prev.filter((b) => b.order !== orderToDelete);
  //     return filtered.map((b, idx) => ({ ...b, order: idx })); // re-index orders
  //   });
  // };

  /* ----------------- Render ----------------- */
  return (
    <div className="w-full space-y-4">
      {/* ---------- Top Toolbar ---------- */}
      {/* <Toolbar
        selectedColor={selectedColor}
        onColorChange={handleColorChange}
        convertBlock={convertBlock}
        addBlock={addBlock}
      /> */}
      <SortableContext
        items={blocks.map((b) => b.order)}
        strategy={verticalListSortingStrategy}
      >
        {blocks.map((block) => (
          <SortableBlock
            key={block.order}
            block={block}
            candidateSlug={candidateSlug}
            onChange={(patch) => updateBlock(block, patch)}
            // onDelete={() => deleteBlock(block.order)}
            uploading={uploadingMap[block.order] || false}
            setUploading={setUploading}
            progress={uploadProgressMap[block.order] ?? 0}
            setProgress={setProgress}
            setSelectedOrder={setSelectedOrder}
            serverUnchanged={
              serverUnchangedMapRef.current.get(
                blockKey(block.id, block.order)
              ) ?? false
            }
          />
        ))}
      </SortableContext>
      <div className="flex flex-row items-center gap-2">
        <Button onClick={handleSave} disabled={isSaving || anyUploading}>
          {isSaving ? "Saving..." : anyUploading ? "Uploading..." : "Save"}
        </Button>
        <Button variant="purple" asChild>
          <Link href={`/candidate/${candidateSlug}`}>
            <Eye className="mr-2 h-4 w-4" /> View Public Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* =========== Sortable individual block =========== */
function SortableBlock({
  block,
  onChange,
  // onDelete,
  candidateSlug,
  uploading,
  setUploading,
  progress,
  setProgress,
  setSelectedOrder,
  serverUnchanged,
}: {
  block: ContentBlock;
  onChange: (patch: Partial<ContentBlock>) => void;
  // onDelete: () => void;
  candidateSlug: string;
  uploading: boolean;
  setUploading: (order: number, isUploading: boolean) => void;
  progress: number;
  setProgress: (order: number, percent: number) => void;
  setSelectedOrder: (order: number) => void;
  serverUnchanged: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.order });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const blockKeyRef = useRef<number | string>(blockKey(block.id, block.order));

  const [hasEditedHeading, setHasEditedHeading] = useState(false);
  const [hasEditedText, setHasEditedText] = useState(false);
  const [editedItems, setEditedItems] = useState<boolean[]>(
    new Array(block.items?.length ?? 0).fill(false)
  );

  useEffect(() => {
    const currentKey = blockKey(block.id, block.order);
    if (blockKeyRef.current !== currentKey) {
      setEditedItems(new Array(block.items?.length ?? 0).fill(false));
      setHasEditedHeading(false);
      setHasEditedText(false);
      blockKeyRef.current = currentKey;
    }
  }, [block.id, block.order, block.items?.length]);

  const resolveColorClass = (locallyEdited: boolean) => {
    if (block.color === "PURPLE") {
      return colorClass.PURPLE;
    }
    if (block.color === "BLACK") {
      return colorClass.BLACK;
    }
    const shouldStayGray = serverUnchanged && !locallyEdited;
    return shouldStayGray ? colorClass.GRAY : colorClass.BLACK;
  };

  let inner: React.ReactNode;

  switch (block.type) {
    case "HEADING": {
      const headingColor = resolveColorClass(hasEditedHeading);
      const headingClass =
        block.level === 1
          ? `text-4xl font-bold ${headingColor} px-2 py-1`
          : `text-2xl font-semibold ${headingColor} px-2 py-1`;

      inner = (
        <h2
          className={headingClass}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (!hasEditedHeading) setHasEditedHeading(true);
            onChange({ text: block.text ?? "" });
          }}
          onFocus={() => setSelectedOrder(block.order)}
        >
          {block.text ?? ""}
        </h2>
      );
      break;
    }
    case "TEXT": {
      const textColor = resolveColorClass(hasEditedText);
      inner = (
        <div
          className={`text-sm whitespace-pre-wrap ${textColor} px-2 py-1`}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (!hasEditedText) setHasEditedText(true);
            onChange({ body: block.body });
          }}
          onFocus={() => setSelectedOrder(block.order)}
        >
          {block.body ?? ""}
        </div>
      );
      break;
    }
    case "LIST": {
      const listItems = block.items ?? [];
      const listEdited = editedItems.some(Boolean);
      const listColor = resolveColorClass(listEdited);
      const ListTag = block.listStyle === ListStyle.NUMBER ? "ol" : "ul";
      const listClass =
        block.listStyle === ListStyle.NUMBER
          ? `list-decimal text-sm ml-6 ${listColor}`
          : `list-disc text-sm ml-6 ${listColor}`;

      inner = (
        <>
          <ListTag className={listClass + " space-y-1"}>
            {listItems.map((item, idx) => (
              <li key={idx} className="relative">
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className={`min-w-[4ch] pr-4 outline-none align-top ${
                    editedItems[idx] ? "text-black" : listColor
                  }`}
                  onInput={() => {
                    if (!editedItems[idx]) {
                      const updated = [...editedItems];
                      updated[idx] = true;
                      setEditedItems(updated);
                    }

                    const newItems = [...(block.items ?? [])];
                    newItems[idx] = block.items[idx] ?? "";
                    onChange({ items: newItems });
                  }}
                  onFocus={() => setSelectedOrder(block.order)}
                >
                  {item}
                </span>
                <button
                  type="button"
                  className="absolute -right-5 top-1.5 text-red-500 hover:text-red-600 opacity-100 transition"
                  onClick={() => {
                    const newItems = listItems.filter((_, i) => i !== idx);
                    onChange({ items: newItems });
                    setEditedItems((prev) => prev.filter((_, i) => i !== idx));
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ListTag>
          <button
            onClick={() => {
              onChange({ items: [...(block.items ?? []), ""] });
              setEditedItems([...editedItems, false]);
            }}
            className="text-sm text-purple-600 hover:underline ml-6 mt-1"
            type="button"
          >
            + Add item
          </button>
        </>
      );
      break;
    }
    case "DIVIDER":
      inner = <hr />;
      break;
    case "IMAGE": {
      if (uploading) {
        inner = <progress value={progress} max={100} className="w-full" />;
        break;
      }

      const handleImageSelect = async (
        e: React.ChangeEvent<HTMLInputElement>
      ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(block.order, true);
        setProgress(block.order, 0);
        try {
          const url = await uploadMedia(file, candidateSlug, (p) =>
            setProgress(block.order, p)
          );
          onChange({ imageUrl: url });
        } catch (error) {
          console.error("Upload failed:", error);
          alert(
            `Upload failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        } finally {
          setUploading(block.order, false);
          setProgress(block.order, 0);
        }
      };

      const captionColor = resolveColorClass(false);

      inner = (
        <>
          {block.imageUrl ? (
            <Image
              src={block.imageUrl}
              alt={block.caption ?? ""}
              className="w-full rounded mx-auto cursor-pointer hover:outline hover:outline-2 hover:outline-purple-600"
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: "50%", height: "auto" }}
              priority={false}
              title="Click to change photo"
              onClick={() => imageInputRef.current?.click()}
            />
          ) : (
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => imageInputRef.current?.click()}
            >
              Select Image
            </Button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          {block.caption ? (
            <figcaption className={`text-sm mt-1 ${captionColor}`}>
              {block.caption}
            </figcaption>
          ) : null}
        </>
      );
      break;
    }
    case "VIDEO": {
      if (uploading) {
        inner = <progress value={progress} max={100} className="w-full" />;
        break;
      }

      const captionColor = resolveColorClass(false);

      if (block.videoUrl) {
        const handleVideoSelect = async (
          e: React.ChangeEvent<HTMLInputElement>
        ) => {
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
        };

        inner = (
          <>
            <video
              src={block.videoUrl}
              controls
              preload="metadata"
              className="w-1/2 rounded mx-auto cursor-pointer hover:outline hover:outline-2 hover:outline-purple-600"
              title="Click to change video"
              onClick={() => videoInputRef.current?.click()}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoSelect}
            />
            {block.caption ? (
              <figcaption className={`text-sm mt-1 ${captionColor}`}>
                {block.caption}
              </figcaption>
            ) : null}
          </>
        );
      } else {
        inner = (
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
      }
      break;
    }
    default:
      inner = null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="space-y-6 mx-auto max-w-4xl px-4 cursor-text"
      onClick={() => setSelectedOrder(block.order)}
    >
      {inner}
    </div>
  );
}
