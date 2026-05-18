import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionIcon } from "@/config/icons.config";
import { Button } from "@/components/ui/button";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  getDefaultInventoryCategoryFormValues,
  inventoryCategoryFormSchema,
  type InventoryCategoryFormValues,
  type InventoryCategoryItem,
} from "../types";

interface InventoryCategoryFormProps {
  initialData?: InventoryCategoryItem | null;
  onSubmit: (values: InventoryCategoryFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InventoryCategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: InventoryCategoryFormProps) {
  const form = useForm<InventoryCategoryFormValues>({
    resolver: zodResolver(inventoryCategoryFormSchema),
    defaultValues: getDefaultInventoryCategoryFormValues(),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!initialData) {
      form.reset(getDefaultInventoryCategoryFormValues());
      return;
    }

    form.reset({
      name: initialData.name,
    });
  }, [form, initialData]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-full flex-col">
        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Raw Materials" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        </div>

        <div className="sticky bottom-0 z-10 -mx-6 mt-auto flex flex-col-reverse gap-3 border-t bg-background px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <CancelButtonContent />
          </Button>
          <Button type="submit" variant="primary" className="gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ActionIcon.Save className="h-4 w-4" />
            )}
            {initialData ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
