import { useState, useMemo, useRef } from "react";
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
import { Search, ClipboardPaste, UserCheck, Users, Trash2, Download, Upload, GitMerge, Lock, Unlock } from "lucide-react";
import { Toaster, toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

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
  const [isPoolLocked, setIsPoolLocked] = useState(true);

  const pool1Ref = useRef<HTMLDivElement>(null);
  const pool2Ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeRound = useMemo(() => rounds.find(r => r.id === activeRoundId)!, [rounds, activeRoundId]);

  const usedActivesSlot1 = useMemo(() => new Set(activeRound.pnms.map(p => p.matchedWith).filter(Boolean)), [activeRound]);
  const usedActivesSlot2 = useMemo(() => new Set(activeRound.pnms.map(p => p.secondMatch).filter(Boolean)), [activeRound]);

  const handlePnmImport = () => {
    if (!pnmPasteData.trim()) return;
    const lines = pnmPasteData.split('\n').filter(line => line.trim());
    
    const newPnms: PNM[] = lines.map((line, index) => {
      let name = "";
      let idNumber = "000";
      
      const cleanLine = line.trim();
      
      // Look for a number at the start: e.g. "123 Jane Doe" or "123, Doe, Jane"
      const startMatch = cleanLine.match(/^(\d+)[\s,]+(.+)$/);
      // Look for a number at the end: e.g. "Jane Doe 123" or "Doe, Jane, 123"
      const endMatch = cleanLine.match(/^(.+?)[\s,]+(\d+)$/);
      
      if (startMatch) {
        idNumber = startMatch[1];
        name = startMatch[2];
      } else if (endMatch) {
        name = endMatch[1];
        idNumber = endMatch[2];
      } else {
        // No number found at start or end, the entire line is the name
        name = cleanLine;
        idNumber = "000";
      }

      // Remove any stray commas or spaces at the start/end of the name
      name = name.replace(/^[\s,]+|[\s,]+$/g, '').trim();
      
      return {
        id: `p_${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`,
        name: name || `PNM ${activeRound.pnms.length + index + 1}`,
        idNumber,
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
      id: `a_${Date.now()}_${index}`,
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

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const parseData = (data: string[][]) => {
        let matchupsStartIndex = -1;
        let matchupsEndIndex = data.length;

        for (let i = 0; i < data.length; i++) {
          if (data[i][0] === "--- MATCHUPS ---") {
            matchupsStartIndex = i + 2; // Skip the title and the header row
          } else if (data[i][0] === "--- UNUSED ACTIVES ---" || (matchupsStartIndex !== -1 && data[i][0] === "")) {
             if(matchupsEndIndex === data.length) {
               matchupsEndIndex = i;
             }
          }
        }

        if (matchupsStartIndex === -1) {
          toast.error("Invalid format. Could not find '--- MATCHUPS ---' section.", {
            className: "rounded-none text-xs font-bold"
          });
          return;
        }

        const newPnms: PNM[] = [];
        const extractedActives = new Map<string, Active>();

        // Ensure current actives are in the map
        actives.forEach(a => extractedActives.set(a.name, a));

        for (let i = matchupsStartIndex; i < matchupsEndIndex; i++) {
          const row = data[i];
          if (!row || row.length < 4) continue;
          if (!row[0] && !row[1]) continue; // Skip empty rows

          const idNumber = String(row[0]);
          const name = String(row[1]);
          const m1Name = String(row[2]);
          const m2Name = String(row[3]);

          let m1Id = undefined;
          let m2Id = undefined;

          // Helper to get or create active
          const getOrCreateActive = (activeName: string) => {
            if (!activeName || activeName === "Unmatched" || activeName === "") return undefined;
            if (extractedActives.has(activeName)) {
              return extractedActives.get(activeName)!.id;
            }
            const newId = `a_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const newActive = { id: newId, name: activeName };
            extractedActives.set(activeName, newActive);
            return newId;
          };

          m1Id = getOrCreateActive(m1Name);
          m2Id = getOrCreateActive(m2Name);

          // Find existing PNM or create new
          const existingPnm = activeRound.pnms.find(p => p.idNumber === idNumber);
          
          if (existingPnm) {
            newPnms.push({
              ...existingPnm,
              matchedWith: m1Id,
              secondMatch: m2Id,
              status: (m1Id || m2Id) ? 'matched' : 'unmatched'
            });
          } else {
             newPnms.push({
              id: `p_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              name: name || `PNM ${newPnms.length + 1}`,
              idNumber: idNumber || `ID-${Date.now()}-${newPnms.length}`,
              matchedWith: m1Id,
              secondMatch: m2Id,
              status: (m1Id || m2Id) ? 'matched' : 'unmatched'
            });
          }
        }
        
        // Update Actives
        setActives(Array.from(extractedActives.values()));

        // Update Round PNMs
        setRounds(prev => prev.map(r => {
          if (r.id !== activeRoundId) return r;
          
          const csvPnmIds = new Set(newPnms.map(p => p.idNumber));
          const keptPnms = r.pnms.filter(p => !csvPnmIds.has(p.idNumber));

          return {
            ...r,
            pnms: [...keptPnms, ...newPnms]
          };
        }));

        toast.success("Imported Successfully", {
          className: "rounded-none text-xs font-bold bg-green-50 text-green-700 border-green-200"
        });
        
        // reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (results) => {
          parseData(results.data as string[][]);
        },
        error: (error) => {
          toast.error(`Error parsing CSV: ${error.message}`, {
            className: "rounded-none text-xs font-bold"
          });
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" });
          
          // Convert array of objects back to array of arrays to match our parser logic
          // XLSX header: 1 means we get an array of arrays
          const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          // Pad rows to ensure they have enough columns if some are missing
          const paddedData = arrayData.map(row => {
             const newRow = [...row];
             while(newRow.length < 4) newRow.push("");
             return newRow;
          });
          
          parseData(paddedData);
        } catch (error) {
          toast.error(`Error parsing Excel file.`, {
            className: "rounded-none text-xs font-bold"
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
        toast.error(`Unsupported file type. Please upload a CSV or Excel file.`, {
          className: "rounded-none text-xs font-bold"
        });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDraggingId(active.id as string);
    // Actives have IDs starting with 'a-', 'a_', or suffix like '-1' or '-2', PNMs start with 'p-' or 'p_'
    const idStr = active.id.toString();
    if (idStr.startsWith('p-') || idStr.startsWith('p_')) {
      setDraggingType('pnm');
    } else if (idStr.startsWith('a-') || idStr.startsWith('a_') || idStr.includes('-1') || idStr.includes('-2')) {
      setDraggingType('active');
    } else {
      setDraggingType('active');
    }
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
      
      // Check if this specific active is already used in THIS SLOT by a DIFFERENT PNM
      const alreadyUsedInSlot = activeRound.pnms.some(p => 
        p.id !== overData.pnm.id && p[slotKey] === realActiveId
      );

      if (alreadyUsedInSlot) {
        toast.error(`This active is already used as Bump ${overData.slot} by another PNM.`, {
          className: "rounded-none text-xs font-bold",
          duration: 3000
        });
        return;
      }

      const pnm = activeRound.pnms.find(p => p.id === overData.pnm.id);
      if (!pnm) return;

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
    const escapeCSV = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const pnmRows: string[][] = activeRound.pnms.map(pnm => {
      const m1 = actives.find(a => a.id === pnm.matchedWith)?.name || "Unmatched";
      const m2 = actives.find(a => a.id === pnm.secondMatch)?.name || "Unmatched";
      return [escapeCSV(pnm.idNumber), escapeCSV(pnm.name), escapeCSV(m1), escapeCSV(m2)];
    });

    const dictForward = new Map<string, string>();
    const dictReverse = new Map<string, string>();
    
    activeRound.pnms.forEach(pnm => {
      const m1Name = actives.find(a => a.id === pnm.matchedWith)?.name;
      const m2Name = actives.find(a => a.id === pnm.secondMatch)?.name;
      if (m1Name && m2Name && m1Name !== "Unmatched" && m2Name !== "Unmatched") {
        dictForward.set(m1Name, m2Name);
        dictReverse.set(m2Name, m1Name);
      }
    });

    const chains: string[] = [];
    const visited = new Set<string>();

    for (const starter of dictForward.keys()) {
      if (!dictReverse.has(starter)) {
        let currentChain = starter;
        let currentName = starter;
        let safetyCounter = 0;
        
        while (dictForward.has(currentName) && safetyCounter <= 100) {
          visited.add(currentName);
          const nextName = dictForward.get(currentName)!;
          currentChain += ` -> ${nextName}`;
          currentName = nextName;
          safetyCounter++;
        }
        visited.add(currentName);
        chains.push(currentChain);
      }
    }

    // Now look for loops/cycles that have no "start"
    for (const starter of dictForward.keys()) {
      if (!visited.has(starter)) {
        let currentChain = starter;
        let currentName = starter;
        let safetyCounter = 0;
        
        while (dictForward.has(currentName) && !visited.has(dictForward.get(currentName)!) && safetyCounter <= 100) {
          visited.add(currentName);
          const nextName = dictForward.get(currentName)!;
          currentChain += ` -> ${nextName}`;
          currentName = nextName;
          safetyCounter++;
        }
        visited.add(currentName);
        if (dictForward.has(currentName)) {
           currentChain += ` -> ${dictForward.get(currentName)!}`;
        }
        chains.push(currentChain);
      }
    }

    const finalRows: string[][] = [];
    const maxRows = Math.max(pnmRows.length, chains.length);
    for (let i = 0; i < maxRows; i++) {
      const row = pnmRows[i] || ["", "", "", ""];
      const chainStr = chains[i] ? escapeCSV(chains[i]) : "";
      finalRows.push([...row, "", chainStr]);
    }

    const unusedActives = actives.filter(active => 
      !usedActivesSlot1.has(active.id) && !usedActivesSlot2.has(active.id)
    ).map(a => escapeCSV(a.name));

    const csvContent = [
      ["--- MATCHUPS ---"],
      ["ID Number", "PNM Name", "Match 1", "Match 2", "", "Bump Chains"],
      ...finalRows,
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

          <Button variant="outline" size="sm" className="h-7 text-[11px] rounded-none bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3 mr-1" /> Import CSV
          </Button>
          <input 
            type="file" 
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleCSVImport} 
          />

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
                      <TableHead className="py-1 h-7 text-[10px] uppercase font-bold">Status</TableHead>
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
                          pnms={activeRound.pnms}
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
            <div className="h-full bg-slate-100/50 p-2 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2 px-1 shrink-0">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Pool</h3>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setIsPoolLocked(!isPoolLocked)} 
                     className="text-slate-400 hover:text-slate-600 transition-colors"
                     title={isPoolLocked ? "Unlock Scroll" : "Lock Scroll"}
                   >
                     {isPoolLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                   </button>
                   <UserCheck className="h-3 w-3 text-slate-400" />
                </div>
              </div>
              
              <div className="flex-1 flex gap-1.5 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="text-[8px] font-bold text-center text-slate-400 uppercase mb-1 shrink-0">M1 Pool</div>
                  <ScrollArea 
                    className="flex-1"
                    viewportRef={pool1Ref}
                    onScrollCapture={(e) => {
                      if (isPoolLocked && pool2Ref.current) {
                        pool2Ref.current.scrollTop = e.currentTarget.scrollTop;
                      }
                    }}
                  >
                    <div className="space-y-1 pr-1 pb-4">
                      {actives.map(active => (
                        <ActiveDraggable key={`${active.id}-1`} active={{ ...active, id: `${active.id}-1` }} isMatched={usedActivesSlot1.has(active.id)} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="w-[1px] bg-slate-200 shrink-0" />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="text-[8px] font-bold text-center text-slate-400 uppercase mb-1 shrink-0">M2 Pool</div>
                  <ScrollArea 
                    className="flex-1"
                    viewportRef={pool2Ref}
                    onScrollCapture={(e) => {
                      if (isPoolLocked && pool1Ref.current) {
                        pool1Ref.current.scrollTop = e.currentTarget.scrollTop;
                      }
                    }}
                  >
                    <div className="space-y-1 pr-1 pb-4">
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
      <Toaster position="top-center" richColors />
    </div>
  );
}
