import { ValidationDomainError } from "../errors/domain.errors";
import { formatMoneyForDisplay } from "./money-format";
import { Money } from "./money";

describe("Money", () => {
  it("normaliza o valor em quatro casas", () => {
    const money = new Money("10");

    expect(money.toString()).toBe("10.0000");
  });

  it("normaliza valores com menos de quatro casas sem perder precisao numerica", () => {
    const money = new Money("10.5");

    expect(money.toString()).toBe("10.5000");
    expect(money.greaterThan("10.4999")).toBe(true);
  });

  it("mantem comparacao numerica consistente", () => {
    const money = new Money("10.5000");

    expect(money.greaterThan("10.49")).toBe(true);
    expect(money.greaterThan("10.5000")).toBe(false);
  });

  it("recusa zero", () => {
    expect(() => new Money("0")).toThrow(ValidationDomainError);
  });

  it("recusa valor negativo", () => {
    expect(() => new Money("-1")).toThrow(ValidationDomainError);
  });

  it("recusa mais de quatro casas decimais", () => {
    expect(() => new Money("10.12345")).toThrow(ValidationDomainError);
  });

  it("recusa formatos invalidos antes da validacao de dominio", () => {
    for (const input of ["abc", "", " "]) {
      expect(() => new Money(input)).toThrow(Error);
    }
  });

  it("aplica arredondamento bancario na apresentacao", () => {
    expect(formatMoneyForDisplay("2.3449")).toBe("2.34");
    expect(formatMoneyForDisplay("2.3460")).toBe("2.35");
    expect(formatMoneyForDisplay("2.3450")).toBe("2.34");
    expect(formatMoneyForDisplay("2.3550")).toBe("2.36");
    expect(formatMoneyForDisplay("-2.3550")).toBe("-2.36");
  });
});
