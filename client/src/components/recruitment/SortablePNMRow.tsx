import { Active, PNM } from "@/lib/mock-data";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PNMDropZone from "./PNMDropZone";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortablePNMRowProps {
  pnm: PNM;
  actives: Active[];
  onUnmatch: (pnmId: string, slot: 1 | 2) => void;
  onDelete: (pnmId: string) => void;
}

export default function SortablePNMRow({ pnm, actives, onUnmatch, onDelete }: SortablePNMRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pnm.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "h-9 border-b-slate-100 hover:bg-slate-50 transition-colors relative group",
        isDragging && "z-50 bg-white shadow-lg opacity-80"
      )}
    >
      <TableCell className="py-0.5 w-8 p-0">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-slate-600 transition-colors"
        >
          <GripVertical className="h-3 w-3" />
        </div>
      </TableCell>
      <TableCell className="py-0.5">
        <div className="flex flex-col">
          <span className="text-[12px] font-semibold leading-tight">{pnm.name}</span>
          <span className="text-[9px] text-muted-foreground">ID: {pnm.idNumber}</span>
        </div>
      </TableCell>
      <TableCell className="py-0.5">
        <PNMDropZone 
          pnm={pnm} 
          slot={1} 
          matchedActiveName={actives.find(a => a.id === pnm.matchedWith)?.name} 
          onUnmatch={onUnmatch} 
        />
      </TableCell>
      <TableCell className="py-0.5">
        <PNMDropZone 
          pnm={pnm} 
          slot={2} 
          matchedActiveName={actives.find(a => a.id === pnm.secondMatch)?.name} 
          onUnmatch={onUnmatch} 
        />
      </TableCell>
      <TableCell className="py-0.5">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-none"
          onClick={() => onDelete(pnm.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
