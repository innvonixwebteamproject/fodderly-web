import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus } from "lucide-react";
import { Container } from "@/components/common/container";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductCategoriesQuery } from "@/features/category-management/hooks";
import { useInventoriesInfiniteQuery } from "@/features/inventory/hooks/useInventory";
import { ProductForm } from "../components/ProductForm";
import { useCreateProductMutation } from "../hooks";
import { ProductFormValues } from "../types";
import { getLanguageLabel } from "../services/product.api";

export function CreateProductPage() {
  const navigate = useNavigate();
  const categoriesQuery = useProductCategoriesQuery({ page: 1, limit: 100, status: "active" });
  const inventoriesQuery = useInventoriesInfiniteQuery(undefined, undefined, "createdAt", "DESC");

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

  const createMutation = useCreateProductMutation(() => navigate("/admin/products"));

  const handleSubmit = (values: ProductFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Container className="pb-8">
      <Card variant="listing" className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <PackagePlus className="h-5 w-5 text-primary" />
            Create Product
          </CardTitle>
        </CardHeader>
        <div className="px-6">
          <ProductForm
            categoryOptions={categoryOptions}
            inventoryOptions={inventoryOptions}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/admin/products")}
            isLoading={createMutation.isPending}
          />
        </div>
      </Card>
    </Container>
  );
}
