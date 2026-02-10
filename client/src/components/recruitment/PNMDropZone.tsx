import { PNM } from "@/lib/mock-data";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface PNMDropZoneProps {
  pnm: PNM;
  slot: 1 | 2;
  matchedActiveName?: string;
  onUnmatch: (pnmId: string, slot: 1 | 2) => void;
}

export default function PNMDropZone({ pnm, slot, matchedActiveName, onUnmatch }: PNMDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${pnm.id}-${slot}`,
    data: { pnm, slot },
  });

  if (matchedActiveName) {
    const isSlot1 = slot === 1;
    return (
      <div className={cn(
        "flex items-center justify-between gap-2 px-3 py-1.5 rounded-md border text-xs font-medium min-w-[120px]",
        isSlot1 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-purple-50 border-purple-200 text-purple-700"
      )}>
        <span className="truncate">{matchedActiveName}</span>
        <button 
          onClick={() => onUnmatch(pnm.id, slot)}
          className="hover:text-destructive transition-colors"
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
        "h-8 border-2 border-dashed rounded-md flex items-center justify-center text-[10px] text-muted-foreground/50 italic px-3 transition-colors min-w-[120px]",
        isOver ? "bg-primary/5 border-primary text-primary" : "border-border/60 hover:border-border"
      )}
    >
      {isOver ? "Release to Match" : `Drop Match ${slot}`}
    </div>
  );
}
