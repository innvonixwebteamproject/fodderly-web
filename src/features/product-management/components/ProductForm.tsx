import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { Languages, Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { ActionIcon } from "@/config/icons.config";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCT_UNITS } from "../constants";
import {
  ProductFormInputValues,
  ProductFormValues,
  ProductOption,
  ProductRecord,
  productFormSchema,
  PRODUCT_LANGUAGES,
  PRODUCT_LANGUAGES_CONFIG,
  type ProductLanguageCode,
  type TranslationMap,
} from "../types";
import { translateEnglishText } from "../utils/translate";

interface ProductFormProps {
  initialData?: ProductRecord | null;
  categoryOptions: ProductOption[];
  inventoryOptions: ProductOption[];
  onSubmit: (data: ProductFormValues) => void;
  onCancel: () => void;
  onDeleteImage?: (imageId: string) => void;
  deletingImageId?: string | null;
  isLoading?: boolean;
}

const emptyTranslations: TranslationMap = {
  en: "",
  hi: "",
  gu: "",
  mr: "",
  te: "",
  pa: "",
  ml: "",
};

const OTHER_PRODUCT_LANGUAGES = PRODUCT_LANGUAGES_CONFIG.filter(
  (language) => language.code !== "en",
);

const normalizeTranslation = (value?: Partial<Record<(typeof PRODUCT_LANGUAGES)[number], string>>) => ({
  ...emptyTranslations,
  ...(value || {}),
});

const MAX_PRICE = 100_000_000;
const MAX_STOCK = 10_000_000;

const parseIntFieldValue = (value: unknown, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
};

