import { Inject, Injectable } from "@nestjs/common";
import { TRANSACTION_REPOSITORY } from "../../../shared/constants/injection-tokens";
import { AccountId } from "../domain/value-objects/account-id";
import { formatMoneyForDisplay } from "../domain/value-objects/money-format";
import type { TransactionRepository } from "../domain/transaction.repository";

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: {
    accountId: string;
    page: number;
    limit: number;
    type?: "cash-in" | "cash-out";
    startDate?: string;
    endDate?: string;
    order?: "ASC" | "DESC";
  }): Promise<{
    data: Array<{
      id: string;
      debitedAccountId: string;
      debitedUsername: string;
      creditedAccountId: string;
      creditedUsername: string;
      value: string;
      createdAt: Date;
      type: "cash-in" | "cash-out";
    }>;
    meta: { total: number; page: number; limit: number };
  }> {
    const accountId = new AccountId(input.accountId);
    const result = await this.transactionRepository.listByAccount({
      ...input,
      accountId: accountId.toString(),
    });
    return {
      data: result.data.map((record) => ({
        id: record.id,
        debitedAccountId: record.debitedAccountId,
        debitedUsername: record.debitedUsername,
        creditedAccountId: record.creditedAccountId,
        creditedUsername: record.creditedUsername,
        value: formatMoneyForDisplay(record.value),
        createdAt: record.createdAt,
        type:
          record.debitedAccountId === accountId.toString()
            ? "cash-out"
            : "cash-in",
      })),
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }
}
