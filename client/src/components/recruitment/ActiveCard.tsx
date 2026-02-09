import { Active, PNM } from "@/lib/mock-data";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import PNMCard from "./PNMCard";

interface ActiveCardProps {
  active: Active;
  matchedPNMs: PNM[];
  onUnmatch?: (pnmId: string) => void;
}

export default function ActiveCard({ active, matchedPNMs, onUnmatch }: ActiveCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: active.id,
    data: { active },
  });

  const isFull = matchedPNMs.length >= active.maxMatches;

  return (
    <Card 
      ref={setNodeRef}
      className={cn(
        "bg-white/50 border-dashed border-2 transition-colors duration-300 min-h-[300px] flex flex-col",
        isOver && !isFull ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]" : "border-border",
        isFull && "opacity-90 bg-secondary/10",
        "backdrop-blur-sm"
      )}
    >
      <CardHeader className="pb-3 border-b border-border/40 bg-white/40">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
            <AvatarImage src={active.avatar} alt={active.name} />
            <AvatarFallback>{active.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base font-heading font-medium flex justify-between items-center">
              {active.name}
              <Badge variant="outline" className="ml-2 font-sans font-normal text-xs bg-white/50">
                {matchedPNMs.length}/{active.maxMatches}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground font-sans">{active.role}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[400px]">
        {matchedPNMs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 text-sm font-medium italic min-h-[100px]">
            Drag PNMs here to match
          </div>
        ) : (
          matchedPNMs.map(pnm => (
             <div key={pnm.id} className="transform transition-all duration-300 hover:scale-[1.02] group relative">
                {/* Simplified card for matched view */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-border/50 flex items-center gap-3">
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={pnm.avatar} />
                     <AvatarFallback>{pnm.name[0]}</AvatarFallback>
                   </Avatar>
                   <div className="overflow-hidden flex-1">
                     <p className="text-sm font-medium truncate">{pnm.name}</p>
                     <p className="text-xs text-muted-foreground truncate">{pnm.hometown}</p>
                   </div>
                   {pnm.legacy && (
                     <div className="w-2 h-2 rounded-full bg-primary" title="Legacy" />
                   )}
                   {onUnmatch && (
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 text-muted-foreground hover:text-destructive"
                       onClick={() => onUnmatch(pnm.id)}
                     >
                       <X className="h-3 w-3" />
                     </Button>
                   )}
                </div>
             </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
