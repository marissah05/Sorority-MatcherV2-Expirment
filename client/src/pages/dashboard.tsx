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
import { Search, Sparkles, ClipboardPaste, UserPlus, X } from "lucide-react";

export default function Dashboard() {
  const [pnms, setPnms] = useState<PNM[]>(MOCK_PNMS);
  const [actives] = useState<Active[]>(MOCK_ACTIVES);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pasteData, setPasteData] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleImport = () => {
    if (!pasteData.trim()) return;
    const lines = pasteData.split('\n');
    const newPnms: PNM[] = lines.map((line, index) => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      const name = parts[0] || `PNM ${pnms.length + index + 1}`;
      const idNumber = parts[1] || `ID-${Date.now()}-${index}`;
      return {
        id: `p-${Date.now()}-${index}`,
        name,
        idNumber,
        status: 'unmatched'
      };
    });
    setPnms(prev => [...prev, ...newPnms]);
    setPasteData("");
    setIsImportOpen(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over) {
      const pnmId = active.id as string;
      const activeMemberId = over.id as string;
      setPnms(prev => prev.map(p => {
        if (p.id === pnmId) {
          if (p.matchedWith === activeMemberId || p.secondMatch === activeMemberId) return p;
          if (!p.matchedWith) return { ...p, status: 'matched', matchedWith: activeMemberId };
          if (!p.secondMatch) return { ...p, status: 'matched', secondMatch: activeMemberId };
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
        const newFirst = isFirst ? p.secondMatch : p.matchedWith;
        const newSecond = isFirst ? undefined : p.secondMatch === activeId ? undefined : p.secondMatch;
        return { ...p, matchedWith: newFirst, secondMatch: newSecond, status: (newFirst || newSecond) ? 'matched' : 'unmatched' };
      }
      return p;
    }));
  };

  const filteredPnms = pnms.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.idNumber.includes(searchTerm));

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b px-4 py-2 flex justify-between items-center shrink-0">
        <h1 className="font-bold text-lg">Bump Matcher</h1>
        <div className="flex gap-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><ClipboardPaste className="w-4 h-4 mr-1" /> Import</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Import PNM List</DialogTitle><DialogDescription>Format: Name, ID Number (one per line)</DialogDescription></DialogHeader>
              <Textarea placeholder="Jane Doe, 12345" className="min-h-[200px]" value={pasteData} onChange={(e) => setPasteData(e.target.value)} />
              <Button onClick={handleImport} className="w-full">Add PNMs</Button>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <DndContext sensors={sensors} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-2 border-b bg-white flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search PNMs..." className="h-8 text-sm max-w-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader><TableRow><TableHead className="py-2">PNM (Name & ID)</TableHead><TableHead className="py-2">Match 1</TableHead><TableHead className="py-2">Match 2</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredPnms.map(pnm => (
                    <TableRow key={pnm.id} className="h-10">
                      <TableCell className="py-1"><PNMCard pnm={pnm} /></TableCell>
                      <TableCell className="py-1">
                        {pnm.matchedWith ? (
                          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs w-fit">
                            {actives.find(a => a.id === pnm.matchedWith)?.name}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => handleUnmatch(pnm.id, pnm.matchedWith!)} />
                          </div>
                        ) : <div className="text-[10px] text-muted-foreground italic border border-dashed rounded px-2">Drop Active Here</div>}
                      </TableCell>
                      <TableCell className="py-1">
                        {pnm.secondMatch ? (
                          <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-xs w-fit">
                            {actives.find(a => a.id === pnm.secondMatch)?.name}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => handleUnmatch(pnm.id, pnm.secondMatch!)} />
                          </div>
                        ) : <div className="text-[10px] text-muted-foreground italic border border-dashed rounded px-2">Drop Active Here</div>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          <div className="w-64 border-l bg-slate-100 p-2 shrink-0">
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 px-1">Active Members</h3>
            <ScrollArea className="h-[calc(100vh-100px)]">
              <div className="space-y-1">
                {actives.map(active => (
                  <ActiveCard key={active.id} active={active} matchedPNMs={pnms.filter(p => p.matchedWith === active.id || p.secondMatch === active.id)} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DragOverlay>{activeId ? <PNMCard pnm={pnms.find(p => p.id === activeId)!} isOverlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
