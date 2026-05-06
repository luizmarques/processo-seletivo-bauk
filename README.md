# Instruções da Aplicação

## Visão Geral

Aplicação fullstack para transferências internas entre usuários, composta por:

- backend `NestJS`
- frontend `Vue 3`
- `PostgreSQL`
- `Redis`
- autenticação JWT
- idempotência obrigatória por `Idempotency-Key`
- chave de idempotência no formato `usuario:destinatario:valor:time`

## Subida com Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

## Endpoints e acessos

- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`
- swagger: `http://localhost:3000/api/docs`

## Usuários seed

Todos usam a senha `Senha123`:

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

## Fluxo básico

1. fazer login
2. copiar o JWT retornado
3. chamar endpoints protegidos com `Authorization: Bearer <token>`
4. para transferências, sempre enviar `Idempotency-Key`

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
  -H 'Idempotency-Key: janedoe:johndoe:10.0000:202605061200' \
  -d '{"username":"johndoe","value":"10.0000"}'
```

No frontend, o sufixo `time` pode ser definido por `VITE_IDEMPOTENCY_TIME`. Se a variável não for informada, a aplicação mantém o bucket temporal anterior usando `VITE_IDEMPOTENCY_TIME_WINDOW_SECONDS`.

## Consultas de histórico

Filtros disponíveis em `GET /wallet/transactions`:

- `page`
- `limit`
- `type`
- `order`
- `startDate`
- `endDate`

## Desenvolvimento local

### Backend

```bash
cd backend
cp .env.example .env
npm install
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
npm run lint
```
