import { Injectable } from "@nestjs/common";
import type { User } from "../../../modules/users/domain/user";

export interface StoredAccount {
  id: string;
  balance: string;
  userId: string;
}

export interface StoredTransaction {
  id: string;
  debitedAccountId: string;
  creditedAccountId: string;
  value: string;
  createdAt: Date;
}

@Injectable()
export class InMemoryStore {
  readonly users = new Map<string, User>();
  readonly usernameIndex = new Map<string, string>();
  readonly accounts = new Map<string, StoredAccount>();
  readonly transactions: StoredTransaction[] = [];

  reset(): void {
    this.users.clear();
    this.usernameIndex.clear();
    this.accounts.clear();
    this.transactions.splice(0);
  }
}
