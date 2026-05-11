export class TransactionRecord {
  constructor(
    readonly id: string,
    readonly debitedAccountId: string,
    readonly debitedUsername: string,
    readonly creditedAccountId: string,
    readonly creditedUsername: string,
    readonly value: string,
    readonly createdAt: Date,
  ) {}
}

export interface PaginatedTransactionRecords {
  data: TransactionRecord[];
  total: number;
  page: number;
  limit: number;
}
