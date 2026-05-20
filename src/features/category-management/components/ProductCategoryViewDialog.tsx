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
  const imageUrl = category?.image_url || category?.image || category?.image_path || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Product Category Details</DialogTitle>
        </DialogHeader>

        {category ? (
          <div className="max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              {/* Image Section */}
              <div className="flex flex-col gap-2 shrink-0 items-center justify-center border-b pb-5 md:border-b-0 md:pb-0 md:border-r md:pr-6 md:self-stretch">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground self-start md:self-auto">Category Image</p>
                <div className="relative aspect-square w-[180px] overflow-hidden rounded-xl border bg-muted/30 shadow-sm transition-all hover:shadow-md flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={category.name.en || "Category"}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                      <span className="text-sm font-medium">No Image Uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Translation/Details Section */}
              <div className="flex-1 min-w-0 md:pl-2">
                <Tabs defaultValue="en">
                  <TabsList variant="line" size="sm" className="flex w-full flex-nowrap overflow-x-auto custom-scrollbar justify-start border-b whitespace-nowrap pb-px">
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
                        className="mt-4 space-y-4 rounded-xl border bg-card p-4 shadow-sm"
                      >
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
                          <div className="rounded-lg border bg-muted/20 px-3.5 py-2.5">
                            <p className="text-sm font-medium text-foreground break-words">{name}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
                          <div className="max-h-60 overflow-y-auto custom-scrollbar rounded-lg border bg-muted/20 px-3.5 py-2.5">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground break-words">{description}</p>
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
