import { ValidationDomainError } from "../../../../shared/domain/errors/domain.errors";
import { PlainPassword } from "./plain-password";

describe("PlainPassword", () => {
  it("aceita senha valida com maiuscula, numero e 8+ caracteres", () => {
    expect(new PlainPassword("Senha123").toString()).toBe("Senha123");
  });

  it("aceita senha com exatamente 8 caracteres", () => {
    expect(new PlainPassword("Abcde12!").toString()).toBe("Abcde12!");
  });

  it("recusa senha sem letra maiuscula", () => {
    expect(() => new PlainPassword("senha123")).toThrow(ValidationDomainError);
  });

  it("recusa senha sem numero", () => {
    expect(() => new PlainPassword("Senhasemnumero")).toThrow(ValidationDomainError);
  });

  it("recusa senha com menos de 8 caracteres", () => {
    expect(() => new PlainPassword("Ab1!")).toThrow(ValidationDomainError);
  });

  it("recusa string vazia", () => {
    expect(() => new PlainPassword("")).toThrow(ValidationDomainError);
  });
});
