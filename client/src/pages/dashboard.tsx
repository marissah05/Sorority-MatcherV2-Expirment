import { useState } from "react";
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor,
  DragStartEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { MOCK_PNMS, MOCK_ACTIVES, PNM, Active } from "@/lib/mock-data";
import PNMCard from "@/components/recruitment/PNMCard";
import ActiveCard from "@/components/recruitment/ActiveCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, SortAsc, Sparkles, ClipboardPaste, UserPlus, X } from "lucide-react";
import bgTexture from "@/assets/bg-texture.png";

export default function Dashboard() {
  const [pnms, setPnms] = useState<PNM[]>(MOCK_PNMS);
  const [actives] = useState<Active[]>(MOCK_ACTIVES);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pasteData, setPasteData] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleImport = () => {
    if (!pasteData.trim()) return;
    
    const lines = pasteData.split('\n');
    const newPnms: PNM[] = lines.map((line, index) => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      const name = parts[0] || `PNM ${pnms.length + index + 1}`;
      const id = `p-new-${Date.now()}-${index}`;
      return {
        id,
        name,
        hometown: parts[1] || "Unknown",
        major: "Undecided",
        gpa: 4.0,
        legacy: false,
        tags: [],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        status: 'unmatched',
        matchedWith: undefined,
        secondMatch: undefined
      };
    });

    setPnms(prev => [...prev, ...newPnms]);
    setPasteData("");
    setIsImportOpen(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && over.id !== 'unmatched') {
      const pnmId = active.id as string;
      const activeMemberId = over.id as string;
      
      setPnms(prev => prev.map(p => {
        if (p.id === pnmId) {
          // If already matched with this person, do nothing
          if (p.matchedWith === activeMemberId || p.secondMatch === activeMemberId) return p;
          
          // If first slot empty, fill it
          if (!p.matchedWith) return { ...p, status: 'matched', matchedWith: activeMemberId };
          
          // If second slot empty, fill it
          if (!p.secondMatch) return { ...p, status: 'matched', secondMatch: activeMemberId };
          
          // If both full, replace first (or we could show an error)
          return { ...p, matchedWith: activeMemberId };
        }
        return p;
      }));
    }
  };

  const handleUnmatch = (pnmId: string, activeId: string) => {
    setPnms(prev => prev.map(p => {
      if (p.id === pnmId) {
        const isFirst = p.matchedWith === activeId;
        const isSecond = p.secondMatch === activeId;
        
        const newFirst = isFirst ? p.secondMatch : p.matchedWith;
        const newSecond = isSecond ? undefined : (isFirst ? undefined : p.secondMatch);
        
        return { 
          ...p, 
          matchedWith: newFirst, 
          secondMatch: newSecond,
          status: (newFirst || newSecond) ? 'matched' : 'unmatched'
        };
      }
      return p;
    }));
  };

  const filteredPnms = pnms.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.hometown.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background font-sans relative overflow-hidden flex flex-col">
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: `url(${bgTexture})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      
      <header className="relative z-10 glass border-b border-border/40 px-6 py-4 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-serif italic text-lg shadow-lg">K</div>
           <div>
             <h1 className="font-heading text-2xl font-bold text-foreground">Bump Group Manager</h1>
             <p className="text-xs text-muted-foreground tracking-widest uppercase">Dual-Match Protocol • Fall 2025</p>
           </div>
        </div>
        
        <div className="flex gap-2">
           <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
             <DialogTrigger asChild>
               <Button variant="outline" size="sm" className="bg-white/50">
                 <ClipboardPaste className="w-4 h-4 mr-2" />
                 Import List
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[500px]">
               <DialogHeader>
                 <DialogTitle>Import PNM List</DialogTitle>
                 <DialogDescription>Paste names and hometowns (separated by commas or tabs) to quickly build your list.</DialogDescription>
               </DialogHeader>
               <Textarea 
                 placeholder="Jane Doe, Dallas TX&#10;Mary Smith, Austin TX" 
                 className="min-h-[200px] font-mono text-sm"
                 value={pasteData}
                 onChange={(e) => setPasteData(e.target.value)}
               />
               <Button onClick={handleImport} className="w-full">
                 <UserPlus className="w-4 h-4 mr-2" /> Add PNMs
               </Button>
             </DialogContent>
           </Dialog>
           <Button className="shadow-lg shadow-primary/20">
             <Sparkles className="w-4 h-4 mr-2" />
             Auto-Match
           </Button>
        </div>
      </header>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 relative z-10 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Main Grid Section */}
          <div className="flex-1 flex flex-col border-r border-border/40 bg-white/20">
            <div className="p-4 border-b border-border/20 flex justify-between items-center bg-white/40">
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search PNMs..." 
                  className="pl-9 bg-white/70 border-white/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white/50">{pnms.length} Total PNMs</Badge>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <Table>
                <TableHeader className="bg-white/60 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[300px]">Potential New Member</TableHead>
                    <TableHead>Bump Match 1</TableHead>
                    <TableHead>Bump Match 2</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPnms.map(pnm => (
                    <TableRow key={pnm.id} className="group hover:bg-primary/5 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <PNMCard pnm={pnm} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {pnm.matchedWith ? (
                          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 w-fit">
                            <span className="text-sm font-medium">{actives.find(a => a.id === pnm.matchedWith)?.name}</span>
                            <button onClick={() => handleUnmatch(pnm.id, pnm.matchedWith!)} className="text-primary hover:text-destructive transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-muted-foreground/30 italic text-sm border-2 border-dashed border-border/50 rounded-lg p-2 w-32 text-center">Empty Slot</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {pnm.secondMatch ? (
                          <div className="flex items-center gap-2 bg-accent/20 px-3 py-1.5 rounded-full border border-accent/30 w-fit">
                            <span className="text-sm font-medium">{actives.find(a => a.id === pnm.secondMatch)?.name}</span>
                            <button onClick={() => handleUnmatch(pnm.id, pnm.secondMatch!)} className="text-accent hover:text-destructive transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-muted-foreground/30 italic text-sm border-2 border-dashed border-border/50 rounded-lg p-2 w-32 text-center">Empty Slot</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={pnm.matchedWith && pnm.secondMatch ? "default" : "secondary"}>
                          {pnm.matchedWith && pnm.secondMatch ? "Matched" : pnm.matchedWith || pnm.secondMatch ? "Partial" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Active Members Dock */}
          <div className="w-full lg:w-80 bg-white/40 backdrop-blur-md border-l border-border/40 p-4">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              Active Members
              <Badge variant="outline">{actives.length}</Badge>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {actives.map(active => (
                <ActiveCard 
                  key={active.id} 
                  active={active} 
                  matchedPNMs={pnms.filter(p => p.matchedWith === active.id || p.secondMatch === active.id)} 
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? <PNMCard pnm={pnms.find(p => p.id === activeId)!} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
