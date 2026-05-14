import { Injectable } from "@nestjs/common";
import { Account } from "../../../../modules/wallet/domain/account";
import type { AccountRepository } from "../../../../modules/wallet/domain/account.repository";
import { InMemoryStore } from "../in-memory-store";

@Injectable()
export class InMemoryAccountRepository implements AccountRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findById(id: string): Promise<Account | null> {
    const stored = this.store.accounts.get(id);
    if (!stored) return null;
    return Account.reconstitute(stored.id, stored.balance);
  }
}
