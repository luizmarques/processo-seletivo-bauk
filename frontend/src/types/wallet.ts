import type {
  AccountId,
  EntityId,
  ISODateString,
  IdempotencyKey,
  MoneyAmount,
  PageNumber,
  PageSize,
  TotalItems,
  Username,
} from "./value-objects";

export type TransactionType = "cash-in" | "cash-out";
export type TransactionOrder = "ASC" | "DESC";

export interface WalletBalanceResponse {
  balance: MoneyAmount;
}

export interface TransferRequest {
  idempotencyKey: IdempotencyKey;
  username: Username;
  value: MoneyAmount;
}

export interface TransferResponse {
  id: EntityId;
  value: MoneyAmount;
}

export interface TransactionFilters {
  page: PageNumber;
  limit: PageSize;
  startDate?: ISODateString;
  endDate?: ISODateString;
  type?: TransactionType;
  order: TransactionOrder;
}

export interface WalletTransaction {
  id: EntityId;
  debitedAccountId: AccountId;
  debitedUsername: Username;
  creditedAccountId: AccountId;
  creditedUsername: Username;
  value: MoneyAmount;
  createdAt: ISODateString;
  type: TransactionType;
}

export interface WalletTransactionsResponse {
  data: WalletTransaction[];
  meta: {
    total: TotalItems;
    page: PageNumber;
    limit: PageSize;
  };
}
