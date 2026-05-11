import { AuthenticationError } from "../../shared/domain/errors/domain.errors";
import {
  createHttpTestApp,
  type HttpTestAppContext,
} from "../http-test-app.factory";

describe("Auth HTTP Integration", () => {
  let context: HttpTestAppContext;

  beforeAll(async () => {
    context = await createHttpTestApp();
  });

  beforeEach(() => {
    context.reset();
  });

  afterAll(async () => {
    await context.close();
  });

  it("POST /auth/login autentica com dto valido", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "janedoe", password: "Senha123" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ accessToken: "jwt-token" });
    expect(context.loginUseCase.calls).toEqual([
      { username: "janedoe", password: "Senha123" },
    ]);
  });

  it("POST /auth/login normaliza o username antes de chamar o caso de uso", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: " JaneDoe ", password: "Senha123" },
    });

    expect(response.statusCode).toBe(200);
    expect(context.loginUseCase.calls).toEqual([
      { username: "janedoe", password: "Senha123" },
    ]);
  });

  it("POST /auth/login retorna 401 quando a autenticacao falha", async () => {
    context.loginUseCase.error = new AuthenticationError(
      "Credenciais inválidas.",
    );

    const response = await context.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "janedoe", password: "Senha123" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: "Credenciais inválidas.",
      error: "Unauthorized",
      statusCode: 401,
    });
  });

  it("POST /auth/login rejeita body invalido pelo pipe", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "janedoe", password: "123" },
    });

    expect(response.statusCode).toBe(400);
    expect(context.loginUseCase.calls).toEqual([]);
  });

  it("POST /auth/login rejeita campos extras sem chamar o caso de uso", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "janedoe", password: "Senha123", role: "admin" },
    });

    expect(response.statusCode).toBe(400);
    expect(context.loginUseCase.calls).toEqual([]);
  });

  it("POST /auth/logout responde mensagem estatica do controller", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/auth/logout",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: "Logout realizado no cliente com remocao do token.",
    });
  });
});
