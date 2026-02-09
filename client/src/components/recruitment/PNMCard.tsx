import { PNM } from "@/lib/mock-data";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface PNMCardProps {
  pnm: PNM;
  isOverlay?: boolean;
}

export default function PNMCard({ pnm, isOverlay }: PNMCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: pnm.id,
    data: { pnm },
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
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing py-1 px-2 rounded border border-border bg-white text-sm font-medium transition-all",
        isDragging && "opacity-50",
        isOverlay && "shadow-lg border-primary ring-1 ring-primary/20 scale-105 z-50"
      )}
    >
      <div className="flex justify-between items-center gap-2">
        <span>{pnm.name}</span>
        <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">#{pnm.idNumber}</span>
      </div>
    </div>
  );
}
