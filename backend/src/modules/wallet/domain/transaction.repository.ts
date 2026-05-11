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
  executeTransfer(input: {
    senderAccountId: string;
    recipientAccountId: string;
    value: string;
  }): Promise<{ id: string; value: string }>;
  listByAccount(filters: TransactionFilters): Promise<PaginatedTransactionRecords>;
  count(): Promise<number>;
}
