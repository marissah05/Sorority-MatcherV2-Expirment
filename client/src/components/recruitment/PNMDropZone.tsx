import { PNM } from "@/lib/mock-data";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface PNMDropZoneProps {
  pnm: PNM;
  slot: 1 | 2;
  matchedActiveName?: string;
  onUnmatch: (pnmId: string, slot: 1 | 2) => void;
  isDuplicate?: boolean;
}

export default function PNMDropZone({ pnm, slot, matchedActiveName, onUnmatch, isDuplicate }: PNMDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${pnm.id}-${slot}`,
    data: { pnm, slot },
  });

  if (matchedActiveName) {
    const isSlot1 = slot === 1;
    return (
      <div className={cn(
        "flex items-center justify-between gap-1 px-2 py-0.5 border text-[11px] font-medium min-w-[100px] rounded-none",
        isSlot1 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-purple-50 border-purple-200 text-purple-700",
        isDuplicate && "bg-red-50 border-red-500 text-red-700 animate-pulse"
      )}>
        <span className="truncate">{matchedActiveName}</span>
        <button 
          onClick={() => onUnmatch(pnm.id, slot)}
          className="hover:text-destructive transition-colors leading-none"
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
        "h-6 border-2 border-dashed flex items-center justify-center text-[10px] text-muted-foreground/50 italic px-2 transition-colors min-w-[100px] rounded-none",
        isOver ? "bg-primary/5 border-primary text-primary" : "border-border/60 hover:border-border"
      )}
    >
      {isOver ? "Release" : `Slot ${slot}`}
    </div>
  );
}
