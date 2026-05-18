import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, PencilLine } from "lucide-react";
import { Container } from "@/components/common/container";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductCategoriesQuery } from "@/features/category-management/hooks";
import { useInventoriesInfiniteQuery } from "@/features/inventory/hooks/useInventory";
import { ProductForm } from "../components/ProductForm";
import {
  useDeleteProductImageMutation,
  useProductQuery,
  useUpdateProductMutation,
} from "../hooks";
import { ProductFormValues } from "../types";
import { getLanguageLabel } from "../services/product.api";

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const productQuery = useProductQuery(id);
  const categoriesQuery = useProductCategoriesQuery({ page: 1, limit: 100, status: "active" });
  const inventoriesQuery = useInventoriesInfiniteQuery(undefined, undefined, "createdAt", "DESC");
  const updateMutation = useUpdateProductMutation(() => navigate("/admin/products"));
  const deleteImageMutation = useDeleteProductImageMutation();

  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data?.data || []).map((item) => ({
        id: item.id,
        label: getLanguageLabel(item.name, "Category"),
      })),
    [categoriesQuery.data?.data],
  );

  const inventoryOptions = useMemo(
    () =>
      (inventoriesQuery.data?.pages.flatMap((page) => page.data) || []).map((item) => ({
        id: item.id,
        label: item.name,
      })),
    [inventoriesQuery.data?.pages],
  );

  const handleSubmit = (values: ProductFormValues) => {
    if (!id) return;
    updateMutation.mutate({ id, values });
  };

  if (productQuery.isLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  if (!productQuery.data) {
    return (
      <Container className="py-8">
        <div className="text-sm text-muted-foreground">Product not found.</div>
      </Container>
    );
  }

  return (
    <Container className="pb-8">
      <Card variant="listing" className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <PencilLine className="h-5 w-5 text-primary" />
            Edit Product
          </CardTitle>
        </CardHeader>
        <div className="px-6">
          <ProductForm
            initialData={productQuery.data}
            categoryOptions={categoryOptions}
            inventoryOptions={inventoryOptions}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/admin/products")}
            onDeleteImage={(imageId) => deleteImageMutation.mutate(imageId)}
            deletingImageId={null}
            isLoading={updateMutation.isPending}
          />
        </div>
      </Card>
    </Container>
  );
}
