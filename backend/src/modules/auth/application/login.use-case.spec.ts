import { AuthenticationError } from "../../../shared/domain/errors/domain.errors";
import { LoginUseCase } from "./login.use-case";

class FakeLoginUserRepository {
  public usersByUsername = new Map<
    string,
    { id: string; username: string; password: string; accountId: string }
  >();

  async findByUsername(username: string) {
    return this.usersByUsername.get(username) ?? null;
  }
}

class FakePasswordComparator {
  public compareCalls: Array<{ value: string; hashed: string }> = [];
  public shouldMatch = true;

  async compare(
    value: { toString(): string },
    hashed: { toString(): string },
  ): Promise<boolean> {
    this.compareCalls.push({
      value: value.toString(),
      hashed: hashed.toString(),
    });
    return this.shouldMatch;
  }
}

class FakeTokenService {
  public signCalls: Array<{
    sub: string;
    username: string;
    accountId: string;
  }> = [];

  async sign(payload: {
    sub: { toString(): string };
    username: { toString(): string };
    accountId: { toString(): string };
  }): Promise<string> {
    this.signCalls.push({
      sub: payload.sub.toString(),
      username: payload.username.toString(),
      accountId: payload.accountId.toString(),
    });
    return `token:${payload.username.toString()}`;
  }
}

describe("LoginUseCase", () => {
  it("retorna token com payload correto ao autenticar", async () => {
    const repository = new FakeLoginUserRepository();
    repository.usersByUsername.set("janedoe", {
      id: "11111111-1111-4111-8111-111111111111",
      username: "janedoe",
      password: "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e",
      accountId: "22222222-2222-4222-8222-222222222222",
    });
    const passwordHasher = new FakePasswordComparator();
    const tokenService = new FakeTokenService();
    const sut = new LoginUseCase(
      repository as never,
      passwordHasher as never,
      tokenService as never,
    );

    const result = await sut.execute({
      username: "janedoe",
      password: "Senha123",
    });

    expect(result).toEqual({ accessToken: "token:janedoe" });
    expect(passwordHasher.compareCalls).toEqual([
      {
        value: "Senha123",
        hashed: "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e",
      },
    ]);
    expect(tokenService.signCalls).toEqual([
      {
        sub: "11111111-1111-4111-8111-111111111111",
        username: "janedoe",
        accountId: "22222222-2222-4222-8222-222222222222",
      },
    ]);
  });

  it("falha ao autenticar com senha invalida e nao assina token", async () => {
    const repository = new FakeLoginUserRepository();
    repository.usersByUsername.set("janedoe", {
      id: "11111111-1111-4111-8111-111111111111",
      username: "janedoe",
      password: "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e",
      accountId: "22222222-2222-4222-8222-222222222222",
    });
    const passwordHasher = new FakePasswordComparator();
    passwordHasher.shouldMatch = false;
    const tokenService = new FakeTokenService();
    const sut = new LoginUseCase(
      repository as never,
      passwordHasher as never,
      tokenService as never,
    );

    let error: unknown;
    try {
      await sut.execute({ username: "janedoe", password: "Senha123" });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(tokenService.signCalls).toEqual([]);
  });

  it("falha ao autenticar com usuario inexistente sem comparar senha", async () => {
    const repository = new FakeLoginUserRepository();
    const passwordHasher = new FakePasswordComparator();
    const tokenService = new FakeTokenService();
    const sut = new LoginUseCase(
      repository as never,
      passwordHasher as never,
      tokenService as never,
    );

    let error: unknown;
    try {
      await sut.execute({ username: "ghost", password: "Senha123" });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(passwordHasher.compareCalls).toEqual([]);
    expect(tokenService.signCalls).toEqual([]);
  });
});
