import { ValidationDomainError } from "../errors/domain.errors";
import { InitialBalance, REQUIRED_INITIAL_BALANCE } from "./initial-balance";

describe("InitialBalance", () => {
  it("materializa a regra de negocio com o saldo inicial exigido", () => {
    expect(InitialBalance.create().toString()).toBe(REQUIRED_INITIAL_BALANCE);
  });

  it("recusa saldo inicial zero, negativo ou com mais de quatro casas decimais", () => {
    const invalidInputs = ["0", "-1", "100.00001"];

    for (const input of invalidInputs) {
      expect(() => InitialBalance.from(input)).toThrow(ValidationDomainError);
    }
  });

  it("recusa saldo inicial diferente da regra exigida pelo projeto", () => {
    const invalidInputs = ["99.9999", "100.0001", "150.0000"];

    for (const input of invalidInputs) {
      expect(() => InitialBalance.from(input)).toThrow(
        `Saldo inicial deve ser ${REQUIRED_INITIAL_BALANCE}.`,
      );
    }
  });

  it("recusa formatos invalidos antes da validacao de dominio", () => {
    for (const input of ["abc", "", " "]) {
      expect(() => InitialBalance.from(input)).toThrow(Error);
    }
  });
});
