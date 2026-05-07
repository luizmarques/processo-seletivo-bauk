# Instruções da Aplicação

## Visão Geral

Aplicação fullstack para transferências internas entre usuários, composta por:

- backend `NestJS`
- frontend `Vue 3`
- `PostgreSQL`
- `Redis`
- autenticação JWT
- proteção de repetição para `POST /wallet/transfer` com `Idempotency-Key`

Com `docker compose`, o backend executa migrations e seed automaticamente antes de iniciar a API.

## Como subir a aplicação

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

## Como acessar a aplicação

- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`
- swagger: `http://localhost:3000/api/docs`

## Como realizar o login

1. Acesse `http://localhost:5173/login`.
2. Informe `username` e `password`.
3. Ao autenticar, o frontend salva `token` e `username` no `localStorage`.
4. O usuário é redirecionado para `/dashboard`.

## Como realizar o cadastro

1. Acesse `http://localhost:5173/register`.
2. Informe um `username` com pelo menos 3 caracteres.
3. Informe uma senha com pelo menos 8 caracteres, contendo uma letra maiúscula e um número.
4. Após sucesso, o frontend redireciona para a tela de login.

Regra de negócio implementada:

- todo novo usuário é criado com saldo inicial fixo de `100.0000`
- essa regra é tratada como política obrigatória do domínio no fluxo de criação de conta
- o cadastro não aceita nem propaga `initialBalance` como entrada
- essa regra não depende de variável de ambiente

## Como realizar a transferência

1. Entre no dashboard autenticado.
2. Preencha o `username` do destinatário.
3. Informe o valor.
4. O frontend envia `POST /wallet/transfer` com `Authorization: Bearer <token>` e `Idempotency-Key`.

Observações reais do código:

- o backend aceita até 4 casas decimais;
- o frontend valida e envia no máximo 2 casas decimais;
- o backend bloqueia transferências para o próprio usuário;
- a proteção de idempotência usa Redis e impede repetir a mesma chave dentro do TTL configurado.

## Como visualizar as transações

1. Entre no dashboard.
2. A tabela de histórico é carregada automaticamente.
3. O frontend consulta `GET /wallet/transactions` com paginação.
4. A interface mostra 5 registros por página.

## Como filtrar as transações

Os filtros disponíveis na interface são:

- data inicial
- data final
- tipo: `cash-in` ou `cash-out`
- ordem: `DESC` ou `ASC`

A API também aceita:

- `page`
- `limit`

## Como realizar o log-out

1. Clique em `Sair` no dashboard.
2. O frontend chama `POST /auth/logout`.
3. Em seguida, remove `token` e `username` do `localStorage`.
4. O usuário volta para `/login`.

Importante: o endpoint `/auth/logout` apenas retorna uma mensagem informativa. O JWT não é invalidado no servidor.

## Usuários seed

Todos usam a senha `Senha123`:

Todos também começam com saldo inicial fixo de `100.0000`, aplicado pela mesma regra obrigatória usada no cadastro.

- `janedoe`
- `johndoe`
- `alice_smith`
- `bob_jones`
- `charlie_brown`
- `diana_prince`
- `edward_elric`
- `fiona_gallagher`
- `george_costanza`
- `hannah_montana`

## Exemplo de login manual

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"janedoe","password":"Senha123"}'
```

## Exemplo de transferência manual

```bash
curl -X POST http://localhost:3000/wallet/transfer \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Idempotency-Key: janedoe:johndoe:10.0000:10' \
  -d '{"username":"johndoe","value":"10.0000"}'
```

## Desenvolvimento local

### Backend

Pré-requisitos:

- PostgreSQL disponível e configurado via `.env`
- Redis disponível e configurado via `.env`

```bash
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Testes

```bash
cd backend
npm test
```
