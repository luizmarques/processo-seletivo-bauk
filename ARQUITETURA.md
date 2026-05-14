# Análise de Arquitetura — Processo Seletivo Bauk

## Visão Geral

Aplicação de carteira digital full-stack composta por um backend NestJS e um frontend Vue 3. O objetivo central é permitir que usuários se cadastrem, façam login e realizem transferências entre contas com histórico paginado.

---

## 1. Classificação Arquitetural

### O que a aplicação implementa

A aplicação é uma **Clean Architecture com DDD tático aplicado**: Value Objects ricos, Aggregate Roots com Domain Events, Domain Services e Repository Interfaces como portas do domínio. Não é DDD estratégico completo (sem Bounded Contexts formalizados, sem linguagem ubíqua explícita), mas os padrões táticos essenciais estão presentes e corretos.

| Padrão | Status | Evidência |
|--------|--------|-----------|
| Clean Architecture (camadas) | ✅ | Use Cases, Domain, Infrastructure separados; Dependency Rule respeitada |
| Value Objects (DDD) | ✅ | VOs ricos, auto-validantes, co-localizados em cada módulo |
| Aggregate Roots (DDD) | ✅ | `User` estende `AggregateRoot`; coleta e publica Domain Events |
| Domain Events (DDD) | ✅ | `UserRegistered`, `TransferExecuted`; publisher, handlers, registry em-memória |
| Domain Services (DDD) | ✅ | `TransferDomainService` encapsula debit/credit de múltiplos agregados |
| Repository Interfaces (Port) | ✅ | Interfaces no domínio, implementações na infra; tokens de DI desacoplam |
| Domain Errors | ✅ | Hierarquia `DomainError` → `DomainExceptionFilter` mapeia para HTTP |
| Bounded Contexts (DDD) | Parcial | Módulos auth/users/wallet sugerem contextos mas não são formalizados |
| Primary/Secondary Ports (Hexagonal) | Parcial | Repositórios são portas secundárias; controllers não são abstraídos |

---

## 2. Estrutura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│  HTTP Layer                                                  │
│  auth.controller · users.controller · wallet.controller      │
│  JwtAuthGuard · IdempotencyInterceptor · DomainExceptionFilter│
│  TransferAmountPipe · TransactionsFilterPipe                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ delega para
┌─────────────────────▼───────────────────────────────────────┐
│  Application Layer (Use Cases)                               │
│  LoginUseCase · LogoutUseCase · RegisterUserUseCase          │
│  GetBalanceUseCase · CreateTransferUseCase                   │
│  ListTransactionsUseCase                                     │
│  Handlers: UserRegisteredHandler · TransferAuditHandler      │
└─────────────────────┬───────────────────────────────────────┘
                      │ depende de interfaces de
