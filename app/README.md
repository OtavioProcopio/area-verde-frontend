# Area Verde Frontend

Aplicação web do bar em `React + Vite + Tailwind CSS`.

Esta pasta concentra o código executável do frontend. O protótipo anterior vinha do AI Studio e usava dados mockados em `localStorage`; a próxima etapa natural é substituir esse fluxo por integração com a `area-verde-api`.

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
|- nginx.conf
|- package.json
`- vite.config.ts
```

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run test`
- `npm run test:watch`
- `npm run test:coverage`
- `npm run typecheck`

## Testes

O projeto usa `Vitest + Testing Library + jsdom`, que encaixa melhor com `React + Vite` do que a configuração de `Jest` usada no repositório de referência.

## API

Configure `VITE_API_BASE_URL` em `.env` a partir de [.env.example](./.env.example). O valor padrão está apontando para a API local em `http://localhost:8001/api`.
