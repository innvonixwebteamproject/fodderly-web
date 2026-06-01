import {
  InfiniteSearchableSelect,
  InfiniteSearchableSelectProps,
} from "@/components/ui/infinite-searchable-select";
import { getStates } from "@/features/master-management/states-management/services/state.api";
import { getDistricts } from "@/features/master-management/districts-management/services/district.api";
import { getTalukas } from "@/features/master-management/talukas-management/services/taluka.api";
import { getVillages } from "@/features/master-management/villages-management/services/village.api";
import { getProductCategories, getInventoryCategories } from "@/features/category-management/services/category.api";
import { getPartners } from "@/features/partner-management/services";
import { getFarmers, getFoddermenOptions } from "@/features/farmer-management/services";
import { StateItem } from "@/features/master-management/states-management/types";
import { DistrictItem } from "@/features/master-management/districts-management/types";
import { TalukaItem } from "@/features/master-management/talukas-management/types";
import { VillageItem } from "@/features/master-management/villages-management/types";
import { ProductCategoryItem, InventoryCategoryItem } from "@/features/category-management/types";
import { IPartner } from "@/features/partner-management/types";
import { FoddermanOptionRecord, IFarmer } from "@/features/farmer-management/types/farmer.types";

// Helper to safely extract names considering translations
type TranslatedNameItem = {
  translations?: { en?: string };
  name?: string | { en?: string };
};

const getTranslatedName = (item: TranslatedNameItem) => {
  if (item.translations?.en) return item.translations.en;
  if (typeof item.name === "string") return item.name;
  return item.name?.en || "-";
};

type BaseProps = Omit<
  InfiniteSearchableSelectProps<TranslatedNameItem>,
  "queryKeyPrefix" | "queryFn" | "getItemId" | "getItemLabel"
>;

export function StateSelect(props: BaseProps) {
  return (
    <InfiniteSearchableSelect<StateItem>
      queryKeyPrefix={["states"]}
      queryFn={({ page, search }) =>
        getStates(page, 10, search || undefined, "name", "ASC")
      }
      getItemId={(item) => item.id}
      getItemLabel={getTranslatedName}
      {...props}
    />
  );
}

export function DistrictSelect(props: BaseProps & { stateId?: string }) {
  return (
    <InfiniteSearchableSelect<DistrictItem>
      queryKeyPrefix={["districts", props.stateId || ""]}
      queryFn={({ page, search }) =>
        getDistricts(page, 10, search || undefined, props.stateId, "name", "ASC")
      }
      getItemId={(item) => item.id}
      getItemLabel={getTranslatedName}
      {...props}
    />
  );
}

type DistrictMultiSelectProps = Omit<
  InfiniteSearchableSelectProps<DistrictItem>,
  "queryKeyPrefix" | "queryFn" | "getItemId" | "getItemLabel" | "multiple"
> & {
  stateId?: string;
  selectedOptionLabels?: Record<string, string>;
};

export function DistrictMultiSelect({
  stateId,
  selectedOptionLabels,
  ...props
}: DistrictMultiSelectProps) {
  return (
    <InfiniteSearchableSelect<DistrictItem>
      multiple
      queryKeyPrefix={["districts", stateId || "", "multi"]}
      queryFn={({ page, search }) =>
        getDistricts(page, 10, search || undefined, stateId, "name", "ASC")
      }
      getItemId={(item) => item.id}
      getItemLabel={getTranslatedName}
      selectedOptionLabels={selectedOptionLabels}
      {...props}
    />
  );
}

export function TalukaSelect(props: BaseProps & { stateId?: string; districtId?: string }) {
  return (
    <InfiniteSearchableSelect<TalukaItem>
      queryKeyPrefix={["talukas", props.stateId || "", props.districtId || ""]}
      queryFn={({ page, search }) =>
        // getTalukas signature: (page, limit, search, districtId, stateId, sortBy, sortOrder)
        getTalukas(page, 10, search || undefined, props.districtId, props.stateId, "name", "ASC")
      }
      getItemId={(item) => item.id}
      getItemLabel={getTranslatedName}
      {...props}
    />
  );
}

export function VillageSelect(props: BaseProps & { stateId?: string; districtId?: string; talukaId?: string }) {
  return (
    <InfiniteSearchableSelect<VillageItem>
      queryKeyPrefix={["villages", props.stateId || "", props.districtId || "", props.talukaId || ""]}
      queryFn={({ page, search }) =>
        // getVillages signature: (page, limit, search, talukaId, districtId, stateId, sortBy, sortOrder)
        getVillages(page, 10, search || undefined, props.talukaId, props.districtId, props.stateId, "name", "ASC")
      }
      getItemId={(item) => item.id}
      getItemLabel={getTranslatedName}
      {...props}
    />
  );
}

type VillageMultiSelectProps = Omit<
  InfiniteSearchableSelectProps<VillageItem>,
  "queryKeyPrefix" | "queryFn" | "getItemId" | "getItemLabel" | "multiple"
