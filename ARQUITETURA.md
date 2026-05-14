# Análise de Arquitetura — Processo Seletivo Bauk

## Visão Geral

Aplicação de carteira digital full-stack composta por um backend NestJS e um frontend Vue 3. O objetivo central é permitir que usuários se cadastrem, façam login e realizem transferências entre contas com histórico paginado.

---

## 1. Classificação Arquitetural

### O que a aplicação implementa

A aplicação **não é DDD puro**, **não é Arquitetura Hexagonal pura**, mas é uma **Clean Architecture bem estruturada com padrões inspirados em DDD**.

| Padrão | Status | Evidência |
|--------|--------|-----------|
| Clean Architecture (camadas) | ✅ Implementado | Use Cases, Domain, Infrastructure claramente separados |
| Value Objects (DDD) | ✅ Implementado | `Money`, `Balance`, `Username`, `PlainPassword`, etc. |
| Repository Interface (Port) | ✅ Implementado | Interfaces no domínio, implementações na infra |
| Domain Errors (DDD) | ✅ Implementado | Hierarquia `DomainError` → filtro HTTP |
| Aggregate Roots (DDD) | ❌ Ausente | Sem agregados formais; entidades são POJO |
| Domain Events (DDD) | ❌ Ausente | Sem eventos de domínio |
| Domain Services (DDD) | ❌ Ausente | Lógica de transferência vaza para o repositório |
| Bounded Contexts (DDD) | Parcial | Módulos auth/users/wallet sugerem contextos mas não são formalizados |
| Primary/Secondary Ports (Hexagonal) | Parcial | Repositórios são portas secundárias; as primárias (controllers) não são abstraídas |

---

## 2. Estrutura em Camadas

```
┌─────────────────────────────────────────────────────┐
│  HTTP Layer (Controllers, Pipes, Guards, Interceptors) │
│  auth.controller · users.controller · wallet.controller│
└────────────────────┬────────────────────────────────┘
                     │ delega para
┌────────────────────▼────────────────────────────────┐
│  Application Layer (Use Cases)                        │
│  LoginUseCase · RegisterUserUseCase                   │
│  GetBalanceUseCase · CreateTransferUseCase            │
│  ListTransactionsUseCase                              │
└────────────────────┬────────────────────────────────┘
                     │ depende de interfaces de
┌────────────────────▼────────────────────────────────┐
│  Domain Layer                                         │
│  Entities: User · Account · TransactionRecord         │
│  Value Objects: Money · Balance · Username · …        │
│  Interfaces: UserRepository · AccountRepository       │
│              TransactionRepository                    │
│  Errors: ValidationDomainError · AuthenticationError │
│          ResourceConflictError · ResourceNotFoundError│
└────────────────────┬────────────────────────────────┘
                     │ implementado por
┌────────────────────▼────────────────────────────────┐
│  Infrastructure Layer                                 │
│  TypeORM Repositories (PostgreSQL)                    │
│  In-Memory Repositories (testes)                      │
│  RedisService · BcryptPasswordService · JwtTokenService│
└─────────────────────────────────────────────────────┘
```

A **Dependency Rule** da Clean Architecture é respeitada: o domínio não importa nada de infraestrutura. Use cases dependem apenas de interfaces. Isso é o ponto mais sólido do projeto.

---

## 3. Fluxos Detalhados

### 3.1 Cadastro de Usuário (`POST /users`)

```
Client
  │
  ▼
UsersController.register(dto)
  │  valida DTO com class-validator (username, password)
  ▼
RegisterUserUseCase.execute(username, password)
  │  1. Username.create(username)          → lança ValidationDomainError se inválido
  │  2. PlainPassword.create(password)     → lança ValidationDomainError se fraca
  │  3. userRepository.findByUsername()    → lança ResourceConflictError se existe
  │  4. bcryptService.hash(password)       → retorna PasswordHash
  │  5. userRepository.createWithAccount() → cria User + Account em transação
  │     └─ conta criada com InitialBalance("100.0000")
  ▼
Controller retorna 201 Created (sem body)
```

**Ponto de atenção**: o passo 3 (verificar username) e o passo 5 (inserir) não são atômicos fora do banco. Há uma janela de race condition; dois requests simultâneos com o mesmo username passariam pelo check e chegariam ao INSERT. O banco tem `UNIQUE` constraint, mas a exceção do TypeORM não seria capturada como `ResourceConflictError` — chegaria como erro 500 ao cliente.

