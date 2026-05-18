import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CATEGORY_LANGUAGES,
  type ProductCategoryItem,
} from "../types";

interface ProductCategoryViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ProductCategoryItem | null;
}

export function ProductCategoryViewDialog({
  open,
  onOpenChange,
  category,
}: ProductCategoryViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Product Category Details</DialogTitle>
        </DialogHeader>

        {category ? (
          <div>
            <Tabs defaultValue="en">
              <TabsList variant="line" size="sm" className="flex w-full flex-wrap justify-start">
                {CATEGORY_LANGUAGES.map((language) => (
                  <TabsTrigger key={language.code} value={language.code}>
                    {language.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {CATEGORY_LANGUAGES.map((language) => {
                const name = category.name[language.code]?.trim() || "-";
                const description = category.description[language.code]?.trim() || "-";

                return (
                  <TabsContent
                    key={language.code}
                    value={language.code}
                    className="mt-4 space-y-4 rounded-lg border p-4"
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Name :</p>
                      <div className="rounded-md border bg-muted/30 px-3 py-2">
                        <p className="text-sm break-words">{name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Description :</p>
                      <div className="max-h-56 overflow-y-auto custom-scrollbar rounded-md border bg-muted/30 px-3 py-2">
                        <p className="whitespace-pre-wrap text-sm break-words">{description}</p>
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
