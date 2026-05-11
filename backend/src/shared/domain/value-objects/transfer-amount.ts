import Decimal from "decimal.js";
import { ValidationDomainError } from "../errors/domain.errors";

export class TransferAmount {
  private readonly value: Decimal;

  constructor(input: Decimal.Value) {
    const decimal = new Decimal(input);
    if (decimal.lte(0)) {
      throw new ValidationDomainError("O valor deve ser maior que zero.");
    }
    if ((decimal.decimalPlaces() ?? 0) > 4) {
      throw new ValidationDomainError(
        "O valor deve ter no máximo 4 casas decimais.",
      );
    }
    this.value = decimal.toDecimalPlaces(4);
  }

  toString(): string {
    return this.value.toFixed(4);
  }

  toDecimal(): Decimal {
    return this.value;
  }
}
