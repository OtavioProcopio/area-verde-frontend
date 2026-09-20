# Plano de implementação — Sistema de notificação de sucesso/erro nos formulários

> Descreve **como**. Deriva da spec e da constituição; não introduz requisito novo.

## Decisões técnicas

| Decisão | Escolha | Alternativas descartadas | Por quê |
|---|---|---|---|
| Onde mora o toast | `React.Context` (`ToastProvider`/`useToast`) em `src/features/shared/contexts/`, montado uma vez em `App.tsx`, com um componente `ToastStack` renderizado no root | Prop-drilling de uma função `showToast` por todos os componentes | O app já tem múltiplas telas lazy-loaded (`App.tsx`) que precisariam receber a prop; Context é o padrão nativo do React para algo que qualquer componente da árvore pode disparar, sem acoplar a assinatura de cada componente |
| Onde os hooks de estado (`useComandasState` etc.) chamam o toast | **Em nenhum lugar** — todos os hooks continuam retornando só `{success, msg}`, como já fazem hoje. Quem dispara o toast é o componente que chama o hook | Fazer `useComandasState`/`useProductsState` etc. chamarem `useToast()` internamente | Todo hook de estado do projeto hoje é "puro" (sem efeito colateral de UI) — só `useComandasState` tinha `window.alert` como exceção. Manter esse contrato uniforme (Princípio "Camada de API única" / hooks devolvem dado, componente decide UI) é mais simples e não quebra o padrão que todos os outros hooks já seguem |
| Onde entra o toast de sucesso (RF-02) | No componente, no mesmo ponto em que hoje ele fecha o formulário/modal silenciosamente (`setShowXForm(false)`) — chama `showToast({tone:'success', message: res.msg})` logo antes | Mover a lógica de sucesso para dentro do hook | Mantém o hook puro (decisão acima); o componente já é o único lugar que sabe se deve fechar algo, então é o lugar certo para decidir mostrar o toast também |
| Onde entra o toast de erro sem formulário aberto (RF-05, RF-07) | No componente/wrapper que chama a ação, no ponto onde hoje não há nenhum tratamento (interações de item de comanda) ou onde hoje há `window.alert`/`alert()` cobrindo um resultado de operação sem modal (ex.: pagamento de fiado no detalhe do cliente) | Manter os `window.alert`/`alert()` atuais | RF-03/RF-05/RF-07 proíbem `window.alert` nesses casos; o toast é a substituição direta |
| Erro com formulário/modal aberto (RF-06) | Continua com o padrão já existente: estado local de erro (`XFormError`) + `InlineFeedback` — inclusive nos 2 lugares que hoje usam `alert()`/`window.alert` para uma validação síncrona dentro de um formulário aberto (recipe/composição de produto, quitar fiado, sangria de caixa), que passam a usar um estado de erro local em vez do alerta bloqueante | Trocar também esses por toast | Decidido em `/bu:clarify` (RF-06): erro com formulário aberto fica inline, não toast — o usuário precisa ver o que corrigir sem a mensagem sumir sozinha |
| Auto-dismiss e empilhamento (RNF-01, RNF-02) | Estado do `ToastProvider` mantém `visible` (máx. 3) e `queue`; cada toast agenda seu próprio `setTimeout` de 5000ms que o remove de `visible` e promove o próximo da `queue`, se houver | Biblioteca de terceiros para toast (ex.: `react-hot-toast`, `sonner`) | Princípio "Stack fechada, sem adição por padrão": biblioteca nova só entra com justificativa técnica explícita; o comportamento pedido (RNF-01/RNF-02) é simples o bastante para não justificar uma dependência nova, e o projeto já tem `motion` disponível para a animação de entrada/saída |
| Estilo visual do toast | Reaproveita a paleta de tom já usada em `InlineFeedback` (`success`→emerald, `error`→rose, `info`→slate/gold) e a posição fixa já usada em `OperationNotice` (topo, centralizado) | Criar paleta nova | Consistência visual com o que já existe; evita uma terceira linguagem visual de feedback no mesmo app |
| `OperationNotice`/`notice` local de `Comandas.tsx` | Aposentado: as 3 chamadas de `showNotice(...)` (guardas de navegação: "selecione uma comanda", "comanda vazia", etc.) passam a usar `useToast()` com `tone: 'info'` | Manter os dois sistemas de notificação em paralelo | Ter duas implementações de "mensagem que aparece e some sozinha" no mesmo app é a duplicação que a constituição (Simplicidade defensável) e a política de UI do projeto (componentes reutilizáveis) pedem para evitar |

## Padrões de projeto aplicados

