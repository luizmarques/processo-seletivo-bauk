import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { AccountEntity } from "./entities/account.entity";
import { TransactionEntity } from "./entities/transaction.entity";
import { UserEntity } from "./entities/user.entity";

export default new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST ?? "localhost",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? "bauk",
  password: process.env.POSTGRES_PASSWORD ?? "bauk",
  database: process.env.POSTGRES_DB ?? "bauk",
  entities: [UserEntity, AccountEntity, TransactionEntity],
  migrations: ["src/infrastructure/database/typeorm/migrations/*.ts"],
});
