import { Balance } from "./value-objects/balance";
import type { TransferAmount } from "./value-objects/transfer-amount";

export class Account {
  private _balance: Balance;

  private constructor(readonly id: string, balance: Balance) {
    this._balance = balance;
  }

  static reconstitute(id: string, rawBalance: string): Account {
    return new Account(id, new Balance(rawBalance));
  }

  get balance(): Balance {
    return this._balance;
  }

  debit(amount: TransferAmount): void {
    this._balance = this._balance.debit(amount);
  }

  credit(amount: TransferAmount): void {
    this._balance = this._balance.credit(amount);
  }
}
