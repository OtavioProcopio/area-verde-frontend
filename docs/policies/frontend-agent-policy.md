# Política Técnica para Agentes — Area Verde Frontend

Este documento define as regras obrigatórias para qualquer agente, pessoa ou automação que trabalhe no repositório `OtavioProcopio/area-verde-frontend`.

A política substitui padrões antigos baseados em Create React App, react-scripts, tsyringe, reflect-metadata, Jest e AI Studio. O frontend atual usa React, Vite, TypeScript, Tailwind CSS, Vitest e integração real com a API `area-verde`.

---

## 1. Escopo obrigatório

O agente deve trabalhar somente no repositório:

```text
OtavioProcopio/area-verde-frontend
```

A branch base obrigatória é:

```text
develop
```

Antes de qualquer alteração, o agente deve executar ou orientar o fluxo equivalente:

```bash
git fetch origin
git checkout develop
git pull origin develop
git checkout -b feature/<nome-curto-da-tarefa>
```

Não trabalhar direto em `main` ou `develop`.

Não usar padrões de outros repositórios como referência automática.

---

## 2. Stack oficial do projeto

A stack real do frontend é:

```text
React 19
TypeScript
Vite
Tailwind CSS 4
Vitest
Testing Library
jsdom
lucide-react
motion
fetch nativo
Docker / Nginx
```

O agente não deve introduzir por padrão:

```text
Create React App
react-scripts
tsyringe
reflect-metadata
Jest
Redux
Zustand
React Query
Axios
Firebase
Supabase
AI Studio
```

Qualquer biblioteca nova só pode ser adicionada se houver justificativa técnica explícita, issue relacionada e impacto avaliado.

---

## 3. Comandos de validação obrigatórios

Antes de considerar uma tarefa concluída, o agente deve rodar, no mínimo:

```bash
cd app
npm run typecheck
npm run build
npm run test
```

Quando a tarefa envolver testes, também rodar:

```bash
npm run test:coverage
```

Se algum comando falhar, o agente deve corrigir ou registrar claramente a falha, causa provável e próximo passo.

---

## 4. Estrutura atual reconhecida

A estrutura atual do projeto é:

```text
app/
|- src/
|  |- components/
|  |- hooks/
|  |- lib/
|  |  `- api/
|  |- styles/
|  |- test/
|  |- types.ts
|  |- useSystemState.ts
|  `- App.tsx
|- Dockerfile
|- docker-compose.yml
|- nginx.conf
|- package.json
`- vite.config.ts
```

O agente deve respeitar a estrutura existente e evoluí-la de forma incremental.

Não fazer reescrita completa sem necessidade.

---

## 5. Arquitetura alvo incremental

O frontend deve evoluir para uma arquitetura modular por domínio, sem copiar cegamente a arquitetura do backend.

Estrutura alvo recomendada:

```text
app/src/
|- app/
|  |- App.tsx
|  |- layout/
|  `- navigation/
|- shared/
|  |- api/
|  |- components/
|  |- feedback/
|  |- utils/
|  `- types/
|- features/
|  |- dashboard/
|  |- produtos/
|  |- categorias/
|  |- composicao/
|  |- estoque/
|  |- comandas/
|  |- caixa/
|  |- clientes/
|  |- fiados/
|  |- relatorios/
|  |- configuracoes/
|  `- acesso/
```

Cada feature deve concentrar, quando aplicável:

```text
components/
hooks/
services/
mappers/
types.ts
validators.ts
```

A migração deve ser gradual. Não quebrar a aplicação em uma refatoração grande demais.

---

## 6. Regra central sobre `useSystemState.ts`

`useSystemState.ts` existe hoje como ponto central de estado, integração e regras de tela.

O agente deve reduzir gradualmente esse acoplamento.

Não adicionar novas responsabilidades ao `useSystemState.ts`, salvo correção emergencial pequena.

A direção correta é extrair:

```text
services de API
mappers de DTO
hooks por módulo
estado por feature
tratamento de loading por módulo
tratamento de erro por módulo
```

