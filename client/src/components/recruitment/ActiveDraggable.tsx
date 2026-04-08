import { Active } from "@/lib/mock-data";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { MouseEvent } from "react";

interface ActiveDraggableProps {
  active: Active;
  isMatched?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onRightClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

export default function ActiveDraggable({ active, isMatched, isHighlighted, isDimmed, onHoverStart, onHoverEnd, onRightClick }: ActiveDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: active.id,
    data: { active },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onContextMenu={onRightClick}
      data-testid={`button-active-${active.id}`}
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing py-1.5 px-2.5 border border-slate-200/90 bg-white/95 text-[12px] font-medium text-slate-700 shadow-[0_10px_18px_-16px_rgba(15,23,42,0.55)] transition-all hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-[0_14px_24px_-18px_rgba(15,23,42,0.45)] rounded-none",
        isDragging && "opacity-55 scale-[1.03] shadow-lg",
        isMatched && "bg-slate-50/90 text-slate-400",
        isHighlighted && "border-sky-400 bg-sky-50 text-sky-700 shadow-[0_14px_24px_-18px_rgba(14,116,144,0.45)]",
        isDimmed && !isDragging && "opacity-30"
      )}
    >
      {active.name}
    </div>
  );
}