> & {
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  selectedOptionLabels?: Record<string, string>;
};

export function VillageMultiSelect({
  stateId,
  districtId,
  talukaId,
  selectedOptionLabels,
  ...props
}: VillageMultiSelectProps) {
  return (
    <InfiniteSearchableSelect<VillageItem>
      multiple
      queryKeyPrefix={["villages", stateId || "", districtId || "", talukaId || "", "multi"]}
      queryFn={({ page, search }) =>
        getVillages(page, 10, search || undefined, talukaId, districtId, stateId, "name", "ASC")
      }
      getItemId={(item) => item.id}
      getItemLabel={getTranslatedName}
      selectedOptionLabels={selectedOptionLabels}
      {...props}
    />
  );
}

type PartnerSelectProps = Omit<
  InfiniteSearchableSelectProps<IPartner>,
  "queryKeyPrefix" | "queryFn" | "getItemId" | "getItemLabel"
> & {
  districtId?: string;
  status?: "active" | "inactive";
};

export function PartnerSelect({
  districtId,
  status = "active",
  ...props
}: PartnerSelectProps) {
  return (
    <InfiniteSearchableSelect<IPartner>
      queryKeyPrefix={["partners", status || "", districtId || ""]}
      queryFn={({ page, search }) =>
        getPartners(
          page,
          10,
          search || undefined,
          status,
          districtId || undefined,
          "name",
          "ASC",
        )
      }
      getItemId={(item) => item.id}
      getItemLabel={(item) => {
        const name =
          item.fullName ||
          `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
          "-";
        return item.phone ? `${name} (${item.phone})` : name;
      }}
      {...props}
    />
  );
}

type FoddermanSelectProps = Omit<
  InfiniteSearchableSelectProps<FoddermanOptionRecord>,
  "queryKeyPrefix" | "queryFn" | "getItemId" | "getItemLabel"
> & {
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
  isActive?: boolean;
};

export function FoddermanSelect({
  stateId,
  districtId,
  talukaId,
  villageId,
  isActive = true,
  ...props
}: FoddermanSelectProps) {
  return (
    <InfiniteSearchableSelect<FoddermanOptionRecord>
      queryKeyPrefix={[
        "foddermen-options",
        stateId || "",
        districtId || "",
        talukaId || "",
        villageId || "",
        String(isActive),
      ]}
      queryFn={({ page, search }) =>
        getFoddermenOptions({
          page,
          limit: 10,
          stateId,
          districtId,
          talukaId,
          villageId,
          search: search || undefined,
          isActive,
        })
      }
      getItemId={(item) => item.id}
      getItemLabel={(item) =>
        item.mobileNumber
          ? `${item.fullName} (${item.mobileNumber})`
          : item.fullName
      }
      {...props}
    />
  );
}

type FarmerSelectProps = Omit<
  InfiniteSearchableSelectProps<IFarmer>,
  "queryKeyPrefix" | "queryFn" | "getItemId" | "getItemLabel"
> & {
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
  foddermanId?: string;
  status?: "active" | "inactive";
};

export function FarmerSelect({
  stateId,
  districtId,
  talukaId,
  villageId,
  foddermanId,
  status = "active",
  ...props
}: FarmerSelectProps) {
  return (
    <InfiniteSearchableSelect<IFarmer>
      queryKeyPrefix={[
        "farmers-options",
        stateId || "",
        districtId || "",
        talukaId || "",
        villageId || "",
        foddermanId || "",
        status || "",
      ]}
      queryFn={({ page, search }) =>
        getFarmers(page, 10, search || undefined, {
          stateId,
          districtId,
          talukaId,
          villageId,
          foddermanId,
          status,
        })
      }
      getItemId={(item) => item.id}
      getItemLabel={(item) =>
        item.mobile ? `${item.fullName} (${item.mobile})` : item.fullName
      }
      {...props}
    />
  );
}

export function CategorySelect(props: BaseProps) {
  return (
    <InfiniteSearchableSelect<ProductCategoryItem>
      queryKeyPrefix={["categories"]}
      queryFn={({ page, search }) =>
        getProductCategories({ page, limit: 10, search: search || undefined, sortBy: "name", sortOrder: "ASC" })
      }
      getItemId={(item) => item.id}
      getItemLabel={getTranslatedName}
      {...props}
    />
  );
}

export function InventoryCategorySelect(props: BaseProps) {
  return (
    <InfiniteSearchableSelect<InventoryCategoryItem>
      queryKeyPrefix={["inventory-categories"]}
      queryFn={({ page, search }) =>
        getInventoryCategories({ page, limit: 10, search: search || undefined, sortBy: "name", sortOrder: "ASC" })
      }
      getItemId={(item) => item.id}
      getItemLabel={getTranslatedName}
      {...props}
    />
  );
}
