import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2 } from "lucide-react";
import { ActionIcon } from "@/config/icons.config";
import { INVENTORY_UNIT_OPTIONS } from "@/constants/unit.constants";
import {
  InventoryCategoryOption,
  InventoryFormInputValues,
  InventoryFormValues,
  InventoryRow,
  inventoryFormSchema,
} from "../types";

interface InventoryFormProps {
  initialData?: InventoryRow | null;
  categories: InventoryCategoryOption[];
  onSubmit: (data: InventoryFormValues) => void;
  onCancel: () => void;
  isOpen?: boolean;
  isLoading?: boolean;
}

export function InventoryForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isOpen = false,
  isLoading,
}: InventoryFormProps) {
  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories],
  );

  const categoryOptions = useMemo(() => {
    const selected = initialData
      ? categories.find((category) => category.id === initialData.category_uuid)
      : undefined;

    const base = activeCategories.map((category) => ({
      label: category.name,
      value: category.id,
    }));

    if (selected && !selected.isActive) {
      return [{ label: `${selected.name} (inactive)`, value: selected.id }, ...base];
    }

    return base;
  }, [activeCategories, categories, initialData]);

  const form = useForm<InventoryFormInputValues, unknown, InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      quantity: "",
      category_uuid: "",
      hsn_code: "",
      price: "",
      unit: "",
    },
  });

  useEffect(() => {
    if (!initialData) {
      if (isOpen) {
        form.reset({
          name: "",
          description: "",
          quantity: "",
          category_uuid: "",
          hsn_code: "",
          price: "",
          unit: "",
        });
      }
      return;
    }

    form.reset({
      name: initialData.name,
      description: initialData.description,
      quantity: initialData.quantity,
      category_uuid: initialData.category_uuid,
      hsn_code: initialData.hsn_code,
      price: initialData.price,
      unit: initialData.unit,
    });
  }, [categoryOptions, form, initialData, isOpen]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter inventory name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_uuid"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Category</FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={categoryOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select category"
                    searchPlaceholder="Search category..."
                    isClearable={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="min-h-28 resize-y"
                  placeholder="Enter inventory description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min={1} placeholder="Enter quantity" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Unit</FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={[...INVENTORY_UNIT_OPTIONS]}
                    value={field.value === "" || field.value === undefined ? "" : String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Select unit"
                    isClearable={false}
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
            name="hsn_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>HSN Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter HSN code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Price</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min={1} placeholder="Enter price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4 -mx-6 mt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="gap-2">
            <CancelButtonContent />
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ActionIcon.Save className="h-4 w-4" />}
            {initialData ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
