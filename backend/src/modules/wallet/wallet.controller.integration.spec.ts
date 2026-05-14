import {
  ResourceNotFoundError,
  ValidationDomainError,
} from "../../shared/domain/errors/domain.errors";
import {
  createHttpTestApp,
  type HttpTestAppContext,
} from "../http-test-app.factory";

describe("Wallet HTTP Integration", () => {
  let context: HttpTestAppContext;
  const idempotencyKey = "janedoe:johndoe:10.0000:123456";

  function transferHeaders(key = idempotencyKey): Record<string, string> {
    return { "idempotency-key": key };
  }

  beforeAll(async () => {
    context = await createHttpTestApp();
  });

  beforeEach(() => {
    context.reset();
  });

  afterAll(async () => {
    await context.close();
  });

  it("GET /wallet/balance usa o usuario autenticado injetado pelo guard", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/wallet/balance",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ balance: "100.00" });
    expect(context.getBalanceUseCase.calls).toEqual(["acc-1"]);
  });

  it("GET /wallet/balance retorna 404 quando o caso de uso falha", async () => {
    context.getBalanceUseCase.error = new ResourceNotFoundError(
      "Conta não encontrada.",
    );

    const response = await context.app.inject({
      method: "GET",
      url: "/wallet/balance",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: "Conta não encontrada.",
      error: "Not Found",
      statusCode: 404,
    });
    expect(context.getBalanceUseCase.calls).toEqual(["acc-1"]);
  });

  it("GET /wallet/balance bloqueia acesso sem autenticacao", async () => {
    context.setAuthenticatedUser(null);

    const response = await context.app.inject({
      method: "GET",
      url: "/wallet/balance",
    });

    expect(response.statusCode).toBe(401);
    expect(context.getBalanceUseCase.calls).toEqual([]);
  });

  it("POST /wallet/transfer executa transferencia valida", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(),
      payload: { username: "johndoe", value: "10.00" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ id: "tx-1", value: "10.00" });
    expect(context.createTransferUseCase.calls).toEqual([
      {
        senderUserId: "user-1",
        senderAccountId: "acc-1",
        recipientUsername: "johndoe",
        value: "10.0000",
      },
    ]);
  });

  it("POST /wallet/transfer normaliza username e valor antes do caso de uso", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(),
      payload: { username: " JohnDoe ", value: "10" },
    });

    expect(response.statusCode).toBe(201);
    expect(context.createTransferUseCase.calls).toEqual([
      {
        senderUserId: "user-1",
        senderAccountId: "acc-1",
        recipientUsername: "johndoe",
        value: "10.0000",
      },
    ]);
  });

  it("POST /wallet/transfer rejeita valor decimal invalido pelo pipe", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(),
      payload: { username: "johndoe", value: "10.99999" },
    });

    expect(response.statusCode).toBe(400);
    expect(context.createTransferUseCase.calls).toEqual([]);
  });

  it("POST /wallet/transfer rejeita campos extras sem chamar o caso de uso", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(),
      payload: { username: "johndoe", value: "10.00", note: "extra" },
    });

    expect(response.statusCode).toBe(400);
    expect(context.createTransferUseCase.calls).toEqual([]);
  });

  it("POST /wallet/transfer retorna erro de regra de negocio quando faltar destinatario", async () => {
    context.createTransferUseCase.error = new ResourceNotFoundError(
      "Usuário não encontrado.",
    );

    const response = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(),
      payload: { username: "ghost", value: "10.00" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: "Usuário não encontrado.",
      error: "Not Found",
      statusCode: 404,
    });
    expect(context.createTransferUseCase.calls).toEqual([
      {
        senderUserId: "user-1",
        senderAccountId: "acc-1",
        recipientUsername: "ghost",
        value: "10.0000",
      },
    ]);
  });

  it("POST /wallet/transfer retorna erro de validacao de negocio", async () => {
    context.createTransferUseCase.error = new ValidationDomainError(
      "Saldo insuficiente para a transferência.",
    );

    const response = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(),
      payload: { username: "johndoe", value: "999.00" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "Saldo insuficiente para a transferência.",
      error: "Bad Request",
      statusCode: 400,
    });
    expect(context.createTransferUseCase.calls).toEqual([
      {
        senderUserId: "user-1",
        senderAccountId: "acc-1",
        recipientUsername: "johndoe",
        value: "999.0000",
      },
    ]);
  });

  it("POST /wallet/transfer rejeita repeticao da mesma chave na janela de protecao", async () => {
    await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(),
      payload: { username: "johndoe", value: "10.00" },
    });

    const secondResponse = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(),
      payload: { username: "johndoe", value: "10.00" },
    });

    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toEqual({
      message:
        "Esta transação acabou de ser realizada e, por segurança, não pode ser enviada novamente agora.",
      error: "Conflict",
      statusCode: 409,
    });
    expect(context.createTransferUseCase.calls).toHaveLength(1);
  });

  it("POST /wallet/transfer trata a mesma chave com casing diferente como repeticao e retorna 409", async () => {
    await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(idempotencyKey.toUpperCase()),
      payload: { username: "johndoe", value: "10.00" },
    });

    const secondResponse = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders(idempotencyKey),
      payload: { username: "johndoe", value: "10.00" },
    });

    expect(secondResponse.statusCode).toBe(409);
    expect(context.createTransferUseCase.calls).toHaveLength(1);
  });

  it("POST /wallet/transfer exige o header Idempotency-Key antes de chamar o caso de uso", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      payload: { username: "johndoe", value: "10.00" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "O header Idempotency-Key é obrigatório para transferências.",
      error: "Bad Request",
      statusCode: 400,
    });
    expect(context.createTransferUseCase.calls).toEqual([]);
  });

  it("POST /wallet/transfer aceita chave composta de idempotencia", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/wallet/transfer",
      headers: transferHeaders("janedoe:johndoe:10.0000:123456"),
      payload: { username: "johndoe", value: "10.00" },
    });

    expect(response.statusCode).toBe(201);
    expect(context.createTransferUseCase.calls).toHaveLength(1);
  });

  it("GET /wallet/transactions aplica transformacao e filtros do query pipe", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/wallet/transactions?page=2&limit=5&type=cash-in&order=ASC&startDate=2026-05-01&endDate=2026-05-31",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().meta).toEqual({ total: 1, page: 1, limit: 10 });
    expect(context.listTransactionsUseCase.calls).toEqual([
      {
        accountId: "acc-1",
        page: 2,
        limit: 5,
        type: "cash-in",
        order: "ASC",
        startDate: "2026-05-01",
        endDate: "2026-05-31",
      },
    ]);
  });

  it("GET /wallet/transactions usa a paginacao padrao quando a query nao informa valores", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/wallet/transactions",
    });

    expect(response.statusCode).toBe(200);
    expect(context.listTransactionsUseCase.calls).toEqual([
      {
        accountId: "acc-1",
        page: 1,
        limit: 10,
      },
    ]);
  });

  it("GET /wallet/transactions rejeita pagina invalida pelo pipe", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/wallet/transactions?page=0&limit=5",
    });

    expect(response.statusCode).toBe(400);
    expect(context.listTransactionsUseCase.calls).toEqual([]);
  });

  it("GET /wallet/transactions rejeita intervalo de datas inconsistente sem chamar o caso de uso", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/wallet/transactions?startDate=2026-05-31&endDate=2026-05-01",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "A data inicial não pode ser maior que a data final.",
      error: "Bad Request",
      statusCode: 400,
    });
    expect(context.listTransactionsUseCase.calls).toEqual([]);
  });

  it("GET /wallet/transactions rejeita tipo invalido sem chamar o caso de uso", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/wallet/transactions?type=invalid",
    });

    expect(response.statusCode).toBe(400);
    expect(context.listTransactionsUseCase.calls).toEqual([]);
  });
});
