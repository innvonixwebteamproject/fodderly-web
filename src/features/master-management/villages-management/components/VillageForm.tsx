import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { translateEnglishText } from "@/services/translation.service";
import { MASTER_LANGUAGES, MasterLangCode, TranslationFields } from "../../components/TranslationFields";
import { VillageFormValues, VillageItem, villageFormSchema } from "../types";
import { StateSelect, DistrictSelect, TalukaSelect } from "@/components/common/api-selects";

interface VillageFormProps {
  initialData?: VillageItem | null;
  onSubmit: (values: VillageFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  viewOnly?: boolean;
}

export function VillageForm({ initialData, onSubmit, onCancel, isLoading, viewOnly }: VillageFormProps) {
  const [activeLanguage, setActiveLanguage] = useState<MasterLangCode>("hi");
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);

  const form = useForm<VillageFormValues>({
    resolver: zodResolver(villageFormSchema),
    defaultValues: {
      stateId: "",
      districtId: "",
      talukaId: "",
      translations: { en: "", hi: "", gu: "", mr: "", te: "", pa: "", ml: "" },
    },
  });

  useEffect(() => {
    if (initialData) {
      const name = initialData.name;
      const translations = initialData.translations || (typeof name === "object" ? name : {});
      const isString = typeof name === "string";

      form.reset({
        stateId: initialData.stateId || "",
        districtId: initialData.districtId || "",
        talukaId: initialData.talukaId || "",
        translations: {
          en: isString ? name : translations?.en || "",
          hi: translations?.hi || "",
          gu: translations?.gu || "",
          mr: translations?.mr || "",
          te: translations?.te || "",
          pa: translations?.pa || "",
          ml: translations?.ml || "",
        },
      });
    } else {
      form.reset({
        stateId: "",
        districtId: "",
        talukaId: "",
        translations: { en: "", hi: "", gu: "", mr: "", te: "", pa: "", ml: "" },
      });
    }
  }, [form, initialData]);

  const handleCancel = () => {
    onCancel();
  };

  const handleAutoTranslate = async () => {
    const englishName = form.getValues("translations.en").trim();
    if (!englishName) { toast.error("Please enter the English village name first."); return; }
    setIsAutoTranslating(true);
    try {
      const results = await Promise.all(
        MASTER_LANGUAGES.map(async ({ code }) => ({
          code,
          translated: await translateEnglishText(englishName, code),
        }))
      );
      results.forEach(({ code, translated }) => {
        form.setValue(`translations.${code}`, translated, { shouldDirty: true, shouldValidate: true });
      });
      toast.success("Translations generated for all supported languages.");
      setActiveLanguage("hi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed. Please try again.");
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const watchedStateId = form.watch("stateId");
  const watchedDistrictId = form.watch("districtId");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-full flex-col">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
          <Card className="h-fit">
            <CardHeader className="flex items-center justify-between pb-3">
              <CardTitle>English Content</CardTitle>
              {!viewOnly && (
                <Button type="button" variant="outline" size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5"
                  onClick={handleAutoTranslate} disabled={isAutoTranslating || isLoading}>
                  {isAutoTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Auto Translate
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="stateId" render={({ field }) => (
                <FormItem>
                  <FormLabel required>State</FormLabel>
                  <FormControl>
                    <StateSelect value={field.value}
                      onValueChange={(val) => { field.onChange(val); form.setValue("districtId", ""); form.setValue("talukaId", ""); }}
                      placeholder="Select state" disabled={isLoading || viewOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="districtId" render={({ field }) => (
                <FormItem>
                  <FormLabel required>District</FormLabel>
                  <FormControl>
                    <DistrictSelect stateId={watchedStateId} value={field.value}
                      onValueChange={(val) => { field.onChange(val); form.setValue("talukaId", ""); }}
                      placeholder={watchedStateId ? "Select district" : "Select state first"}
                      disabled={isLoading || viewOnly || !watchedStateId} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="talukaId" render={({ field }) => (
                <FormItem>
                  <FormLabel required>Taluka</FormLabel>
                  <FormControl>
                    <TalukaSelect stateId={watchedStateId} districtId={watchedDistrictId} value={field.value} onValueChange={field.onChange}
                      placeholder={watchedDistrictId ? "Select taluka" : "Select district first"}
                      disabled={isLoading || viewOnly || !watchedDistrictId} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="translations.en" render={({ field }) => (
                <FormItem>
                  <FormLabel required>Village Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter village name" disabled={isLoading || viewOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <TranslationFields
            form={form}
            activeLanguage={activeLanguage}
            setActiveLanguage={setActiveLanguage}
            basePath="translations"
            label="Village Name"
            isLoading={isLoading}
            viewOnly={viewOnly}
          />
        </div>

        {!viewOnly && (
          <div className="sticky bottom-[-24px] z-10 -mx-6 mt-3 flex items-center justify-end gap-3 border-t bg-slate-50/50 px-6 py-4 backdrop-blur-sm">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading || isAutoTranslating} className="h-9 gap-1.5 px-4">
              <CancelButtonContent />
            </Button>
            <Button type="submit" variant="primary" className="h-9 gap-1.5 px-4" disabled={isLoading || isAutoTranslating}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {initialData ? "Update" : "Create"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
