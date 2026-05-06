export type TransactionType = 'cash-in' | 'cash-out';
export type TransactionOrder = 'ASC' | 'DESC';

export interface WalletBalanceResponse {
  balance: string;
}

export interface TransferRequest {
  idempotencyKey: string;
  username: string;
  value: string;
}

export interface TransferResponse {
  id: string;
  value: string;
}

export interface TransactionFilters {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  order: TransactionOrder;
}

export interface WalletTransaction {
  id: string;
  debitedAccountId: string;
  debitedUsername: string;
  creditedAccountId: string;
  creditedUsername: string;
  value: string;
  createdAt: string;
  type: TransactionType;
}

export interface WalletTransactionsResponse {
  data: WalletTransaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
