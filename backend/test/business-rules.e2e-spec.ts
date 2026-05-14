import { createE2ETestApp, type E2ETestAppContext } from '../src/modules/e2e-test-app.factory';

describe('Business Rules E2E', () => {
  let context: E2ETestAppContext;

  beforeAll(async () => {
    context = await createE2ETestApp();
  });

  afterEach(() => {
    context.reset();
  });

  afterAll(async () => {
    await context.close();
  });

  async function registerAndLogin(
    username: string,
    password = 'Senha123',
  ): Promise<string> {
    await context.app.inject({
      method: 'POST',
      url: '/users',
      payload: { username, password },
    });
    const res = await context.app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { username, password },
    });
    return (res.json() as { accessToken: string }).accessToken;
  }

  function transfer(
    token: string,
    username: string,
    value: string,
    idempotencyKey: string,
  ) {
    return context.app.inject({
      method: 'POST',
      url: '/wallet/transfer',
      headers: {
        authorization: `Bearer ${token}`,
        'idempotency-key': idempotencyKey,
      },
      payload: { username, value },
    });
  }

  describe('Cadastro de usuários', () => {
    it('cria usuário com saldo inicial e retorna id + username', async () => {
      const response = await context.app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'janedoe', password: 'Senha123' },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json<{ id: string; username: string }>();
      expect(body.username).toBe('janedoe');
      expect(body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('normaliza o username (trim + lowercase) antes de aplicar a regra de unicidade', async () => {
      const response = await context.app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: ' JaneDoe ', password: 'Senha123' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json<{ username: string }>().username).toBe('janedoe');
    });

    it('bloqueia cadastro quando o username já estiver em uso', async () => {
      await context.app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'janedoe', password: 'Senha123' },
      });

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
    });
  });

  describe('Autenticação', () => {
    it('normaliza o username no login e retorna token JWT válido', async () => {
      await context.app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'janedoe', password: 'Senha123' },
      });

      const response = await context.app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { username: ' JaneDoe ', password: 'Senha123' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty('accessToken');
    });

    it('nega acesso quando a senha estiver errada', async () => {
      await context.app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'janedoe', password: 'Senha123' },
      });

      const response = await context.app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { username: 'janedoe', password: 'SenhaErrada1' },
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
    it('debita remetente e credita destinatário — saldo vai de 100 para 90', async () => {
      const [tokenRemetente] = await Promise.all([
        registerAndLogin('remetente'),
        registerAndLogin('destinatario'),
      ]);

      const transferRes = await transfer(tokenRemetente, 'destinatario', '10.00', 'remetente:destinatario:10.0000:001');

      expect(transferRes.statusCode).toBe(201);
      expect(transferRes.json()).toMatchObject({ value: '10.00' });

      const balanceRes = await context.app.inject({
        method: 'GET',
        url: '/wallet/balance',
        headers: { authorization: `Bearer ${tokenRemetente}` },
      });
      expect(balanceRes.json<{ balance: string }>().balance).toBe('90.00');
    });

    it('impede double-spend quando a mesma chave de idempotência é reenviada na janela de proteção', async () => {
      const [token] = await Promise.all([
        registerAndLogin('alice'),
        registerAndLogin('bob'),
      ]);

      const first = await transfer(token, 'bob', '10.00', 'alice:bob:10.0000:001');
      const second = await transfer(token, 'bob', '10.00', 'ALICE:BOB:10.0000:001');

      expect(first.statusCode).toBe(201);
      expect(second.statusCode).toBe(409);
      expect(second.json()).toEqual({
        message:
          'Esta transação acabou de ser realizada e, por segurança, não pode ser enviada novamente agora.',
        error: 'Conflict',
        statusCode: 409,
      });
    });

    it('rejeita a transferência quando o saldo for insuficiente', async () => {
      const [token] = await Promise.all([
        registerAndLogin('pobre'),
        registerAndLogin('rico'),
      ]);

      const response = await transfer(token, 'rico', '999.00', 'pobre:rico:999.0000:001');

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        message: 'Saldo insuficiente para a transferência.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('rejeita a transferência quando o destinatário não existir', async () => {
      const token = await registerAndLogin('sender');

      const response = await transfer(token, 'fantasma', '10.00', 'sender:fantasma:10.0000:001');

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        message: 'Usuário não encontrado.',
        error: 'Not Found',
        statusCode: 404,
      });
    });

    it('rejeita a transferência para a própria conta', async () => {
      const token = await registerAndLogin('narciso');

      const response = await transfer(token, 'narciso', '10.00', 'narciso:narciso:10.0000:001');

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Histórico financeiro', () => {
    it('lista transações com paginação e filtro por tipo cash-out', async () => {
      const [tokenCarla] = await Promise.all([
        registerAndLogin('carla'),
        registerAndLogin('davi'),
      ]);

      await transfer(tokenCarla, 'davi', '5.00', 'carla:davi:5.0000:001');

      const response = await context.app.inject({
        method: 'GET',
        url: '/wallet/transactions?type=cash-out',
        headers: { authorization: `Bearer ${tokenCarla}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{
        data: Array<{ type: string }>;
        meta: { total: number };
      }>();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].type).toBe('cash-out');
      expect(body.meta.total).toBe(1);
    });

    it('rejeita intervalo de datas inconsistente antes de consultar o histórico', async () => {
      const token = await registerAndLogin('elena');

      const response = await context.app.inject({
        method: 'GET',
        url: '/wallet/transactions?startDate=2026-05-31&endDate=2026-05-01',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        message: 'A data inicial não pode ser maior que a data final.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });
  });
});
