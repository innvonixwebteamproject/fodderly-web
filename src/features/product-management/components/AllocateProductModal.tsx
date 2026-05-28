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
import {
  INVENTORY_UNIT_OPTIONS,
  INVENTORY_UNITS,
  normalizeInventoryUnit,
} from "@/constants/unit.constants";
import { convertInventoryToKgFormat, formatForDisplay, getTonToKgRate, formatAdminAvailableQty } from "@/utils/unit-conversion";
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

  // Calculate price per display unit (KG or TON based on formatForDisplay)
  const pricePerDisplayUnit = useMemo(() => {
    if (selectedProducts.length === 0) return 0;

    const product = selectedProducts[0];
    const pricePerKg = Number(product.price || 0);
    const quantity = Number(product.admin_available_quantity || 0);
    const display = formatForDisplay(quantity, 0);
    const displayUnit = display.unit === "ton" ? INVENTORY_UNITS.TON : INVENTORY_UNITS.KG;

    // Convert price to display unit
    let priceInDisplayUnit = pricePerKg;
    if (displayUnit === INVENTORY_UNITS.TON) {
      priceInDisplayUnit = pricePerKg * getTonToKgRate();
    }

    return priceInDisplayUnit;
  }, [selectedProducts]);

  const totalAllocationPrice = useMemo(() => {
    if (selectedProducts.length === 0) return 0;

    const product = selectedProducts[0];
    const pricePerKg = Number(product.price || 0);
    const adminUnit = normalizeInventoryUnit(
      product.admin_unit ?? product.quantity_indicator,
    );
    const currentUnit = normalizeInventoryUnit(selectedUnit);

    // Convert price from admin unit to user's selected unit
    let pricePerSelectedUnit = pricePerKg;
    if (adminUnit === INVENTORY_UNITS.TON && currentUnit === INVENTORY_UNITS.KG) {
      pricePerSelectedUnit = pricePerKg / getTonToKgRate();
    } else if (adminUnit === INVENTORY_UNITS.KG && currentUnit === INVENTORY_UNITS.TON) {
      pricePerSelectedUnit = pricePerKg * getTonToKgRate();
    }

    return Math.round(Number((Math.max(allocatedQuantity, 0) * pricePerSelectedUnit).toFixed(2)));
  }, [allocatedQuantity, selectedUnit, selectedProducts]);

  const { adminTotalAvailableQuantity, displayUnit } = useMemo(() => {
    if (selectedProducts.length === 0) return { adminTotalAvailableQuantity: "", displayUnit: INVENTORY_UNITS.KG };

    const product = selectedProducts[0];
    if (product.admin_available_quantity === undefined || product.admin_available_quantity === null) {
      return { adminTotalAvailableQuantity: "", displayUnit: INVENTORY_UNITS.KG };
    }
    const quantity = Number(product.admin_available_quantity);
    const display = formatForDisplay(quantity, 0);
    const displayUnit = display.unit === "ton" ? INVENTORY_UNITS.TON : INVENTORY_UNITS.KG;
    return {
      adminTotalAvailableQuantity: formatAdminAvailableQty(quantity),
      displayUnit
    };
  }, [selectedProducts]);

  const maxAvailableStock = useMemo(() => {
    if (selectedProducts.length === 0) return Number.POSITIVE_INFINITY;
    return Math.min(
      ...selectedProducts.map((product) => {
        const stock = Number(product.stock || 0);
        const adminUnit = normalizeInventoryUnit(
          product.admin_unit ?? product.quantity_indicator,
        );

        // Convert stock from admin unit to KG (base unit)
        let stockInKg = stock;
        if (adminUnit === INVENTORY_UNITS.TON) {
          stockInKg = stock * getTonToKgRate();
        }

        // Always return stock in KG for display stability
        // Unit conversion will happen only during API submission
        return stockInKg;
      }),
    );
  }, [selectedProducts]);

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
    const unitPrice = Number(product?.price || 0);
    const adminUnit = normalizeInventoryUnit(
      product?.admin_unit ?? product?.quantity_indicator,
    );
    const currentUnit = normalizeInventoryUnit(values.unit);

    // Convert price from admin unit to KG (base unit)
    let priceInKg = unitPrice;
    if (adminUnit === INVENTORY_UNITS.TON) {
      priceInKg = unitPrice / getTonToKgRate();
    }

    // Convert to KG format for API submission based on user's selected unit
    // When unit is TON: quantity = TON * getTonToKgRate(), price = TON price / getTonToKgRate()
    // When unit is KG: values remain as-is
    // Note: Display values are always in KG, so we use the user's selected unit for conversion
    const converted = convertInventoryToKgFormat(
      values.allocated_quantity,
      priceInKg,
      currentUnit
    );

    const payloads: AllocateProductPayload[] = [
      {
        partner_uuid: values.partner_uuid,
        product_uuid: values.product_uuid,
        allocated_quantity: converted.quantity,
        total_allocated_price: Number((converted.quantity * converted.price).toFixed(2)),
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
            Assign one product to a partner with real-time pricing calculation.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(submitForm)}>
              {isPartnerLocked ? (
                <FormItem>
                  <FormLabel>Partner Name</FormLabel>
                  <Input disabled value={lockedPartnerLabel || "-"} />
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
                <Input disabled value={selectedPartner?.companyName || "-"} />
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
                    disabled
                    value={inventoryNames.length > 0 ? inventoryNames.join(", ") : "Auto-populated"}
                  />
                </FormItem>
                <FormItem>
                  <FormLabel>Total Available Quantity</FormLabel>
                  <Input
                    disabled
                    value={adminTotalAvailableQuantity}
                    placeholder="Auto-populated"
                  />
                </FormItem>
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
                          options={[...INVENTORY_UNIT_OPTIONS]}
                          value={
                            field.value === undefined || field.value === null || field.value === ""
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
                          step={selectedUnit === INVENTORY_UNITS.TON ? "any" : 1}
                          placeholder="Enter allocated quantity"
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
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormItem>
                  <FormLabel>Price Per Unit</FormLabel>
                  <Input
                    disabled
                    value={`₹${Math.round(pricePerDisplayUnit).toLocaleString()}/${displayUnit === INVENTORY_UNITS.TON ? "TON" : "KG"}`}
                  />
                </FormItem>
                <FormItem>
                  <FormLabel>Total Allocation Price</FormLabel>
                  <Input disabled value={`₹${totalAllocationPrice.toLocaleString()}`} />
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
