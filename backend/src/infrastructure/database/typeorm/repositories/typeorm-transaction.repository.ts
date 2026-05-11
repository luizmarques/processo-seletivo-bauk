import { Injectable } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { Brackets, EntityManager, Repository } from "typeorm";
import { ResourceNotFoundError } from "../../../../shared/domain/errors/domain.errors";
import { Balance } from "../../../../shared/domain/value-objects/balance";
import { TransferAmount } from "../../../../shared/domain/value-objects/transfer-amount";
import { AccountEntity } from "../entities/account.entity";
import { TransactionEntity } from "../entities/transaction.entity";
import type {
  PaginatedTransactions,
  TransactionFilters,
  TransactionRepository,
} from "../../../../modules/wallet/domain/transaction.repository";

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repository: Repository<TransactionEntity>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async executeTransfer(input: {
    senderAccountId: string;
    recipientAccountId: string;
    value: string;
  }): Promise<TransactionEntity> {
    return this.entityManager.transaction(async (manager) => {
      const lockedAccounts = await manager
        .createQueryBuilder(AccountEntity, "account")
        .setLock("pessimistic_write")
        .where("account.id IN (:...accountIds)", {
          accountIds: [input.senderAccountId, input.recipientAccountId].sort(),
        })
        .orderBy("account.id", "ASC")
        .getMany();

      const senderAccount = lockedAccounts.find(
        (account) => account.id === input.senderAccountId,
      );
      const recipientAccount = lockedAccounts.find(
        (account) => account.id === input.recipientAccountId,
      );

      if (!senderAccount || !recipientAccount) {
        throw new ResourceNotFoundError("Conta não encontrada.");
      }

      const amount = new TransferAmount(input.value);
      const senderBalance = new Balance(senderAccount.balance);
      const recipientBalance = new Balance(recipientAccount.balance);

      senderAccount.balance = senderBalance.debit(amount).toString();
      recipientAccount.balance = recipientBalance.credit(amount).toString();

      await manager.save(AccountEntity, [senderAccount, recipientAccount]);

      const transaction = manager.create(TransactionEntity, {
        debitedAccountId: input.senderAccountId,
        creditedAccountId: input.recipientAccountId,
        value: input.value,
      });
      return manager.save(transaction);
    });
  }

  async listByAccount(
    filters: TransactionFilters,
  ): Promise<PaginatedTransactions> {
    const query = this.repository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.debitedAccount", "debitedAccount")
      .leftJoinAndSelect("debitedAccount.user", "debitedUser")
      .leftJoinAndSelect("transaction.creditedAccount", "creditedAccount")
      .leftJoinAndSelect("creditedAccount.user", "creditedUser")
      .where(
        new Brackets((qb) => {
          qb.where("transaction.debitedAccountId = :accountId", {
            accountId: filters.accountId,
          }).orWhere("transaction.creditedAccountId = :accountId", {
            accountId: filters.accountId,
          });
        }),
      );

    if (filters.type === "cash-in") {
      query.andWhere("transaction.creditedAccountId = :accountId", {
        accountId: filters.accountId,
      });
    }
    if (filters.type === "cash-out") {
      query.andWhere("transaction.debitedAccountId = :accountId", {
        accountId: filters.accountId,
      });
    }
    if (filters.startDate) {
      query.andWhere("transaction.createdAt >= :startDate", {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      query.andWhere("transaction.createdAt <= :endDate", {
        endDate: filters.endDate,
      });
    }

    query.orderBy("transaction.createdAt", filters.order ?? "DESC");
    query.skip((filters.page - 1) * filters.limit).take(filters.limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page: filters.page, limit: filters.limit };
  }

  count(): Promise<number> {
    return this.repository.count();
  }
}
