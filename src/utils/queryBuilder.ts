import { TBuildQueryParams, TFilterCondition } from "../types/apiResponse";

export const buildWhereClause = <TFilters extends Record<string, unknown>>({
  searchTerm,
  searchableFields = [],
  filters = {} as TFilters,
  searchMode = "insensitive",
}: TBuildQueryParams<TFilters>): { AND: TFilterCondition[] } | Record<string, never> => {
  const andConditions: TFilterCondition[] = [];

  const trimmedSearch = searchTerm?.trim();
  if (trimmedSearch && searchableFields.length > 0) {
    andConditions.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: trimmedSearch,
          ...(searchMode === "insensitive" ? { mode: "insensitive" } : {}),
        },
      })),
    });
  }

  const filterEntries = Object.entries(filters).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      !(typeof value === "string" && value.trim() === "")
  );

  filterEntries.forEach(([field, value]) => {
    andConditions.push({ [field]: value });
  });

  if (andConditions.length === 0) {
    return {};
  }

  return { AND: andConditions };
};