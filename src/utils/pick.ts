// Generic, strictly-typed helper to pluck a known subset of keys from an
// object — used to safely lift query params (filters) without spreading
// req.query (untyped) directly into a Prisma `where` clause.
const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Partial<T> => {
  const result: Partial<T> = {};

  keys.forEach((key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });

  return result;
};

export default pick;
