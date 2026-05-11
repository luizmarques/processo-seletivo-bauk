import { ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";
import { IdempotencyKey } from "../idempotency-key";
import { IdempotencyInterceptor } from "./idempotency.interceptor";

class FakeRedisService {
  public store = new Map<string, string>();
  public ttlByKey = new Map<string, number>();
  public setCalls: Array<{ key: string; value: string; ttlSeconds: number }> =
    [];
  public nxResults: boolean[] = [];

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, value);
    this.ttlByKey.set(key, ttlSeconds);
    this.setCalls.push({ key, value, ttlSeconds });
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const queuedResult = this.nxResults.shift();
    if (queuedResult === false) {
      return false;
    }
    if (this.store.has(key)) {
      return false;
    }
    this.store.set(key, value);
    this.ttlByKey.set(key, ttlSeconds);
    return true;
  }
}

function createExecutionContext(request: {
  method: string;
  path?: string;
  headers?: Record<string, string>;
  user?: { username?: string };
  body?: { username?: string; value?: string };
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        ...request,
      }),
    }),
  } as ExecutionContext;
}

async function collectObservableResult(
  interceptorPromise: ReturnType<IdempotencyInterceptor["intercept"]>,
) {
  return new Promise((resolve, reject) => {
    interceptorPromise.subscribe({ next: resolve, error: reject });
  });
}

