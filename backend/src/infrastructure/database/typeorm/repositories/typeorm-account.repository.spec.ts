import { Account } from "../../../../modules/wallet/domain/account";
import { Balance } from "../../../../modules/wallet/domain/value-objects/balance";
import { AccountEntity } from "../entities/account.entity";
import { TypeOrmAccountRepository } from "./typeorm-account.repository";

const accountId = "11111111-1111-4111-8111-111111111111";

function createSut(entity: AccountEntity | null) {
  const fakeRepository = {
    async findOne(_options: { where: { id: string } }) {
      return entity;
    },
  };

  return new TypeOrmAccountRepository(fakeRepository as never);
}

describe("TypeOrmAccountRepository", () => {
  it("retorna Account com id e balance quando a entidade existe", async () => {
    const entity = { id: accountId, balance: "100.0000" } as AccountEntity;
    const repository = createSut(entity);

    const result = await repository.findById(accountId);

    expect(result).toBeInstanceOf(Account);
    expect(result?.id).toBe(accountId);
    expect(result?.balance).toBeInstanceOf(Balance);
    expect(result?.balance.toString()).toBe("100.0000");
  });

  it("retorna null quando a entidade nao existe", async () => {
    const repository = createSut(null);

    const result = await repository.findById(accountId);

    expect(result).toBeNull();
  });
});
