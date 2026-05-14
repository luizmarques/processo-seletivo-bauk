import { ValidationDomainError } from "../errors/domain.errors";
import { AccountId } from "../../../modules/wallet/domain/value-objects/account-id";
import { UserId } from "./user-id";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const OTHER_UUID = "22222222-2222-4222-8222-222222222222";

describe("UuidValueObject", () => {
  it("aceita UUID v4 valido e preserva o valor", () => {
    expect(new AccountId(VALID_UUID).toString()).toBe(VALID_UUID);
  });

  it("recusa string que nao e UUID", () => {
    expect(() => new AccountId("nao-e-uuid")).toThrow(ValidationDomainError);
    expect(() => new UserId("123")).toThrow(ValidationDomainError);
  });

  it("recusa string vazia", () => {
    expect(() => new AccountId("")).toThrow(ValidationDomainError);
  });

  it("equals retorna true para o mesmo UUID", () => {
    expect(new AccountId(VALID_UUID).equals(new AccountId(VALID_UUID))).toBe(true);
  });

  it("equals retorna false para UUIDs diferentes", () => {
    expect(new AccountId(VALID_UUID).equals(new AccountId(OTHER_UUID))).toBe(false);
  });

  it("equals compara valor independente do subtipo concreto", () => {
    const accountId = new AccountId(VALID_UUID);
    const userId = new UserId(VALID_UUID);
    expect(accountId.equals(userId)).toBe(true);
  });
});

describe("AccountId", () => {
  it("recusa string que nao e UUID com label correto", () => {
    expect(() => new AccountId("invalid")).toThrow("AccountId inválido.");
  });
});

describe("UserId", () => {
  it("recusa string que nao e UUID com label correto", () => {
    expect(() => new UserId("invalid")).toThrow("UserId inválido.");
  });
});
