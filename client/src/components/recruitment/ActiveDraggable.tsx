import { Active, PNM } from "@/lib/mock-data";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface ActiveDraggableProps {
  active: Active;
  isMatched?: boolean;
}

export default function ActiveDraggable({ active, isMatched }: ActiveDraggableProps) {
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
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing py-1.5 px-3 rounded-md border border-border bg-white text-sm font-semibold shadow-sm transition-all hover:border-primary/50",
        isDragging && "opacity-50 scale-105 shadow-md",
        isMatched && "opacity-40"
      )}
    >
      {active.name}
    </div>
  );
}
