import type { SortingState } from "@tanstack/react-table";

export type ApiSortOrder = "ASC" | "DESC";

type ApiSortConfig<TSortBy extends string> = {
  sorting: SortingState;
  defaultSortBy: TSortBy;
  columnToSortByMap?: Partial<Record<string, TSortBy>>;
};

export const getApiSortParams = <TSortBy extends string>({
  sorting,
  defaultSortBy,
  columnToSortByMap,
}: ApiSortConfig<TSortBy>): { sortBy: TSortBy; sortOrder: ApiSortOrder } => {
  const primarySort = sorting[0];

  if (!primarySort?.id) {
    return { sortBy: defaultSortBy, sortOrder: "DESC" };
  }

  const mappedSortBy =
    (columnToSortByMap?.[primarySort.id] as TSortBy | undefined) ||
    (primarySort.id as TSortBy);

  return {
    sortBy: mappedSortBy,
    sortOrder: primarySort.desc ? "DESC" : "ASC",
  };
};

/** When the table has no active sort, omit both params (backend applies its own default). */
export const getApiSortParamsWhenSorted = <TSortBy extends string>({
  sorting,
  columnToSortByMap,
}: Omit<ApiSortConfig<TSortBy>, "defaultSortBy">): {
  sortBy: TSortBy | undefined;
  sortOrder: ApiSortOrder | undefined;
} => {
  const primarySort = sorting[0];

  if (!primarySort?.id) {
    return { sortBy: undefined, sortOrder: undefined };
  }

  const mappedSortBy =
    (columnToSortByMap?.[primarySort.id] as TSortBy | undefined) ||
    (primarySort.id as TSortBy);

  return {
    sortBy: mappedSortBy,
    sortOrder: primarySort.desc ? "DESC" : "ASC",
  };
};
