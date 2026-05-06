import { ResourceConflictError } from '../../shared/domain/errors/domain.errors';
import { createHttpTestApp, type HttpTestAppContext } from '../http-test-app.factory';

describe('Users HTTP Integration', () => {
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

  it('POST /users aceita cadastro valido e aciona o caso de uso', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/users',
      payload: { username: 'janedoe', password: 'Senha123' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ id: 'user-1', username: 'janedoe' });
    expect(context.registerUserUseCase.calls).toEqual([{ username: 'janedoe', password: 'Senha123' }]);
  });

  it('POST /users normaliza o username antes de chamar o caso de uso', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/users',
      payload: { username: ' JaneDoe ', password: 'Senha123' },
    });

    expect(response.statusCode).toBe(201);
    expect(context.registerUserUseCase.calls).toEqual([{ username: 'janedoe', password: 'Senha123' }]);
  });

  it('POST /users rejeita senha fora da regra pelo pipe', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/users',
      payload: { username: 'janedoe', password: 'senha123' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toContain('A senha deve conter ao menos uma letra maiúscula e um número.');
    expect(context.registerUserUseCase.calls).toEqual([]);
  });

  it('POST /users rejeita username curto sem chamar o caso de uso', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/users',
      payload: { username: 'ab', password: 'Senha123' },
    });

    expect(response.statusCode).toBe(400);
    expect(context.registerUserUseCase.calls).toEqual([]);
  });

  it('POST /users rejeita campos extras sem chamar o caso de uso', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/users',
      payload: { username: 'janedoe', password: 'Senha123', balance: '9999' },
    });

    expect(response.statusCode).toBe(400);
    expect(context.registerUserUseCase.calls).toEqual([]);
  });

  it('POST /users retorna 409 quando a regra de negocio detectar conflito', async () => {
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
    expect(context.registerUserUseCase.calls).toEqual([{ username: 'janedoe', password: 'Senha123' }]);
  });
});