export function ProductForm({
  initialData,
  categoryOptions,
  inventoryOptions,
  onSubmit,
  onCancel,
  onDeleteImage,
  deletingImageId,
  isLoading,
}: ProductFormProps) {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<ProductLanguageCode>("hi");
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);

  const form = useForm<ProductFormInputValues, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: emptyTranslations,
      category_uuid: "",
      inventory_uuids: [],
      price: 0,
      stock: 0,
      unit: "kg",
      description: emptyTranslations,
      usage_instructions: emptyTranslations,
      safety_information: emptyTranslations,
      quality_grade: "",
      nutritional_value: emptyTranslations,
      brand_uuid: "",
      is_active: true,
      existingImageIds: [],
      newImages: [],
    },
  });

  useEffect(() => {
    if (!initialData) return;

    form.reset({
      name: normalizeTranslation(initialData.name),
      category_uuid: initialData.category_uuid,
      inventory_uuids:
        initialData.inventory_uuids || initialData.inventories?.map((item) => item.id) || [],
      price: initialData.price,
      stock: initialData.stock,
      unit:
        (initialData.quantity_controls?.unit as "kg" | "ton" | undefined) ||
        (initialData.quantity_indicator?.toLowerCase() === "ton" ? "ton" : "kg"),
      description: normalizeTranslation(initialData.description),
      usage_instructions: normalizeTranslation(initialData.usage_instructions),
      safety_information: normalizeTranslation(initialData.safety_information),
      quality_grade: initialData.quality_grade || "",
      nutritional_value: normalizeTranslation(initialData.nutritional_value),
      brand_uuid: initialData.brand_uuid || "",
      is_active: initialData.is_active,
      existingImageIds: initialData.images.map((img) => img.id),
      newImages: [],
    });
  }, [form, initialData]);

  const selectedInventoryIds = form.watch("inventory_uuids");
  const watchedNewImages = form.watch("newImages");
  const newImages = useMemo(() => watchedNewImages ?? [], [watchedNewImages]);
  const watchedExistingImageIds = form.watch("existingImageIds");
  const existingImageIds = useMemo(() => watchedExistingImageIds ?? [], [watchedExistingImageIds]);
  const newImagePreviews = useMemo(
    () =>
      newImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [newImages],
  );

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [newImagePreviews]);

  const selectedInventories = useMemo(
    () => inventoryOptions.filter((item) => selectedInventoryIds.includes(item.id)),
    [inventoryOptions, selectedInventoryIds],
  );

  const translationErrorsByLanguage = useMemo(() => {
    return OTHER_PRODUCT_LANGUAGES.reduce<Record<string, boolean>>((acc, language) => {
      acc[language.code] = Boolean(
        form.formState.errors.name?.[language.code] ||
        form.formState.errors.description?.[language.code] ||
        form.formState.errors.usage_instructions?.[language.code] ||
        form.formState.errors.safety_information?.[language.code] ||
        form.formState.errors.nutritional_value?.[language.code],
      );
      return acc;
    }, {});
  }, [form.formState.errors]);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const current = form.getValues("newImages") ?? [];
    const existingCount = (form.getValues("existingImageIds") ?? []).length;
    const selectedFiles = Array.from(files);

    const hasInvalidType = selectedFiles.some(
      (file) => !["image/jpeg", "image/png"].includes(file.type),
    );
    if (hasInvalidType) {
      form.setError("newImages", { type: "manual", message: "Only JPG/PNG allowed." });
      return;
    }

    const hasInvalidSize = selectedFiles.some((file) => file.size > 5 * 1024 * 1024);
    if (hasInvalidSize) {
      form.setError("newImages", {
        type: "manual",
        message: "Upload 5MB JPG/PNG per single image",
      });
      return;
    }

    const nextImages = [...current, ...selectedFiles];

    if (nextImages.length + existingCount > 10) {
      form.setError("newImages", { type: "manual", message: "Upload only 10 images" });
      return;
    }

    form.clearErrors("newImages");
    form.setValue("newImages", nextImages, { shouldValidate: true });
  };

  const handleAutoTranslate = async () => {
    const values = form.getValues();
    const englishName = values.name.en.trim();

    if (!englishName) {
      form.setFocus("name.en");
      toast.error("Please enter the English product name first.");
      return;
    }

    setIsAutoTranslating(true);

    try {
      const sections: Array<keyof Pick<ProductFormValues, "name" | "description" | "usage_instructions" | "safety_information" | "nutritional_value">> = [
        "name",
        "description",
        "usage_instructions",
        "safety_information",
        "nutritional_value",
      ];

      const translationTasks = OTHER_PRODUCT_LANGUAGES.map(async (language) => {
        const translations = await Promise.all(
          sections.map(async (section) => {
            const englishValue = values[section].en.trim();
            if (!englishValue) return { section, translated: "" };

            // For sections other than name, we only translate if it's not empty
            const translated = await translateEnglishText(englishValue, language.code);
            return { section, translated };
          })
        );

        return {
          code: language.code,
          translations,
        };
      });

      const translatedResults = await Promise.all(translationTasks);

      translatedResults.forEach(({ code, translations }) => {
        translations.forEach(({ section, translated }) => {
          if (translated) {
            const fieldPath = `${section}.${code}` as const;
            form.setValue(fieldPath, translated, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        });
      });

      toast.success("Translations generated for all supported languages.");
      setActiveLanguage("hi");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to generate translations right now.",
      );
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const handleInvalidSubmit = (errors: FieldErrors<ProductFormInputValues>) => {
    const mainFields: Array<keyof ProductFormInputValues> = [
      "category_uuid",
      "inventory_uuids",
      "price",
      "stock",
      "unit",
      "newImages",
    ];
    const hasMainFieldError = mainFields.some(field => errors[field]);

    if (hasMainFieldError) return;

    if (errors.name?.en || errors.description?.en || errors.usage_instructions?.en || errors.safety_information?.en || errors.nutritional_value?.en) {
      return;
    }

    const firstLanguageWithError = OTHER_PRODUCT_LANGUAGES.find(
      (language) =>
        errors.name?.[language.code] ||
        errors.description?.[language.code] ||
        errors.usage_instructions?.[language.code] ||
        errors.safety_information?.[language.code] ||
        errors.nutritional_value?.[language.code],
    );

    if (!firstLanguageWithError) return;

    setActiveLanguage(firstLanguageWithError.code);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
        className="flex min-h-full flex-col"
      >
        <div className="flex flex-row gap-4 py-4 w-full">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>English Content</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5"
                onClick={handleAutoTranslate}
                disabled={isAutoTranslating || isLoading}
              >
                {isAutoTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Auto Translate
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4 space-y-4">
                <FormField
                  control={form.control}
                  name="name.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name in English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter description in English"
                          className="min-h-20 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nutritional_value.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nutritional Value</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. High Protein" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="usage_instructions.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usage Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="English instructions"
                            className="min-h-20 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="safety_information.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safety Information</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="English safety info"
                            className="min-h-20 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quality_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Grade</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. A+, Premium" {...field} />
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
                          options={categoryOptions.map((item) => ({
                            value: item.id,
                            label: item.label,
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>MRP / Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={MAX_PRICE}
                          step={1}
                          className="tabular-nums"
                          autoComplete="off"
                          disabled={isLoading}
                          value={
                            field.value === "" || field.value === undefined || field.value === null
                              ? ""
                              : parseIntFieldValue(field.value, 0)
                          }
                          onChange={(event) => {
                            const raw = event.target.value;
                            if (raw === "") {
                              field.onChange("" as unknown as number);
                              return;
                            }
                            const n = Number(raw);
                            if (!Number.isFinite(n)) return;
                            const next = Math.trunc(n);
                            if (next < 0 || next > MAX_PRICE) return;
                            field.onChange(next);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          onKeyDown={(event) => {
                            if (["e", "E", "+", "-", ".", ","].includes(event.key)) {
                              event.preventDefault();
                            }
                          }}
                          onWheel={(event) => event.currentTarget.blur()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={MAX_STOCK}
                          step={1}
                          className="tabular-nums"
                          autoComplete="off"
                          disabled={isLoading}
                          value={
                            field.value === "" || field.value === undefined || field.value === null
                              ? ""
                              : parseIntFieldValue(field.value, 0)
                          }
                          onChange={(event) => {
                            const raw = event.target.value;
                            if (raw === "") {
                              field.onChange("" as unknown as number);
                              return;
                            }
                            const n = Number(raw);
                            if (!Number.isFinite(n)) return;
                            const next = Math.trunc(n);
                            if (next < 0 || next > MAX_STOCK) return;
                            field.onChange(next);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          onKeyDown={(event) => {
                            if (["e", "E", "+", "-", ".", ","].includes(event.key)) {
                              event.preventDefault();
                            }
                          }}
                          onWheel={(event) => event.currentTarget.blur()}
                        />
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
                          options={PRODUCT_UNITS.map((item) => ({
                            value: item.value,
                            label: item.label,
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select unit"
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
                name="inventory_uuids"
                render={() => (
                  <FormItem>
                    <FormLabel required>Inventory Mapping</FormLabel>
                    <Popover open={inventoryOpen} onOpenChange={setInventoryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {selectedInventories.length > 0
                            ? `${selectedInventories.length} items selected`
                            : "Select inventories"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search inventory..." />
                          <CommandList>
                            <CommandEmpty>No inventory found.</CommandEmpty>
                            <CommandGroup>
                              {inventoryOptions.map((item) => {
                                const selected = selectedInventoryIds.includes(item.id);
                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={`${item.label}-${item.id}`}
                                    onSelect={() => {
                                      const current = form.getValues("inventory_uuids");
                                      const next = selected
                                        ? current.filter((id) => id !== item.id)
                                        : [...current, item.id];
                                      form.setValue("inventory_uuids", next, {
                                        shouldValidate: true,
                                      });
                                    }}
                                  >
                                    <span className="mr-2">{selected ? "✓" : ""}</span>
                                    <span>{item.label}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedInventories.map((item) => (
                        <Badge key={item.id} variant="secondary" className="gap-1">
                          {item.label}
                          <button
                            type="button"
                            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={() =>
                              form.setValue(
                                "inventory_uuids",
                                selectedInventoryIds.filter((id) => id !== item.id),
                                { shouldValidate: true },
                              )
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <div className="border-t pt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="name.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name in English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter description in English"
                          className="min-h-20 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="quality_grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quality Grade</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. A+, Premium" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nutritional_value.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nutritional Value</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. High Protein" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="usage_instructions.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usage Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="English instructions"
                            className="min-h-20 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="safety_information.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safety Information</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="English safety info"
                            className="min-h-20 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div> */}
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Translations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={activeLanguage}
                onValueChange={(value) => setActiveLanguage(value as ProductLanguageCode)}
              >
                <TabsList
                  variant="line"
                  size="sm"
                  className="flex w-full flex-wrap justify-start border-b"
                >
                  {OTHER_PRODUCT_LANGUAGES.map((language) => (
                    <TabsTrigger key={language.code} value={language.code}>
                      {language.label}
                      {translationErrorsByLanguage[language.code] ? " *" : ""}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {OTHER_PRODUCT_LANGUAGES.map((language) => (
                  <TabsContent
                    key={language.code}
                    value={language.code}
                    className="mt-4 space-y-4 rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                      <Languages className="h-4 w-4" />
                      {language.label} ({language.nativeLabel})
                    </div>

                    <FormField
                      control={form.control}
                      name={`name.${language.code}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder={`Name in ${language.label}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`description.${language.code}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={`Description in ${language.label}`}
                              className="min-h-20 resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`nutritional_value.${language.code}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nutritional Value</FormLabel>
                          <FormControl>
                            <Input placeholder={`Nutritional value in ${language.label}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`usage_instructions.${language.code}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usage Instructions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`${language.label} instructions`}
                                className="min-h-20 resize-y"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`safety_information.${language.code}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Safety Information</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`${language.label} safety info`}
                                className="min-h-20 resize-y"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-row gap-4 pb-4 w-full">
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:bg-muted/50">
                <div className="rounded-full bg-primary/10 p-2">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload images</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB, max 10 images</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={(event) => handleFileChange(event.target.files)}
                />
              </label>
              <FormField control={form.control} name="newImages" render={() => <FormMessage />} />

              {initialData && initialData.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Existing Images</p>
                  <div className="flex flex-wrap gap-2.5">
                    {initialData.images
                      .filter((img) => existingImageIds.includes(img.id))
                      .map((img) => (
                        <div
                          key={img.id}
                          className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted"
                        >
                          <img
                            src={img.image_path}
                            alt="Product"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <button
                            type="button"
                            className="absolute right-1 top-1 rounded bg-destructive/90 p-1 text-destructive-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                            disabled={deletingImageId === img.id}
                            onClick={() => {
                              form.setValue(
                                "existingImageIds",
                                existingImageIds.filter((id) => id !== img.id),
                                { shouldValidate: true },
                              );
                              onDeleteImage?.(img.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {newImagePreviews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">New Images</p>
                  <div className="flex flex-wrap gap-2.5">
                    {newImagePreviews.map(({ file, url }, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted"
                      >
                        <img
                          src={url}
                          alt={file.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[9px] text-white">
                          <p className="truncate font-medium">{file.name}</p>
                        </div>
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded bg-destructive/90 p-1 text-destructive-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => {
                            const next = [...newImages];
                            next.splice(index, 1);
                            form.setValue("newImages", next, { shouldValidate: true });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="sticky bottom-0 z-10 -mx-6 mt-auto flex flex-col-reverse gap-3 border-t bg-background px-6 py-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isAutoTranslating}
          >
            <CancelButtonContent />
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="gap-2"
            disabled={isLoading || isAutoTranslating}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ActionIcon.Save className="h-4 w-4" />
            )}
            {initialData ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
