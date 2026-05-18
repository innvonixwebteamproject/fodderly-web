import { zodResolver } from "@hookform/resolvers/zod";
import { Languages, Loader2, Sparkles } from "lucide-react";
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

  const form = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategoryFormSchema),
    defaultValues: getDefaultProductCategoryFormValues(),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const englishDescription = form.watch("description.en");
  const isTranslatedDescriptionRequired = englishDescription.trim().length > 0;

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
      return;
    }

    const nextValues = getDefaultProductCategoryFormValues();
    LANGUAGE_FIELD_NAMES.forEach((language) => {
      nextValues.name[language] = initialData.name[language] || "";
      nextValues.description[language] = initialData.description[language] || "";
    });
    nextValues.status = initialData.status;

    form.reset(nextValues);
    setActiveLanguage("hi");
  }, [form, initialData]);

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
                          <FormLabel required={isTranslatedDescriptionRequired}>
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
