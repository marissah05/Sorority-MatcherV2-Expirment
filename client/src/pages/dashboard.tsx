import { useState, useMemo } from "react";
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
import ActiveDraggable from "@/components/recruitment/ActiveDraggable";
import PNMDropZone from "@/components/recruitment/PNMDropZone";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ClipboardPaste, UserPlus, Layers } from "lucide-react";

interface RoundData {
  id: string;
  name: string;
  pnms: PNM[];
}

export default function Dashboard() {
  const [rounds, setRounds] = useState<RoundData[]>([
    { id: "r1", name: "Round 1", pnms: MOCK_PNMS },
    { id: "r2", name: "Round 2", pnms: MOCK_PNMS.slice(0, 2) },
    { id: "r3", name: "Round 3", pnms: [] },
  ]);
  const [activeRoundId, setActiveRoundId] = useState("r1");
  const [actives] = useState<Active[]>(MOCK_ACTIVES);
  const [draggingActiveId, setDraggingActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pasteData, setPasteData] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeRound = useMemo(() => rounds.find(r => r.id === activeRoundId)!, [rounds, activeRoundId]);

  const handleImport = () => {
    if (!pasteData.trim()) return;
    const lines = pasteData.split('\n');
    const newPnms: PNM[] = lines.map((line, index) => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      return {
        id: `p-${Date.now()}-${index}`,
        name: parts[0] || `PNM ${activeRound.pnms.length + index + 1}`,
        idNumber: parts[1] || `ID-${Date.now()}-${index}`,
        status: 'unmatched'
      };
    });

    setRounds(prev => prev.map(r => 
      r.id === activeRoundId ? { ...r, pnms: [...r.pnms, ...newPnms] } : r
    ));
    setPasteData("");
    setIsImportOpen(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingActiveId(null);

    if (over) {
      const activeId = active.id as string;
      const overData = over.data.current as { pnm: PNM, slot: 1 | 2 };
      
      // Check if this active is already used in THIS ROUND for THIS PNM
      const pnm = activeRound.pnms.find(p => p.id === overData.pnm.id);
      if (!pnm) return;

      if (pnm.matchedWith === activeId || pnm.secondMatch === activeId) return;

      // Update round PNMs
      setRounds(prev => prev.map(r => {
        if (r.id !== activeRoundId) return r;
        return {
          ...r,
          pnms: r.pnms.map(p => {
            if (p.id !== overData.pnm.id) return p;
            return {
              ...p,
              status: 'matched',
              [overData.slot === 1 ? 'matchedWith' : 'secondMatch']: activeId
            };
          })
        };
      }));
    }
  };

  const handleUnmatch = (pnmId: string, slot: 1 | 2) => {
    setRounds(prev => prev.map(r => {
      if (r.id !== activeRoundId) return r;
      return {
        ...r,
        pnms: r.pnms.map(p => {
          if (p.id !== pnmId) return p;
          const updated = { ...p, [slot === 1 ? 'matchedWith' : 'secondMatch']: undefined };
          updated.status = (updated.matchedWith || updated.secondMatch) ? 'matched' : 'unmatched';
          return updated;
        })
      };
    }));
  };

  const filteredPnms = activeRound.pnms.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.idNumber.includes(searchTerm)
  );

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="bg-white border-b px-4 py-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg text-primary">Bump Planner Pro</h1>
          <Tabs value={activeRoundId} onValueChange={setActiveRoundId} className="w-auto">
            <TabsList className="h-8 bg-slate-100">
              {rounds.map(r => (
                <TabsTrigger key={r.id} value={r.id} className="text-xs px-4 h-7">
                  {r.name}
                </TabsTrigger>
              ))}
              <Button 
                variant="ghost" 
                className="h-7 w-7 p-0 ml-1 hover:bg-white"
                onClick={() => setRounds(prev => [...prev, { id: `r${prev.length + 1}`, name: `Round ${prev.length + 1}`, pnms: [] }])}
              >
                +
              </Button>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><ClipboardPaste className="w-3 h-3 mr-1.5" /> Import for {activeRound.name}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Import to {activeRound.name}</DialogTitle><DialogDescription>Format: Name, ID Number (one per line)</DialogDescription></DialogHeader>
              <Textarea placeholder="Jane Doe, 12345" className="min-h-[200px]" value={pasteData} onChange={(e) => setPasteData(e.target.value)} />
              <Button onClick={handleImport} className="w-full">Add PNMs to Round</Button>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <DndContext sensors={sensors} onDragStart={(e) => setDraggingActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-2 border-b bg-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search current round..." className="h-8 text-sm max-w-xs bg-slate-50/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-normal">{activeRound.pnms.length} PNMs in Round</Badge>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-2 h-9 text-xs uppercase tracking-wider font-bold">PNM Name & ID</TableHead>
                    <TableHead className="py-2 h-9 text-xs uppercase tracking-wider font-bold">Bump Match 1</TableHead>
                    <TableHead className="py-2 h-9 text-xs uppercase tracking-wider font-bold">Bump Match 2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPnms.map(pnm => (
                    <TableRow key={pnm.id} className="h-12 border-b-slate-100 hover:bg-white/80 transition-colors">
                      <TableCell className="py-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{pnm.name}</span>
                          <span className="text-[10px] text-muted-foreground">ID: {pnm.idNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <PNMDropZone 
                          pnm={pnm} 
                          slot={1} 
                          matchedActiveName={actives.find(a => a.id === pnm.matchedWith)?.name}
                          onUnmatch={handleUnmatch}
                        />
                      </TableCell>
                      <TableCell className="py-1">
                        <PNMDropZone 
                          pnm={pnm} 
                          slot={2} 
                          matchedActiveName={actives.find(a => a.id === pnm.secondMatch)?.name}
                          onUnmatch={handleUnmatch}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          <div className="w-64 border-l bg-slate-100/50 p-3 shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Active Members</h3>
              <Layers className="h-3 w-3 text-slate-400" />
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1.5 pr-2">
                {actives.map(active => (
                  <ActiveDraggable 
                    key={active.id} 
                    active={active}
                  />
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-[10px] leading-relaxed text-slate-600 italic">
                Tip: Drag actives into the empty slots to build your bump pairs.
              </p>
            </div>
          </div>
        </div>
        
        <DragOverlay>
          {draggingActiveId ? (
            <div className="py-1.5 px-3 rounded-md border border-primary bg-white text-sm font-semibold shadow-xl opacity-90 scale-105">
              {actives.find(a => a.id === draggingActiveId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
