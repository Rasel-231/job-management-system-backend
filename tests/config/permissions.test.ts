import { Permission, RolePermissions, hasPermission } from "../../src/config/permissions";

describe("permissions (RBAC)", () => {
  it("every role listed in RolePermissions maps to valid Permission values", () => {
    const allowed = new Set(Object.values(Permission));
    Object.values(RolePermissions).forEach((perms) => {
      perms.forEach((p) => expect(allowed.has(p)).toBe(true));
    });
  });

  it("finds ADMIN permissions", () => {
    expect(hasPermission("ADMIN", Permission.TRANSACTION_VIEW_ALL)).toBe(true);
  });

  it("denies USER permissions it does not own", () => {
    expect(hasPermission("USER", Permission.TRANSACTION_VIEW_ALL)).toBe(false);
    expect(hasPermission("USER", Permission.USER_UPDATE_STATUS)).toBe(false);
  });

  it("denies unknown roles", () => {
    expect(hasPermission("SUPERADMIN", Permission.JOB_VIEW)).toBe(false);
  });
});