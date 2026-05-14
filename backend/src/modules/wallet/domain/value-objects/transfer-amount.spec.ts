import Decimal from "decimal.js";
import { ValidationDomainError } from "../../../../shared/domain/errors/domain.errors";
import { TransferAmount } from "./transfer-amount";

describe("TransferAmount", () => {
  it("normaliza o valor em quatro casas", () => {
    const amount = new TransferAmount("10");

    expect(amount.toString()).toBe("10.0000");
  });

  it("preserva o valor decimal para operacoes numericas reais", () => {
    const amount = new TransferAmount("10.5");

    expect(amount.toString()).toBe("10.5000");
    expect(amount.toDecimal().equals(new Decimal("10.5000"))).toBe(true);
  });

  it("recusa zero", () => {
    expect(() => new TransferAmount("0")).toThrow(ValidationDomainError);
  });

  it("recusa valor negativo", () => {
    expect(() => new TransferAmount("-1")).toThrow(ValidationDomainError);
  });

  it("recusa mais de quatro casas decimais", () => {
    expect(() => new TransferAmount("10.12345")).toThrow(ValidationDomainError);
  });

  it("recusa formatos invalidos antes da validacao de dominio", () => {
    for (const input of ["abc", "", " "]) {
      expect(() => new TransferAmount(input)).toThrow(Error);
    }
  });
});
