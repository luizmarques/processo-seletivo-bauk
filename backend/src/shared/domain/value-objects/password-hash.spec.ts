import { ValidationDomainError } from "../errors/domain.errors";
import { PasswordHash } from "./password-hash";

const VALID_HASH_2A = "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e";
const VALID_HASH_2B = "$2b$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e";
const VALID_HASH_2Y = "$2y$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e";

describe("PasswordHash", () => {
  it("aceita hash bcrypt variante 2a", () => {
    expect(new PasswordHash(VALID_HASH_2A).toString()).toBe(VALID_HASH_2A);
  });

  it("aceita hash bcrypt variante 2b", () => {
    expect(new PasswordHash(VALID_HASH_2B).toString()).toBe(VALID_HASH_2B);
  });

  it("aceita hash bcrypt variante 2y", () => {
    expect(new PasswordHash(VALID_HASH_2Y).toString()).toBe(VALID_HASH_2Y);
  });

  it("recusa string sem formato bcrypt", () => {
    expect(() => new PasswordHash("hash-invalido")).toThrow(ValidationDomainError);
  });

  it("recusa string vazia", () => {
    expect(() => new PasswordHash("")).toThrow(ValidationDomainError);
  });

  it("recusa hash com prefixo inválido", () => {
    expect(() => new PasswordHash("$2c$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e")).toThrow(
      ValidationDomainError,
    );
  });
});
