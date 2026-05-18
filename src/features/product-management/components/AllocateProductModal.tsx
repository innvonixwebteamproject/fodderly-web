import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
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
import { INVENTORY_UNIT_OPTIONS, INVENTORY_UNITS } from "@/constants/unit.constants";
import { getLanguageLabel } from "../services/product.api";
import type { IPartner } from "@/features/partner-management/types";
import type { ProductRecord } from "../types";
import {
  allocationFormSchema,
  type AllocateProductPayload,
  type AllocationFormInputValues,
  type AllocationFormValues,
} from "../types/allocation.types";

interface AllocateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: IPartner[];
  products: ProductRecord[];
  onSubmit: (payloads: AllocateProductPayload[]) => void;
  isSubmitting?: boolean;
  defaultPartnerUuid?: string;
  lockPartnerSelection?: boolean;
  lockedPartnerLabel?: string;
}

export function AllocateProductModal({
  open,
  onOpenChange,
  partners,
  products,
  onSubmit,
  isSubmitting = false,
  defaultPartnerUuid,
  lockPartnerSelection = false,
  lockedPartnerLabel,
}: AllocateProductModalProps) {
  const isPartnerLocked = lockPartnerSelection || Boolean(defaultPartnerUuid);

  const form = useForm<AllocationFormInputValues, unknown, AllocationFormValues>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      partner_uuid: defaultPartnerUuid || "",
      product_uuid: "",
      allocated_quantity: "",
      unit: INVENTORY_UNITS.KG,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (open && defaultPartnerUuid) {
      form.setValue("partner_uuid", defaultPartnerUuid, { shouldValidate: true });
    }
  }, [defaultPartnerUuid, form, open]);

  useEffect(() => {
    if (!open) {
      form.reset({
        partner_uuid: defaultPartnerUuid || "",
        product_uuid: "",
        allocated_quantity: "",
        unit: INVENTORY_UNITS.KG,
      });
    }
  }, [defaultPartnerUuid, form, open]);

  const selectedProductId = form.watch("product_uuid");
  const selectedPartnerId = form.watch("partner_uuid");
  const allocatedQuantity = Number(form.watch("allocated_quantity") || 0);
  const selectedUnit = form.watch("unit");

  const selectedPartner = useMemo(
    () =>
      partners.find(
        (partner) =>
          partner.id === (selectedPartnerId || defaultPartnerUuid || ""),
      ),
    [defaultPartnerUuid, partners, selectedPartnerId],
  );

  const selectedProducts = useMemo(
    () => products.filter((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );
  const inventoryNames = useMemo(() => {
    const nameSet = new Set<string>();
    selectedProducts.forEach((product) => {
      product.inventories?.forEach((inventory) => {
        if (inventory.name.trim()) {
          nameSet.add(inventory.name.trim());
        }
      });
    });
    return Array.from(nameSet);
  }, [selectedProducts]);

  const combinedUnitPrice = useMemo(() => {
    return selectedProducts.reduce((sum, product) => {
      let price = Number(product.price || 0);
      const adminUnit = product.admin_unit ?? INVENTORY_UNITS.KG;
      const currentUnit = selectedUnit === "" || selectedUnit === undefined ? adminUnit : Number(selectedUnit);

      if (adminUnit === INVENTORY_UNITS.TON && currentUnit === INVENTORY_UNITS.KG) {
        price = price / 1000;
      } else if (adminUnit === INVENTORY_UNITS.KG && currentUnit === INVENTORY_UNITS.TON) {
        price = price * 1000;
      }
      return sum + price;
    }, 0);
  }, [selectedProducts, selectedUnit]);

  const totalAllocationPrice = useMemo(
    () => Number((Math.max(allocatedQuantity, 0) * combinedUnitPrice).toFixed(2)),
    [allocatedQuantity, combinedUnitPrice],
  );

  const maxAvailableStock = useMemo(() => {
    if (selectedProducts.length === 0) return Number.POSITIVE_INFINITY;
    return Math.min(
      ...selectedProducts.map((product) => {
        let stock = Number(product.stock || 0);
        const adminUnit = product.admin_unit ?? INVENTORY_UNITS.KG;
        const currentUnit = selectedUnit === "" || selectedUnit === undefined ? adminUnit : Number(selectedUnit);

        if (adminUnit === INVENTORY_UNITS.TON && currentUnit === INVENTORY_UNITS.KG) {
          stock = stock * 1000;
        } else if (adminUnit === INVENTORY_UNITS.KG && currentUnit === INVENTORY_UNITS.TON) {
          stock = stock / 1000;
        }
        return stock;
      }),
    );
  }, [selectedProducts, selectedUnit]);

  useEffect(() => {
    if (open && (form.getValues("unit") === "" || form.getValues("unit") === undefined || form.getValues("unit") === null)) {
      form.setValue("unit", INVENTORY_UNITS.KG, { shouldValidate: true });
    }
  }, [open, form]);

  const partnerOptions = partners.map((partner) => ({
    value: partner.id,
    label: partner.fullName || `${partner.firstName} ${partner.lastName}`.trim() || partner.email,
  }));

  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${getLanguageLabel(product.name)} (${product.uniqueID || "No product code"})`,
  }));

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const submitForm = (values: AllocationFormValues) => {
    if (values.allocated_quantity > maxAvailableStock) {
      form.setError("allocated_quantity", {
        type: "validate",
        message: "Allocated quantity cannot exceed available stock.",
      });
      return;
    }

    const product = products.find((item) => item.id === values.product_uuid);
    let unitPrice = Number(product?.price || 0);
    const adminUnit = product?.admin_unit ?? INVENTORY_UNITS.KG;
    const currentUnit = values.unit;

    if (adminUnit === INVENTORY_UNITS.TON && currentUnit === INVENTORY_UNITS.KG) {
      unitPrice = unitPrice / 1000;
    } else if (adminUnit === INVENTORY_UNITS.KG && currentUnit === INVENTORY_UNITS.TON) {
      unitPrice = unitPrice * 1000;
    }

    const payloads: AllocateProductPayload[] = [
      {
        partner_uuid: values.partner_uuid,
        product_uuid: values.product_uuid,
        allocated_quantity: values.allocated_quantity,
        total_allocated_price: Number((values.allocated_quantity * unitPrice).toFixed(2)),
        unit: values.unit ?? 0,
      },
    ];

    onSubmit(payloads);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate Product</DialogTitle>
          <DialogDescription>
            Assign one or more products to a partner with real-time pricing calculation.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(submitForm)}>
              {isPartnerLocked ? (
                <FormItem>
                  <FormLabel>Partner Name</FormLabel>
                  <Input readOnly value={lockedPartnerLabel || "-"} />
                </FormItem>
              ) : (
                <FormField
                  control={form.control}
                  name="partner_uuid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Partner Name</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={partnerOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select partner"
                          isClearable={false}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <Input readOnly value={selectedPartner?.companyName || "-"} />
              </FormItem>

              <FormField
                control={form.control}
                name="product_uuid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Product Name</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={productOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select product"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormItem>
                  <FormLabel>Inventory Name</FormLabel>
                  <Input
                    readOnly
                    value={inventoryNames.length > 0 ? inventoryNames.join(", ") : "Auto-populated"}
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
                          placeholder="Enter allocated quantity"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Unit</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={INVENTORY_UNIT_OPTIONS.filter((option) => Number(option.value) === INVENTORY_UNITS.KG)}
                          value={
                            field.value === undefined || field.value === null || field.value === ""
                              ? ""
                              : String(field.value)
                          }
                          onValueChange={(value) => field.onChange(Number(value))}
                          placeholder="Select unit"
                          isClearable={false}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Price Per Unit</FormLabel>
                  <Input readOnly value={`₹${combinedUnitPrice.toLocaleString()}`} />
                </FormItem>
                <FormItem>
                  <FormLabel>Total Allocation Price</FormLabel>
                  <Input readOnly value={`₹${totalAllocationPrice.toLocaleString()}`} />
                </FormItem>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
                  <CancelButtonContent />
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Allocate Product
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
