import { Active, PNM } from "@/lib/mock-data";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActiveCardProps {
  active: Active;
  matchedPNMs: PNM[];
}

export default function ActiveCard({ active, matchedPNMs }: ActiveCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: active.id,
    data: { active },
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "p-2 rounded border transition-colors",
        isOver ? "bg-primary/10 border-primary" : "bg-white/50 border-border",
      )}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold">{active.name}</span>
        <Badge variant="outline" className="text-[10px] h-4 px-1">{matchedPNMs.length}</Badge>
      </div>
    </div>
  );
}
