import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollContainer } from "@/components/common/scroll-container";
import { Activity, Info, ShieldAlert, Tag, Wrench, Zap } from "lucide-react";
import { ProductRecord, PRODUCT_LANGUAGES_CONFIG, type ProductLanguageCode, type TranslationMap } from "../types";
import { getLanguageLabel } from "../services/product.api";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  normalizeProductImageUrl,
  PRODUCT_NO_IMAGE_PLACEHOLDER,
} from "../utils/product-image";

import { TruncatedCell } from "@/components/common/truncated-cell";
import { formatForDisplay, formatAdminAvailableQty, formatPartnerAllocatedQty } from "../utils/unit-conversion";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductRecord | null;
  englishOnly?: boolean;
  showAllocatedQty?: boolean;
}

function ExpandableText({ text, maxLength = 1000 }: { text: string; maxLength?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text === "-") return <p className="text-[13px] text-foreground/70 font-medium italic">-</p>;
  if (text.length <= maxLength) return <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-line font-medium break-words overflow-wrap-anywhere">{text}</p>;

  return (
    <div className="space-y-1.5">
      <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-line font-medium break-words overflow-wrap-anywhere">
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="text-[11px] font-bold text-primary hover:underline transition-all"
      >
        {isExpanded ? "Show Less" : "Show More"}
      </button>
    </div>
  );
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  englishOnly = false,
  showAllocatedQty = true,
}: ProductDetailModalProps) {
  const [activeLanguage, setActiveLanguage] = useState<ProductLanguageCode>("en");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setActiveLanguage("en");
      setSelectedImageIndex(0);
      setFailedImages(new Set());
    }
  }, [isOpen]);

  const productImages = useMemo(() => product?.images || [], [product?.images]);

  const imageUrls = useMemo(
    () =>
      productImages
        .map((img) => normalizeProductImageUrl(img.image_path))
        .filter((url): url is string => Boolean(url)),
    [productImages],
  );

  const primaryImageSrc = imageUrls[selectedImageIndex] || PRODUCT_NO_IMAGE_PLACEHOLDER;

  if (!product) return null;

  // Format price and quantity for display based on automatic unit selection
  const stockInKg = product.admin_available_quantity ?? product.stock;
  const pricePerKg = product.price;
  const formattedDisplay = formatForDisplay(stockInKg, pricePerKg);
  const unitLabel = formattedDisplay.unit === "ton" ? "Ton" : "KG";

  // Format quantities for display using new centralized helpers
  const adminAvailableQtyStr = formatAdminAvailableQty(product.admin_available_quantity ?? product.stock);
  const allocatedQtyStr = formatPartnerAllocatedQty(product.allocated_quantity ?? 0);

  const getTranslation = (value: Partial<TranslationMap> | undefined, lang: ProductLanguageCode, fallback = "-"): string => {
    if (!value) return fallback;
    const text = value[lang]?.trim();
    if (text) return text;
    return getLanguageLabel(value, fallback);
  };

  const handleImageError = (idx: number) => {
    setFailedImages((prev) => new Set(prev).add(idx));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[780px] gap-0 p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-5 pb-3 pr-12 bg-gradient-to-r from-primary/5 to-transparent border-b">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-lg font-bold flex items-start gap-2 text-foreground leading-snug">
              <Tag className="h-4 w-4 text-primary shrink-0 mt-1" />
              <TruncatedCell 
                value={getLanguageLabel(product.name)} 
                maxWidth="max-w-[620px]" 
                lineClamp={2}
                className="whitespace-normal leading-snug"
                tooltipClassName="sm:max-w-[400px]"
              />
            </DialogTitle>
            <div className="flex items-center gap-3">
              <TruncatedCell 
                value={`Product Code: ${product.uniqueID}`} 
                maxWidth="max-w-[500px]" 
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              />
              <Badge 
                variant={product.is_active ? "success" : "destructive"} 
                className="text-[10px] h-4 px-1.5 font-bold uppercase shrink-0"
              >
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollContainer
          className="max-h-[75vh] px-5 py-4"
          overflowX="hidden"
          overflowY="auto"
        >
          <div className="flex flex-col gap-5">
            {/* Top Section: Image Gallery & Core Specs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Image Gallery (4 cols on md) */}
              <div className="md:col-span-4 space-y-2.5">
                <div className="aspect-square rounded-xl bg-muted/50 overflow-hidden border border-border group relative max-w-[280px] mx-auto md:mx-0">
                  {failedImages.has(selectedImageIndex) ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                      <Zap className="h-10 w-10 opacity-20" />
                    </div>
                  ) : (
                    <img
                      src={primaryImageSrc}
                      alt={getLanguageLabel(product.name)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={() => handleImageError(selectedImageIndex)}
                    />
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                    {selectedImageIndex + 1} / {imageUrls.length || 1}
                  </div>
                </div>
                
                {/* Thumbnails Grid - All uploaded images */}
                {imageUrls.length > 1 && (
                  <div className="grid grid-cols-5 gap-1.5 max-w-[280px] mx-auto md:mx-0">
                    {imageUrls.map((imageUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                          selectedImageIndex === idx 
                            ? "border-primary shadow-sm scale-95" 
                            : "border-transparent hover:border-primary/20"
                        }`}
                      >
                        <img
                          src={imageUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className={`w-full h-full object-cover ${failedImages.has(idx) ? "opacity-20 grayscale" : ""}`}
                          referrerPolicy="no-referrer"
                          onError={() => handleImageError(idx)}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Info (8 cols on md) */}
              <div className="md:col-span-8 flex flex-col justify-between py-0">
                <div className="space-y-4">
                  <div className="space-y-1 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <h4 className="text-xs font-bold uppercase tracking-tight text-primary/70 flex items-center gap-1.5">
                      Product Price
                    </h4>
                    <p className="text-2xl font-black text-primary">
                      ₹{formattedDisplay.price.toLocaleString()}/{unitLabel}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-0.5">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5" /> Total Admin Available Qty
                      </h4>
                      <p className="text-[13px] font-bold text-foreground">
                        {adminAvailableQtyStr}
                      </p>
                    </div>

                    {showAllocatedQty && (
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-1.5">
                          Partner Allocated Qty
                        </h4>
                        <p className="text-[13px] font-bold text-foreground">
                          {allocatedQtyStr}
                        </p>
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> Category
                      </h4>
                      <TruncatedCell
                        value={getLanguageLabel(product.category_name)}
                        maxWidth="max-w-[200px]"
                        className="text-[13px] font-semibold text-foreground"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold uppercase tracking-tight text-muted-foreground flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" /> Quality Grade
                      </h4>
                      <TruncatedCell
                        value={product.quality_grade || "-"}
                        maxWidth="max-w-full"
                        lineClamp={2}
                        asBadge={Boolean(product.quality_grade)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="border border-border rounded-xl overflow-hidden bg-muted/5">
              {englishOnly ? (
                <div className="mt-0 p-4 space-y-5 animate-in fade-in-50 slide-in-from-bottom-1 duration-300">
                  <section className="space-y-2">
                    <h4 className="text-[13px] font-bold flex items-center gap-2 text-primary uppercase tracking-tight">
                      <Info className="h-4 w-4" /> Description
                    </h4>
                    <div className="bg-background rounded-lg p-3.5 border border-border/50 shadow-sm">
                      <ExpandableText text={getTranslation(product.description, "en")} />
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-5">
                    <section className="space-y-2">
                      <h4 className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                        <Wrench className="h-3.5 w-3.5" /> Usage Instructions
                      </h4>
                      <div className="bg-background rounded-lg p-3.5 border border-border/50 shadow-sm">
                        <ExpandableText text={getTranslation(product.usage_instructions, "en", "-")} />
                      </div>
                    </section>

                    <section className="space-y-2">
                      <h4 className="text-xs font-bold flex items-center gap-2 text-destructive/70 uppercase tracking-wider">
                        <ShieldAlert className="h-3.5 w-3.5" /> Safety Information
                      </h4>
                      <div className="bg-background rounded-lg p-3.5 border border-border/50 shadow-sm">
                        <ExpandableText text={getTranslation(product.safety_information, "en", "-")} />
                      </div>
                    </section>
                  </div>

                  {getLanguageLabel(product.nutritional_value, "") && (
                    <section className="space-y-2">
                      <h4 className="text-xs font-bold flex items-center gap-2 text-amber-600 uppercase tracking-wider">
                        <Zap className="h-3.5 w-3.5" /> Nutritional Value / Specs
                      </h4>
                      <div className="bg-background rounded-lg p-3.5 border border-border/50 shadow-sm">
                        <ExpandableText text={getTranslation(product.nutritional_value, "en")} />
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <Tabs
                  value={activeLanguage}
                  onValueChange={(value) => setActiveLanguage(value as ProductLanguageCode)}
                  className="w-full"
                >
                  <TabsList variant="line" size="sm" className="flex w-full overflow-x-auto justify-start border-b px-1.5 bg-muted/10 no-scrollbar whitespace-nowrap gap-0">
                    {PRODUCT_LANGUAGES_CONFIG.map((lang) => (
                      <TabsTrigger
                        key={lang.code}
                        value={lang.code}
                        className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:bg-primary/5"
                      >
                        {lang.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {PRODUCT_LANGUAGES_CONFIG.map((lang) => (
                    <TabsContent key={lang.code} value={lang.code} className="mt-0 p-4 space-y-5 animate-in fade-in-50 slide-in-from-bottom-1 duration-300">
                      <section className="space-y-2">
                        <h4 className="text-[13px] font-bold flex items-center gap-2 text-primary uppercase tracking-tight">
                          <Info className="h-4 w-4" /> Description
                        </h4>
                        <div className="bg-background rounded-lg p-3.5 border border-border/50 shadow-sm">
                          <ExpandableText text={getTranslation(product.description, lang.code)} />
                        </div>
                      </section>

                      <div className="grid grid-cols-1 gap-5">
                        <section className="space-y-2">
                          <h4 className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                            <Wrench className="h-3.5 w-3.5" /> Usage Instructions
                          </h4>
                          <div className="bg-background rounded-lg p-3.5 border border-border/50 shadow-sm">
                            <ExpandableText text={getTranslation(product.usage_instructions, lang.code, "-")} />
                          </div>
                        </section>

                        <section className="space-y-2">
                          <h4 className="text-xs font-bold flex items-center gap-2 text-destructive/70 uppercase tracking-wider">
                            <ShieldAlert className="h-3.5 w-3.5" /> Safety Information
                          </h4>
                          <div className="bg-background rounded-lg p-3.5 border border-border/50 shadow-sm">
                            <ExpandableText text={getTranslation(product.safety_information, lang.code, "-")} />
                          </div>
                        </section>
                      </div>

                      {getLanguageLabel(product.nutritional_value, "") && (
                        <section className="space-y-2">
                          <h4 className="text-xs font-bold flex items-center gap-2 text-amber-600 uppercase tracking-wider">
                            <Zap className="h-3.5 w-3.5" /> Nutritional Value / Specs
                          </h4>
                          <div className="bg-background rounded-lg p-3.5 border border-border/50 shadow-sm">
                            <ExpandableText text={getTranslation(product.nutritional_value, lang.code)} />
                          </div>
                        </section>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </div>
        </ScrollContainer>
      </DialogContent>
    </Dialog>
  );
}

