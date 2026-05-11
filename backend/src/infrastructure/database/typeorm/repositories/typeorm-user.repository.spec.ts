import { REQUIRED_INITIAL_BALANCE } from "../../../../shared/domain/value-objects/initial-balance";
import { AccountEntity } from "../entities/account.entity";
import { UserEntity } from "../entities/user.entity";
import { TypeOrmUserRepository } from "./typeorm-user.repository";

describe("TypeOrmUserRepository", () => {
  function createSut(options?: {
    saveAccountError?: Error;
    saveUserError?: Error;
  }): {
    repository: TypeOrmUserRepository;
    saveCalls: unknown[];
  } {
    const saveCalls: unknown[] = [];
    const accountEntity = {
      balance: REQUIRED_INITIAL_BALANCE,
    } as AccountEntity;
    const userEntity = {
      username: "janedoe",
      password: "hashed-password",
      accountId: "account-created",
    } as UserEntity;

    const manager = {
      create(
        entity: typeof AccountEntity | typeof UserEntity,
        input: Record<string, unknown>,
      ) {
        if (entity === AccountEntity) {
          return { ...accountEntity, ...input };
        }

        return { ...userEntity, ...input };
      },
      async save(entity: AccountEntity | UserEntity) {
        saveCalls.push(entity);

        if ("balance" in entity) {
          if (options?.saveAccountError) {
            throw options.saveAccountError;
          }

          return { ...entity, id: "account-created" };
        }

        if (options?.saveUserError) {
          throw options.saveUserError;
        }

        return { ...entity, id: "user-created" };
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
      repository: new TypeOrmUserRepository(
        {} as never,
        entityManager as never,
      ),
      saveCalls,
    };
  }

  it("cria conta com saldo inicial informado e vincula o usuario ao accountId persistido", async () => {
    const { repository, saveCalls } = createSut();

    const createdUser = await repository.createWithAccount({
      username: "janedoe",
      password: "hashed-password",
    });

    expect(saveCalls).toEqual([
      { balance: REQUIRED_INITIAL_BALANCE },
      {
        username: "janedoe",
        password: "hashed-password",
        accountId: "account-created",
      },
    ]);
    expect(createdUser).toEqual({
      id: "user-created",
      username: "janedoe",
      password: "hashed-password",
      accountId: "account-created",
    });
  });

  it("propaga erro quando a persistencia da conta falha antes de criar o usuario", async () => {
    const accountError = new Error("account-save-failed");
    const { repository, saveCalls } = createSut({
      saveAccountError: accountError,
    });

    await expect(
      repository.createWithAccount({
        username: "janedoe",
        password: "hashed-password",
      }),
    ).rejects.toThrow(accountError);

    expect(saveCalls).toEqual([{ balance: REQUIRED_INITIAL_BALANCE }]);
  });

  it("propaga erro quando a persistencia do usuario falha apos criar a conta", async () => {
    const userError = new Error("user-save-failed");
    const { repository, saveCalls } = createSut({ saveUserError: userError });

    await expect(
      repository.createWithAccount({
        username: "janedoe",
        password: "hashed-password",
      }),
    ).rejects.toThrow(userError);

    expect(saveCalls).toEqual([
      { balance: REQUIRED_INITIAL_BALANCE },
      {
        username: "janedoe",
        password: "hashed-password",
        accountId: "account-created",
      },
    ]);
  });

  it("materializa o saldo inicial obrigatorio mesmo se houver env divergente no processo", async () => {
    const previousInitialBalance = process.env.INITIAL_BALANCE;
    process.env.INITIAL_BALANCE = "999.9999";
    try {
      const { repository, saveCalls } = createSut();

      await repository.createWithAccount({
        username: "janedoe",
        password: "hashed-password",
      });

      expect(saveCalls[0]).toEqual({ balance: REQUIRED_INITIAL_BALANCE });
    } finally {
      if (previousInitialBalance === undefined) {
        delete process.env.INITIAL_BALANCE;
      } else {
        process.env.INITIAL_BALANCE = previousInitialBalance;
      }
    }
  });
});
