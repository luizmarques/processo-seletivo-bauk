import Decimal from "decimal.js";
import { ValidationDomainError } from "../errors/domain.errors";
import { TransferAmount } from "./transfer-amount";

export class Balance {
  private readonly value: Decimal;

  constructor(input: Decimal.Value) {
    const decimal = new Decimal(input);
    if (decimal.lt(0)) {
      throw new ValidationDomainError("Saldo não pode ser negativo.");
    }
    if (decimal.decimalPlaces() > 4) {
      throw new ValidationDomainError(
        "Saldo deve ter no máximo 4 casas decimais.",
      );
    }
    this.value = decimal.toDecimalPlaces(4);
  }

  toString(): string {
    return this.value.toFixed(4);
  }

  ensureCanDebit(amount: TransferAmount): void {
    if (this.value.lessThan(amount.toDecimal())) {
      throw new ValidationDomainError(
        "Saldo insuficiente para a transferência.",
      );
    }
  }

  debit(amount: TransferAmount): Balance {
    this.ensureCanDebit(amount);
    return new Balance(this.value.minus(amount.toDecimal()));
  }

  credit(amount: TransferAmount): Balance {
    return new Balance(this.value.plus(amount.toDecimal()));
  }
}
