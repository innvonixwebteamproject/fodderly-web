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
import { getInventoryUnitLabel } from "@/constants/unit.constants";
import type { AllocationItem } from "../types/allocation.types";

const editAllocationSchema = z.object({
  allocated_quantity: z
    .coerce
    .number()
    .refine((value) => Number.isInteger(value) && value > 0, "Allocated quantity must be greater than zero."),
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
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        allocated_quantity: allocation?.allocated_quantity ?? 1,
      });
    }
  }, [allocation?.allocated_quantity, form, open]);

  const inventoryNames = useMemo(() => {
    if (!allocation) return "";
    const list = allocation.inventories?.map((i) => i.name).filter(Boolean) ?? [];
    return list.length ? list.join(", ") : "—";
  }, [allocation]);

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      form.reset({ allocated_quantity: 1 });
    }
  };

  const submitForm = (values: EditAllocationFormValues) => {
    if (!allocation) return;
    onSubmit({ id: allocation.id, allocated_quantity: values.allocated_quantity });
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
                      value={`${allocation.admin_available_quantity ?? 0} ${getInventoryUnitLabel(allocation.admin_unit ?? allocation.unit)}`}
                    />
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="allocated_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Allocated Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Input readOnly value={getInventoryUnitLabel(allocation.unit)} />
                </FormItem>

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