| Padrão | Onde | Problema que resolve | Custo aceito |
|---|---|---|---|
| Observer (via Context + hook) | `ToastContext`/`useToast` | Qualquer componente da árvore precisa poder disparar uma notificação renderizada em um único lugar (o `ToastStack` no root), sem prop-drilling | Um Context a mais na árvore; aceitável dado que é exatamente o problema que Context resolve |

Nenhum outro padrão novo. Fila (`queue`) de toasts é uma estrutura de dados simples (array),
não um padrão GoF — Command/Mediator foram considerados e descartados por não resolverem nada
que o Context sozinho não resolva aqui.

## Arquivos a criar ou alterar

| Camada | Arquivo | Ação | Teste espelhado |
|---|---|---|---|
| shared | `app/src/features/shared/contexts/ToastContext.tsx` | criar — `ToastProvider`, `useToast()`, tipo `Toast` (`tone`, `message`), fila com máx. 3 visíveis e auto-dismiss em 5s | `app/src/features/shared/contexts/ToastContext.test.tsx` |
| shared | `app/src/features/shared/components/ToastStack.tsx` | criar — renderiza os toasts visíveis do contexto, com `motion` para entrada/saída | `app/src/features/shared/components/ToastStack.test.tsx` |
| app | `app/src/App.tsx` | alterar — envolve a árvore com `ToastProvider`, renderiza `ToastStack` uma vez | — (coberto pelos testes de integração de cada fluxo que passa a disparar toast) |
| comandas | `app/src/features/comandas/hooks/useComandasState.ts` | alterar — remove os 5 `window.alert`; os 2 casos "não suportado" (`addItemToComanda` para item manual, `reativarComanda`) passam a só retornar `{success:false, msg}`, como todo o resto do hook já faz | `app/src/features/comandas/hooks/useComandasState.test.ts` (atualizar: os 2 testes que hoje verificam `window.alert` passam a verificar só o retorno) |
| comandas | `app/src/components/Comandas.tsx` | alterar — `addItem`, o wrapper de `onUpdateComandaItemQty` passado ao `CartPanel` e o `onConfirm` de remover item passam a `await` e chamar `useToast()` (sucesso e erro, RF-05); as 3 chamadas de `showNotice` viram `showToast(tone:'info')`; remove `notice`/`showNotice`/`NOTICE_DURATION_MS`/import de `OperationNotice`; `handleCreateComanda` ganha toast de sucesso antes de fechar o modal | — (componente sem teste direto hoje; comportamento coberto pelos testes do hook e do `ToastContext`) |
| comandas | `app/src/components/comandas/OperationNotice.tsx` | remover — superado pelo `ToastStack` compartilhado | — |
| comandas | `app/src/components/comandas/CheckoutModal.tsx` | alterar — `handleConfirm` chama `useToast()` com sucesso antes de `onSuccess(...)` | — |
| produtos | `app/src/components/Produtos.tsx` | alterar — toast de sucesso em `handleSaveProduct`, `handleSaveCat` e `handleToggleProductStatus` (antes de fechar/sem modal); `handleAddRecipeIngredient` troca `alert(...)` por `setProductFormError(...)` (reaproveita o `InlineFeedback` já existente no formulário de produto); `handleSaveComp` ganha estado de erro local novo (`compFormError`) + `InlineFeedback` no modal de composição, no lugar dos 3 `alert(...)` | — |
| clientes | `app/src/components/Clientes.tsx` | alterar — toast de sucesso ao salvar cliente e ao ativar/inativar; `handleRegisterPayment` troca o `alert(...)` de "caixa fechado" por um estado de erro local novo exibido no painel de pagamento, e o `alert(result.msg)` final vira toast (sucesso ou erro — esse painel não é um formulário que "fica aberto" bloqueando o próximo passo) | — |
| fiados | `app/src/components/Fiados.tsx` | alterar — `handleQuitar` ganha estado de erro local novo (`quitarError`) + `InlineFeedback` no modal de quitação, no lugar dos 3 `alert(...)` de validação; o resultado final vira toast de sucesso (fecha o modal) ou permanece inline se falhar (RF-06); o `alert(...)` de "Ver Comanda em desenvolvimento" vira `showToast(tone:'info')` (RF-07) | — |
| caixa | `app/src/components/Caixa.tsx` | alterar — toast de sucesso em `handleAberturaSubmit`, `handleReforcoSubmit`, `handleSangriaSubmit` e o handler de fechamento equivalente (4 modais); o `alert(...)` de sangria excedendo dinheiro físico passa a usar o `setFormError` já existente na mesma função, em vez de `alert` | — |

