import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountEntity } from "../../infrastructure/database/typeorm/entities/account.entity";
import { TransactionEntity } from "../../infrastructure/database/typeorm/entities/transaction.entity";
import { TypeOrmAccountRepository } from "../../infrastructure/database/typeorm/repositories/typeorm-account.repository";
import { TypeOrmTransactionRepository } from "../../infrastructure/database/typeorm/repositories/typeorm-transaction.repository";
import {
  ACCOUNT_REPOSITORY,
  TRANSACTION_REPOSITORY,
} from "../../shared/constants/injection-tokens";
import { IdempotencyInterceptor } from "../../shared/http/interceptors/idempotency.interceptor";
import { UsersModule } from "../users/users.module";
import { CreateTransferUseCase } from "./application/create-transfer.use-case";
import { GetBalanceUseCase } from "./application/get-balance.use-case";
import { ListTransactionsUseCase } from "./application/list-transactions.use-case";
import { WalletController } from "./wallet.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity, TransactionEntity]),
    UsersModule,
  ],
  controllers: [WalletController],
  providers: [
    GetBalanceUseCase,
    CreateTransferUseCase,
    ListTransactionsUseCase,
    // Necessário para o Nest instanciar via DI (RedisService) na aplicação real.
    IdempotencyInterceptor,
    { provide: ACCOUNT_REPOSITORY, useClass: TypeOrmAccountRepository },
    { provide: TRANSACTION_REPOSITORY, useClass: TypeOrmTransactionRepository },
  ],
})
export class WalletModule {}
