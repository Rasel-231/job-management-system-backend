import { passwordSchema, AuthValidation } from "../src/modules/auth/auth.validation";

describe("password policy", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.parse("Str0ngPass")).toBe("Str0ngPass");
  });

  it("rejects a password shorter than 8 characters", () => {
    const res = passwordSchema.safeParse("Ab1cd");
    expect(res.success).toBe(false);
  });

  it("rejects a password without an uppercase letter", () => {
    expect(passwordSchema.safeParse("abcdefg1").success).toBe(false);
  });

  it("rejects a password without a lowercase letter", () => {
    expect(passwordSchema.safeParse("ABCDEF1").success).toBe(false);
  });

  it("rejects a password without a digit", () => {
    expect(passwordSchema.safeParse("Abcdefgh").success).toBe(false);
  });
});

describe("register validation", () => {
  it("accepts a valid registration payload", () => {
    const res = AuthValidation.registerValidationSchema.safeParse({
      body: {
        name: "Tahsin Rahman",
        email: "tahsin@example.com",
        password: "Str0ngPass",
      },
    });
    expect(res.success).toBe(true);
  });

  it("rejects a weak password in registration", () => {
    const res = AuthValidation.registerValidationSchema.safeParse({
      body: {
        name: "Tahsin Rahman",
        email: "tahsin@example.com",
        password: "weak",
      },
    });
    expect(res.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const res = AuthValidation.registerValidationSchema.safeParse({
      body: {
        name: "Tahsin Rahman",
        email: "not-an-email",
        password: "Str0ngPass",
      },
    });
    expect(res.success).toBe(false);
  });
});