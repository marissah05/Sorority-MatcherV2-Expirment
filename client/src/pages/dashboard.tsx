import { useState } from "react";
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from "@dnd-kit/core";
import { MOCK_PNMS, MOCK_ACTIVES, PNM, Active } from "@/lib/mock-data";
import PNMCard from "@/components/recruitment/PNMCard";
import ActiveCard from "@/components/recruitment/ActiveCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Fixed import
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, Sparkles } from "lucide-react";
import bgTexture from "@/assets/bg-texture.png";

export default function Dashboard() {
  const [pnms, setPnms] = useState<PNM[]>(MOCK_PNMS);
  const [actives, setActives] = useState<Active[]>(MOCK_ACTIVES);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const unmatchedPnms = pnms.filter(p => p.status === 'unmatched' && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.hometown.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && over.id !== 'unmatched') {
      const pnmId = active.id as string;
      const activeMemberId = over.id as string;
      
      const activeMember = actives.find(a => a.id === activeMemberId);
      const matchesCount = pnms.filter(p => p.matchedWith === activeMemberId).length;

      if (activeMember && matchesCount < activeMember.maxMatches) {
        setPnms(prev => prev.map(p => {
          if (p.id === pnmId) {
            return { ...p, status: 'matched', matchedWith: activeMemberId };
          }
          return p;
        }));
      }
    }
  };

  const draggedPnm = activeId ? pnms.find(p => p.id === activeId) : null;

  const handleUnmatch = (pnmId: string) => {
     setPnms(prev => prev.map(p => {
        if (p.id === pnmId) {
           return { ...p, status: 'unmatched', matchedWith: undefined };
        }
        return p;
     }));
  }

  return (
    <div className="min-h-screen bg-background font-sans relative overflow-hidden flex flex-col">
      {/* Background Texture */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url(${bgTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Header */}
      <header className="relative z-10 glass border-b border-border/40 px-6 py-4 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-serif italic text-lg shadow-lg">
             K
           </div>
           <div>
             <h1 className="font-heading text-2xl font-bold text-foreground">Kappa Beta Phi</h1>
             <p className="text-xs text-muted-foreground tracking-widest uppercase">Recruitment Dashboard • Fall 2025</p>
           </div>
        </div>
        
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="hidden sm:flex bg-white/50">
             <Filter className="w-4 h-4 mr-2" />
             Filters
           </Button>
           <Button className="shadow-lg shadow-primary/20">
             <Sparkles className="w-4 h-4 mr-2" />
             Auto-Match
           </Button>
        </div>
      </header>

      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 relative z-10 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Unmatched PNMs */}
          <div className="w-full md:w-[400px] lg:w-[450px] border-r border-border/40 bg-white/30 flex flex-col h-full">
            <div className="p-4 border-b border-border/20 space-y-4 bg-white/40 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                 <h2 className="font-heading text-lg font-medium flex items-center gap-2">
                   Potential New Members
                   <Badge variant="secondary" className="rounded-full px-2">{unmatchedPnms.length}</Badge>
                 </h2>
                 <Button variant="ghost" size="icon" className="h-8 w-8"><SortAsc className="h-4 w-4" /></Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or hometown..." 
                  className="pl-9 bg-white/70 border-white/40 shadow-sm focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 pb-20">
                {unmatchedPnms.map(pnm => (
                  <PNMCard key={pnm.id} pnm={pnm} />
                ))}
                {unmatchedPnms.length === 0 && (
                   <div className="text-center py-10 text-muted-foreground">
                      No PNMs found matching your search.
                   </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Column: Active Members / Matching Area */}
          <div className="flex-1 bg-secondary/5 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="font-heading text-2xl font-medium mb-2">Matching Rooms</h2>
                <p className="text-muted-foreground">Drag PNMs to an Active Member to assign a match.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {actives.map(active => (
                  <ActiveCard 
                    key={active.id} 
                    active={active} 
                    matchedPNMs={pnms.filter(p => p.matchedWith === active.id)}
                    onUnmatch={handleUnmatch}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>

        <DragOverlay>
          {draggedPnm ? (
            <PNMCard pnm={draggedPnm} isOverlay />
          ) : null}
        </DragOverlay>

      </DndContext>
    </div>
  );
}
