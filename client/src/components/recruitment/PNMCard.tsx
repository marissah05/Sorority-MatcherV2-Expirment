import { PNM } from "@/lib/mock-data";
import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, MapPin, Heart } from "lucide-react";
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
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <Card 
        className={cn(
          "relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 bg-white/80 backdrop-blur-sm cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50 rotate-3 scale-105 shadow-xl z-50",
          isOverlay && "rotate-3 scale-105 shadow-xl cursor-grabbing ring-2 ring-primary/20",
          "w-full max-w-[300px]"
        )}
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/80 to-accent/80" />
        
        <div className="p-4 flex gap-4">
          <Avatar className="h-16 w-16 border-2 border-white shadow-md ring-1 ring-primary/10">
            <AvatarImage src={pnm.avatar} alt={pnm.name} className="object-cover" />
            <AvatarFallback>{pnm.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-start">
              <h3 className="font-heading font-semibold text-lg leading-tight text-foreground">
                {pnm.name}
              </h3>
              {pnm.legacy && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium bg-primary/10 text-primary border-primary/20">
                  LEGACY
                </Badge>
              )}
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <MapPin className="h-3 w-3" />
              <span>{pnm.hometown}</span>
            </div>

            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <GraduationCap className="h-3 w-3" />
              <span>{pnm.major} • {pnm.gpa} GPA</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-1 flex-wrap">
          {pnm.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border border-secondary">
              {tag}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