Exemplo de extração desejada:

```text
features/produtos/services/produtosService.ts
features/produtos/mappers/produtoMapper.ts
features/produtos/hooks/useProdutos.ts
```

---

## 7. Camada de API

O cliente HTTP base é o `fetch` nativo encapsulado em `lib/api/client.ts`.

O agente deve manter a estratégia:

```text
apiRequest<T>()
ApiError
VITE_API_BASE_URL
base padrão /api
```

Não usar Axios por padrão.

Não espalhar `fetch` diretamente em componentes.

Não colocar regra de negócio dentro do cliente HTTP genérico.

O padrão correto é:

```text
component/page
  -> hook da feature
    -> service da feature
      -> apiRequest
        -> backend FastAPI
```

---

## 8. Mappers e contratos

O backend usa DTOs em português e campos em camelCase via alias Pydantic em várias respostas.

O frontend pode manter modelos próprios para UI, mas deve mapear explicitamente:

```text
API DTO -> UI Model
UI Form -> API Request
```

Regras:

- Nunca fazer mapeamento complexo dentro do JSX.
- Nunca duplicar mappers espalhados por componentes.
- Nunca assumir campos que não existam no backend.
- Campos provisórios devem ser comentados como provisórios.
- Enums devem ser tratados de forma explícita.

---

## 9. Estado e atualização de dados

A estratégia atual de `refreshState()` global pode continuar durante a transição, mas não deve crescer.

Sempre que possível, preferir atualização por módulo:

```text
Produtos atualizam produtos/categorias/composição
Comandas atualizam comandas/caixa/estoque quando necessário
Caixa atualiza caixa/histórico
Fiados atualizam fiados/clientes/caixa quando necessário
Relatórios atualizam somente relatórios
```

Evitar recarregar toda a aplicação após qualquer mutation se houver alternativa simples e segura.

---

## 10. Regras por módulo

### Dashboard

O Dashboard deve usar endpoints reais de relatório sempre que possível.

Não duplicar no frontend cálculos que pertencem ao backend.

### Produtos e Categorias

Manter integração com:

```text
/api/produtos
/api/categorias
/api/produtos/{id}/composicao
```

Separar produtos simples, compostos e composição em services/mappers claros.

### Estoque

Usar endpoints reais de estoque:

```text
/api/estoque
/api/estoque/baixo
/api/estoque/negativo
/api/estoque/produtos/{id}/movimentos
/api/estoque/produtos/{id}/entrada
/api/estoque/produtos/{id}/ajuste
```

Não recalcular movimentação de estoque no frontend.

### Comandas

O backend é a fonte de verdade para status, total, itens e baixa de estoque.

O frontend não deve simular fechamento, cancelamento ou baixa de estoque.

### Pagamentos

Pagamentos devem usar os endpoints reais de fechamento e listagem de pagamentos.

Desconto, acréscimo e pagamento parcial só devem ser implementados se o backend suportar oficialmente.

### Caixa

Caixa deve usar os endpoints reais de abertura, fechamento, reforço, sangria e consulta.

Não calcular dinheiro esperado como regra principal no frontend.

### Clientes e Fiados

Clientes, pendências e quitação devem usar a API.

Pagamento parcial de fiado não deve ser inventado no frontend se o backend ainda não suporta.

### Relatórios

Relatórios devem consumir `/api/relatorios/*`.

Evitar relatório calculado em cima de arrays locais quando houver endpoint consolidado.

### Configurações

Configurações ainda não possuem endpoint backend oficial.

Enquanto isso, qualquer configuração local deve ficar isolada e marcada como provisória.

### Acesso / PIN

O PIN local atual é provisório.

Não tratar PIN em `localStorage` como autenticação real.

Não criar fluxo de auth fictício antes de existir contrato backend.

---

## 11. Regras de UI e componentes

Componentes devem ser preferencialmente puros e receber dados por props.

Evitar componentes que fazem simultaneamente:

