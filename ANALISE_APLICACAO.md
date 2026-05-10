# Análise da Aplicação

Documento baseado no código-fonte atual do repositório. O conteúdo abaixo descreve apenas o que está implementado.

## Visão Geral

A aplicação é um sistema fullstack para transferências internas entre usuários.

O backend usa `NestJS`, `TypeORM`, `PostgreSQL`, `Redis`, autenticação `JWT`, Swagger e validação global.
O frontend usa `Vue 3`, `TypeScript`, `Pinia`, `Vue Router`, `Axios`, `Zod` e `Tailwind CSS`.

## O que o sistema faz

- autentica usuários com `POST /auth/login`
- cadastra novos usuários com `POST /users`
- exibe o saldo da conta autenticada em `GET /wallet/balance`
- realiza transferências entre usuários em `POST /wallet/transfer`
- lista o histórico de transações em `GET /wallet/transactions`
- protege a rota de transferência com `Idempotency-Key`
- expõe documentação Swagger em `/api/docs`

## Estrutura de pastas

```text
.
├── README.md
├── ANALISE_APLICACAO.md
├── docker-compose.yml
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── shared/
│       │   ├── auth/
│       │   ├── constants/
│       │   ├── domain/
│       │   ├── http/
│       │   ├── redis/
│       │   └── security/
│       ├── modules/
│       │   ├── auth/
│       │   ├── users/
│       │   └── wallet/
│       └── infrastructure/
│           └── database/
│               ├── seeds/
│               └── typeorm/
└── frontend/
    └── src/
        ├── main.ts
        ├── App.vue
        ├── router/
        ├── stores/
        ├── services/
        ├── validation/
        ├── views/
        ├── components/
        └── types/
```

## Backend

### Inicialização

O bootstrap está em `backend/src/main.ts`. Ele:

- cria a aplicação Nest
- habilita `CORS` para lista origen explícita
- aplica validação global com `ValidationPipe`
- registra `DomainExceptionFilter`
- expõe Swagger em `/api/docs`
- sobe a aplicação na porta `3000` por padrão

### Módulos

- `AuthModule` trata login e JWT
- `UsersModule` trata cadastro de usuários
- `WalletModule` trata saldo, transferência e histórico
- `RedisModule` fornece o client Redis de forma global

### Persistência

O `AppModule` conecta no PostgreSQL via `TypeOrmModule.forRoot`.
As entidades registradas são `UserEntity`, `AccountEntity` e `TransactionEntity`.

As migrations mostram a estrutura real do banco:

- `accounts` com `balance numeric(18,4)`
- `users` com `username`, `password` e `account_id`
- `transactions` com `debited_account_id`, `credited_account_id`, `value numeric(18,4)` e `created_at`
- índices em `transactions` por `debited_account_id + created_at` e `credited_account_id + created_at`

### Casos de uso

- `LoginUseCase` valida usuário e senha e gera JWT com `sub`, `username` e `accountId`
- `RegisterUserUseCase` cria usuário e conta em uma transação no banco
- `GetBalanceUseCase` busca a conta e formata o saldo para exibição
- `CreateTransferUseCase` valida remetente, destinatário, saldo e executa a transferência
- `ListTransactionsUseCase` monta o histórico paginado com tipo `cash-in` ou `cash-out`

### Repositórios

O código usa Repository Pattern com interfaces de domínio e implementações TypeORM:

- `UserRepository`
- `AccountRepository`
- `TransactionRepository`

### Regras de domínio

- `Username` normaliza para minúsculas e exige no mínimo 3 caracteres
- `PlainPassword` exige ao menos 8 caracteres, uma maiúscula e um número
- `TransferAmount` valida valor maior que zero e com no máximo 4 casas decimais
- `Balance` valida saldo não negativo
- `UuidValueObject` valida IDs UUID
- `DomainError` e suas variações são mapeadas pelo `DomainExceptionFilter`

## Frontend

### Estrutura

O frontend é uma SPA com:

