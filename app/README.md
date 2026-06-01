# Area Verde Frontend

Aplicacao web do bar em `React + Vite + Tailwind CSS`.

Esta pasta concentra o codigo executavel do frontend. O fluxo atual usa integracao real com a `area-verde-api`, mantendo `React + Vite + TypeScript + Tailwind + Vitest` como stack oficial.

## Estrutura

```text
app/
|- src/
|  |- components/
|  |- hooks/
|  |- lib/
|  |- styles/
|  |- test/
|  |- types.ts
|  `- App.tsx
|- Dockerfile
|- docker-compose.yml
|- Makefile
|- nginx.conf
|- package.json
`- vite.config.ts
```

## Instalação

Use `npm ci` como caminho padrao para ambiente local, CI e container:

```bash
cd app
npm ci
```

Quando for necessario atualizar dependencias e regenerar o lockfile, use `npm install` de forma intencional e versione o `package-lock.json`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run test`
- `npm run test:coverage`

## Makefile

Para listar os atalhos disponiveis:

```bash
cd app
make help
```

Comandos mais usados:

- `make install`
- `make doctor`
- `make check`
- `make ci-docker`

## Validação local

Validacao de leitura:

```bash
cd app
make check
```

Validacao com Docker:

```bash
cd app
make ci-docker
```

## Testes

O projeto usa `Vitest + Testing Library + jsdom`, que encaixa melhor com `React + Vite` do que a configuracao antiga baseada em Jest.

## API

Configure `VITE_API_BASE_URL` em `.env` a partir de [.env.example](./.env.example). O valor padrao esta apontando para a API local em `http://localhost:8001/api`.

## CI

Pull requests para `develop` e pushes em `develop` executam o workflow `frontend-ci`, que roda:

- `npm ci`
- `npm run typecheck`
- `npm run format:check`
- `npm run lint`
- `npm run test:coverage`
- `npm run build`
- `docker build -t area-verde-frontend:ci ./app`