```text
fetch
mapeamento
regra de negócio
estado global
renderização complexa
```

Componentes grandes devem ser quebrados por responsabilidade:

```text
Header
Toolbar
Table
Form
Modal
Card
EmptyState
ErrorState
LoadingState
```

Não remover identidade visual atual sem solicitação explícita.

---

## 12. Tratamento de loading, erro e feedback

Todo módulo que chama API deve tratar:

```text
loading
error
empty state
success feedback quando aplicável
```

Usar `ApiError` quando disponível.

Não depender apenas de `console.error`.

Evitar `window.alert` para fluxos comuns. Alertas podem existir temporariamente, mas a direção correta é feedback contextual na tela.

---

## 13. Testes

A stack oficial de testes é:

```text
Vitest
Testing Library
jsdom
```

Não usar Jest.

Prioridades de teste:

```text
apiRequest
mappers
services por módulo
hooks críticos
fluxos de caixa
fluxos de comanda
fluxos de fiado
componentes de formulário
tratamento de erro
```

Testes unitários não devem depender da API real.

Usar mocks de `fetch` ou services falsos quando necessário.

---

## 14. Docker, Vite e proxy

O projeto usa Vite.

O proxy local deve respeitar `vite.config.ts`.

A API pode ser acessada por:

```text
/api
VITE_API_BASE_URL
proxy do Vite
proxy do Nginx em produção/container
```

Não adicionar `setupProxy.js`, pois isso é padrão de Create React App e não se aplica ao Vite.

---

## 15. Regras sobre AI Studio

O uso de AI Studio foi eliminado.

O agente não deve:

```text
importar telas do AI Studio
manter mocks vindos do AI Studio
justificar arquitetura com base no AI Studio
criar código com comentários ou licenças herdadas do AI Studio
```

Qualquer vestígio antigo deve ser removido gradualmente quando estiver no escopo da tarefa.

---

## 16. Git Flow e Pull Request

Toda alteração deve seguir o fluxo:

```text
develop -> feature/* -> pull request -> develop
```

Commits devem ser pequenos e objetivos.

Sugestões de prefixo:

```text
feat:
fix:
refactor:
test:
docs:
chore:
```

Antes de abrir PR, validar:

```bash
npm run typecheck
npm run build
npm run test
```

A descrição do PR deve conter:

```text
Resumo
Issue relacionada
Arquivos principais alterados
Como testar
Riscos
Checklist de validação
```

---

## 17. Checklist obrigatório para agentes

Antes de alterar:

- [ ] Confirmar que está no repositório `area-verde-frontend`.
- [ ] Confirmar que a base é `develop`.
- [ ] Ler `app/package.json`.
- [ ] Ler `app/vite.config.ts`.
- [ ] Ler arquivos diretamente relacionados à tarefa.
- [ ] Não assumir CRA, Jest, tsyringe, Redux, Axios ou AI Studio.

Durante a alteração:

- [ ] Manter a stack atual.
- [ ] Não criar endpoints inexistentes.
- [ ] Não simular regra que pertence ao backend.
- [ ] Não aumentar responsabilidade do `useSystemState.ts`.
- [ ] Criar ou ajustar testes quando houver lógica extraída.

Antes de concluir:

- [ ] Rodar `npm run typecheck`.
- [ ] Rodar `npm run build`.
- [ ] Rodar `npm run test`.
- [ ] Informar claramente o que mudou.
- [ ] Informar riscos ou pendências.

---

## 18. Decisão arquitetural principal

O frontend deve evoluir de um MVP funcional para uma arquitetura modular, sem reescrita total.

A prioridade é:

```text
1. Preservar sistema rodando.
2. Reduzir acoplamento.
3. Separar API/services/mappers/hooks.
4. Melhorar feedback de erro/loading.
5. Testar integração e regras críticas.
6. Só depois evoluir navegação, rotas e autenticação real.
```

Essa política deve ser usada como referência obrigatória para prompts de agentes, issues e pull requests do frontend.
