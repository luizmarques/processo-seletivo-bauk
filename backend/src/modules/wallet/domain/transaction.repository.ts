import type { Account } from "./account";
import type { TransferAmount } from "./value-objects/transfer-amount";
import type { PaginatedTransactionRecords } from "./transaction-record";
export type { PaginatedTransactionRecords };

export interface TransactionFilters {
  accountId: string;
  page: number;
  limit: number;
  type?: "cash-in" | "cash-out";
  startDate?: string;
  endDate?: string;
  order?: "ASC" | "DESC";
}

export interface TransactionRepository {
  executeTransfer(
    senderAccountId: string,
    recipientAccountId: string,
    amount: TransferAmount,
    perform: (sender: Account, recipient: Account) => void,
  ): Promise<{ id: string; value: string }>;
  listByAccount(filters: TransactionFilters): Promise<PaginatedTransactionRecords>;
  count(): Promise<number>;
}
