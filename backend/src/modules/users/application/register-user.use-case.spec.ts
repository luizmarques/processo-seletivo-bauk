import { ResourceConflictError } from '../../../shared/domain/errors/domain.errors';
import { RegisterUserUseCase } from './register-user.use-case';

class FakeUserRepository {
  public usersByUsername = new Map<string, { id: string; username: string; password: string; accountId: string }>();
  public createWithAccountCalls: Array<{ username: string; password: string; initialBalance: string }> = [];

  async findByUsername(username: string) {
    return this.usersByUsername.get(username) ?? null;
  }

  async createWithAccount(input: { username: string; password: string; initialBalance: string }) {
    this.createWithAccountCalls.push(input);
    return {
      id: 'user-created',
      username: input.username,
      password: input.password,
      accountId: 'account-created',
    };
  }
}

class FakePasswordHasher {
  public hashCalls: string[] = [];

  async hash(value: { toString(): string }): Promise<{ toString(): string }> {
    this.hashCalls.push(value.toString());
    return {
      toString: () => '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e',
    };
  }
}

describe('RegisterUserUseCase', () => {
  it('cria usuario com conta inicial e senha criptografada', async () => {
    process.env.INITIAL_BALANCE = '100.0000';
    const userRepository = new FakeUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const sut = new RegisterUserUseCase(userRepository as never, passwordHasher as never);

    const result = await sut.execute({ username: 'janedoe', password: 'Senha123' });

    expect(result).toEqual({ id: 'user-created', username: 'janedoe' });
    expect(passwordHasher.hashCalls).toEqual(['Senha123']);
    expect(userRepository.createWithAccountCalls).toEqual([
      {
        username: 'janedoe',
        password: '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiB0JzZMfjNV8iPBUFeCFGXFq8iDS.e',
        initialBalance: '100.0000',
      },
    ]);
  });

  it('usa saldo inicial padrao quando a variavel nao existe', async () => {
    delete process.env.INITIAL_BALANCE;
    const userRepository = new FakeUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const sut = new RegisterUserUseCase(userRepository as never, passwordHasher as never);

    await sut.execute({ username: 'johndoe', password: 'Senha123' });

    expect(userRepository.createWithAccountCalls[0]?.initialBalance).toBe('100.0000');
  });

  it('impede username duplicado sem tentar hash ou criacao', async () => {
    const userRepository = new FakeUserRepository();
    userRepository.usersByUsername.set('janedoe', {
      id: 'user-1',
      username: 'janedoe',
      password: 'hashed',
      accountId: 'acc-1',
    });
    const passwordHasher = new FakePasswordHasher();
    const sut = new RegisterUserUseCase(userRepository as never, passwordHasher as never);

    let error: unknown;
    try {
      await sut.execute({ username: 'janedoe', password: 'Senha123' });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceConflictError);
    expect(passwordHasher.hashCalls).toEqual([]);
    expect(userRepository.createWithAccountCalls).toEqual([]);
  });
});
