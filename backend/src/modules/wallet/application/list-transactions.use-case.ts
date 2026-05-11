import { Inject, Injectable } from "@nestjs/common";
import { TRANSACTION_REPOSITORY } from "../../../shared/constants/injection-tokens";
import { AccountId } from "../../../shared/domain/value-objects/account-id";
import { formatMoneyForDisplay } from "../../../shared/domain/value-objects/money-format";
import { TransactionId } from "../../../shared/domain/value-objects/transaction-id";
import { TransferAmount } from "../../../shared/domain/value-objects/transfer-amount";
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
      data: result.data.map((transaction) => ({
        id: new TransactionId(transaction.id).toString(),
        debitedAccountId: transaction.debitedAccountId,
        debitedUsername: transaction.debitedAccount.user.username,
        creditedAccountId: transaction.creditedAccountId,
        creditedUsername: transaction.creditedAccount.user.username,
        value: formatMoneyForDisplay(
          new TransferAmount(transaction.value).toString(),
        ),
        createdAt: transaction.createdAt,
        type:
          transaction.debitedAccountId === accountId.toString()
            ? "cash-out"
            : "cash-in",
      })),
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }
}
