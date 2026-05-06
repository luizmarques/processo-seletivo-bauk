# Análise da Aplicação

Documento baseado no `README.md` e no código-fonte do repositório. O conteúdo abaixo descreve apenas o que está implementado no código.

## Visão Geral

A aplicação é um sistema fullstack para transferências internas entre usuários.

O backend usa `NestJS` com `TypeORM`, `PostgreSQL`, `Redis`, autenticação `JWT`, Swagger e validação global.
O frontend usa `Vue 3`, `TypeScript`, `Pinia`, `Vue Router`, `Axios`, `Zod` e `Tailwind CSS`.

## O Que O Sistema Faz

- Autentica usuários com `POST /auth/login`.
- Cadastra novos usuários com `POST /users`.
- Exibe o saldo da conta autenticada em `GET /wallet/balance`.
- Realiza transferências entre usuários em `POST /wallet/transfer`.
- Lista o histórico de transações em `GET /wallet/transactions`.
- Protege as transferências com `Idempotency-Key`.
- Expõe documentação Swagger em `/api/docs`.

## Estrutura De Pastas

```text
.
├── README.md
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
        ├── types/
        └── style.css
```

## Backend

### Inicialização

O bootstrap está em `backend/src/main.ts`. Ele:

- cria a aplicação Nest;
- habilita CORS;
- aplica validação global com `createRequestValidationPipe()`;
- registra `DomainExceptionFilter`;
- expõe Swagger em `/api/docs`;
- sobe a aplicação na porta `3000` por padrão.

### Módulos

- `AuthModule` trata login, JWT e estratégia de autenticação.
- `UsersModule` trata cadastro de usuários.
- `WalletModule` trata saldo, transferência e histórico.
- `RedisModule` fornece o client Redis de forma global.

### Persistência

O `AppModule` conecta no PostgreSQL via `TypeOrmModule.forRoot`.
As entidades registradas são `UserEntity`, `AccountEntity` e `TransactionEntity`.

As migrations mostram a estrutura real do banco:

- `accounts` com `balance numeric(18,4)`;
- `users` com `username`, `password` e `account_id`;
- `transactions` com `debited_account_id`, `credited_account_id`, `value numeric(18,4)` e `created_at`;
- índices em `transactions` por `debited_account_id + created_at` e `credited_account_id + created_at`.

### Casos De Uso

- `LoginUseCase` valida usuário e senha, e gera JWT com `sub`, `username` e `accountId`.
- `RegisterUserUseCase` cria usuário e conta em uma transação no banco.
- `GetBalanceUseCase` busca a conta e formata o saldo para exibição.
- `CreateTransferUseCase` valida remetente, destinatário, saldo e executa a transferência.
- `ListTransactionsUseCase` monta o histórico paginado com tipo `cash-in` ou `cash-out`.

### Repositórios

O código usa o padrão Repository com interfaces de domínio e implementações TypeORM:

- `UserRepository`
- `AccountRepository`
- `TransactionRepository`

### Regras De Domínio

O backend centraliza regras em value objects e erros de domínio:

- `Username` normaliza para minúsculas e exige no mínimo 3 caracteres.
- `PlainPassword` exige ao menos 8 caracteres, uma maiúscula e um número.
- `TransferAmount` valida valor maior que zero e com no máximo 4 casas decimais.
- `Balance` valida saldo não negativo.
- `UuidValueObject` valida IDs UUID.
- `DomainError` e suas variações são mapeadas pelo `DomainExceptionFilter`.

## Frontend

### Estrutura

O frontend é uma SPA com:

- `router` para navegação;
- `Pinia` para estado de autenticação;
- `Axios` para comunicação com a API;
- `Zod` para validação dos formulários.

### Telas

- `LoginView.vue` autentica o usuário e salva token no `localStorage`.
- `RegisterView.vue` cria conta e redireciona para login.
- `DashboardView.vue` mostra saldo, faz transferências e lista histórico.

### Serviços

- `api.ts` centraliza o client HTTP e injeta `Authorization: Bearer <token>`.
- `auth-service.ts` chama login e cadastro.
- `wallet-service.ts` chama saldo, histórico e transferência.
- `idempotency.ts` monta a chave composta da transferência.
- `money.ts` normaliza e formata valores monetários.

### Estado E Rotas

- O store `auth` controla `token`, `username`, login, cadastro e logout.
- O router protege `/dashboard` com uma checagem simples de token no `localStorage`.

## Conceitos De Software Aplicados

- Arquitetura modular com `NestJS` por domínio.
- Separação de responsabilidades entre controllers, use cases, repositories, DTOs e infraestrutura.
- Inversão de dependência por meio de tokens de injeção.
- Padrão de caso de uso para concentrar regra de negócio.
- Padrão Repository para desacoplar domínio da persistência.
- Value Objects para validação e normalização de dados sensíveis.
- Tratamento centralizado de erros de domínio.
- Validação de entrada com `class-validator`, `class-transformer` e `ValidationPipe`.
- Interceptor para comportamento transversal de idempotência.
- Guard para autenticação JWT.
- Strategy para validação do token.
- Transações no banco para criação de usuário+conta e para execução da transferência.
- Paginação, filtro e ordenação no histórico de transações.
- Centralização de client HTTP no frontend.
- State management no frontend com `Pinia`.
- Proteção de rotas no frontend.

## Redis

O Redis é usado no `IdempotencyInterceptor`.

O fluxo implementado é:

- ler o header `Idempotency-Key`;
- normalizar a chave para minúsculas;
- negar requisições duplicadas com `409 Conflict`;
- gravar um marcador `processing` enquanto a transferência está em andamento;
- salvar a resposta final com TTL;
- impedir reenvio da mesma transferência dentro da janela configurada.

Na prática, o Redis serve como mecanismo de proteção contra repetição acidental de transferências.

## Valores Monetários E Decimal

O código trata valores monetários com precisão de 4 casas decimais.

Isso aparece em vários pontos:

- banco com `numeric(18,4)`;
- value objects `Money`, `TransferAmount` e `Balance`;
- biblioteca `decimal.js` no backend e no seed;
- normalização de entrada no frontend;
- formatação de saída para 2 casas decimais na resposta exibida ao usuário.

O objetivo é evitar erro de ponto flutuante em operações financeiras.

## Fluxo Principal

1. Usuário faz login.
2. Frontend recebe e salva o JWT.
3. Requests protegidas passam com `Authorization: Bearer <token>`.
4. Dashboard carrega saldo e histórico.
5. Transferência envia `Idempotency-Key` junto com destinatário e valor.
6. Backend executa a operação com validação, transação e proteção contra repetição.

## Seed

O seed cria usuários apenas se a base estiver vazia.

Ele:

- cria 10 usuários;
- usa a senha `Senha123`;
- cria uma conta para cada usuário;
- inicializa saldo com `100.0000`;
- gera transações de exemplo;
- atualiza os saldos com `Decimal`.
