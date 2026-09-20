# Area Verde Frontend

Aplicação web do bar em `React + Vite + Tailwind CSS`, com integração real com a API do
repositório `area-verde` (não é mais um protótipo — é o frontend em uso real do MVP).

Esta pasta concentra todo o código executável do frontend.

## Módulos implementados

Comandas (balcão), Produtos & Estoque, Clientes, Fiado (caderneta), Caixa diário,
Relatórios, Configurações e Acesso/Senha.

## Estrutura

```text
app/
|- src/
|  |- components/            telas grandes (Comandas.tsx, Produtos.tsx, Caixa.tsx, ...)
|  |- features/
|  |  `- <dominio>/           ex: comandas, products, caixa, fiados, customers, categories
|  |     |- hooks/            estado + regra de UI do domínio (useComandasState etc.)
|  |     |- services/         chamada à API (usa apiRequest, nunca fetch direto)
|  |     |- mappers/          converte a resposta da API pro tipo de domínio
|  |     `- types.ts          tipos da resposta da API (Api*), não confundir com src/types.ts
|  |- lib/api/                cliente HTTP único (apiRequest, ApiError)
|  `- types.ts                tipos de domínio compartilhados entre features
|- tests/unit/src/            testes unitários, espelhando o caminho de src/
|- e2e/                       suíte Playwright (fluxos ponta a ponta contra API real)
|- Dockerfile
|- docker-compose.yml
|- Makefile
|- nginx.conf
|- package.json
`- vite.config.ts
```

Fluxo de uma chamada à API: `componente/tela → hook da feature → service da feature →
apiRequest`. Nunca `fetch` direto num componente, nunca regra de negócio dentro de
`apiRequest`.

## Instalação

Use `npm ci` como caminho padrão para ambiente local, CI e container:

```bash
cd app
npm ci
```

Quando for necessário atualizar dependências e regenerar o lockfile, use `npm install` de
forma intencional e versione o `package-lock.json`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run test`
- `npm run test:watch`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run test:e2e:ui`
- `npm run test:e2e:report`

## Makefile

Para listar os atalhos disponíveis:

```bash
cd app
make help
```

Comandos mais usados:

- `make install`
- `make doctor`
- `make check` (leitura) / `make validate` (com format automático)
- `make test-e2e`
- `make ci-docker`

## Testes

Duas suítes, complementares:

- **Vitest + Testing Library + jsdom** (`make test` / `make test-coverage`) — testes
  unitários da camada de API (`tests/unit/src/lib/api/client.test.ts`), dos mappers de cada
  domínio (`tests/unit/src/features/<dominio>/mappers/`) e dos hooks (mockando o service,
  sem depender de API real). Ficam em `tests/unit/src/`, espelhando o caminho do arquivo
  testado em `src/`.
- **Playwright** (`make test-e2e`) — fluxos ponta a ponta contra uma API real rodando, em
  `e2e/*.spec.ts`. Cobre login, cada módulo do sistema e um fluxo completo de atendimento
  (abertura de caixa → comanda → pagamento/fiado → fechamento). Ver
  [`docs/mapa-fluxos-e-cobertura-testes.md`](../docs/mapa-fluxos-e-cobertura-testes.md) pro
  mapa completo do que está coberto.

### Pré-requisitos para rodar o E2E

O Playwright precisa de uma API real respondendo e do frontend servido:

```bash
# 1. Backend (num checkout do repo area-verde, ajuste o caminho):
docker compose -f ../area-verde/docker-compose.local.yml up -d db
cd ../area-verde/app && RUN_MIGRATIONS=true POSTGRES_HOST=localhost POSTGRES_PORT=5432 \
  POSTGRES_PASSWORD=local-dev-only uvicorn api:app --host 0.0.0.0 --port 8000

# 2. Frontend, com o proxy do Vite apontando pra essa API local:
cd app && API_PROXY_TARGET=http://localhost:8000 npm run dev

# 3. Suíte E2E:
make test-e2e            # ou: npm run test:e2e
make test-e2e-ui         # modo interativo
make test-e2e-report     # abre o último relatório HTML
```

`E2E_BASE_URL` (padrão `http://localhost:3000`) aponta o Playwright pro frontend.
`API_PROXY_TARGET` (padrão `http://area-verde-api-devcontainer:8001`, usado dentro do
devcontainer) é o destino do proxy `/api` do Vite — mude apenas quando rodar fora do
devcontainer.

## API

Configure `VITE_API_BASE_URL` em `.env` a partir de [.env.example](./.env.example). O valor
padrão está apontando para a API local em `http://localhost:8001/api`.

## CI

Pull requests para `develop` e pushes em `develop` executam o workflow `frontend-ci`, que roda:

- `npm ci`
- `npm run typecheck`
- `npm run format:check`
- `npm run lint`
- `npm run test:coverage`
- `npm run build`
- `docker build -t area-verde-frontend:ci ./app`

A suíte E2E (`test:e2e`) não roda no CI — depende de uma API real de pé, que o workflow
atual não provê. É um comando manual/local, documentado acima.
