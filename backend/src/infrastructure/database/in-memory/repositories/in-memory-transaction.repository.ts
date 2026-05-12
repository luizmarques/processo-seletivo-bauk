import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { TransactionRecord } from "../../../../modules/wallet/domain/transaction-record";
import { ResourceNotFoundError } from "../../../../shared/domain/errors/domain.errors";
import { Balance } from "../../../../shared/domain/value-objects/balance";
import { TransferAmount } from "../../../../shared/domain/value-objects/transfer-amount";
import type {
  PaginatedTransactionRecords,
  TransactionFilters,
  TransactionRepository,
} from "../../../../modules/wallet/domain/transaction.repository";
import { InMemoryStore } from "../in-memory-store";

@Injectable()
export class InMemoryTransactionRepository implements TransactionRepository {
  constructor(private readonly store: InMemoryStore) {}

  async executeTransfer(input: {
    senderAccountId: string;
    recipientAccountId: string;
    value: string;
  }): Promise<{ id: string; value: string }> {
    const senderStored = this.store.accounts.get(input.senderAccountId);
    const recipientStored = this.store.accounts.get(input.recipientAccountId);

    if (!senderStored || !recipientStored) {
      throw new ResourceNotFoundError("Conta não encontrada.");
    }

    const amount = new TransferAmount(input.value);
    senderStored.balance = new Balance(senderStored.balance).debit(amount).toString();
    recipientStored.balance = new Balance(recipientStored.balance).credit(amount).toString();

    const id = randomUUID();
    this.store.transactions.push({
      id,
      debitedAccountId: input.senderAccountId,
      creditedAccountId: input.recipientAccountId,
      value: input.value,
      createdAt: new Date(),
    });

    return { id, value: input.value };
  }

  async listByAccount(filters: TransactionFilters): Promise<PaginatedTransactionRecords> {
    let results = this.store.transactions.filter((t) => {
      if (filters.type === "cash-in") return t.creditedAccountId === filters.accountId;
      if (filters.type === "cash-out") return t.debitedAccountId === filters.accountId;
      return (
        t.debitedAccountId === filters.accountId ||
        t.creditedAccountId === filters.accountId
      );
    });

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      results = results.filter((t) => t.createdAt >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      results = results.filter((t) => t.createdAt <= end);
    }

    const order = filters.order ?? "DESC";
    results = [...results].sort((a, b) =>
      order === "ASC"
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const total = results.length;
    const page = filters.page;
    const limit = filters.limit;
    const paged = results.slice((page - 1) * limit, page * limit);

    const data = paged.map((t) => {
      const debitedAccount = this.store.accounts.get(t.debitedAccountId);
      const creditedAccount = this.store.accounts.get(t.creditedAccountId);
      const debitedUser = debitedAccount
        ? this.store.users.get(debitedAccount.userId)
        : undefined;
      const creditedUser = creditedAccount
        ? this.store.users.get(creditedAccount.userId)
        : undefined;

      return new TransactionRecord(
        t.id,
        t.debitedAccountId,
        debitedUser?.username ?? "",
        t.creditedAccountId,
        creditedUser?.username ?? "",
        t.value,
        t.createdAt,
      );
    });

    return { data, total, page, limit };
  }

  async count(): Promise<number> {
    return this.store.transactions.length;
  }
}
