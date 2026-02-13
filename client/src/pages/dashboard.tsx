import { useState, useMemo } from "react";
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  DragStartEvent, 
  DragEndEvent,
  closestCenter,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { MOCK_PNMS, MOCK_ACTIVES, PNM, Active } from "@/lib/mock-data";
import ActiveDraggable from "@/components/recruitment/ActiveDraggable";
import PNMDropZone from "@/components/recruitment/PNMDropZone";
import SortablePNMRow from "@/components/recruitment/SortablePNMRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Search, ClipboardPaste, UserCheck, Users, Trash2, Download } from "lucide-react";

interface RoundData {
  id: string;
  name: string;
  pnms: PNM[];
}

export default function Dashboard() {
  const [rounds, setRounds] = useState<RoundData[]>([
    { id: "r1", name: "Round 1", pnms: MOCK_PNMS },
    { id: "r2", name: "Round 2", pnms: MOCK_PNMS.slice(0, 2) },
  ]);
  const [activeRoundId, setActiveRoundId] = useState("r1");
  const [actives, setActives] = useState<Active[]>(MOCK_ACTIVES);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<'active' | 'pnm' | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pnmPasteData, setPnmPasteData] = useState("");
  const [activePasteData, setActivePasteData] = useState("");
  const [isPnmImportOpen, setIsPnmImportOpen] = useState(false);
  const [isActiveImportOpen, setIsActiveImportOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeRound = useMemo(() => rounds.find(r => r.id === activeRoundId)!, [rounds, activeRoundId]);

  const usedActivesSlot1 = useMemo(() => new Set(activeRound.pnms.map(p => p.matchedWith).filter(Boolean)), [activeRound]);
  const usedActivesSlot2 = useMemo(() => new Set(activeRound.pnms.map(p => p.secondMatch).filter(Boolean)), [activeRound]);

  const handlePnmImport = () => {
    if (!pnmPasteData.trim()) return;
    const lines = pnmPasteData.split('\n');
    const newPnms: PNM[] = lines.map((line, index) => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      return {
        id: `p-${Date.now()}-${index}`,
        name: parts[0] || `PNM ${activeRound.pnms.length + index + 1}`,
        idNumber: parts[1] || `ID-${Date.now()}-${index}`,
        status: 'unmatched'
      };
    });
    setRounds(prev => prev.map(r => r.id === activeRoundId ? { ...r, pnms: [...r.pnms, ...newPnms] } : r));
    setPnmPasteData("");
    setIsPnmImportOpen(false);
  };

  const handleActiveImport = () => {
    if (!activePasteData.trim()) return;
    const lines = activePasteData.split('\n');
    const newActives: Active[] = lines.map((line, index) => ({
      id: `a-${Date.now()}-${index}`,
      name: line.trim()
    })).filter(a => a.name);
    setActives(prev => [...prev, ...newActives]);
    setActivePasteData("");
    setIsActiveImportOpen(false);
  };

  const handleDeletePnm = (pnmId: string) => {
    setRounds(prev => prev.map(r => {
      if (r.id !== activeRoundId) return r;
      return {
        ...r,
        pnms: r.pnms.filter(p => p.id !== pnmId)
      };
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDraggingId(active.id as string);
    setDraggingType(active.id.toString().includes('p-') ? 'pnm' : 'active');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);
    setDraggingType(null);

    if (!over) return;

    if (draggingType === 'active' && over.id.toString().startsWith('drop-')) {
      const activeId = active.id as string;
      const realActiveId = activeId.split('-')[0];
      const overData = over.data.current as { pnm: PNM, slot: 1 | 2 };
      const slotKey = overData.slot === 1 ? 'matchedWith' : 'secondMatch';
      
      const alreadyUsedInSlot = activeRound.pnms.some(p => p[slotKey] === realActiveId);
      if (alreadyUsedInSlot) return;

      const pnm = activeRound.pnms.find(p => p.id === overData.pnm.id);
      if (!pnm) return;
      
      if (pnm.matchedWith === realActiveId || pnm.secondMatch === realActiveId) return;

      setRounds(prev => prev.map(r => {
        if (r.id !== activeRoundId) return r;
        return {
          ...r,
          pnms: r.pnms.map(p => {
            if (p.id !== overData.pnm.id) return p;
            return {
              ...p,
              status: 'matched',
              [slotKey]: realActiveId
            };
          })
        };
      }));
    }

    if (draggingType === 'pnm' && active.id !== over.id) {
      setRounds(prev => prev.map(r => {
        if (r.id !== activeRoundId) return r;
        const oldIndex = r.pnms.findIndex(p => p.id === active.id);
        const newIndex = r.pnms.findIndex(p => p.id === over.id);
        return {
          ...r,
          pnms: arrayMove(r.pnms, oldIndex, newIndex)
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

  const exportToCSV = () => {
    const pnmRows = activeRound.pnms.map(pnm => {
      const m1 = actives.find(a => a.id === pnm.matchedWith)?.name || "Unmatched";
      const m2 = actives.find(a => a.id === pnm.secondMatch)?.name || "Unmatched";
      return [pnm.name, pnm.idNumber, m1, m2];
    });

    const unusedActives = actives.filter(active => 
      !usedActivesSlot1.has(active.id) && !usedActivesSlot2.has(active.id)
    ).map(a => a.name);

    const csvContent = [
      ["--- MATCHUPS ---"],
      ["PNM Name", "ID Number", "Match 1", "Match 2"],
      ...pnmRows,
      [""],
      ["--- UNUSED ACTIVES ---"],
      ...unusedActives.map(name => [name])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeRound.name}_matches.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPnms = activeRound.pnms.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.idNumber.includes(searchTerm));

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-[12px]">
      <header className="bg-white border-b px-4 py-1.5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-base text-primary">Bump Planner Pro</h1>
          <Tabs value={activeRoundId} onValueChange={setActiveRoundId} className="w-auto">
            <TabsList className="h-7 bg-slate-100 p-0.5 rounded-none">
              {rounds.map(r => (
                <TabsTrigger key={r.id} value={r.id} className="text-[11px] px-3 h-6 rounded-none">
                  {r.name}
                </TabsTrigger>
              ))}
              <Button variant="ghost" className="h-6 w-6 p-0 ml-0.5 hover:bg-white rounded-none" onClick={() => setRounds(prev => [...prev, { id: `r${prev.length + 1}`, name: `Round ${prev.length + 1}`, pnms: [] }])}>+</Button>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-[11px] rounded-none bg-green-50 hover:bg-green-100 border-green-200 text-green-700" onClick={exportToCSV}>
            <Download className="w-3 h-3 mr-1" /> Export CSV
          </Button>

          <Dialog open={isActiveImportOpen} onOpenChange={setIsActiveImportOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="h-7 text-[11px] rounded-none"><Users className="w-3 h-3 mr-1" /> Import Actives</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-none">
              <DialogHeader><DialogTitle>Import Active Members</DialogTitle><DialogDescription>Paste names (one per line)</DialogDescription></DialogHeader>
              <Textarea placeholder="Sarah Jenkins&#10;Jessica Reynolds" className="min-h-[200px] text-xs rounded-none" value={activePasteData} onChange={(e) => setActivePasteData(e.target.value)} />
              <Button onClick={handleActiveImport} className="w-full h-8 text-xs rounded-none">Add Actives</Button>
            </DialogContent>
          </Dialog>

          <Dialog open={isPnmImportOpen} onOpenChange={setIsPnmImportOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="h-7 text-[11px] rounded-none"><ClipboardPaste className="w-3 h-3 mr-1" /> Import PNMs</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-none">
              <DialogHeader><DialogTitle>Import PNMs to {activeRound.name}</DialogTitle><DialogDescription>Format: Name, ID Number (one per line)</DialogDescription></DialogHeader>
              <Textarea placeholder="Jane Doe, 12345" className="min-h-[200px] text-xs rounded-none" value={pnmPasteData} onChange={(e) => setPnmPasteData(e.target.value)} />
              <Button onClick={handlePnmImport} className="w-full h-8 text-xs rounded-none">Add PNMs to Round</Button>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          <ResizablePanel defaultSize={75} minSize={30}>
            <div className="h-full flex flex-col bg-white">
              <div className="p-1.5 border-b flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search PNMs..." className="h-7 text-[12px] max-w-xs py-0 rounded-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Badge variant="outline" className="text-[10px] h-5 py-0 rounded-none">{activeRound.pnms.length} PNMs</Badge>
              </div>
              
              <ScrollArea className="flex-1">
                <Table className="rounded-none">
                  <TableHeader className="bg-slate-50/50 sticky top-0 z-20">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="py-1 h-7 text-[10px] uppercase font-bold">PNM Name & ID</TableHead>
                      <TableHead className="py-1 h-7 text-[10px] uppercase font-bold">Bump Match 1</TableHead>
                      <TableHead className="py-1 h-7 text-[10px] uppercase font-bold">Bump Match 2</TableHead>
                      <TableHead className="py-1 h-7 text-[10px] uppercase font-bold w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext 
                      items={filteredPnms.map(p => p.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      {filteredPnms.map(pnm => (
                        <SortablePNMRow 
                          key={pnm.id} 
                          pnm={pnm} 
                          actives={actives} 
                          onUnmatch={handleUnmatch} 
                          onDelete={handleDeletePnm} 
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-200" />

          <ResizablePanel defaultSize={25} minSize={15}>
            <div className="h-full bg-slate-100/50 p-2 flex flex-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Pool</h3>
                <UserCheck className="h-3 w-3 text-slate-400" />
              </div>
              
              <div className="flex-1 flex gap-1.5 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="text-[8px] font-bold text-center text-slate-400 uppercase mb-1">M1 Pool</div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-1 pr-1">
                      {actives.map(active => (
                        <ActiveDraggable key={`${active.id}-1`} active={{ ...active, id: `${active.id}-1` }} isMatched={usedActivesSlot1.has(active.id)} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="w-[1px] bg-slate-200" />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="text-[8px] font-bold text-center text-slate-400 uppercase mb-1">M2 Pool</div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-1 pr-1">
                      {actives.map(active => (
                        <ActiveDraggable key={`${active.id}-2`} active={{ ...active, id: `${active.id}-2` }} isMatched={usedActivesSlot2.has(active.id)} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        
        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {draggingId ? (
            draggingType === 'pnm' ? (
              <div className="w-full bg-white border border-primary shadow-2xl opacity-90 p-2 text-xs font-semibold">
                {activeRound.pnms.find(p => p.id === draggingId)?.name}
              </div>
            ) : (
              <div className="py-1 px-2 border border-primary bg-white text-[12px] font-semibold shadow-xl opacity-90 scale-105 rounded-none">
                {actives.find(a => a.id === draggingId.split('-')[0])?.name}
              </div>
            )
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