┌─────────────────────▼───────────────────────────────────────┐
│  Domain Layer (co-localizado por módulo)                     │
│                                                              │
│  modules/users/domain/                                       │
│    User (AggregateRoot) · UserRegistered (DomainEvent)       │
│    UserId · Username · PlainPassword · PasswordHash          │
│    UserRepository (interface)                                │
│                                                              │
│  modules/wallet/domain/                                      │
│    Account · TransferDomainService                           │
│    TransferExecuted (DomainEvent)                            │
│    AccountId · Balance · TransferAmount · InitialBalance     │
│    AccountRepository · TransactionRepository (interfaces)    │
│                                                              │
│  shared/domain/                                              │
│    AggregateRoot · DomainError hierarchy · DomainEvent       │
│    UuidValueObject (base genérica)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ implementado por
┌─────────────────────▼───────────────────────────────────────┐
│  Infrastructure Layer                                        │
│  TypeORM Repositories + Entities (PostgreSQL)                │
│  In-Memory Repositories (testes E2E e integração)            │
│  RedisService · BcryptPasswordService · JwtTokenService      │
└─────────────────────────────────────────────────────────────┘
```

A **Dependency Rule** é respeitada integralmente: domínio não importa infraestrutura, use cases dependem apenas de interfaces, repositórios concretos conhecem apenas entidades de domínio.

---

## 3. Value Objects — Co-localização por Módulo

Os Value Objects vivem junto ao domínio que os possui, eliminando o acoplamento de shared para conceitos específicos de negócio.

### `modules/users/domain/value-objects/`

| VO | Invariante principal |
|----|----------------------|
| `UserId` | UUID v4 válido; estende `UuidValueObject` |
| `Username` | ≥ 3 chars; normalizado (trim + lowercase) |
| `PlainPassword` | ≥ 8 chars, 1 maiúscula, 1 número |
| `PasswordHash` | Regex bcrypt `$2[aby]$dd$...` |

### `modules/wallet/domain/value-objects/`

| VO | Invariante principal |
|----|----------------------|
| `AccountId` | UUID v4 válido; estende `UuidValueObject` |
| `Balance` | `NUMERIC(20,4)`, ≥ 0; operações `debit()` / `credit()` retornam novo `Balance` |
| `TransferAmount` | > 0, máximo 4 casas decimais |
| `InitialBalance` | Sempre `"100.0000"` — constante tipada |
| `money-format` | Função `formatMoneyForDisplay()` — arredondamento bancário para 2 casas |

### `shared/domain/value-objects/`

Apenas `UuidValueObject` (abstração genuinamente genérica, base de `UserId` e `AccountId`).

---

## 4. Aggregate Root e Domain Events

### AggregateRoot (`shared/domain/aggregate-root.ts`)

```typescript
abstract class AggregateRoot {
  // _domainEvents é non-enumerable: não interfere em .toEqual() nos testes
  protected addDomainEvent(event: DomainEvent): void
  collectDomainEvents(): DomainEvent[]  // retorna e limpa a lista
}
```

### User (único Aggregate Root atual)

```typescript
class User extends AggregateRoot {
  static register(id, username, accountId, password): User
    // → adiciona UserRegistered ao registro interno

  static reconstitute(id, username, accountId, password): User
    // → sem evento (reconstituição, não criação)

  hasSameAccountAs(other: User): boolean
}
```

### Domain Events

| Evento | Módulo | Payload | Handler |
|--------|--------|---------|---------|
| `UserRegistered` | users | `userId`, `username`, `accountId` | `UserRegisteredHandler` (log) |
| `TransferExecuted` | wallet | `transactionId`, `senderAccountId`, `recipientAccountId`, `amount` | `TransferAuditHandler` (log) |

### Publisher

`NestDomainEventPublisher` mantém um registry em-memória `Map<eventName, DomainEventHandler[]>`. Handlers registram-se via `OnModuleInit`. A publicação invoca handlers em paralelo (`Promise.all`).

`EventsModule` é `@Global()` — exporta `DOMAIN_EVENT_PUBLISHER` e `NestDomainEventPublisher` para todos os módulos sem importação explícita.

---

## 5. Domain Service — Transferência

`TransferDomainService` encapsula a invariante de negócio que envolve dois agregados distintos:

```typescript
@Injectable()
export class TransferDomainService {
  execute(sender: Account, recipient: Account, amount: TransferAmount): void {
    sender.debit(amount);    // Balance.debit() → lança ValidationDomainError se insuficiente
    recipient.credit(amount);
  }
}
```

`Account.debit()` e `Account.credit()` atualizam `_balance` internamente via `Balance.debit()` e `Balance.credit()`. A validação de saldo (`ensureCanDebit`) ocorre dentro de `Balance.debit()` — no domínio, não no repositório.

O `TypeOrmTransactionRepository.executeTransfer()` recebe um callback `perform` que é preenchido pelo use case com a chamada ao `TransferDomainService`. O repositório cuida apenas da infraestrutura transacional (locks, updates, inserts).

---

## 6. Autenticação e Invalidação de Logout

### Fluxo de emissão (Login)

`JwtTokenService.sign()` adiciona `jti: randomUUID()` ao payload. O `jti` é o identificador único do token, usado para revogação.

### Fluxo de validação (toda requisição autenticada)

`JwtStrategy.validate()` executa dois passos:
1. Desserializa o payload (sub, username, accountId, jti, exp).
2. Consulta `TokenBlocklist.isBlocked(jti)` → Redis GET `blocklist:jti:{jti}`. Se presente: `UnauthorizedException("Token revogado.")`.

### Fluxo de logout

`LogoutUseCase` calcula o TTL restante (`expiresAt − now`) e chama `TokenBlocklist.block(jti, ttl)` → Redis SET `blocklist:jti:{jti}` com EX igual ao tempo restante do token. O token é inválido imediatamente, sem TTL residual desnecessário.

### RedisService

Implementa duas interfaces via mesma instância:

```
IDEMPOTENCY_STORE → RedisService → IdempotencyInterceptor
TOKEN_BLOCKLIST   → RedisService → JwtStrategy, LogoutUseCase
```

---

## 7. Fluxos Detalhados

### 7.1 Cadastro de Usuário (`POST /users`)

```
UsersController.register(dto)
  │  class-validator valida DTO
  ▼
