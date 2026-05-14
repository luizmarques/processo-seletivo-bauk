import { ValidationDomainError } from "../../../../shared/domain/errors/domain.errors";
import { Balance } from "./balance";
import { TransferAmount } from "./transfer-amount";

describe("Balance", () => {
  it("aceita zero como saldo valido", () => {
    expect(new Balance("0").toString()).toBe("0.0000");
  });

  it("normaliza para quatro casas decimais", () => {
    expect(new Balance("100").toString()).toBe("100.0000");
    expect(new Balance("100.5").toString()).toBe("100.5000");
  });

  it("recusa saldo negativo", () => {
    expect(() => new Balance("-0.0001")).toThrow(ValidationDomainError);
    expect(() => new Balance("-1")).toThrow(ValidationDomainError);
  });

  it("recusa mais de quatro casas decimais", () => {
    expect(() => new Balance("1.00001")).toThrow(ValidationDomainError);
  });

  it("debita corretamente e retorna novo Balance", () => {
    const result = new Balance("100.0000").debit(new TransferAmount("10.5000"));
    expect(result.toString()).toBe("89.5000");
  });

  it("debito exato ate zero e valido", () => {
    const result = new Balance("10.0000").debit(new TransferAmount("10.0000"));
    expect(result.toString()).toBe("0.0000");
  });

  it("lanca ValidationDomainError quando saldo insuficiente para debito", () => {
    expect(() =>
      new Balance("5.0000").debit(new TransferAmount("10.0000")),
    ).toThrow(ValidationDomainError);
  });

  it("credita corretamente e retorna novo Balance", () => {
    const result = new Balance("50.0000").credit(new TransferAmount("25.2500"));
    expect(result.toString()).toBe("75.2500");
  });

  it("ensureCanDebit nao lanca quando saldo e suficiente", () => {
    expect(() =>
      new Balance("100.0000").ensureCanDebit(new TransferAmount("100.0000")),
    ).not.toThrow();
  });

  it("ensureCanDebit lanca quando saldo e insuficiente", () => {
    expect(() =>
      new Balance("5.0000").ensureCanDebit(new TransferAmount("5.0001")),
    ).toThrow(ValidationDomainError);
  });
});
