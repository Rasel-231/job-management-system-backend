import { buildMeta, calculatePagination } from "../../src/utils/paginationHelper";

describe("calculatePagination", () => {
  it("provides sensible defaults", () => {
    expect(calculatePagination({})).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  });

  it("coerces numeric string inputs", () => {
    const result = calculatePagination({ page: "3", limit: "5" });
    expect(result).toMatchObject({ page: 3, limit: 5, skip: 10 });
  });

  it("ignores invalid (non-positive or NaN) values", () => {
    expect(calculatePagination({ page: "-2", limit: "abc" }).page).toBe(1);
    expect(calculatePagination({ page: "-2", limit: "abc" }).limit).toBe(10);
  });

  it("normalizes sortOrder to asc/desc", () => {
    expect(calculatePagination({ sortOrder: "asc" }).sortOrder).toBe("asc");
    expect(calculatePagination({ sortOrder: "weird" }).sortOrder).toBe("desc");
  });
});

describe("buildMeta", () => {
  it("computes totalPages", () => {
    expect(buildMeta(2, 10, 25).totalPages).toBe(3);
  });

  it("never reports zero totalPages for a valid page", () => {
    expect(buildMeta(1, 10, 0).totalPages).toBe(1);
  });
});