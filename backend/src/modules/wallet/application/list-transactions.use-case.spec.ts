import { ListTransactionsUseCase } from './list-transactions.use-case';

class FakeTransactionRepository {
  public lastFilters: Record<string, unknown> | null = null;
  public response = {
    data: [] as Array<{
      id: string;
      debitedAccountId: string;
      debitedAccount: { user: { username: string } };
      creditedAccountId: string;
      creditedAccount: { user: { username: string } };
      value: string;
      createdAt: Date;
    }>,
    total: 0,
    page: 1,
    limit: 10,
  };

  async listByAccount(filters: Record<string, unknown>) {
    this.lastFilters = filters;
    return this.response;
  }
}

describe('ListTransactionsUseCase', () => {
  const accountId = '11111111-1111-4111-8111-111111111111';
  const creditedAccountId = '22222222-2222-4222-8222-222222222222';
  const otherAccountId = '33333333-3333-4333-8333-333333333333';
  const transactionOneId = '44444444-4444-4444-8444-444444444444';
  const transactionTwoId = '55555555-5555-4555-8555-555555555555';

  it('mapeia tipo de transacao por participacao da conta e preserva meta', async () => {
    const repository = new FakeTransactionRepository();
    repository.response = {
      data: [
        {
          id: transactionOneId,
          debitedAccountId: accountId,
          debitedAccount: { user: { username: 'janedoe' } },
          creditedAccountId,
          creditedAccount: { user: { username: 'johndoe' } },
          value: '10.9876',
          createdAt: new Date('2026-05-06T10:00:00.000Z'),
        },
        {
          id: transactionTwoId,
          debitedAccountId: otherAccountId,
          debitedAccount: { user: { username: 'alice_smith' } },
          creditedAccountId: accountId,
          creditedAccount: { user: { username: 'janedoe' } },
          value: '8.3450',
          createdAt: new Date('2026-05-06T11:00:00.000Z'),
        },
      ],
      total: 2,
      page: 2,
      limit: 5,
    };
    const sut = new ListTransactionsUseCase(repository as never);

    const result = await sut.execute({
      accountId,
      page: 2,
      limit: 5,
      type: 'cash-in',
      order: 'ASC',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });

    expect(repository.lastFilters).toEqual({
      accountId,
      page: 2,
      limit: 5,
      type: 'cash-in',
      order: 'ASC',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });
    expect(result.data).toEqual([
      {
        id: transactionOneId,
        debitedAccountId: accountId,
        debitedUsername: 'janedoe',
        creditedAccountId,
        creditedUsername: 'johndoe',
        value: '10.99',
        createdAt: new Date('2026-05-06T10:00:00.000Z'),
        type: 'cash-out',
      },
      {
        id: transactionTwoId,
        debitedAccountId: otherAccountId,
        debitedUsername: 'alice_smith',
        creditedAccountId: accountId,
        creditedUsername: 'janedoe',
        value: '8.34',
        createdAt: new Date('2026-05-06T11:00:00.000Z'),
        type: 'cash-in',
      },
    ]);
    expect(result.meta).toEqual({ total: 2, page: 2, limit: 5 });
  });

  it('retorna lista vazia quando o repositorio nao encontra movimentos', async () => {
    const repository = new FakeTransactionRepository();
    const sut = new ListTransactionsUseCase(repository as never);

    const result = await sut.execute({ accountId, page: 1, limit: 10 });

    expect(result.data).toEqual([]);
    expect(result.meta).toEqual({ total: 0, page: 1, limit: 10 });
  });
});