RegisterUserUseCase.execute({ username, password })
  │  1. new Username(input)          → normaliza + valida (≥3 chars)
  │  2. new PlainPassword(input)     → valida política de senha
  │  3. userRepository.findByUsername()
  │     └─ se existe → ResourceConflictError("Username já utilizado.")
  │  4. passwordHasher.hash(password) → PasswordHash
  │  5. userRepository.createWithAccount()
  │     [transação PostgreSQL]
  │       INSERT accounts (balance = InitialBalance.create())
  │       INSERT users    (username, password, accountId)
  │       User.register() → UserRegistered adicionado aos eventos
  │       retorna User (AggregateRoot)
  │     [commit]
  │     catch QueryFailedError code 23505 → ResourceConflictError
  │  6. eventPublisher.publishAll(user.collectDomainEvents())
  │     └─ UserRegisteredHandler.handle() → log
  ▼
201 Created { id, username }
```

A constraint `UNIQUE` no banco é a última linha de defesa contra race condition; o repositório captura `QueryFailedError 23505` e relança como `ResourceConflictError` (409).

---

### 7.2 Login (`POST /auth/login`)

```
AuthController.login(dto)
  ▼
LoginUseCase.execute({ username, password })
  │  1. new Username(input)           → normaliza
  │  2. userRepository.findByUsername()
  │     └─ não existe → AuthenticationError("Credenciais inválidas.")
  │  3. passwordHasher.compare(plain, hash)
  │     └─ não bate → AuthenticationError("Credenciais inválidas.")
  │  4. tokenService.sign({ sub: UserId, username, accountId })
  │     └─ JWT payload inclui jti (randomUUID) + exp
  ▼
200 OK { accessToken }
```

---

### 7.3 Logout (`POST /auth/logout`)

```
JwtAuthGuard → JwtStrategy.validate()
  │  Verifica blocklist; se revogado → 401
  ▼
AuthController.logout(currentUser)
  ▼
LogoutUseCase.execute({ jti, expiresAt })
  │  ttl = max(expiresAt − now, 1)
  │  tokenBlocklist.block(jti, ttl)
  │  └─ Redis SET blocklist:jti:{jti} = "1" EX {ttl}
  ▼
200 OK { message: "Logout realizado com sucesso." }
```

---

### 7.4 Transferência (`POST /wallet/transfer`)

```
IdempotencyInterceptor (pré)
  │  1. Header Idempotency-Key obrigatório; normaliza (lowercase)
  │  2. Redis GET idempotency:{key}
  │     └─ se encontra qualquer valor → ConflictException (409)
  │  3. Redis SETNX idempotency:{key} = "processing" (TTL 5s)
  │     └─ se falha → ConflictException (409)
  ▼
JwtAuthGuard → JwtStrategy.validate()
  │  TokenBlocklist.isBlocked(jti) → se bloqueado → 401
  ▼
TransferAmountPipe
  │  Valida formato; max 4 casas decimais
  ▼
WalletController.transfer(dto, currentUser)
  ▼
