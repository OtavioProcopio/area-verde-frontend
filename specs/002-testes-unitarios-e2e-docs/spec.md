# Especificação — Testes unitários de API/mappers, scripts E2E e atualização de documentação

> Descreve **o quê** e **por quê**. Não descreve como implementar: sem nome de biblioteca,
> sem esquema de banco, sem assinatura de função.

## Problema

O frontend tem duas issues de teste abertas há tempo. A #7 aponta que a camada de integração
com a API (o cliente HTTP e os mappers de cada domínio) não tem nenhum teste unitário direto —
a cobertura hoje é só incidental, via testes de hook que mockam o service inteiro, então uma
mudança de contrato entre frontend e backend (nome de campo, formato de data, enum) pode passar
despercebida. A #11 aponta que, apesar de já existir uma suíte Playwright robusta em `app/e2e/`
(10 arquivos, cobrindo login, cada módulo do sistema e um fluxo completo de atendimento), ela não
está formalizada com scripts próprios no `package.json`, não documenta os pré-requisitos pra
rodar, e não valida explicitamente o caso conhecido de `GET /api/caixas/aberto` responder 404
quando não há caixa aberto (comportamento esperado, mas nunca testado como tal).

Além disso, a documentação do frontend ficou pra trás em relação ao código: o `README.md` raiz
ainda descreve o projeto como protótipo recém-saído do AI Studio, `app/README.md` descreve uma
estrutura de pastas que não é mais a real (o padrão vigente é
`features/<domínio>/{hooks,services,mappers}`, não uma pasta `hooks/` solta), e
`docs/mapa-fluxos-e-cobertura-testes.md` já se autodeclara desatualizado num trecho sobre
Configurações e PIN sem ter sido corrigido.

## Objetivo

- A camada de API (cliente HTTP) e os mappers de produtos, categorias, clientes, comandas, caixa
  e fiados passam a ter teste unitário direto, sem depender de backend real.
- A suíte E2E existente ganha scripts formais (`test:e2e`, `test:e2e:ui`, `test:e2e:report`), um
  cenário novo que valida o tratamento do 404 esperado em `/api/caixas/aberto`, e captura de
  console errors nesse cenário novo.
- `README.md` raiz, `app/README.md` e `docs/mapa-fluxos-e-cobertura-testes.md` refletem o estado
  real do projeto: arquitetura por `features/`, módulos implementados, e como rodar cada suíte de
  teste (Vitest e Playwright).

## Fora de escopo

- Expandir a captura de console errors para os 10 arquivos E2E já existentes — só o cenário novo
  desta feature ganha isso.
- Testes de componente para as telas grandes (`Produtos.tsx`, `Clientes.tsx` etc.) — não é o
  padrão de teste já estabelecido no projeto (ver nota em `docs/mapa-fluxos-e-cobertura-testes.md`).
- Rodar a suíte E2E dentro do pipeline de CI — ela depende de API real rodando, o que o workflow
  atual não provê; permanece um comando manual/local.
- Alterar `docker-compose.local.yml` ou qualquer caminho relativo a outro repositório — não é
  inconsistência do repo, é uma particularidade do checkout local desta máquina.
- Auditoria da documentação do backend (`area-verde`) — tratada em spec própria nesse outro
  repositório.

## Personas e cenários de uso

- **Quem desenvolve no frontend** (humano ou agente): abre o repo, quer saber em 2 minutos como
  rodar os testes unitários e os E2E, e quer confiar que um teste vermelho de mapper indica uma
  quebra real de contrato com a API, não um mock desatualizado.
- **Quem revisa PR**: usa a suíte E2E localmente antes de aprovar uma mudança que toca fluxo de
  caixa, pra confirmar que o estado "caixa fechado" continua sendo tratado como vazio, não como
  erro.

## Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | O sistema deve ter teste unitário cobrindo `apiRequest` (cliente HTTP) para: resposta de sucesso com corpo JSON, erro com corpo JSON (`ApiError` com `payload`), erro com corpo texto puro, e resposta `204` sem corpo. | obrigatório |
| RF-02 | O sistema deve ter teste unitário para cada um dos 6 mappers de domínio (produtos, categorias, clientes, comandas, caixa, fiados), cobrindo a conversão de tipos (`toNumber`, datas) e o mapeamento de enums de status/forma de pagamento vindos da API. | obrigatório |
| RF-03 | O `package.json` do frontend deve expor os scripts `test:e2e`, `test:e2e:ui` e `test:e2e:report` que executam a suíte Playwright já existente em `app/e2e/`. | obrigatório |
| RF-04 | Deve existir um cenário E2E que confirma que, com o caixa fechado (sem caixa aberto no backend), a tela correspondente mostra o estado vazio/fechado — validando na prática que o 404 de `GET /api/caixas/aberto` é tratado como esperado, não como erro. | obrigatório |
| RF-05 | O cenário E2E do RF-04 deve capturar erros de console/página da aplicação e falhar o teste se algum ocorrer de forma inesperada durante o fluxo. | obrigatório |
| RF-06 | `README.md` (raiz) deve descrever o estado atual do projeto (dois módulos de frontend + backend, stack, como se relacionam), sem o framing de protótipo do AI Studio. | obrigatório |
| RF-07 | `app/README.md` deve descrever a estrutura real de pastas (`features/<domínio>/{hooks,services,mappers,types.ts}` + `components/` de tela), listar os módulos implementados, e documentar os comandos de Vitest e Playwright (incluindo os pré-requisitos pra rodar E2E: API e frontend em execução). | obrigatório |
| RF-08 | A nota já sinalizada como desatualizada em `docs/mapa-fluxos-e-cobertura-testes.md` (sobre Configurações não ter endpoint oficial e PIN em `localStorage`) deve ser corrigida para refletir o estado real do código. | obrigatório |

## Requisitos não funcionais

| ID | Requisito | Critério mensurável |
|---|---|---|
| RNF-01 | Cobertura de linhas dos arquivos tocados por esta feature (cliente HTTP + 6 mappers) deve subir substancialmente em relação ao nível atual, majoritariamente incidental. | De ~10-20% (nível atual, incidental) para pelo menos 80% de linhas em cada arquivo, medido por `npm run test:coverage`. |
| RNF-02 | Os testes unitários novos não podem depender de rede real. | Zero chamadas de rede real nos testes de `apiRequest`/mappers — tudo via mock/stub do `fetch` ou de dado local. |

## Critérios de aceite

```gherkin
# language: pt
Funcionalidade: Testes unitários de API/mappers, scripts E2E e atualização de documentação

  Cenário: apiRequest trata sucesso, erro JSON, erro texto e 204
    Dado um mock de fetch configurado para cada uma dessas respostas
    Quando apiRequest é chamado
    Então o teste confirma o corpo retornado no caso de sucesso, um ApiError com o payload no caso de erro JSON, um ApiError com mensagem de texto no caso de erro texto, e undefined/vazio no caso 204
    Mas nenhuma chamada de rede real acontece

  Cenário: mapper de cada domínio converte a resposta da API corretamente
    Dado um objeto de resposta de API (fixture) para produtos, categorias, clientes, comandas, caixa ou fiados
    Quando o mapper correspondente é chamado
    Então o objeto de domínio resultante tem os campos e enums mapeados corretamente
    Mas o teste não depende de nenhum service ou hook

  Cenário: scripts de E2E rodam a suíte Playwright existente
    Dado o frontend instalado localmente
    Quando o usuário roda npm run test:e2e
    Então a suíte Playwright em app/e2e/ executa
    Mas o comando não exige nenhuma configuração manual adicional além do documentado

  Cenário: dashboard com caixa fechado não gera erro
    Dado que não existe caixa aberto no backend (GET /api/caixas/aberto responde 404)
    Quando o usuário autenticado chega ao dashboard/tela de caixa
    Então a tela mostra o estado de caixa fechado/vazio
    Mas nenhum console.error ou erro de página inesperado é capturado durante o fluxo

  Cenário: documentação reflete o estado real do projeto
    Dado o README raiz, o app/README.md e o mapa de cobertura de testes
    Quando um novo colaborador lê esses arquivos
    Então ele encontra a estrutura de pastas real, os módulos implementados e como rodar Vitest e Playwright
    Mas não encontra mais a nota desatualizada sobre Configurações/PIN
```

## Ambiguidades

Nenhuma — o pedido do usuário já delimitou escopo (issues #7 e #11 + os três arquivos de
documentação) o suficiente para prosseguir sem checagem adicional.

## Métricas de sucesso

- `npm run test:coverage` mostra cobertura de linhas ≥ 80% em `lib/api/client.ts` e nos 6 mappers
  tocados.
- `npm run test:e2e` roda com sucesso localmente contra a stack já usada nesta sessão (API local +
  `npm run dev`), incluindo o cenário novo de caixa fechado.
- `npm run typecheck`, `npm run lint`, `npm run format:check` e `npm run build` continuam verdes.
- As issues #7 e #11 podem ser fechadas com base no código, não em promessa.
