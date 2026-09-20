import { buildWhereClause } from "../../src/utils/queryBuilder";

describe("buildWhereClause", () => {
  it("builds empty AND array when nothing provided", () => {
    expect(buildWhereClause({ searchableFields: ["title"], filters: {} })).toEqual({ AND: [] });
  });

  it("maps searchTerm onto an OR of searchable fields", () => {
    const where = buildWhereClause({
      searchTerm: "web dev",
      searchableFields: ["title", "description"],
      filters: {},
    });
    expect(where.AND[0]).toEqual({
      OR: [
        { title: { contains: "web dev", mode: "insensitive" } },
        { description: { contains: "web dev", mode: "insensitive" } },
      ],
    });
  });

  it("includes only defined filter values", () => {
    const where = buildWhereClause({
      searchTerm: undefined,
      searchableFields: ["title"],
      filters: { category: "dev", reward: undefined },
    });
    expect(where.AND[0]).toEqual({ AND: [{ category: "dev" }] });
  });
});