CreateTransferUseCase.execute({ senderUserId, senderAccountId, recipientUsername, value })
  │  1. new TransferAmount(value)      → > 0, max 4 casas
  │  2. userRepository.findById(sender)
  │  3. userRepository.findByUsername(recipient)
  │     └─ qualquer não encontrado → ResourceNotFoundError
  │  4. sender.hasSameAccountAs(recipient)
  │     └─ mesma conta → ValidationDomainError (auto-transferência)
  │  5. transactionRepository.executeTransfer(
  │       senderAccountId, recipient.accountId, amount,
  │       (senderAccount, recipientAccount) =>
  │         transferDomainService.execute(senderAccount, recipientAccount, amount)
  │     )
  │     [transação PostgreSQL]
  │       SELECT accounts FOR UPDATE ORDER BY id  ← lock ordenado por ID (anti-deadlock)
  │       Account.reconstitute() × 2
  │       perform() → transferDomainService.execute()
  │         → sender.debit(amount)    → Balance.ensureCanDebit() ou ValidationDomainError
  │         → recipient.credit(amount)
  │       UPDATE accounts SET balance
  │       INSERT transactions
  │     [commit]
  │  6. eventPublisher.publish(new TransferExecuted(...))
  │     └─ TransferAuditHandler.handle() → log
  ▼
IdempotencyInterceptor (pós)
  │  Redis SET idempotency:{key} = JSON(response) (sobrescreve "processing" com TTL)
  ▼
201 Created { id, value: "10.00" }
```

---

### 7.5 Saldo e Histórico

```
GET /wallet/balance
  JwtAuthGuard → CurrentUser.accountId
  GetBalanceUseCase → accountRepository.findById()
  formatMoneyForDisplay(balance) → arredondamento bancário 2 casas
  200 OK { balance: "100.00" }

GET /wallet/transactions?page&limit&type&order&startDate&endDate
  JwtAuthGuard → CurrentUser.accountId
  TransactionsFilterPipe → valida startDate ≤ endDate
  ListTransactionsUseCase → transactionRepository.listByAccount(filters)
    JOIN users para usernames; classifica cash-in / cash-out; pagina
  200 OK { data: [...], meta: { total, page, limit } }
