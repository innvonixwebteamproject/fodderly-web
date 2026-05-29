import { useEffect, useMemo } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  INVENTORY_UNIT_OPTIONS,
  INVENTORY_UNITS,
  normalizeInventoryUnit,
} from "@/constants/unit.constants";
import { convertInventoryToKgFormat, formatForDisplay, formatAdminAvailableQty } from "@/utils/unit-conversion";
import type { AllocationItem } from "../types/allocation.types";

const editAllocationSchema = z.object({
  allocated_quantity: z
    .coerce
    .number()
    .refine((value) => value > 0, "Allocated quantity must be greater than zero."),
  unit: z.coerce.number(),
});

type EditAllocationFormValues = z.infer<typeof editAllocationSchema>;

interface EditAllocationQuantityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation: AllocationItem | null;
  onSubmit: (values: { id: string; allocated_quantity: number }) => void;
  isSubmitting?: boolean;
}

export function EditAllocationQuantityModal({
  open,
  onOpenChange,
  allocation,
  onSubmit,
  isSubmitting = false,
}: EditAllocationQuantityModalProps) {
  const form = useForm<EditAllocationFormValues>({
    resolver: zodResolver(editAllocationSchema),
    defaultValues: {
      allocated_quantity: allocation?.allocated_quantity ?? 1,
      unit: normalizeInventoryUnit(allocation?.unit ?? allocation?.admin_unit ?? INVENTORY_UNITS.KG),
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (open && allocation) {
      // Use formatForDisplay to automatically determine the best display unit
      const display = formatForDisplay(allocation.allocated_quantity, 0);
      const displayUnitValue = display.unit === "ton" ? INVENTORY_UNITS.TON : INVENTORY_UNITS.KG;

      form.reset({
        allocated_quantity: display.quantity,
        unit: displayUnitValue,
      });
    }
  }, [allocation, form, open]);

  const inventoryNames = useMemo(() => {
    if (!allocation) return "";
    const list = allocation.inventories?.map((i) => i.name).filter(Boolean) ?? [];
    return list.length ? list.join(", ") : "—";
  }, [allocation]);

  const availableStockDisplay = useMemo(() => {
    if (!allocation) return "";
    return formatAdminAvailableQty(allocation.admin_available_quantity);
  }, [allocation]);

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      form.reset({ allocated_quantity: 1 });
    }
  };

  const submitForm = (values: EditAllocationFormValues) => {
    if (!allocation) return;

    // Convert to KG format for API submission
    // When unit is TON: quantity = TON * getTonToKgRate()
    // When unit is KG: values remain as-is
    const converted = convertInventoryToKgFormat(
      values.allocated_quantity,
      0, // Price is not applicable for edit allocation quantity
      normalizeInventoryUnit(values.unit)
    );

    onSubmit({ id: allocation.id, allocated_quantity: converted.quantity });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Allocation Quantity</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {allocation ? (
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(submitForm)}>
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <Input readOnly value={allocation.product_name || "—"} />
                </FormItem>

                <FormItem>
                  <FormLabel>Inventory Name</FormLabel>
                  <Input readOnly value={inventoryNames} />
                </FormItem>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormItem>
                    <FormLabel>Available Stock</FormLabel>
                    <Input
                      readOnly
                      value={availableStockDisplay}
                    />
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="allocated_quantity"
                    render={({ field }) => {
                      const selectedUnit = form.watch("unit");
                      return (
                        <FormItem>
                          <FormLabel required>Allocated Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              step={selectedUnit === INVENTORY_UNITS.TON ? "any" : 1}
                              value={field.value}
                              onChange={(event) => {
                                const raw = event.target.value;
                                if (raw === "") {
                                  field.onChange("");
                                  return;
                                }
                                const n = Number(raw);
                                if (!Number.isFinite(n)) return;
                                if (selectedUnit === INVENTORY_UNITS.TON) {
                                  field.onChange(n);
                                } else {
                                  const next = Math.trunc(n);
                                  field.onChange(next);
                                }
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              onKeyDown={(event) => {
                                if (selectedUnit === INVENTORY_UNITS.KG && [".", ","].includes(event.key)) {
                                  event.preventDefault();
                                }
                                if (["e", "E", "+", "-"].includes(event.key)) {
                                  event.preventDefault();
                                }
                              }}
                              onWheel={(event) => event.currentTarget.blur()}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Unit</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={[...INVENTORY_UNIT_OPTIONS]}
                          value={
                            field.value === undefined || field.value === null
                              ? ""
                              : String(field.value)
                          }
                          onValueChange={(value) => field.onChange(Number(value))}
                          placeholder="Select unit"
                          isClearable={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleClose(false)}
                    disabled={isSubmitting}
                  >
                    <CancelButtonContent />
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Update
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

