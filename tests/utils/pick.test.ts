import pick from "../../src/utils/pick";

type TSample = { a: number; b: number };

describe("pick", () => {
  it("plucks only the requested keys", () => {
    const source: TSample = { a: 1, b: 2 };
    expect(pick(source, ["a"])).toEqual({ a: 1 });
  });

  it("drops undefined values", () => {
    const source: Partial<TSample> & TSample = { a: undefined as unknown as number, b: 2 };
    expect(pick(source, ["a", "b"])).toEqual({ b: 2 });
  });

  it("returns empty object when nothing matches", () => {
    const source: TSample = { a: 1, b: 2 };
    expect(pick(source, [])).toEqual({});
  });
});