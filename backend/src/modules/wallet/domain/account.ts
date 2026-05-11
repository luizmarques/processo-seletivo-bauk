import { Balance } from "../../../shared/domain/value-objects/balance";
import type { TransferAmount } from "../../../shared/domain/value-objects/transfer-amount";

export class Account {
  constructor(
    readonly id: string,
    readonly balance: string,
  ) {}

  ensureCanDebit(amount: TransferAmount): void {
    new Balance(this.balance).ensureCanDebit(amount);
  }
}
