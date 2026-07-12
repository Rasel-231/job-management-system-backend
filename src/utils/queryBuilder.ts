// Generic search + filter query builder for Prisma `where` clauses.
// Keeps controllers/services free of ad-hoc `Object.entries` filter logic.

export type TFilterCondition = Record<string, unknown>;

type TBuildQueryParams<TFilters extends Record<string, unknown>> = {
  searchTerm?: string;
  searchableFields: string[];
  filters: TFilters;
};

export const buildWhereClause = <TFilters extends Record<string, unknown>>({
  searchTerm,
  searchableFields,
  filters,
}: TBuildQueryParams<TFilters>): { AND: TFilterCondition[] } => {
  const andConditions: TFilterCondition[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: searchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  const filterEntries = Object.entries(filters).filter(([, value]) => value !== undefined);

  if (filterEntries.length > 0) {
    andConditions.push({
      AND: filterEntries.map(([field, value]) => ({ [field]: value })),
    });
  }

  return { AND: andConditions };
};
