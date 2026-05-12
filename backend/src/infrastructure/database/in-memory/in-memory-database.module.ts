import { Module } from "@nestjs/common";
import {
  ACCOUNT_REPOSITORY,
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
} from "../../../shared/constants/injection-tokens";
import { InMemoryStore } from "./in-memory-store";
import { InMemoryAccountRepository } from "./repositories/in-memory-account.repository";
import { InMemoryTransactionRepository } from "./repositories/in-memory-transaction.repository";
import { InMemoryUserRepository } from "./repositories/in-memory-user.repository";

@Module({
  providers: [
    InMemoryStore,
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
    { provide: ACCOUNT_REPOSITORY, useClass: InMemoryAccountRepository },
    { provide: TRANSACTION_REPOSITORY, useClass: InMemoryTransactionRepository },
  ],
  exports: [
    USER_REPOSITORY,
    ACCOUNT_REPOSITORY,
    TRANSACTION_REPOSITORY,
    InMemoryStore,
  ],
})
export class InMemoryDatabaseModule {}