---

### 3.2 Login (`POST /auth/login`)

```
Client
  │
  ▼
AuthController.login(dto)
  ▼
LoginUseCase.execute(username, password)
  │  1. Username.create(username)
  │  2. userRepository.findByUsername()    → lança AuthenticationError se não existe
  │  3. bcryptService.compare(pwd, hash)   → lança AuthenticationError se inválida
  │  4. jwtService.sign({ sub, username, accountId })
  ▼
Controller retorna { token, username }
```

O JWT carrega `userId`, `username` e `accountId` — evitando buscas extras no banco a cada request autenticado.

---

### 3.3 Transferência (`POST /wallet/transfer`)

Este é o fluxo mais complexo e usa dois mecanismos de proteção sobrepostos.

```
Client (envia Idempotency-Key: <uuid>)
  │
  ▼
JwtAuthGuard → extrai CurrentUser do token
  │
  ▼
IdempotencyInterceptor (pre-handler)
  │  1. Lê header Idempotency-Key (obrigatório)
  │  2. Normaliza (lowercase, trim)
  │  3. Redis SET NX com TTL=5s
  │     └─ Se chave já existe → lança ResourceConflictError (409)
  │
  ▼
TransferAmountPipe → converte string "10.50" para Decimal
  │
  ▼
WalletController.transfer(dto, currentUser)
  │
  ▼
CreateTransferUseCase.execute(senderAccountId, recipientUsername, value)
  │  1. TransferAmount.create(value)           → valida valor > 0, max 4 decimais
  │  2. userRepository.findByUsername(recipient)→ lança ResourceNotFoundError se não existe
  │  3. Verifica self-transfer                 → lança ValidationDomainError
  │  4. transactionRepository.executeTransfer()→ executa atômico no banco:
  │     a. Abre transação PostgreSQL
  │     b. Bloqueia Account(senderId) e Account(recipientId) com LOCK PESSIMISTIC_WRITE
  │        └─ sempre na ordem menor_id → maior_id para evitar deadlock
  │     c. Carrega saldo do remetente
  │     d. account.ensureCanDebit(amount)       → lança ValidationDomainError se insuficiente
  │     e. Decrementa balance do remetente
  │     f. Incrementa balance do destinatário
  │     g. Insere registro na tabela transactions
  │     h. Commit
  │
  ▼
IdempotencyInterceptor (post-handler)
  │  Armazena resposta no Redis com TTL
  │
  ▼
Controller retorna 201 Created
```

**Problema**: o interceptor de idempotência armazena a resposta após a execução, mas em uma requisição duplicada dentro do TTL retorna **409 Conflict**, não a resposta original cacheada. Isso não é idempotência completa — é apenas deduplicação por janela de tempo.

---

### 3.4 Consulta de Saldo (`GET /wallet/balance`)

```
JwtAuthGuard → CurrentUser.accountId
  │
  ▼
GetBalanceUseCase.execute(accountId)
  │  1. accountRepository.findById()
  │  2. formatMoneyForDisplay(balance) → arredondamento bancário para 2 casas
  ▼
{ balance: "100.00" }
```

---

### 3.5 Histórico de Transações (`GET /wallet/transactions`)

```
JwtAuthGuard → CurrentUser.accountId
TransactionsFilterPipe → valida e normaliza query params
  │
  ▼
ListTransactionsUseCase.execute(accountId, filters)
  │  transactionRepository.listByAccount({
  │    accountId, page, limit, type, startDate, endDate, order
  │  })
  │  └─ consulta por (debitedAccountId OR creditedAccountId)
  │  └─ classifica cada transação como cash-in ou cash-out
  ▼
{ data: [...], total, page, limit }
```

---

## 4. Padrões Bem Executados

### 4.1 Value Objects ricos e auto-validantes

Cada Value Object valida no construtor e lança `ValidationDomainError` com mensagem em pt-BR. São imutáveis e expressam claramente as invariantes do domínio.

```typescript
// Money não aceita valor zero nem negativo
// Balance tem métodos debit/credit que retornam novos Balance
// Username normaliza (lowercase + trim) antes de armazenar
```

### 4.2 Separação entre erro de domínio e resposta HTTP

