import { zodResolver } from "@hookform/resolvers/zod";
import { Languages, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SubmitErrorHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ActionIcon } from "@/config/icons.config";
import { Button } from "@/components/ui/button";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { translateEnglishText } from "../utils/translate";
import {
  CATEGORY_LANGUAGES,
  getDefaultProductCategoryFormValues,
  productCategoryFormSchema,
  type CategoryLanguageCode,
  type ProductCategoryFormValues,
  type ProductCategoryItem,
} from "../types";

interface ProductCategoryFormProps {
  initialData?: ProductCategoryItem | null;
  onSubmit: (values: ProductCategoryFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const LANGUAGE_FIELD_NAMES = CATEGORY_LANGUAGES.map((language) => language.code);
const OTHER_CATEGORY_LANGUAGES = CATEGORY_LANGUAGES.filter(
  (language) => language.code !== "en",
);

export function ProductCategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ProductCategoryFormProps) {
  const [activeLanguage, setActiveLanguage] = useState<CategoryLanguageCode>("hi");
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const form = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategoryFormSchema),
    defaultValues: getDefaultProductCategoryFormValues(),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const translationErrorsByLanguage = useMemo(() => {
    return OTHER_CATEGORY_LANGUAGES.reduce<Record<string, boolean>>((acc, language) => {
      acc[language.code] = Boolean(
        form.formState.errors.name?.[language.code] ||
          form.formState.errors.description?.[language.code],
      );
      return acc;
    }, {});
  }, [form.formState.errors.description, form.formState.errors.name]);

  useEffect(() => {
    if (!initialData) {
      form.reset(getDefaultProductCategoryFormValues());
      setActiveLanguage("hi");
      setImagePreview(null);
      setExistingImageUrl(null);
      return;
    }

    const nextValues = getDefaultProductCategoryFormValues();
    LANGUAGE_FIELD_NAMES.forEach((language) => {
      nextValues.name[language] = initialData.name[language] || "";
      nextValues.description[language] = initialData.description[language] || "";
    });
    nextValues.status = initialData.status;
    nextValues.existingImageRemoved = false;
    nextValues.image = null;
    nextValues.hasExistingImage = Boolean(initialData.image_url || initialData.image_path || initialData.image);

    form.reset(nextValues);
    setActiveLanguage("hi");
    setImagePreview(null);
    setExistingImageUrl(initialData.image_url || initialData.image_path || initialData.image || null);
  }, [form, initialData]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      form.setError("image", { type: "manual", message: "Only JPG and PNG formats are allowed." });
      return;
    }
    if (file.size > maxSize) {
      form.setError("image", { type: "manual", message: "Image size must be less than 5MB." });
      return;
    }

    form.clearErrors("image");
    form.setValue("image", file, { shouldValidate: true, shouldDirty: true });
    
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    form.setValue("image", null, { shouldValidate: true, shouldDirty: true });
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleRemoveExistingImage = () => {
    setExistingImageUrl(null);
    form.setValue("existingImageRemoved", true, { shouldValidate: true, shouldDirty: true });
  };

  const handleAutoTranslate = async () => {
    const englishName = form.getValues("name.en").trim();
    const englishDescriptionValue = form.getValues("description.en").trim();

    if (!englishName) {
      form.setFocus("name.en");
      toast.error("Please enter the English category name first.");
      return;
    }

    setIsAutoTranslating(true);

    try {
      const translationTasks = OTHER_CATEGORY_LANGUAGES.map(async (language) => {
        const [translatedName, translatedDescription] = await Promise.all([
          translateEnglishText(englishName, language.code),
          englishDescriptionValue
            ? translateEnglishText(englishDescriptionValue, language.code)
            : Promise.resolve(""),
        ]);

        return {
          code: language.code,
          translatedName,
          translatedDescription,
        };
      });

      const translatedValues = await Promise.all(translationTasks);

      translatedValues.forEach(
        ({ code, translatedName, translatedDescription }) => {
          form.setValue(`name.${code}`, translatedName, {
            shouldDirty: true,
            shouldValidate: true,
          });
          form.setValue(`description.${code}`, translatedDescription, {
            shouldDirty: true,
            shouldValidate: true,
          });
        },
      );

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

  const handleInvalidSubmit: SubmitErrorHandler<ProductCategoryFormValues> = (errors) => {
    if (errors.name?.en) {
      form.setFocus("name.en");
      return;
    }

    if (errors.description?.en) {
      form.setFocus("description.en");
      return;
    }

    const firstLanguageWithError = OTHER_CATEGORY_LANGUAGES.find(
      (language) =>
        errors.name?.[language.code] || errors.description?.[language.code],
    );

    if (!firstLanguageWithError) {
      return;
    }

    setActiveLanguage(firstLanguageWithError.code);

    setTimeout(() => {
      if (errors.name?.[firstLanguageWithError.code]) {
        form.setFocus(`name.${firstLanguageWithError.code}`);
        return;
      }

      if (errors.description?.[firstLanguageWithError.code]) {
        form.setFocus(`description.${firstLanguageWithError.code}`);
      }
    }, 0);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
        className="flex min-h-full flex-col"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
          <div className="flex flex-col gap-4">
            <Card className="h-fit">
              <CardHeader className="flex items-center justify-between pb-3">
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
                <FormField
                  control={form.control}
                  name="name.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product category name" {...field} />
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
                          {...field}
                          className="min-h-28 resize-y custom-scrollbar"
                          placeholder="Enter product category description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle>Category Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:bg-muted/50">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png"
                    onChange={(event) => handleFileChange(event.target.files)}
                  />
                </label>
                <FormField control={form.control} name="image" render={() => <FormMessage />} />

                {existingImageUrl && !imagePreview && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Existing Image</p>
                    <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
                      <img
                        src={existingImageUrl}
                        alt="Category"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded bg-destructive/90 p-1 text-destructive-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={handleRemoveExistingImage}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {imagePreview && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">New Image</p>
                    <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
                      <img
                        src={imagePreview}
                        alt="New category"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded bg-destructive/90 p-1 text-destructive-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Translations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={activeLanguage}
                onValueChange={(value) =>
                  setActiveLanguage(value as CategoryLanguageCode)
                }
              >
                <TabsList
                  variant="line"
                  size="sm"
                  className="flex w-full flex-wrap justify-start"
                >
                  {OTHER_CATEGORY_LANGUAGES.map((language) => (
                    <TabsTrigger key={language.code} value={language.code}>
                      {language.label}
                      {translationErrorsByLanguage[language.code] ? " *" : ""}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {OTHER_CATEGORY_LANGUAGES.map((language) => (
                  <TabsContent
                    key={language.code}
                    value={language.code}
                    className="mt-4 space-y-4 rounded-lg border p-4"
                  >
                    <FormField
                      control={form.control}
                      name={`name.${language.code}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Category Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={`Enter ${language.label.toLowerCase()} category name`}
                            />
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
                          <FormLabel>
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-28 resize-y custom-scrollbar"
                              placeholder={`Enter ${language.label.toLowerCase()} description`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                ))}
              </Tabs>
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
            {initialData ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
