import {
  AuthenticationError,
  ResourceConflictError,
  ResourceNotFoundError,
  ValidationDomainError,
} from '../shared/domain/errors/domain.errors';
import { createHttpTestApp, type HttpTestAppContext } from './http-test-app.factory';

describe('Business Rules E2E', () => {
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

  describe('Cadastro de usuários', () => {
    it('aceita somente credenciais válidas e normaliza o username antes de aplicar a regra de unicidade', async () => {
      const response = await context.app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: ' JaneDoe ', password: 'Senha123' },
      });

      expect(response.statusCode).toBe(201);
      expect(context.registerUserUseCase.calls).toEqual([
        { username: 'janedoe', password: 'Senha123' },
      ]);
    });

    it('bloqueia cadastro quando o username já estiver em uso', async () => {
      context.registerUserUseCase.error = new ResourceConflictError('Username já utilizado.');

      const response = await context.app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'janedoe', password: 'Senha123' },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({
        message: 'Username já utilizado.',
        error: 'Conflict',
        statusCode: 409,
      });
    });

    it('rejeita senha fora da política mínima antes de atingir a regra de negócio', async () => {
      const response = await context.app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'janedoe', password: 'senha123' },
      });

      expect(response.statusCode).toBe(400);
      expect(context.registerUserUseCase.calls).toEqual([]);
    });
  });

  describe('Autenticação', () => {
    it('normaliza o username no login e retorna o token do usuário autenticado', async () => {
      const response = await context.app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { username: ' JaneDoe ', password: 'Senha123' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ accessToken: 'jwt-token' });
      expect(context.loginUseCase.calls).toEqual([
        { username: 'janedoe', password: 'Senha123' },
      ]);
    });

    it('nega acesso quando as credenciais informadas não forem válidas', async () => {
      context.loginUseCase.error = new AuthenticationError('Credenciais inválidas.');

      const response = await context.app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { username: 'janedoe', password: 'Senha123' },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        message: 'Credenciais inválidas.',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });
  });

  describe('Transferências internas', () => {
    it('usa o usuário autenticado como origem e normaliza o valor monetário antes da transferência', async () => {
      const response = await context.app.inject({
        method: 'POST',
        url: '/wallet/transfer',
        headers: { 'idempotency-key': 'janedoe:johndoe:10.0000:123456' },
        payload: { username: ' JohnDoe ', value: '10' },
      });

      expect(response.statusCode).toBe(201);
      expect(context.createTransferUseCase.calls).toEqual([
        {
          senderUserId: 'user-1',
          senderAccountId: 'acc-1',
          recipientUsername: 'johndoe',
          value: '10.0000',
        },
      ]);
    });

    it('impede double-spend quando a mesma chave de idempotência é reenviada na janela de proteção', async () => {
      const firstResponse = await context.app.inject({
        method: 'POST',
        url: '/wallet/transfer',
        headers: { 'idempotency-key': 'janedoe:johndoe:10.0000:123456' },
        payload: { username: 'johndoe', value: '10.00' },
      });

      const secondResponse = await context.app.inject({
        method: 'POST',
        url: '/wallet/transfer',
        headers: { 'idempotency-key': 'JANEDOE:JOHNDOE:10.0000:123456' },
        payload: { username: 'johndoe', value: '10.00' },
      });

      expect(firstResponse.statusCode).toBe(201);
      expect(secondResponse.statusCode).toBe(409);
      expect(secondResponse.json()).toEqual({
        message: 'Esta transação acabou de ser realizada e, por segurança, não pode ser enviada novamente agora.',
        error: 'Conflict',
        statusCode: 409,
      });
      expect(context.createTransferUseCase.calls).toHaveLength(1);
    });

    it('rejeita a transferência quando o saldo for insuficiente', async () => {
      context.createTransferUseCase.error = new ValidationDomainError('Saldo insuficiente para a transferência.');

      const response = await context.app.inject({
        method: 'POST',
        url: '/wallet/transfer',
        headers: { 'idempotency-key': 'janedoe:johndoe:999.0000:123456' },
        payload: { username: 'johndoe', value: '999.00' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        message: 'Saldo insuficiente para a transferência.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('rejeita a transferência quando o destinatário não existir', async () => {
      context.createTransferUseCase.error = new ResourceNotFoundError('Usuário não encontrado.');

      const response = await context.app.inject({
        method: 'POST',
        url: '/wallet/transfer',
        headers: { 'idempotency-key': 'janedoe:ghost:10.0000:123456' },
        payload: { username: 'ghost', value: '10.00' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        message: 'Usuário não encontrado.',
        error: 'Not Found',
        statusCode: 404,
      });
    });
  });

  describe('Histórico financeiro', () => {
    it('aplica paginação e filtros usando a conta do usuário autenticado', async () => {
      const response = await context.app.inject({
        method: 'GET',
        url: '/wallet/transactions?page=2&limit=5&type=cash-in&order=ASC&startDate=2026-05-01&endDate=2026-05-31',
      });

      expect(response.statusCode).toBe(200);
      expect(context.listTransactionsUseCase.calls).toEqual([
        {
          accountId: 'acc-1',
          page: 2,
          limit: 5,
          type: 'cash-in',
          order: 'ASC',
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        },
      ]);
    });

    it('rejeita intervalo de datas inconsistente antes de consultar o histórico', async () => {
      const response = await context.app.inject({
        method: 'GET',
        url: '/wallet/transactions?startDate=2026-05-31&endDate=2026-05-01',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        message: 'A data inicial não pode ser maior que a data final.',
        error: 'Bad Request',
        statusCode: 400,
      });
      expect(context.listTransactionsUseCase.calls).toEqual([]);
    });
  });
});