`DomainExceptionFilter` é um mapa declarativo. Controllers nunca lançam HTTP exceptions — apenas Use Cases lançam erros de domínio. Isso mantém a lógica de negócio agnóstica ao protocolo.

### 4.3 Tokens de injeção de dependência

`shared/constants/injection-tokens.ts` define símbolos que desacoplam os Use Cases de qualquer implementação concreta. Trocar TypeORM por outro ORM exige apenas mudar os módulos NestJS, sem tocar em use cases.

### 4.4 Fábrica de aplicação de teste HTTP

`http-test-app.factory.ts` cria uma aplicação Fastify real com repositórios fake. Isso permite testar controllers, interceptors, pipes e filtros sem banco de dados, sem mocks frágeis de módulo.

### 4.5 Atomicidade da transferência com locks pessimistas

Os locks são adquiridos sempre em ordem crescente de ID, eliminando a possibilidade de deadlock clássico entre dois transfers simultâneos em sentidos opostos.

---

## 5. Problemas Identificados

### P1 — Lógica de negócio dentro do repositório (crítico de design)

**Arquivo**: `infrastructure/database/typeorm/repositories/typeorm-transaction.repository.ts`

O método `executeTransfer` não é uma operação de persistência — ele contém lógica de negócio: verificar saldo, debitar, creditar. Isso viola o princípio de que repositórios são abstrações de persistência.

**Consequência**: os repositórios in-memory precisam duplicar a mesma lógica de negócio. Se a regra de transferência mudar (ex.: adicionar taxa), ela precisa ser atualizada em dois lugares.

**O que deveria acontecer**: o `CreateTransferUseCase` deveria orquestrar: buscar contas, aplicar lógica de domínio, e depois chamar o repositório apenas para persistir o resultado.

---

### P2 — Use Case delega demais ao repositório (consequência do P1)

**Arquivo**: `modules/wallet/application/create-transfer.use-case.ts`

O use case faz validações superficiais (verifica se destinatário existe, previne auto-transferência) mas delega a verificação de saldo e a execução financeira para o repositório. O use case deveria ser o orquestrador do fluxo.

---

### P3 — Idempotência incompleta

**Arquivo**: `shared/http/interceptors/idempotency.interceptor.ts`

O comportamento atual:
- Primeira requisição: processa e armazena resposta no Redis.
- Segunda requisição com mesma chave dentro do TTL: retorna 409.
- Segunda requisição com mesma chave após 5s: processa novamente.

Idempotência financeira real deveria:
1. Retornar a resposta original cacheada (não 409) quando a chave já foi processada com sucesso.
2. TTL de 5 segundos é inadequado para operações financeiras — clientes que recebem timeout e retentam após 5s seriam cobrados duas vezes.

---

### P4 — Logout sem invalidação server-side

**Arquivo**: `modules/auth/auth.controller.ts`

O endpoint `POST /auth/logout` apenas retorna uma mensagem. O JWT permanece válido no servidor pelo restante do período de 24h. Se o token vazar após o logout, o atacante tem acesso garantido.

**Para uma carteira digital, isso é uma falha de segurança relevante.** A solução mais simples é uma blacklist no Redis com TTL igual ao restante da validade do token.

---

### P5 — Race condition no cadastro de usuário

**Arquivo**: `modules/users/application/register-user.use-case.ts`

```typescript
// Passo 1: verifica se username existe
const existing = await this.userRepository.findByUsername(username);
if (existing) throw new ResourceConflictError(...);

// Passo 2: cria o usuário (há janela entre os dois passos)
await this.userRepository.createWithAccount(...);
```

Dois requests simultâneos com o mesmo username podem ambos passar pelo passo 1 e depois falhar no passo 2 com uma exceção de constraint do banco não tratada. O `TypeOrmUserRepository.createWithAccount` deveria capturar `QueryFailedError` com código de erro de constraint única (`23505` no PostgreSQL) e relançar como `ResourceConflictError`.

---

### P6 — `InitialBalance` como Value Object é um design smell

**Arquivo**: `shared/domain/value-objects/initial-balance.ts`

Um Value Object que só pode representar um único valor (`"100.0000"`) não agrega valor semântico — é uma constante disfarçada de objeto. A invariante "toda conta começa com 100" deveria ser expressa no módulo de criação de conta, não em um type. Isso também torna o sistema inflexível: mudar o saldo inicial exige alterar o VO e potencialmente os testes.

