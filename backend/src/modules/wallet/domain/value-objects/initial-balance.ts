import type Decimal from "decimal.js";
import { ValidationDomainError } from "../../../../shared/domain/errors/domain.errors";
import { Balance } from "./balance";

export const REQUIRED_INITIAL_BALANCE = "100.0000";

export class InitialBalance extends Balance {
  private constructor(input: Decimal.Value) {
    super(input);

    if (this.toString() !== REQUIRED_INITIAL_BALANCE) {
      throw new ValidationDomainError(
        `Saldo inicial deve ser ${REQUIRED_INITIAL_BALANCE}.`,
      );
    }
  }

  static create(): InitialBalance {
    return new InitialBalance(REQUIRED_INITIAL_BALANCE);
  }

  static from(input: Decimal.Value): InitialBalance {
    return new InitialBalance(input);
  }
}
