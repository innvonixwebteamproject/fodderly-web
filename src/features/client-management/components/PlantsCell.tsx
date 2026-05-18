import { useState, useEffect } from "react";
import { Globe, Users } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { IClient } from "../types";

interface PlantsCellProps {
  row: IClient;
}

export const PlantsCell = ({ row }: PlantsCellProps) => {
  const [plants, setPlants] = useState(row.plants || []);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setPlants(row.plants || []);
  }, [row.plants]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex flex-wrap gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
          {plants.slice(0, 3).map((p, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              size="sm"
              appearance="light"
              className="text-[11px] font-semibold px-2 py-0 h-5 bg-muted/80 text-foreground border border-border rounded-[4px] hover:bg-muted transition-colors shadow-sm"
            >
              {p.plant_name}
            </Badge>
          ))}
          {plants.length > 3 && (
            <Badge
              variant="outline"
              size="sm"
              className="text-[11px] font-semibold px-2 py-0 h-5 border border-border rounded-[4px] bg-background text-foreground shadow-sm"
            >
              +{plants.length - 3}
            </Badge>
          )}
          {plants.length === 0 && (
            <span className="text-muted-foreground text-xs italic">-</span>
          )}
        </div>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl w-full p-0 gap-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 flex flex-row items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Users className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-semibold">
              {row.client_name} - Plants
            </DialogTitle>
          </div>
        </DialogHeader>
        <Separator />
        <DialogBody className="p-0">
          <Table wrapperClassName="max-h-[450px]">
            <TableHeader className="bg-muted/10 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent border-b">
                <TableCell className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-3">
                  Plant Name
                </TableCell>
                <TableCell className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-3">
                  City
                </TableCell>
                <TableCell className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-3">
                  Plant Location
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plants.map((p, idx) => (
                <TableRow
                  key={idx}
                  className="group hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="py-4 font-medium text-sm">
                    {p.plant_name}
                  </TableCell>
                  <TableCell className="py-4">{p.city}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <Globe className="h-3.5 w-3.5 text-primary/60" />
                      <a href={p.plant_location} target="_blank" rel="noopener noreferrer" className="truncate max-w-[180px] cursor-pointer">{p.plant_location || "-"}</a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {plants.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-32 text-center text-muted-foreground italic text-sm"
                  >
                    No plants available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