---

### P7 — Entidade de domínio `Account` armazena balance como `string`

**Arquivo**: `modules/wallet/domain/account.ts`

```typescript
export interface Account {
  id: string;
  balance: string; // "100.0000"
}
```

A entidade de domínio usa `string`, mas a entidade TypeORM usa `number` (TypeORM converte `NUMERIC` para `number` JavaScript). A conversão `number → string` acontece no repositório e pode perder precisão para valores muito grandes. Usar `Decimal.js` ou `string` consistentemente entre as camadas seria mais seguro.

---

### P8 — Frontend sem interceptor de resposta para 401

**Arquivo**: `frontend/src/services/api.ts`

Se o JWT expirar (após 24h), as chamadas à API retornam 401. O frontend não tem um interceptor de resposta que redirecione para `/login` automaticamente. O usuário veria erros genéricos na interface.

---

### P9 — Swagger exposto sem proteção

**Arquivo**: `src/main.ts`

O Swagger UI em `/api/docs` é acessível publicamente sem autenticação. Em um ambiente de produção, isso expõe a superfície de ataque da API.

---

### P10 — Nomes de entidades de teste são "E2E" mas testam lógica in-memory

**Arquivo**: `test/business-rules.e2e-spec.ts` e `e2e-test-app.factory.ts`

Os "testes E2E" usam repositórios in-memory, não o PostgreSQL real. Eles testam bem a camada de aplicação e HTTP, mas não validam as queries reais, índices, constraints do banco, ou comportamento de concorrência. Seria mais preciso chamá-los de "testes de integração de aplicação".

---

## 6. Frontend — Análise

### Pontos fortes

- **Validação com Zod** garante que dados inválidos não chegam à API.
- **Branded types** (`JwtToken`, `MoneyAmount`, `Username`) previnem confusões de tipo em runtime.
- **Arredondamento bancário** (round-half-to-even) implementado consistentemente no frontend e backend.
- **Geração de chave de idempotência** determinística baseada em `sender:recipient:value:timeWindow` evita duplicatas acidentais do formulário.
- **AppSkeleton** com `<Suspense>` oferece boa UX durante carregamento.

### Pontos a melhorar

- **Auth store lê diretamente de `localStorage`** em vez de usar um plugin de persistência (ex.: `pinia-plugin-persistedstate`). Isso é funcional mas frágil.
- **Sem refresh token** — sessão expira em 24h sem aviso ao usuário.
- **`DashboardView.vue` é monolítico** — contém lógica de transfer, balance e histórico em um único componente. Poderia ser decomposto.
- **Sem tratamento de 401 global** conforme P8.

---

## 7. Segurança

| Controle | Status | Detalhe |
|----------|--------|---------|
| Bcrypt (10 rounds) | ✅ | Adequado |
| JWT com expiração | ✅ | 24h |
| HTTPS (Helmet HSTS) | ✅ | Apenas em produção |
| CSP via Helmet | ✅ | |
| Rate limiting | ✅ | 30 req/min global |
| CORS restrito | ✅ | Single origin |
| Locks pessimistas | ✅ | Previne race na transferência |
| Idempotência | ⚠️ | Incompleta (ver P3) |
| Invalidação de logout | ❌ | JWT permanece válido (ver P4) |
| Swagger protegido | ❌ | Exposto publicamente (ver P9) |
| Tratamento de constraint única | ❌ | Race condition no cadastro (ver P5) |

---

## 8. Resumo

A aplicação demonstra **boa compreensão de Clean Architecture** e uso sólido de **Value Objects DDD**. O desacoplamento via interfaces de repositório e tokens de DI é correto e permite testabilidade sem banco. A separação controllers → use cases → domínio → infraestrutura é respeitada na maior parte do código.

Os problemas mais relevantes — em ordem de impacto — são:

1. **Lógica de negócio no repositório** (P1/P2): mina a separação de camadas e duplica regras.
2. **Idempotência incompleta** (P3): risco real em operações financeiras com retry.
3. **Logout sem invalidação** (P4): falha de segurança em uma carteira digital.
4. **Race condition no cadastro** (P5): pode expor 500 interno ao usuário.

Os demais são design smells ou melhorias incrementais, não bloqueadores críticos.
