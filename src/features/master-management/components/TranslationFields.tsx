import { Languages } from "lucide-react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const MASTER_LANGUAGES = [
  { code: "hi" as const, label: "Hindi" },
  { code: "gu" as const, label: "Gujarati" },
  { code: "mr" as const, label: "Marathi" },
  { code: "te" as const, label: "Telugu" },
  { code: "pa" as const, label: "Punjabi" },
  { code: "ml" as const, label: "Malayalam" },
] as const;

export type MasterLangCode = (typeof MASTER_LANGUAGES)[number]["code"];

interface TranslationFieldsProps {
  form: UseFormReturn<FieldValues>;
  activeLanguage: MasterLangCode;
  setActiveLanguage: (lang: MasterLangCode) => void;
  basePath: string; // e.g. "name"
  label: string;
  isLoading?: boolean;
  viewOnly?: boolean;
}

export function TranslationFields({
  form,
  activeLanguage,
  setActiveLanguage,
  basePath,
  label,
  isLoading,
  viewOnly,
}: TranslationFieldsProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Translations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeLanguage}
          onValueChange={(v) => setActiveLanguage(v as MasterLangCode)}
        >
          <TabsList variant="line" size="sm" className="flex w-full flex-wrap justify-start">
            {MASTER_LANGUAGES.map(({ code, label: langLabel }) => (
              <TabsTrigger key={code} value={code}>
                {langLabel} *
              </TabsTrigger>
            ))}
          </TabsList>
          {MASTER_LANGUAGES.map(({ code, label: langLabel }) => (
            <TabsContent
              key={code}
              value={code}
              className="mt-4 space-y-4 rounded-lg border p-4"
            >
              <FormField
                control={form.control}
                name={`${basePath}.${code}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder={`Enter ${langLabel.toLowerCase()} ${label.toLowerCase()}`}
                        disabled={isLoading || viewOnly}
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
  );
}
