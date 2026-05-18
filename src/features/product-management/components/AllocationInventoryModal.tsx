import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInventoryUnitLabel } from "@/constants/unit.constants";
import type { AllocationInventory } from "../types/allocation.types";

interface AllocationInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventories: AllocationInventory[];
  title?: string;
}

export function AllocationInventoryModal({
  open,
  onOpenChange,
  inventories,
  title = "Inventory Details",
}: AllocationInventoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <DialogBody className="min-h-0">
          {inventories.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-md border bg-muted/30">
              <p className="text-sm text-muted-foreground">No inventory available</p>
            </div>
          ) : (
            <Table
              wrapperClassName="max-h-[70vh] custom-scrollbar rounded-md border"
              className="text-[12px]"
            >
              <TableHeader>
                <TableRow className="[&>th]:h-9 [&>th]:px-2.5">
                  <TableHead className="text-xs font-semibold">Inventory</TableHead>
                  <TableHead className="text-xs font-semibold">Description</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">HSN</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Qty</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold">Price</TableHead>
                  <TableHead className="text-xs font-semibold">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventories.map((inv) => (
                  <TableRow key={inv.id} className="[&>td]:px-2.5 [&>td]:py-2">
                    <TableCell className="text-[12px] font-medium">{inv.name || "—"}</TableCell>
                    <TableCell className="max-w-[420px]">
                      <p className="text-[12px] font-normal whitespace-pre-wrap break-words">
                        {inv.description || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-[12px] font-normal">{inv.hsn_code || "—"}</TableCell>
                    <TableCell className="text-[12px] font-normal">
                      {inv.quantity !== null && inv.quantity !== undefined
                        ? `${inv.quantity} ${getInventoryUnitLabel(inv.unit)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-[12px] font-normal">
                      {typeof inv.price === "number" ? `₹${inv.price.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="text-[12px] font-normal">{inv.category_name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

