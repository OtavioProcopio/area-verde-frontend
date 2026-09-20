# Area Verde Frontend

> Identidade e princípios **deste** projeto. Este arquivo **é versionado** — é o que o time
> compartilha. Os princípios da organização ficam em `.specify/memory/constitution.md`, que o
> `/bu:constitution` gera a cada clone e o `.gitignore` mantém fora do git.

## Identidade

- **Projeto**: Area Verde Frontend
- **Tipo**: frontend
- **Stack**: React 19, TypeScript, Vite, Tailwind CSS 4, Vitest, Testing Library, jsdom, lucide-react, motion, `fetch` nativo
- **Domínio**: Frontend operacional do MVP de controle de bar (Area Verde), consumindo a API real `area-verde` — comandas, caixa, produtos, clientes, fiados, relatórios, configurações e acesso
- **Cobertura mínima acordada**: 90% (padrão da organização; ainda não é imposta por CI neste repositório — `npm run test:coverage` roda mas não falha por percentual)

## Princípios específicos deste projeto

> Entram aqui, e só aqui, as regras que valem para **este** repositório e que não estão nos
> princípios da organização. Este repositório já tem uma política própria e mais detalhada em
> `docs/policies/frontend-agent-policy.md` — os princípios abaixo são um resumo verificável dela;
> na dúvida sobre um caso não coberto aqui, esse documento é a referência completa.

### Princípio 1 — Stack fechada, sem adição por padrão

Proíbe introduzir Create React App, react-scripts, tsyringe, reflect-metadata, Jest, Redux,
Zustand, React Query, Axios, Firebase, Supabase ou qualquer resquício de AI Studio. Biblioteca
nova só entra com justificativa técnica explícita, issue relacionada e impacto avaliado.
Referência: `docs/policies/frontend-agent-policy.md` §2, §15.

### Princípio 2 — Feedback contextual obrigatório, não `window.alert`

Todo módulo que chama a API deve tratar loading, erro, estado vazio e **feedback de sucesso
quando aplicável** — proíbe depender só de `console.error` e proíbe `window.alert` para fluxos
comuns (a direção correta é feedback contextual na tela). Referência:
`docs/policies/frontend-agent-policy.md` §12.

### Princípio 3 — `useSystemState.ts` não cresce

Proíbe adicionar responsabilidade nova a `useSystemState.ts`, salvo correção emergencial
pequena — a direção é extrair para `features/<modulo>/{services,mappers,hooks}`. Referência:
`docs/policies/frontend-agent-policy.md` §6.

### Princípio 4 — Camada de API única

Proíbe espalhar `fetch` direto em componentes e proíbe regra de negócio dentro do cliente HTTP
genérico (`lib/api/client.ts`). O caminho é sempre `component/page → hook da feature → service
da feature → apiRequest`. Referência: `docs/policies/frontend-agent-policy.md` §7.

### Princípio 5 — Testes não dependem da API real

Testes unitários usam Vitest + Testing Library + jsdom, com mocks de `fetch`/services — proíbe
teste que dependa de um backend real de pé. Referência: `docs/policies/frontend-agent-policy.md` §13.

## Emendas

| Versão | Data | O que mudou |
|---|---|---|
| 1.0.0 | 2026-09-19 | ratificação inicial |