```

---

## 8. Padrões Bem Executados

### 8.1 Dependency Rule sem vazamentos

O domínio nunca importa de `infrastructure/`. Os casos de uso dependem apenas de interfaces injetadas via tokens simbólicos (`USER_REPOSITORY`, `ACCOUNT_REPOSITORY`, etc.). Substituir TypeORM exige modificar apenas os módulos NestJS.

### 8.2 Repositórios substituíveis sem reconfiguração

`InMemoryUserRepository`, `InMemoryAccountRepository` e `InMemoryTransactionRepository` implementam as mesmas interfaces que as versões TypeORM. Os testes E2E sobem a aplicação inteira (Fastify + NestJS + pipes + interceptors + filtros) sem banco de dados.

### 8.3 Domain Service isolando lógica multi-agregado

`TransferDomainService.execute()` é puro: recebe objetos de domínio, aplica regras (debit/credit), sem efeitos colaterais externos. Testável de forma completamente isolada.

### 8.4 AggregateRoot não-enumerável

`_domainEvents` é definido com `Object.defineProperty({ enumerable: false })`. Isso evita que eventos acumulados interfiram em `expect(user).toEqual(...)` nos testes, sem precisar de ajustes manuais nos matchers.

### 8.5 Locks anti-deadlock por ordenação de ID

`TypeOrmTransactionRepository` adquire locks `FOR UPDATE` sempre em ordem crescente de `id`. Duas transferências simultâneas `A→B` e `B→A` nunca causam deadlock porque ambas tentam bloquear `min(A,B)` antes de `max(A,B)`.

### 8.6 JWT com revogação granular por `jti`

Cada token possui um UUID único (`jti`). O logout grava exatamente esse ID no Redis com TTL igual ao tempo restante do token. Não há acúmulo indefinido de entradas expiradas.

### 8.7 Idempotência com lock atômico NX

O interceptor usa `SETNX` atômico antes de executar o handler. Isso previne que duas requisições idênticas simultâneas executem a transferência duas vezes mesmo sem cache prévio.

### 8.8 Segurança no cadastro contra race condition

`TypeOrmUserRepository.createWithAccount()` cria usuário e conta em uma única transação. Caso dois cadastros simultâneos com o mesmo username passem pela verificação no use case, o `INSERT` do segundo falha com `QueryFailedError 23505`, capturado e mapeado para `ResourceConflictError` (409).

---

## 9. Problemas Remanescentes

### P1 — Idempotência retorna 409 em vez da resposta cacheada

**Arquivo**: `shared/http/interceptors/idempotency.interceptor.ts`

O comportamento atual:
- 1ª requisição: executa e armazena resposta no Redis.
- 2ª requisição com mesma chave dentro do TTL: retorna **409 Conflict**.
- 2ª requisição após 5s: executa novamente.

Idempotência financeira padrão deveria retornar a resposta original (2xx) na repetição — não 409. Clientes que recebem timeout e retentam após 5s seriam cobrados duas vezes.

O TTL de 5 segundos é inadequado para operações financeiras: redes móveis com latência alta podem facilmente ultrapassar essa janela.

---

### P2 — `InitialBalance` é uma constante disfarçada de Value Object

**Arquivo**: `modules/wallet/domain/value-objects/initial-balance.ts`

Um VO que só pode representar `"100.0000"` não encapsula variação — é uma constante. A invariante "toda conta começa com saldo 100" deveria ser expressa como uma constante ou diretamente no factory method de criação de conta, não como um tipo próprio.

---

### P3 — `Money` é dead code

**Arquivo**: `modules/wallet/domain/value-objects/money.ts`

A classe `Money` existe no módulo mas não é importada por nenhum consumidor. Semanticamente duplica `TransferAmount`. Deve ser removida.

---

### P4 — Frontend sem interceptor global de 401

**Arquivo**: `frontend/src/services/` (ausência)

Quando o JWT expira (24h) ou é revogado pelo logout, as chamadas à API retornam 401. O frontend não possui um interceptor de resposta que redirecione automaticamente para `/login`. O usuário veria erros genéricos na interface sem entender que precisa autenticar novamente.

---

### P5 — Testes chamados "E2E" usam repositórios in-memory

**Arquivo**: `test/business-rules.e2e-spec.ts`

Os testes sobem a aplicação Fastify completa com todos os pipes, interceptors e filtros, mas usam repositórios in-memory em vez do PostgreSQL real. Eles não validam queries SQL, índices, constraints de banco, locks pessimistas ou comportamento de concorrência real. São mais precisamente "testes de integração de aplicação" do que E2E.

---

## 10. Frontend — Análise

### Pontos fortes

- **Validação com Zod** garante que dados inválidos não chegam à API.
- **Branded types** (`JwtToken`, `MoneyAmount`, `Username`) previnem confusões de tipo em compile time.
- **Arredondamento bancário** (round-half-to-even) implementado consistentemente no frontend e backend.
- **Chave de idempotência determinística** baseada em `sender:recipient:value:timeWindow` evita duplicatas acidentais do formulário.

### Pontos a melhorar

- **Auth store em `localStorage`** sem plugin de persistência — funcional mas frágil.
- **Sem refresh token** — sessão expira em 24h sem aviso ao usuário.
- **`DashboardView.vue` monolítico** — contém lógica de transfer, balance e histórico no mesmo componente.
- **Sem tratamento global de 401** — ver P4.

---

## 11. Segurança

| Controle | Status | Detalhe |
|----------|--------|---------|
| Bcrypt (10 rounds) | ✅ | Adequado para senhas |
| JWT com expiração de 24h | ✅ | `exp` no payload |
| `jti` por token + blocklist Redis | ✅ | Logout invalida token imediatamente |
| HTTPS (Helmet HSTS) | ✅ | Apenas em produção |
| CSP via Helmet | ✅ | |
| Rate limiting (30 req/min) | ✅ | Global via ThrottlerGuard |
| CORS restrito (single origin) | ✅ | |
| Locks pessimistas ordenados | ✅ | Previne race na transferência e deadlock |
| Constraint única + captura 23505 | ✅ | Previne race no cadastro |
| Swagger protegido | ✅ | Condicional a `NODE_ENV !== "production"` |
| Idempotência (deduplicação) | ⚠️ | Previne double-spend, mas TTL de 5s é curto |
| Refresh token / aviso de expiração | ❌ | Sem mecanismo no frontend |
