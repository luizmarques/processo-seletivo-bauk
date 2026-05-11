import { ResourceNotFoundError } from "../../../../shared/domain/errors/domain.errors";
import { AccountEntity } from "../entities/account.entity";
import { TransactionEntity } from "../entities/transaction.entity";
import { TypeOrmTransactionRepository } from "./typeorm-transaction.repository";

const senderAccountId = "11111111-1111-4111-8111-111111111111";
const recipientAccountId = "22222222-2222-4222-8222-222222222222";

function makeAccount(id: string, balance: string): AccountEntity {
  return { id, balance } as AccountEntity;
}

function makeTransactionEntity(overrides?: Partial<TransactionEntity>): TransactionEntity {
  return {
    id: "tx-uuid-1",
    debitedAccountId: senderAccountId,
    creditedAccountId: recipientAccountId,
    value: "10.0000",
    createdAt: new Date("2026-05-06T10:00:00.000Z"),
    debitedAccount: {
      user: { username: "janedoe" },
    } as AccountEntity,
    creditedAccount: {
      user: { username: "johndoe" },
    } as AccountEntity,
    ...overrides,
  } as TransactionEntity;
}

function createTransferSut(options?: {
  lockedAccounts?: AccountEntity[];
  transactionId?: string;
}) {
  const lockedAccounts = options?.lockedAccounts ?? [
    makeAccount(senderAccountId, "100.0000"),
    makeAccount(recipientAccountId, "50.0000"),
  ];
  const transactionId = options?.transactionId ?? "tx-uuid-1";
  const savedAccountBatches: AccountEntity[][] = [];
  const createdTransactions: Partial<TransactionEntity>[] = [];

  const manager = {
    createQueryBuilder(_entity: unknown, _alias: string) {
      const builder = {
        setLock(_mode: string) { return builder; },
        where(_condition: unknown, _params?: unknown) { return builder; },
        orderBy(_field: string, _order?: string) { return builder; },
        async getMany() { return lockedAccounts; },
      };
      return builder;
    },
    create(_entity: unknown, data: Partial<TransactionEntity>) {
      createdTransactions.push({ ...data });
      return { ...data };
    },
    async save(entityOrArray: unknown, items?: unknown) {
      if (Array.isArray(items)) {
        savedAccountBatches.push(items.map((item) => ({ ...item })) as AccountEntity[]);
        return items;
      }
      return { ...(entityOrArray as object), id: transactionId };
    },
  };

  const entityManager = {
    async transaction<T>(
      callback: (transactionManager: typeof manager) => Promise<T>,
    ): Promise<T> {
      return callback(manager);
    },
  };

  return {
    repository: new TypeOrmTransactionRepository(
      {} as never,
      entityManager as never,
    ),
    savedAccountBatches,
    createdTransactions,
  };
}

class FakeListQueryBuilder {
  public result: [TransactionEntity[], number] = [[], 0];

  leftJoinAndSelect(_relation: string, _alias: string) { return this; }
  where(_condition: unknown) { return this; }
  andWhere(_condition: string, _params?: unknown) { return this; }
  orWhere(_condition: string, _params?: unknown) { return this; }
  orderBy(_field: string, _order?: string) { return this; }
  skip(_n: number) { return this; }
  take(_n: number) { return this; }
  async getManyAndCount(): Promise<[TransactionEntity[], number]> {
    return this.result;
  }
}

function createListSut(entities: TransactionEntity[], total: number) {
  const builder = new FakeListQueryBuilder();
  builder.result = [entities, total];

  const fakeRepository = {
    createQueryBuilder(_alias: string) {
      return builder;
    },
  };

  return {
    repository: new TypeOrmTransactionRepository(
      fakeRepository as never,
      {} as never,
    ),
    builder,
  };
}

describe("TypeOrmTransactionRepository", () => {
  describe("executeTransfer", () => {
    it("debita sender, credita recipient, salva ambos e retorna id e valor da transaction", async () => {
      const { repository, savedAccountBatches, createdTransactions } =
        createTransferSut();

      const result = await repository.executeTransfer({
        senderAccountId,
        recipientAccountId,
        value: "10.0000",
      });

      expect(result).toEqual({ id: "tx-uuid-1", value: "10.0000" });
      expect(savedAccountBatches).toHaveLength(1);
      expect(savedAccountBatches[0]).toEqual([
        { id: senderAccountId, balance: "90.0000" },
        { id: recipientAccountId, balance: "60.0000" },
      ]);
      expect(createdTransactions).toEqual([
        {
          debitedAccountId: senderAccountId,
          creditedAccountId: recipientAccountId,
          value: "10.0000",
        },
      ]);
    });

    it("lanca ResourceNotFoundError quando a conta sender nao e encontrada", async () => {
      const { repository, savedAccountBatches } = createTransferSut({
        lockedAccounts: [makeAccount(recipientAccountId, "50.0000")],
      });

      let error: unknown;
      try {
        await repository.executeTransfer({
          senderAccountId,
          recipientAccountId,
          value: "10.0000",
        });
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(ResourceNotFoundError);
      expect(savedAccountBatches).toHaveLength(0);
    });

    it("lanca ResourceNotFoundError quando a conta recipient nao e encontrada", async () => {
      const { repository, savedAccountBatches } = createTransferSut({
        lockedAccounts: [makeAccount(senderAccountId, "100.0000")],
      });

      let error: unknown;
      try {
        await repository.executeTransfer({
          senderAccountId,
          recipientAccountId,
          value: "10.0000",
        });
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(ResourceNotFoundError);
      expect(savedAccountBatches).toHaveLength(0);
    });
  });

  describe("listByAccount", () => {
    const accountId = senderAccountId;

    it("mapeia entity para TransactionRecord com usernames resolvidos pelos joins", async () => {
      const entity = makeTransactionEntity();
      const { repository } = createListSut([entity], 1);

      const result = await repository.listByAccount({
        accountId,
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual([
        {
          id: "tx-uuid-1",
          debitedAccountId: senderAccountId,
          debitedUsername: "janedoe",
          creditedAccountId: recipientAccountId,
          creditedUsername: "johndoe",
          value: "10.0000",
          createdAt: new Date("2026-05-06T10:00:00.000Z"),
        },
      ]);
    });

    it("retorna metadata de paginacao correta", async () => {
      const { repository } = createListSut([makeTransactionEntity()], 42);

      const result = await repository.listByAccount({
        accountId,
        page: 3,
        limit: 5,
      });

      expect(result.total).toBe(42);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
    });

    it("retorna lista vazia e total zero quando nao ha transactions", async () => {
      const { repository } = createListSut([], 0);

      const result = await repository.listByAccount({
        accountId,
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});
