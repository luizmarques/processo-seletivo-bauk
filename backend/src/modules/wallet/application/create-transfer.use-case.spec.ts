import { ResourceNotFoundError, ValidationDomainError } from '../../../shared/domain/errors/domain.errors';
import { CreateTransferUseCase } from './create-transfer.use-case';

const senderUserId = '11111111-1111-4111-8111-111111111111';
const recipientUserId = '22222222-2222-4222-8222-222222222222';
const senderAccountId = '33333333-3333-4333-8333-333333333333';
const recipientAccountId = '44444444-4444-4444-8444-444444444444';

class FakeTransferUserRepository {
  public usersById = new Map<string, { id: string; username: string; accountId: string }>();
  public usersByUsername = new Map<string, { id: string; username: string; accountId: string }>();

  async findById(id: string) {
    return this.usersById.get(id) ?? null;
  }

  async findByUsername(username: string) {
    return this.usersByUsername.get(username) ?? null;
  }
}

class FakeTransferAccountRepository {
  public accountsById = new Map<string, { id: string; balance: string }>();

  async findById(id: string) {
    const account = this.accountsById.get(id);
    return account ? { ...account } : null;
  }
}

class FakeTransactionRepository {
  public executeTransferCalls: Array<{
    senderAccount: { id: string; balance: string };
    recipientAccount: { id: string; balance: string };
    value: string;
  }> = [];
  public transactionId = 'tx-1';

  async executeTransfer(input: {
    senderAccount: { id: string; balance: string };
    recipientAccount: { id: string; balance: string };
    value: string;
  }) {
    this.executeTransferCalls.push(input);
    return { id: this.transactionId, value: input.value };
  }
}

describe('CreateTransferUseCase', () => {
  function createSut() {
    const userRepository = new FakeTransferUserRepository();
    const accountRepository = new FakeTransferAccountRepository();
    const transactionRepository = new FakeTransactionRepository();

    userRepository.usersById.set(senderUserId, { id: senderUserId, username: 'janedoe', accountId: senderAccountId });
    userRepository.usersByUsername.set('johndoe', {
      id: recipientUserId,
      username: 'johndoe',
      accountId: recipientAccountId,
    });
    accountRepository.accountsById.set(senderAccountId, { id: senderAccountId, balance: '100.0000' });
    accountRepository.accountsById.set(recipientAccountId, { id: recipientAccountId, balance: '50.0000' });

    const sut = new CreateTransferUseCase(
      userRepository as never,
      accountRepository as never,
      transactionRepository as never,
    );

    return { sut, userRepository, accountRepository, transactionRepository };
  }

  it('transfere saldo em quatro casas e retorna valor arredondado ao usuario', async () => {
    const { sut, transactionRepository } = createSut();

    const result = await sut.execute({
      senderUserId,
      senderAccountId,
      recipientUsername: 'johndoe',
      value: '10.9876',
    });

    expect(result).toEqual({ id: 'tx-1', value: '10.99' });
    expect(transactionRepository.executeTransferCalls).toEqual([
      {
        senderAccount: { id: senderAccountId, balance: '89.0124' },
        recipientAccount: { id: recipientAccountId, balance: '60.9876' },
        value: '10.9876',
      },
    ]);
  });

  it('normaliza valor inteiro antes de enviar ao repositorio', async () => {
    const { sut, transactionRepository } = createSut();

    const result = await sut.execute({
      senderUserId,
      senderAccountId,
      recipientUsername: 'johndoe',
      value: '10',
    });

    expect(result).toEqual({ id: 'tx-1', value: '10.00' });
    expect(transactionRepository.executeTransferCalls[0]?.value).toBe('10.0000');
  });

  it('impede auto transferencia', async () => {
    const { sut, userRepository, transactionRepository } = createSut();
    userRepository.usersByUsername.set('janedoe', { id: senderUserId, username: 'janedoe', accountId: senderAccountId });

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: 'janedoe',
        value: '10.0000',
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ValidationDomainError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it('impede transferencia sem saldo', async () => {
    const { sut, accountRepository, transactionRepository } = createSut();
    accountRepository.accountsById.set(senderAccountId, { id: senderAccountId, balance: '5.0000' });

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: 'johndoe',
        value: '10.0000',
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ValidationDomainError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it('falha quando remetente nao existe', async () => {
    const { sut, userRepository, transactionRepository } = createSut();
    userRepository.usersById.clear();

    let error: unknown;
    try {
      await sut.execute({
        senderUserId: '55555555-5555-4555-8555-555555555555',
        senderAccountId,
        recipientUsername: 'johndoe',
        value: '10.0000',
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it('falha quando destinatario nao existe', async () => {
    const { sut, userRepository, transactionRepository } = createSut();
    userRepository.usersByUsername.clear();

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: 'ghost',
        value: '10.0000',
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it('falha quando a conta remetente nao existe', async () => {
    const { sut, accountRepository, transactionRepository } = createSut();
    accountRepository.accountsById.delete(senderAccountId);

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: 'johndoe',
        value: '10.0000',
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it('falha quando a conta destinataria nao existe', async () => {
    const { sut, accountRepository, transactionRepository } = createSut();
    accountRepository.accountsById.delete(recipientAccountId);

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: 'johndoe',
        value: '10.0000',
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });

  it('falha quando o valor e invalido sem consultar dependencias', async () => {
    const { sut, transactionRepository } = createSut();

    let error: unknown;
    try {
      await sut.execute({
        senderUserId,
        senderAccountId,
        recipientUsername: 'johndoe',
        value: '0.0000',
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ValidationDomainError);
    expect(transactionRepository.executeTransferCalls).toEqual([]);
  });
});
