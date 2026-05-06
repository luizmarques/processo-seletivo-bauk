import { ResourceNotFoundError } from '../../../shared/domain/errors/domain.errors';
import { GetBalanceUseCase } from './get-balance.use-case';

class FakeAccountLookupRepository {
  public accountsById = new Map<string, { id: string; balance: string }>();

  async findById(id: string) {
    return this.accountsById.get(id) ?? null;
  }
}

describe('GetBalanceUseCase', () => {
  it('retorna saldo da conta', async () => {
    const repository = new FakeAccountLookupRepository();
    repository.accountsById.set('11111111-1111-4111-8111-111111111111', {
      id: '11111111-1111-4111-8111-111111111111',
      balance: '100.9876',
    });
    const sut = new GetBalanceUseCase(repository as never);

    const result = await sut.execute('11111111-1111-4111-8111-111111111111');

    expect(result).toEqual({ balance: '100.99' });
  });

  it('falha quando a conta nao existe', async () => {
    const repository = new FakeAccountLookupRepository();
    const sut = new GetBalanceUseCase(repository as never);

    let error: unknown;
    try {
      await sut.execute('11111111-1111-4111-8111-111111111111');
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ResourceNotFoundError);
  });
});
