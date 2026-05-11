import "dotenv/config";
import "reflect-metadata";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import Decimal from "decimal.js";
import { DataSource } from "typeorm";
import dataSource from "../typeorm/data-source";
import { AccountEntity } from "../typeorm/entities/account.entity";
import { TransactionEntity } from "../typeorm/entities/transaction.entity";
import { UserEntity } from "../typeorm/entities/user.entity";
import { REQUIRED_INITIAL_BALANCE } from "../../../shared/domain/value-objects/initial-balance";

const usernames = [
  "janedoe",
  "johndoe",
  "alice_smith",
  "bob_jones",
  "charlie_brown",
  "diana_prince",
  "edward_elric",
  "fiona_gallagher",
  "george_costanza",
  "hannah_montana",
];

async function seed(appDataSource: DataSource): Promise<void> {
  const userRepo = appDataSource.getRepository(UserEntity);
  const accountRepo = appDataSource.getRepository(AccountEntity);
  const transactionRepo = appDataSource.getRepository(TransactionEntity);

  if ((await userRepo.count()) > 0) {
    return;
  }

  const password = await bcrypt.hash("Senha123", 10);
  const users: UserEntity[] = [];

  for (const username of usernames) {
    const account = await accountRepo.save(
      accountRepo.create({ balance: REQUIRED_INITIAL_BALANCE }),
    );
    const user = await userRepo.save(
      userRepo.create({
        username,
        password,
        accountId: account.id,
      }),
    );
    users.push(user);
  }

  for (let index = 0; index < 20; index += 1) {
    const sender = users[index % users.length];
    const recipient = users[(index + 3) % users.length];
    const value = new Decimal((index % 5) + 1)
      .mul(5)
      .plus(new Decimal(index).div(10000))
      .toFixed(4);

    const senderAccount = await accountRepo.findOneByOrFail({
      id: sender.accountId,
    });
    const recipientAccount = await accountRepo.findOneByOrFail({
      id: recipient.accountId,
    });
    senderAccount.balance = new Decimal(senderAccount.balance)
      .minus(value)
      .toFixed(4);
    recipientAccount.balance = new Decimal(recipientAccount.balance)
      .plus(value)
      .toFixed(4);

    await accountRepo.save(senderAccount);
    await accountRepo.save(recipientAccount);
    await transactionRepo.save(
      transactionRepo.create({
        id: randomUUID(),
        debitedAccountId: sender.accountId,
        creditedAccountId: recipient.accountId,
        value,
      }),
    );
  }
}

dataSource.initialize().then(async (appDataSource) => {
  await seed(appDataSource);
  await appDataSource.destroy();
});
