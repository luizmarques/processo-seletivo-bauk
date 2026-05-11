import { IdempotencyKey } from "./idempotency-key";

describe("IdempotencyKey", () => {
  it("normaliza para lowercase", () => {
    expect(IdempotencyKey.fromRaw("JANEDOE:JOHNDOE:10.0000:123456").toString()).toBe(
      "janedoe:johndoe:10.0000:123456",
    );
  });

  it("remove espacos nas bordas", () => {
    expect(IdempotencyKey.fromRaw("  abc-key  ").toString()).toBe("abc-key");
  });

  it("preserva chave ja normalizada", () => {
    const key = "janedoe:johndoe:10.0000:123456";
    expect(IdempotencyKey.fromRaw(key).toString()).toBe(key);
  });

  it("trata a mesma chave com casing diferente como equivalente", () => {
    const lower = IdempotencyKey.fromRaw("abc-123").toString();
    const upper = IdempotencyKey.fromRaw("ABC-123").toString();
    expect(lower).toBe(upper);
  });
});
