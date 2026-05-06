import { TransactionEntity } from '../../../infrastructure/database/typeorm/entities/transaction.entity';

export interface TransactionFilters {
  accountId: string;
  page: number;
  limit: number;
  type?: 'cash-in' | 'cash-out';
  startDate?: string;
  endDate?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedTransactions {
  data: TransactionEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionRepository {
  executeTransfer(input: {
    senderAccount: { id: string; balance: string };
    recipientAccount: { id: string; balance: string };
    value: string;
  }): Promise<TransactionEntity>;
  listByAccount(filters: TransactionFilters): Promise<PaginatedTransactions>;
  count(): Promise<number>;
}
