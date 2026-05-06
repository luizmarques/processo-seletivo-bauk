import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AuthController } from './auth/auth.controller';
import { LoginUseCase } from './auth/application/login.use-case';
import { UsersController } from './users/users.controller';
import { RegisterUserUseCase } from './users/application/register-user.use-case';
import { WalletController } from './wallet/wallet.controller';
import { CreateTransferUseCase } from './wallet/application/create-transfer.use-case';
import { GetBalanceUseCase } from './wallet/application/get-balance.use-case';
import { ListTransactionsUseCase } from './wallet/application/list-transactions.use-case';
import { JwtAuthGuard } from '../shared/auth/jwt-auth.guard';
import { DomainExceptionFilter } from '../shared/http/filters/domain-exception.filter';
import { IdempotencyInterceptor } from '../shared/http/interceptors/idempotency.interceptor';
import { createRequestValidationPipe } from '../shared/http/pipes/request-validation-options';
import { RedisService } from '../shared/redis/redis.service';

export class FakeRegisterUserUseCase {
  public result = { id: 'user-1', username: 'janedoe' };
  public error: Error | null = null;
  public calls: Array<{ username: string; password: string }> = [];

  async execute(input: { username: string; password: string }) {
    this.calls.push(input);
    if (this.error) {
      throw this.error;
    }
    return this.result;
  }

  reset(): void {
    this.result = { id: 'user-1', username: 'janedoe' };
    this.error = null;
    this.calls = [];
  }
}

export class FakeLoginUseCase {
  public result = { accessToken: 'jwt-token' };
  public error: Error | null = null;
  public calls: Array<{ username: string; password: string }> = [];

  async execute(input: { username: string; password: string }) {
    this.calls.push(input);
    if (this.error) {
      throw this.error;
    }
    return this.result;
  }

  reset(): void {
    this.result = { accessToken: 'jwt-token' };
    this.error = null;
    this.calls = [];
  }
}

export class FakeCreateTransferUseCase {
  public result = { id: 'tx-1', value: '10.00' };
  public error: Error | null = null;
  public calls: Array<{
    senderUserId: string;
    senderAccountId: string;
    recipientUsername: string;
    value: string;
  }> = [];

  async execute(input: {
    senderUserId: string;
    senderAccountId: string;
    recipientUsername: string;
    value: string;
  }) {
    this.calls.push(input);
    if (this.error) {
      throw this.error;
    }
    return this.result;
  }

  reset(): void {
    this.result = { id: 'tx-1', value: '10.00' };
    this.error = null;
    this.calls = [];
  }
}

export class FakeGetBalanceUseCase {
  public result = { balance: '100.00' };
  public error: Error | null = null;
  public calls: string[] = [];

  async execute(accountId: string) {
    this.calls.push(accountId);
    if (this.error) {
      throw this.error;
    }
    return this.result;
  }

  reset(): void {
    this.result = { balance: '100.00' };
    this.error = null;
    this.calls = [];
  }
}

export class FakeListTransactionsUseCase {
  public result = {
    data: [
      {
        id: 'tx-1',
        debitedAccountId: 'acc-1',
        debitedUsername: 'janedoe',
        creditedAccountId: 'acc-2',
        creditedUsername: 'johndoe',
        value: '10.00',
        createdAt: new Date('2026-05-06T10:00:00.000Z'),
        type: 'cash-out' as const,
      },
    ],
    meta: { total: 1, page: 1, limit: 10 },
  };
  public error: Error | null = null;
  public calls: Array<Record<string, unknown>> = [];

  async execute(input: Record<string, unknown>) {
    this.calls.push(input);
    if (this.error) {
      throw this.error;
    }
    return this.result;
  }

  reset(): void {
    this.result = {
      data: [
        {
          id: 'tx-1',
          debitedAccountId: 'acc-1',
          debitedUsername: 'janedoe',
          creditedAccountId: 'acc-2',
          creditedUsername: 'johndoe',
          value: '10.00',
          createdAt: new Date('2026-05-06T10:00:00.000Z'),
          type: 'cash-out' as const,
        },
      ],
      meta: { total: 1, page: 1, limit: 10 },
    };
    this.error = null;
    this.calls = [];
  }
}

export class FakeRedisService {
  public store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async setIfNotExists(key: string, value: string): Promise<boolean> {
    if (this.store.has(key)) {
      return false;
    }
    this.store.set(key, value);
    return true;
  }

  reset(): void {
    this.store.clear();
  }
}

class TestJwtAuthGuard implements CanActivate {
  static shouldAllow = true;
  static user = {
    userId: 'user-1',
    username: 'janedoe',
    accountId: 'acc-1',
  };

  canActivate(context: ExecutionContext): boolean {
    if (!TestJwtAuthGuard.shouldAllow) {
      throw new UnauthorizedException('Unauthorized');
    }

    const request = context.switchToHttp().getRequest();
    request.user = { ...TestJwtAuthGuard.user };
    return true;
  }
}

export type HttpTestAppContext = {
  app: NestFastifyApplication;
  registerUserUseCase: FakeRegisterUserUseCase;
  loginUseCase: FakeLoginUseCase;
  createTransferUseCase: FakeCreateTransferUseCase;
  getBalanceUseCase: FakeGetBalanceUseCase;
  listTransactionsUseCase: FakeListTransactionsUseCase;
  redisService: FakeRedisService;
  setAuthenticatedUser(user: { userId: string; username: string; accountId: string } | null): void;
  reset(): void;
  close(): Promise<void>;
};

export async function createHttpTestApp(): Promise<HttpTestAppContext> {
  const registerUserUseCase = new FakeRegisterUserUseCase();
  const loginUseCase = new FakeLoginUseCase();
  const createTransferUseCase = new FakeCreateTransferUseCase();
  const getBalanceUseCase = new FakeGetBalanceUseCase();
  const listTransactionsUseCase = new FakeListTransactionsUseCase();
  const redisService = new FakeRedisService();

  const moduleRef = await Test.createTestingModule({
    controllers: [UsersController, AuthController, WalletController],
    providers: [
      IdempotencyInterceptor,
      { provide: RegisterUserUseCase, useValue: registerUserUseCase },
      { provide: LoginUseCase, useValue: loginUseCase },
      { provide: CreateTransferUseCase, useValue: createTransferUseCase },
      { provide: GetBalanceUseCase, useValue: getBalanceUseCase },
      { provide: ListTransactionsUseCase, useValue: listTransactionsUseCase },
      { provide: RedisService, useValue: redisService },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(TestJwtAuthGuard)
    .compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  app.useGlobalPipes(createRequestValidationPipe());
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return {
    app,
    registerUserUseCase,
    loginUseCase,
    createTransferUseCase,
    getBalanceUseCase,
    listTransactionsUseCase,
    redisService,
    setAuthenticatedUser(user) {
      TestJwtAuthGuard.shouldAllow = user !== null;
      if (user) {
        TestJwtAuthGuard.user = { ...user };
      }
    },
    reset() {
      registerUserUseCase.reset();
      loginUseCase.reset();
      createTransferUseCase.reset();
      getBalanceUseCase.reset();
      listTransactionsUseCase.reset();
      redisService.reset();
      TestJwtAuthGuard.shouldAllow = true;
      TestJwtAuthGuard.user = {
        userId: 'user-1',
        username: 'janedoe',
        accountId: 'acc-1',
      };
    },
    async close() {
      await app.close();
    },
  };
}