describe("IdempotencyInterceptor", () => {
  const idempotencyMessage =
    "Esta transação acabou de ser realizada e, por segurança, não pode ser enviada novamente agora.";
  const requiredMessage =
    "O header Idempotency-Key é obrigatório para transferências.";
  const transferKey = "janedoe:johndoe:10.0000:123456";

  it("retorna erro funcional para chave repetida com resposta ja armazenada", async () => {
    const redisService = new FakeRedisService();
    const key = IdempotencyKey.fromRaw(transferKey).toString();
    redisService.store.set(
      `idempotency:${key}`,
      JSON.stringify({ id: "tx-1" }),
    );
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/wallet/transfer",
      headers: { "idempotency-key": transferKey },
    });
    let handled = false;

    let error: unknown;
    try {
      await collectObservableResult(
        interceptor.intercept(context, {
          handle: () => {
            handled = true;
            return of({ ok: true });
          },
        } as never),
      );
    } catch (caughtError) {
      error = caughtError;
    }

    expect(handled).toBe(false);
    expect(error).toMatchObject({
      response: {
        message: idempotencyMessage,
        statusCode: 409,
      },
    });
  });

  it("bloqueia requisicao em processamento", async () => {
    const redisService = new FakeRedisService();
    const key = IdempotencyKey.fromRaw(transferKey).toString();
    redisService.store.set(`idempotency:${key}`, "processing");
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/wallet/transfer",
      headers: { "idempotency-key": transferKey },
    });

    let error: unknown;
    try {
      await collectObservableResult(
        interceptor.intercept(context, { handle: () => of({}) } as never),
      );
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      response: {
        message: idempotencyMessage,
        statusCode: 409,
      },
    });
  });

  it("exige chave de idempotencia na rota de transferencia", async () => {
    const redisService = new FakeRedisService();
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/wallet/transfer",
      headers: {},
    });

    let error: unknown;
    try {
      await collectObservableResult(
        interceptor.intercept(context, {
          handle: () => of({ ok: true }),
        } as never),
      );
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      response: {
        message: requiredMessage,
        statusCode: 400,
      },
    });
    expect(redisService.store.size).toBe(0);
  });

  it("ignora requests que nao sao POST", async () => {
    const redisService = new FakeRedisService();
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "GET",
      headers: { "idempotency-key": transferKey },
    });

    const result = await collectObservableResult(
      interceptor.intercept(context, {
        handle: () => of({ ok: true }),
      } as never),
    );

    expect(result).toEqual({ ok: true });
    expect(redisService.store.size).toBe(0);
  });

  it("marca processamento e salva resposta ao concluir", async () => {
    const redisService = new FakeRedisService();
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/wallet/transfer",
      headers: { "idempotency-key": transferKey },
    });

    const result = await collectObservableResult(
      interceptor.intercept(context, {
        handle: () => of({ id: "tx-1" }),
      } as never),
    );

    const key = IdempotencyKey.fromRaw(transferKey).toString();
    expect(result).toEqual({ id: "tx-1" });
    expect(redisService.store.get(`idempotency:${key}`)).toBe(
      JSON.stringify({ id: "tx-1" }),
    );
    expect(redisService.ttlByKey.get(`idempotency:${key}`)).toBe(5);
    expect(redisService.setCalls).toEqual([
      {
        key: `idempotency:${key}`,
        value: JSON.stringify({ id: "tx-1" }),
        ttlSeconds: 5,
      },
    ]);
  });

  it("bloqueia quando a trava NX nao pode ser adquirida e a chave ja existe", async () => {
    const redisService = new FakeRedisService();
    const key = IdempotencyKey.fromRaw(transferKey).toString();
    redisService.store.set(`idempotency:${key}`, "processing");
    redisService.nxResults.push(false);
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/wallet/transfer",
      headers: { "idempotency-key": transferKey },
    });

    let error: unknown;
    try {
      await collectObservableResult(
        interceptor.intercept(context, { handle: () => of({}) } as never),
      );
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      response: {
        message: idempotencyMessage,
        statusCode: 409,
      },
    });
  });

  it("bloqueia quando a trava NX falha mesmo sem valor lido na segunda consulta", async () => {
    const redisService = new FakeRedisService();
    redisService.nxResults.push(false);
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/wallet/transfer",
      headers: { "idempotency-key": transferKey },
    });

    let error: unknown;
    try {
      await collectObservableResult(
        interceptor.intercept(context, { handle: () => of({}) } as never),
      );
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      response: {
        message: idempotencyMessage,
        statusCode: 409,
      },
    });
  });

  it("usa header generico quando a rota nao e transferencia", async () => {
    const redisService = new FakeRedisService();
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/other",
      headers: { "idempotency-key": "custom-key" },
    });

    const result = await collectObservableResult(
      interceptor.intercept(context, {
        handle: () => of({ ok: true }),
      } as never),
    );

    expect(result).toEqual({ ok: true });
    expect(redisService.store.get("idempotency:custom-key")).toBe(
      JSON.stringify({ ok: true }),
    );
  });

  it("ignora header vazio quando nao ha chave aplicavel", async () => {
    const redisService = new FakeRedisService();
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/other",
      headers: { "idempotency-key": "   " },
    });

    const result = await collectObservableResult(
      interceptor.intercept(context, {
        handle: () => of({ ok: true }),
      } as never),
    );

    expect(result).toEqual({ ok: true });
    expect(redisService.store.size).toBe(0);
  });

  it("usa o header manual na rota de transferencia quando ele e valido", async () => {
    const redisService = new FakeRedisService();
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/wallet/transfer",
      headers: { "idempotency-key": transferKey },
    });

    await collectObservableResult(
      interceptor.intercept(context, {
        handle: () => of({ id: "tx-1" }),
      } as never),
    );

    expect(redisService.store.get(`idempotency:${transferKey}`)).toBe(
      JSON.stringify({ id: "tx-1" }),
    );
  });

  it("trata a mesma chave composta com casing diferente como a mesma chave de idempotencia", async () => {
    const redisService = new FakeRedisService();
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const uppercaseKey = transferKey.toUpperCase();

    await collectObservableResult(
      interceptor.intercept(
        createExecutionContext({
          method: "POST",
          path: "/wallet/transfer",
          headers: { "idempotency-key": uppercaseKey },
        }),
        { handle: () => of({ id: "tx-1" }) } as never,
      ),
    );

    let error: unknown;
    try {
      await collectObservableResult(
        interceptor.intercept(
          createExecutionContext({
            method: "POST",
            path: "/wallet/transfer",
            headers: { "idempotency-key": transferKey },
          }),
          { handle: () => of({ id: "tx-2" }) } as never,
        ),
      );
    } catch (caughtError) {
      error = caughtError;
    }

    expect(redisService.store.get(`idempotency:${transferKey}`)).toBe(
      JSON.stringify({ id: "tx-1" }),
    );
    expect(error).toMatchObject({
      response: {
        message: idempotencyMessage,
        statusCode: 409,
      },
    });
  });

  it("usa ttl padrao de 5 segundos quando a variavel de ambiente e invalida", async () => {
    const previousTtl = process.env.IDEMPOTENCY_TTL_SECONDS;
    process.env.IDEMPOTENCY_TTL_SECONDS = "abc";
    try {
      const redisService = new FakeRedisService();
      const interceptor = new IdempotencyInterceptor(redisService as never);
      const context = createExecutionContext({
        method: "POST",
        path: "/wallet/transfer",
        headers: { "idempotency-key": transferKey },
      });

      await collectObservableResult(
        interceptor.intercept(context, { handle: () => of({ id: "tx-1" }) } as never),
      );

      const key = IdempotencyKey.fromRaw(transferKey).toString();
      expect(redisService.ttlByKey.get(`idempotency:${key}`)).toBe(5);
    } finally {
      if (previousTtl === undefined) {
        delete process.env.IDEMPOTENCY_TTL_SECONDS;
      } else {
        process.env.IDEMPOTENCY_TTL_SECONDS = previousTtl;
      }
    }
  });

  it("aceita chave composta na rota de transferencia", async () => {
    const redisService = new FakeRedisService();
    const interceptor = new IdempotencyInterceptor(redisService as never);
    const context = createExecutionContext({
      method: "POST",
      path: "/wallet/transfer",
      headers: { "idempotency-key": "janedoe:johndoe:10.0000:123456" },
    });

    const result = await collectObservableResult(
      interceptor.intercept(context, {
        handle: () => of({ ok: true }),
      } as never),
    );
    expect(result).toEqual({ ok: true });
  });
});
