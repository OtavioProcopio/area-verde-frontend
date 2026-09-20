# Area Verde Frontend

Frontend operacional do MVP de controle de bar (comandas, produtos, estoque, clientes,
fiado, caixa diário, relatórios, configurações e acesso), em produção de uso real. Consome
a API do repositório [`area-verde`](https://github.com/OtavioProcopio/area-verde) via HTTP.

Estrutura do repositório:

- `.devcontainer/` e `.vscode/` na raiz para padronizar o ambiente de desenvolvimento
- `app/` com todo o código executável do frontend — ver [`app/README.md`](app/README.md) para
  como instalar, rodar e testar

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, Vitest + Testing Library (unitário),
Playwright (E2E).

## Documentação

- [`app/README.md`](app/README.md) — instalação, scripts, estrutura de pastas, testes
- [`docs/mapa-fluxos-e-cobertura-testes.md`](docs/mapa-fluxos-e-cobertura-testes.md) — mapa de
  fluxos do sistema e o que já está coberto por teste (unitário e E2E)
- [`docs/policies/frontend-agent-policy.md`](docs/policies/frontend-agent-policy.md) — regras de
  arquitetura e convenções do projeto
