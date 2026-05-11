import { ArgumentsHost, HttpStatus } from "@nestjs/common";
import {
  AuthenticationError,
  ResourceConflictError,
  ResourceNotFoundError,
  ValidationDomainError,
} from "../../domain/errors/domain.errors";
import { DomainExceptionFilter } from "./domain-exception.filter";

class FakeHttpResponse {
  public statusCode: number | null = null;
  public body: unknown = null;

  status(code: number) {
    this.statusCode = code;
    return {
      json: (body: unknown) => {
        this.body = body;
      },
    };
  }
}

describe("DomainExceptionFilter", () => {
  function createHost() {
    const response = new FakeHttpResponse();
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as ArgumentsHost;

    return { host, response };
  }

  it("retorna 404 para recurso nao encontrado", () => {
    const { host, response } = createHost();
    const filter = new DomainExceptionFilter();

    filter.catch(new ResourceNotFoundError("Usuário não encontrado."), host);

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      message: "Usuário não encontrado.",
      error: "Not Found",
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it("retorna 401 para erro de autenticacao", () => {
    const { host, response } = createHost();
    const filter = new DomainExceptionFilter();

    filter.catch(new AuthenticationError("Credenciais inválidas."), host);

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body).toEqual({
      message: "Credenciais inválidas.",
      error: "Unauthorized",
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  });

  it("retorna 409 para conflito", () => {
    const { host, response } = createHost();
    const filter = new DomainExceptionFilter();

    filter.catch(new ResourceConflictError("Username já utilizado."), host);

    expect(response.statusCode).toBe(HttpStatus.CONFLICT);
    expect(response.body).toEqual({
      message: "Username já utilizado.",
      error: "Conflict",
      statusCode: HttpStatus.CONFLICT,
    });
  });

  it("retorna 400 para erro de validacao", () => {
    const { host, response } = createHost();
    const filter = new DomainExceptionFilter();

    filter.catch(
      new ValidationDomainError("Saldo insuficiente para a transferência."),
      host,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toEqual({
      message: "Saldo insuficiente para a transferência.",
      error: "Bad Request",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it("retorna 500 para erro nao mapeado", () => {
    const { host, response } = createHost();
    const filter = new DomainExceptionFilter();

    filter.catch(new Error("Erro inesperado"), host);

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      message: "Erro interno.",
      error: "Internal Server Error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });
});
