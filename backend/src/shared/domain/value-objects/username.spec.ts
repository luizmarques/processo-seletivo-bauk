import { ResourceConflictError, ValidationDomainError } from "../errors/domain.errors";
import { Username } from "./username";

describe("Username", () => {
  it("normaliza trim e lowercase", () => {
    expect(new Username(" JaneDoe ").toString()).toBe("janedoe");
  });

  it("preserva username ja normalizado", () => {
    expect(new Username("janedoe").toString()).toBe("janedoe");
  });

  it("recusa username com menos de 3 caracteres apos normalizacao", () => {
    expect(() => new Username("ab")).toThrow(ValidationDomainError);
    expect(() => new Username("  ab  ")).toThrow(ValidationDomainError);
  });

  it("aceita username com exatamente 3 caracteres", () => {
    expect(new Username("abc").toString()).toBe("abc");
  });

  it("equals retorna true para usernames equivalentes independente de casing", () => {
    const a = new Username("JaneDoe");
    const b = new Username("janedoe");
    expect(a.equals(b)).toBe(true);
  });

  it("equals retorna false para usernames distintos", () => {
    expect(new Username("janedoe").equals(new Username("johndoe"))).toBe(false);
  });

  it("ensureDifferentFrom lanca ResourceConflictError quando usernames sao iguais", () => {
    const username = new Username("janedoe");
    expect(() => username.ensureDifferentFrom(new Username("JANEDOE"))).toThrow(
      ResourceConflictError,
    );
  });

  it("ensureDifferentFrom nao lanca quando usernames sao distintos", () => {
    const username = new Username("janedoe");
    expect(() => username.ensureDifferentFrom(new Username("johndoe"))).not.toThrow();
  });
});