**Fora desta tabela, sem alteração** (achado durante o `/bu:plan`, não durante a spec):
`Configuracoes.tsx` já mostra sucesso e erro de forma inline e persistente via
`configuracaoFeedback`/`accessFeedback` (tom `success`/`error` já implementado nos hooks
`useConfiguracoesState`/`useAccessPin`) — não é um formulário que fecha, é uma página de
configurações sempre visível, então a notificação persistente já atende RF-02/RF-03 sem
precisar de toast. Convertê-la para toast substituiria um padrão já correto por um pior (a
mensagem sumiria em 5s numa tela sem "fechar" para sinalizar que a ação terminou).

## Contrato entre camadas

`ToastContext` expõe `useToast(): { showToast(tone, message): void }`. Qualquer componente sob
`ToastProvider` (toda a árvore, montado em `App.tsx`) pode chamar. O provider mantém
`visible: Toast[]` (máx. 3) e `queue: Toast[]`; cada toast tem um `id` e um `setTimeout` de
5000ms que o remove de `visible`; ao remover, se `queue` não estiver vazia, promove o primeiro
item dela para `visible`.

Hooks de estado (`useComandasState`, `useProductsState` etc.) **não conhecem** `useToast` —
continuam devolvendo `{success, msg}` para quem os chama. Componentes decidem: se o resultado é
de sucesso e não há formulário para manter aberto, chamam `showToast('success', msg)`; se é erro
e o formulário/modal segue aberto, usam o estado de erro local + `InlineFeedback` já existente
(ou criado, quando ainda não existia); se é erro sem formulário aberto (itens de comanda,
pagamento de fiado no detalhe do cliente), chamam `showToast('error', msg)`.

## Dependências externas

| Dependência | Versão | Justificativa | Simulada nos testes por |
|---|---|---|---|
| — | — | Nenhuma nova; reaproveita `motion` (já em `package.json`) para animação de entrada/saída do toast | — |

## Impacto no contrato de operação

Nenhum. Nenhum novo alvo de `Makefile`, nenhuma mudança em `vite.config.ts`, `docker-compose.yml`
ou CI — `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:coverage` continuam
os mesmos comandos.

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| `useComandasState.test.ts` quebrar ao remover `window.alert` (se algum teste espia `window.alert`) | Média | Rodar a suíte de testes do hook logo após a remoção, antes de seguir para os componentes, e ajustar as asserções que hoje checam `window.alert` para checar só o retorno `{success, msg}` |
| Esquecer algum `window.alert`/`alert()` remanescente fora da lista já levantada | Baixa (busca já feita em todo `src/`, ver Riscos → verificação) | Rodar `grep -rn "alert(" src/` (excluindo `window.confirm`) de novo ao final da implementação, como critério de pronto |
| `ToastStack` cobrir conteúdo interativo importante da tela | Baixa | Posição fixa no topo, central, com no máximo 3 visíveis (RNF-02); mesma posição já validada pelo `OperationNotice` que está sendo substituído |

## Conformidade com a constituição

| Princípio | Como este plano o respeita |
|---|---|
| Contrato de operação (org) | Não se aplica a este repositório do jeito que o texto descreve (Makefile em `app/` com `make infra`/`make it`/`make bdd` não existe aqui) — desvio já documentado na ratificação da constituição; os comandos reais (`npm run typecheck/build/test/test-coverage`) continuam os mesmos, RF nenhum os altera |
| Arquitetura limpa (org) | Não se aplica ao layout `adapters/core/infra` do template — este repositório usa `features/<módulo>/{components,hooks,services,mappers}`, já documentado como desvio aceito. Este plano segue esse layout real: novo código entra em `features/shared/{contexts,components}` |
| Testes provam a entrega | Todo cenário de aceite da spec vira teste em `ToastContext.test.tsx`/`ToastStack.test.tsx` e nos testes de hook ajustados; convenção real do repositório (Vitest + Testing Library, nomes em português, sem mock manual de interface — ver Princípio 11 específico) |
| Simplicidade defensável | Nenhuma biblioteca nova; reaproveita `InlineFeedback`, `motion` e a paleta de cor já existentes; um só sistema de notificação transitória (aposenta `OperationNotice`) em vez de dois |
| Autoria | Nenhum artefato atribui autoria a ferramenta de IA |
| Idioma | `spec.md`, este `plan.md`, mensagens e documentação em português |
| Stack fechada (específico) | Nenhuma lib nova (Princípio 7) |
| Feedback contextual, não `window.alert` (específico) | É o requisito central desta feature (Princípio 8) |
| `useSystemState.ts` não cresce (específico) | Nenhuma mudança em `useSystemState.ts` — o toast é consumido diretamente pelos componentes, não passa por ali |
| Camada de API única (específico) | Hooks de estado continuam não sabendo de UI; `ToastContext` não é uma camada de API, é puramente de apresentação |
| Testes não dependem da API real (específico) | Testes do `ToastContext`/`ToastStack` não tocam rede; testes de hook continuam mockando os services, como já faziam |
