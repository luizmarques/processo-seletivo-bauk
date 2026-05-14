import { Injectable } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { Brackets, EntityManager, Repository } from "typeorm";
import { TransactionRecord } from "../../../../modules/wallet/domain/transaction-record";
import { Account } from "../../../../modules/wallet/domain/account";
import { ResourceNotFoundError } from "../../../../shared/domain/errors/domain.errors";
import type { TransferAmount } from "../../../../shared/domain/value-objects/transfer-amount";
import { AccountEntity } from "../entities/account.entity";
import { TransactionEntity } from "../entities/transaction.entity";
import type {
  PaginatedTransactionRecords,
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

  async executeTransfer(
    senderAccountId: string,
    recipientAccountId: string,
    amount: TransferAmount,
    perform: (sender: Account, recipient: Account) => void,
  ): Promise<{ id: string; value: string }> {
    return this.entityManager.transaction(async (manager) => {
      const lockedEntities = await manager
        .createQueryBuilder(AccountEntity, "account")
        .setLock("pessimistic_write")
        .where("account.id IN (:...accountIds)", {
          accountIds: [senderAccountId, recipientAccountId].sort(),
        })
        .orderBy("account.id", "ASC")
        .getMany();

      const senderEntity = lockedEntities.find((e) => e.id === senderAccountId);
      const recipientEntity = lockedEntities.find((e) => e.id === recipientAccountId);

      if (!senderEntity || !recipientEntity) {
        throw new ResourceNotFoundError("Conta não encontrada.");
      }

      const sender = Account.reconstitute(senderEntity.id, senderEntity.balance);
      const recipient = Account.reconstitute(recipientEntity.id, recipientEntity.balance);

      perform(sender, recipient);

      senderEntity.balance = sender.balance.toString();
      recipientEntity.balance = recipient.balance.toString();

      await manager.save(AccountEntity, [senderEntity, recipientEntity]);

      const transaction = manager.create(TransactionEntity, {
        debitedAccountId: senderAccountId,
        creditedAccountId: recipientAccountId,
        value: amount.toString(),
      });
      const saved = await manager.save(transaction);
      return { id: saved.id, value: saved.value };
    });
  }

  async listByAccount(
    filters: TransactionFilters,
  ): Promise<PaginatedTransactionRecords> {
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

    const [entities, total] = await query.getManyAndCount();
    const data = entities.map(
      (t) =>
        new TransactionRecord(
          t.id,
          t.debitedAccountId,
          t.debitedAccount.user.username,
          t.creditedAccountId,
          t.creditedAccount.user.username,
          t.value,
          t.createdAt,
        ),
    );
    return { data, total, page: filters.page, limit: filters.limit };
  }

  count(): Promise<number> {
    return this.repository.count();
  }
}
