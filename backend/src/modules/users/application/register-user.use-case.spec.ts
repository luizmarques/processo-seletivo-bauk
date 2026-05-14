import { ResourceConflictError } from "../../../shared/domain/errors/domain.errors";
import type { DomainEvent } from "../../../shared/domain/events/domain-event";
import { User } from "../domain/user";
import { RegisterUserUseCase } from "./register-user.use-case";

class FakeUserRepository {
  public usersByUsername = new Map<
    string,
    { id: string; username: string; password: string; accountId: string }
  >();
  public createWithAccountCalls: Array<{ username: string; password: string }> =
    [];

  async findByUsername(username: string) {
    return this.usersByUsername.get(username) ?? null;
  }

  async createWithAccount(input: { username: string; password: string }) {
    this.createWithAccountCalls.push(input);
    return User.register("user-created", input.username, "account-created", input.password);
  }
}

class FakePasswordHasher {
  public hashCalls: string[] = [];

  async hash(value: { toString(): string }): Promise<{ toString(): string }> {
    this.hashCalls.push(value.toString());
    return {
      toString: () =>
        "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e",
    };
  }
}

class FakeDomainEventPublisher {
  public published: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }
}

describe("RegisterUserUseCase", () => {
  function createSut() {
    const userRepository = new FakeUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const eventPublisher = new FakeDomainEventPublisher();
    const sut = new RegisterUserUseCase(
      userRepository as never,
      passwordHasher as never,
      eventPublisher as never,
    );
    return { sut, userRepository, passwordHasher, eventPublisher };
  }

  it("cria usuario com conta inicial e senha criptografada", async () => {
    const { sut, userRepository, passwordHasher } = createSut();

    const result = await sut.execute({
      username: "janedoe",
      password: "Senha123",
    });

    expect(result).toEqual({ id: "user-created", username: "janedoe" });
    expect(passwordHasher.hashCalls).toEqual(["Senha123"]);
    expect(userRepository.createWithAccountCalls).toEqual([
      {
        username: "janedoe",
        password:
          "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e",
      },
    ]);
  });

  it("publica evento UserRegistered apos criar o usuario", async () => {
    const { sut, eventPublisher } = createSut();

    await sut.execute({ username: "janedoe", password: "Senha123" });

    expect(eventPublisher.published).toHaveLength(1);
    expect(eventPublisher.published[0].eventName).toBe("user.registered");
  });

  it("ignora qualquer env divergente ao preparar o cadastro", async () => {
    const previousInitialBalance = process.env.INITIAL_BALANCE;
    process.env.INITIAL_BALANCE = "999.9999";
    try {
      const { sut, userRepository } = createSut();

      await sut.execute({ username: "johndoe", password: "Senha123" });

      expect(userRepository.createWithAccountCalls[0]).toEqual({
        username: "johndoe",
        password:
          "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e",
      });
    } finally {
      if (previousInitialBalance === undefined) {
        delete process.env.INITIAL_BALANCE;
      } else {
        process.env.INITIAL_BALANCE = previousInitialBalance;
      }
    }
  });

  it("impede username duplicado sem tentar hash ou criacao", async () => {
    const { sut, userRepository, passwordHasher, eventPublisher } = createSut();
    userRepository.usersByUsername.set("janedoe", {
      id: "user-1",
      username: "janedoe",
      password: "hashed",
      accountId: "acc-1",
    });

    let error: unknown;
    try {
      await sut.execute({ username: "janedoe", password: "Senha123" });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceConflictError);
    expect(passwordHasher.hashCalls).toEqual([]);
    expect(userRepository.createWithAccountCalls).toEqual([]);
    expect(eventPublisher.published).toHaveLength(0);
  });
});
