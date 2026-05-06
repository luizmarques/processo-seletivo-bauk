import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { TransactionEntity } from '../entities/transaction.entity';
import type {
  PaginatedTransactions,
  TransactionFilters,
  TransactionRepository,
} from '../../../../modules/wallet/domain/transaction.repository';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity) private readonly repository: Repository<TransactionEntity>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async executeTransfer(input: {
    senderAccount: { id: string; balance: string };
    recipientAccount: { id: string; balance: string };
    value: string;
  }): Promise<TransactionEntity> {
    return this.entityManager.transaction(async (manager) => {
      await manager.update('accounts', { id: input.senderAccount.id }, { balance: input.senderAccount.balance });
      await manager.update('accounts', { id: input.recipientAccount.id }, { balance: input.recipientAccount.balance });

      const transaction = manager.create(TransactionEntity, {
        debitedAccountId: input.senderAccount.id,
        creditedAccountId: input.recipientAccount.id,
        value: input.value,
      });
      return manager.save(transaction);
    });
  }

  async listByAccount(filters: TransactionFilters): Promise<PaginatedTransactions> {
    const query = this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.debitedAccount', 'debitedAccount')
      .leftJoinAndSelect('debitedAccount.user', 'debitedUser')
      .leftJoinAndSelect('transaction.creditedAccount', 'creditedAccount')
      .leftJoinAndSelect('creditedAccount.user', 'creditedUser')
      .where(
        new Brackets((qb) => {
          qb.where('transaction.debitedAccountId = :accountId', { accountId: filters.accountId }).orWhere(
            'transaction.creditedAccountId = :accountId',
            { accountId: filters.accountId },
          );
        }),
      );

    if (filters.type === 'cash-in') {
      query.andWhere('transaction.creditedAccountId = :accountId', { accountId: filters.accountId });
    }
    if (filters.type === 'cash-out') {
      query.andWhere('transaction.debitedAccountId = :accountId', { accountId: filters.accountId });
    }
    if (filters.startDate) {
      query.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('transaction.createdAt', filters.order ?? 'DESC');
    query.skip((filters.page - 1) * filters.limit).take(filters.limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page: filters.page, limit: filters.limit };
  }

  count(): Promise<number> {
    return this.repository.count();
  }
}
