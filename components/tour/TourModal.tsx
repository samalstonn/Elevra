"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { GripVertical } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TourModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  widthClass?: string; // e.g., "sm:max-w-[640px]" or "max-w-sm"
  draggable?: boolean;
  backLabel?: string;
  onBack?: () => void;
};

export function TourModal({
  open,
  onOpenChange,
  title,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  widthClass = "sm:max-w-[640px]",
  draggable = true,
  backLabel,
  onBack,
}: TourModalProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const dragging = useRef(false);

  // Center the dialog on open
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const el = contentRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = el?.getBoundingClientRect();
      const w = rect?.width || 560; // fallback to widthClass default
      const h = rect?.height || 320;
      setPos({ x: Math.max((vw - w) / 2, 8), y: Math.max((vh - h) / 2, 8) });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!draggable) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos((_prev) => ({
        x: e.clientX - dragOffset.current.dx,
        y: e.clientY - dragOffset.current.dy,
      }));
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    // Touch support
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const t = e.touches[0];
      setPos({
        x: t.clientX - dragOffset.current.dx,
        y: t.clientY - dragOffset.current.dy,
      });
    };
    const onTouchEnd = () => {
      dragging.current = false;
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [draggable]);

  const startDrag = (clientX: number, clientY: number) => {
    if (!draggable) return;
    dragging.current = true;
    dragOffset.current = { dx: clientX - pos.x, dy: clientY - pos.y };
  };

  const onMouseDown = (e: React.MouseEvent) => startDrag(e.clientX, e.clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  };

  return (
    // Non-modal dialog keeps background scrollable and interactive
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        {/* Dim overlay that does not block interaction/scroll */}
        <div className="fixed inset-0 z-40 bg-black/30 pointer-events-none" />
        {/* Content stays scroll-friendly since dialog is non-modal */}
        <DialogPrimitive.Content
          ref={contentRef}
          style={{ left: pos.x, top: pos.y, transform: "none" }}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={`${widthClass} fixed z-50 grid w-full gap-4 border bg-background p-6 shadow-lg sm:rounded-lg`}
        >
          <DialogHeader className="relative pt-2">
            {/* Top-center drag handle */}
            <div
              className="absolute left-1/2 -top-5 rounded-md p-1 cursor-move select-none"
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              title="Drag to move"
              style={{ transform: "translateX(-50%) rotate(90deg)" }}
            >
              <GripVertical
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <DialogTitle
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              className="cursor-move select-none text-center"
            >
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-700 space-y-3">{children}</div>
          <div className="flex items-center justify-between gap-2">
            <div>
              {backLabel && onBack ? (
                <Button variant="ghost" onClick={onBack}>
                  {backLabel}
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              {secondaryLabel && onSecondary ? (
                <Button variant="outline" onClick={onSecondary}>
                  {secondaryLabel}
                </Button>
              ) : null}
              <Button variant="purple" onClick={onPrimary}>
                {primaryLabel}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}

export default TourModal;
