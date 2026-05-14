import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth/auth.controller";
import { LoginUseCase } from "./auth/application/login.use-case";
import { UsersController } from "./users/users.controller";
import { RegisterUserUseCase } from "./users/application/register-user.use-case";
import { WalletController } from "./wallet/wallet.controller";
import { CreateTransferUseCase } from "./wallet/application/create-transfer.use-case";
import { GetBalanceUseCase } from "./wallet/application/get-balance.use-case";
import { ListTransactionsUseCase } from "./wallet/application/list-transactions.use-case";
import { JwtStrategy } from "../shared/auth/jwt.strategy";
import { BcryptPasswordService } from "../shared/security/bcrypt-password.service";
import { JwtTokenService } from "../shared/security/jwt-token.service";
import { DomainExceptionFilter } from "../shared/http/filters/domain-exception.filter";
import { IdempotencyInterceptor } from "../shared/http/interceptors/idempotency.interceptor";
import { createRequestValidationPipe } from "../shared/http/pipes/request-validation-options";
import {
  ACCOUNT_REPOSITORY,
  DOMAIN_EVENT_PUBLISHER,
  IDEMPOTENCY_STORE,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
} from "../shared/constants/injection-tokens";
import { NoopDomainEventPublisher } from "../shared/events/noop-domain-event-publisher";
import { InMemoryStore } from "../infrastructure/database/in-memory/in-memory-store";
import { InMemoryUserRepository } from "../infrastructure/database/in-memory/repositories/in-memory-user.repository";
import { InMemoryAccountRepository } from "../infrastructure/database/in-memory/repositories/in-memory-account.repository";
import { InMemoryTransactionRepository } from "../infrastructure/database/in-memory/repositories/in-memory-transaction.repository";
import { InMemoryRedisService } from "../shared/redis/in-memory-redis.service";

export type E2ETestAppContext = {
  app: NestFastifyApplication;
  store: InMemoryStore;
  reset(): void;
  close(): Promise<void>;
};

export async function createE2ETestApp(): Promise<E2ETestAppContext> {
  const store = new InMemoryStore();
  const redisService = new InMemoryRedisService();

  const moduleRef = await Test.createTestingModule({
    imports: [
      PassportModule,
      JwtModule.register({
        secret: process.env.JWT_SECRET ?? "supersecretjwtkey",
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "24h" },
      }),
    ],
    controllers: [UsersController, AuthController, WalletController],
    providers: [
      RegisterUserUseCase,
      LoginUseCase,
      CreateTransferUseCase,
      GetBalanceUseCase,
      ListTransactionsUseCase,
      JwtStrategy,
      IdempotencyInterceptor,
      { provide: PASSWORD_HASHER, useClass: BcryptPasswordService },
      { provide: TOKEN_SERVICE, useClass: JwtTokenService },
      { provide: IDEMPOTENCY_STORE, useValue: redisService },
      { provide: InMemoryStore, useValue: store },
      { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
      { provide: ACCOUNT_REPOSITORY, useClass: InMemoryAccountRepository },
      { provide: TRANSACTION_REPOSITORY, useClass: InMemoryTransactionRepository },
      { provide: DOMAIN_EVENT_PUBLISHER, useClass: NoopDomainEventPublisher },
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  app.useGlobalPipes(createRequestValidationPipe());
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return {
    app,
    store,
    reset() {
      store.reset();
      redisService.reset();
    },
    async close() {
      await app.close();
    },
  };
}
