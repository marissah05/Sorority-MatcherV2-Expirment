import { PNM } from "@/lib/mock-data";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface PNMDropZoneProps {
  pnm: PNM;
  slot: 1 | 2;
  matchedActiveName?: string;
  onUnmatch: (pnmId: string, slot: 1 | 2) => void;
  isDuplicate?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  dropPreview?: {
    alreadyUsedInSlot: boolean;
    chainCount: number;
    isOverLimit: boolean;
  };
}

export default function PNMDropZone({ pnm, slot, matchedActiveName, onUnmatch, isDuplicate, isHighlighted, isDimmed, dropPreview }: PNMDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${pnm.id}-${slot}`,
    data: { pnm, slot },
  });

  if (matchedActiveName) {
    const isSlot1 = slot === 1;
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-1 px-2 py-0.5 border text-[11px] font-medium min-w-[100px] rounded-none transition-all",
          isSlot1 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-purple-50 border-purple-200 text-purple-700",
          isDuplicate && "bg-red-50 border-red-500 text-red-700 animate-pulse",
          isHighlighted && "ring-1 ring-slate-900/10 shadow-sm",
          isDimmed && "opacity-40"
        )}
        data-testid={`text-match-${slot}-${pnm.id}`}
      >
        <span className="truncate">{matchedActiveName}</span>
        <button
          onClick={() => onUnmatch(pnm.id, slot)}
          className="hover:text-destructive transition-colors leading-none"
          data-testid={`button-unmatch-${slot}-${pnm.id}`}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-6 border-2 border-dashed flex items-center justify-center text-[10px] px-2 transition-colors min-w-[100px] rounded-none",
        isOver && dropPreview?.alreadyUsedInSlot && "border-red-400 bg-red-50 text-red-700",
        isOver && !dropPreview?.alreadyUsedInSlot && dropPreview?.isOverLimit && "border-amber-400 bg-amber-50 text-amber-700",
        isOver && !dropPreview?.alreadyUsedInSlot && !dropPreview?.isOverLimit && "bg-primary/5 border-primary text-primary",
        !isOver && "text-muted-foreground/50 italic border-border/60 hover:border-border",
        isHighlighted && !isOver && "border-slate-400 text-slate-700",
        isDimmed && !isOver && "opacity-40"
      )}
      data-testid={`dropzone-slot-${slot}-${pnm.id}`}
    >
      {isOver && dropPreview?.alreadyUsedInSlot
        ? `Used in Bump ${slot}`
        : isOver && dropPreview?.isOverLimit
          ? `Chain ${dropPreview.chainCount}`
          : isOver
            ? "Release"
            : `Slot ${slot}`}
    </div>
  );
}