- `Vue Router` para navegação
- `Pinia` para estado de autenticação
- `Axios` para comunicação com a API
- `Zod` para validação dos formulários

### Telas

- `LoginView.vue` autentica o usuário e salva `token` e `username` no `localStorage`
- `RegisterView.vue` cria conta e redireciona para login
- `DashboardView.vue` mostra saldo, faz transferências e lista histórico

### Serviços

- `api.ts` centraliza o client HTTP e injeta `Authorization: Bearer <token>`
- `auth-service.ts` chama login, cadastro e logout
- `wallet-service.ts` chama saldo, histórico e transferência
- `idempotency.ts` monta a chave composta da transferência
- `money.ts` normaliza e formata valores monetários

### Estado e rotas

- o store `auth` controla `token`, `username`, login, cadastro e logout
- a rota `/dashboard` faz apenas uma checagem de existência de token no `localStorage`

## Fluxos implementados

### Login

1. o usuário envia `username` e `password` para `POST /auth/login`
2. o backend valida as credenciais e retorna `accessToken`
3. o frontend salva o token no `localStorage`
4. o usuário é redirecionado para `/dashboard`

### Cadastro

1. o usuário envia `username` e `password` para `POST /users`
2. o backend verifica unicidade do username
3. a senha é hashada com `bcryptjs` usando 10 rounds
4. conta e usuário são criados em transação

### Transferência

1. o frontend envia `username`, `value` e `Idempotency-Key`
2. o backend valida token JWT, destinatário, valor e saldo
3. a transferência é persistida em transação de banco
4. o frontend recarrega saldo e histórico

### Histórico

1. o dashboard carrega histórico automaticamente
2. o frontend usa `limit` fixo de `5` itens por página
3. os filtros disponíveis na interface são data inicial, data final, tipo e ordem
4. a API também aceita `page` e `limit`

## Redis e idempotência

O Redis é usado no `IdempotencyInterceptor`.

O fluxo implementado é:

- ler o header `Idempotency-Key`
- exigir esse header em `POST /wallet/transfer`
- normalizar a chave para minúsculas
- negar requisições duplicadas com `409 Conflict`
- gravar um marcador `processing` enquanto a transferência está em andamento
- salvar a resposta final com TTL

Na prática:

- a aplicação não retorna o payload previamente salvo
- ela apenas bloqueia a reutilização da mesma chave enquanto o registro existir no Redis
- o TTL é lido de `IDEMPOTENCY_TTL_SECONDS`, com fallback efetivo para `5` segundos se o valor não for numérico válido
- no frontend, a chave enviada por padrão usa o componente final fixo `10`, salvo se outro valor vier de variável de ambiente

## Valores monetários e decimal

O código trata valores monetários com precisão decimal.

Isso aparece em vários pontos:

- banco com `numeric(18,4)`
- value objects `Money`, `TransferAmount` e `Balance`
- `decimal.js` no backend e no seed
- normalização de entrada no frontend
- formatação de saída para 2 casas decimais na interface

Observação prática:

- a API aceita até 4 casas decimais
- o formulário do frontend limita a entrada a 2 casas decimais

## Seed

O seed atual:

- roda automaticamente no container do backend
- também pode ser executado manualmente com `npm run seed`
- cria usuários apenas se a base estiver vazia
- cria 10 usuários com senha `Senha123`
- cria saldo inicial fixo de `100.0000` para cada conta
- segue a mesma regra obrigatória de domínio usada no fluxo real de cadastro
- gera 20 transações entre esses usuários

## Logout

O endpoint `POST /auth/logout` existe, mas o comportamento real é apenas:

- retornar uma mensagem estática
- não exigir autenticação
- não invalidar JWT no backend

O encerramento da sessão acontece de fato no frontend, com remoção de `token` e `username` do `localStorage`.

## Testes e validação executados

Validação observada no repositório:

- `npm test` no backend passou com `99` testes
- cobertura reportada acima de `99%` em statements e lines
- `npm run build` no frontend concluiu com sucesso
