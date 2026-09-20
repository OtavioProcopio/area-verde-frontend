# Tarefas — Sistema de notificação de sucesso/erro nos formulários

> Ordem de dependência. `[P]` marca tarefa paralelizável (não toca arquivo de outra `[P]`
> da mesma fase). Teste vem antes da implementação que ele prova.

> Nota sobre cobertura de teste: `Produtos.tsx`, `Clientes.tsx`, `Fiados.tsx`, `Caixa.tsx` e
> `Comandas.tsx` não têm teste unitário próprio hoje (só `Login.tsx` tem, entre os componentes
> grandes) — a convenção real deste repositório testa a camada de **hooks**, não os componentes
> de tela grandes. Este plano segue essa convenção: testa o `ToastContext`/`ToastStack` (código
> novo) e ajusta `useComandasState.test.ts` (comportamento de hook que muda); não introduz teste
> de componente novo para os 5 arquivos de tela, por não ser o padrão já estabelecido no projeto
> e estar fora do pedido da issue (que pede auditoria de feedback, não cobertura de teste nova).

## Fase 1 — Fundação (toast compartilhado)

- [x] T001 Escrever `app/src/features/shared/contexts/ToastContext.test.tsx` — cobre: `showToast` adiciona um toast visível; toast some sozinho após o tempo configurado (RNF-01); no máximo 3 visíveis ao mesmo tempo, o 4º entra em fila e só aparece quando o mais antigo some (RNF-02)
- [x] T002 Implementar `app/src/features/shared/contexts/ToastContext.tsx` — `ToastProvider`, `useToast()`, tipo `Toast{id, tone: 'success'|'error'|'info', message}`, fila com máx. 3 visíveis e auto-dismiss em 5000ms (RF-01, RNF-01, RNF-02)
- [x] T003 Escrever `app/src/features/shared/components/ToastStack.test.tsx` — cobre: renderiza cada toast visível do contexto com o tom e a mensagem corretos
- [x] T004 Implementar `app/src/features/shared/components/ToastStack.tsx` — lê `useToast()`, renderiza os toasts visíveis com `motion` (entrada/saída), paleta de cor igual à do `InlineFeedback`, posição fixa igual à do `OperationNotice` que está sendo substituído (RF-01)
- [x] T005 Alterar `app/src/App.tsx` — envolve a árvore com `ToastProvider`, renderiza `ToastStack` uma vez no root

## Fase 2 — Comandas (item de comanda, novo modal, avisos)

- [x] T006 Alterar `app/src/features/comandas/hooks/useComandasState.test.ts` — os testes que hoje verificam `window.alert` em `addItemToComanda` (item manual) e em `reativarComanda` passam a verificar só o retorno `{success:false, msg}` (RF-05, RF-07)
- [x] T007 Alterar `app/src/features/comandas/hooks/useComandasState.ts` — remove os 5 `window.alert`; `addItemToComanda` (item manual) e `reativarComanda` passam a só retornar `{success:false, msg}`, como todo o resto do hook já faz (RF-05, RF-07)
- [x] T008 Alterar `app/src/components/Comandas.tsx` — `addItem`, o wrapper de `onUpdateComandaItemQty` passado ao `CartPanel` e o `onConfirm` de remover item passam a `await` a ação e chamar `useToast()` (sucesso e erro); as 3 chamadas de `showNotice(...)` viram `showToast(tone:'info', ...)`; remove `notice`/`showNotice`/`NOTICE_DURATION_MS`/import de `OperationNotice`; `handleCreateComanda` ganha `showToast(tone:'success', ...)` antes de fechar o modal (RF-02, RF-05, RF-07)
- [x] T009 Remover `app/src/components/comandas/OperationNotice.tsx` (superado pelo `ToastStack`)
- [x] T010 Alterar `app/src/components/comandas/CheckoutModal.tsx` — `handleConfirm` chama `useToast()` com sucesso antes de `onSuccess(...)` (RF-02)

## Fase 3 — Demais formulários

> Cada tarefa toca um arquivo diferente dos das outras — `[P]`.

- [x] T011 [P] Alterar `app/src/components/Produtos.tsx` — toast de sucesso em `handleSaveProduct`, `handleSaveCat` e `handleToggleProductStatus`; `handleAddRecipeIngredient` troca `alert(...)` por `setProductFormError(...)` (reaproveita o `InlineFeedback` já existente); `handleSaveComp` ganha estado de erro local novo (`compFormError`) + `InlineFeedback` no modal de composição, no lugar dos 3 `alert(...)` (RF-02, RF-06)
- [x] T012 [P] Alterar `app/src/components/Clientes.tsx` — toast de sucesso ao salvar cliente e ao ativar/inativar; `handleRegisterPayment` troca o `alert(...)` de "caixa fechado" por estado de erro local exibido no painel, e o `alert(result.msg)` final vira `showToast` (sucesso ou erro) (RF-02, RF-03, RF-06)
- [x] T013 [P] Alterar `app/src/components/Fiados.tsx` — `handleQuitar` ganha estado de erro local novo (`quitarError`) + `InlineFeedback` no modal de quitação, no lugar dos 3 `alert(...)` de validação; resultado final vira `showToast` de sucesso (fecha o modal) ou fica inline se falhar; o `alert(...)` de "Ver Comanda em desenvolvimento" vira `showToast(tone:'info')` (RF-02, RF-03, RF-06, RF-07)
- [x] T014 [P] Alterar `app/src/components/Caixa.tsx` — toast de sucesso em `handleAberturaSubmit`, `handleReforcoSubmit`, `handleSangriaSubmit` e o handler de fechamento equivalente; o `alert(...)` de sangria excedendo dinheiro físico passa a usar o `setFormError` já existente na mesma função (RF-02, RF-03, RF-06)

## Fase 4 — Integração e verificação final

> Mesmo desvio já documentado no backend: sem framework BDD específico neste repositório para
> além do Playwright E2E (fora do escopo desta feature, que é Vitest/unitário). Os 4 cenários
> Gherkin de `spec.md` mapeiam para os testes de T001 (fundação) e para a verificação manual de
> T015/T016 abaixo, já que os componentes de tela não têm teste unitário próprio (ver nota no
> topo deste arquivo).

- [x] T015 Rodar `grep -rn "[^.]\balert(" app/src --include=*.ts --include=*.tsx` (excluindo `window.confirm`/`confirm(`) e confirmar que não sobrou nenhuma ocorrência fora de teste
- [x] T016 Atualizar `docs/mapa-fluxos-e-cobertura-testes.md` — a nota da seção "Nota sobre convenção de testes do projeto" que lista os `alert()` como "gaps conhecidos e aceitos" passa a registrar que foram corrigidos nesta feature
- [x] T017 `npm run typecheck && npm run build && npm run test && npm run test:coverage` verdes (dentro de `app/`)

## Rastreabilidade

| Requisito | Tarefas |
|---|---|
| RF-01 | T001, T002, T003, T004 |
| RF-02 | T008, T010, T011, T012, T013, T014 |
| RF-03 | T007, T012, T013, T014 |
| RF-04 | T002 (toast vive fora do estado do formulário, não some ao fechar) |
| RF-05 | T006, T007, T008 |
| RF-06 | T011, T012, T013, T014 |
| RF-07 | T006, T007, T008, T013 |
| RNF-01 | T001, T002 |
| RNF-02 | T001, T002 |

## Convergence

> Seção **append-only**, escrita por `/bu:converge`. Cada rodada acrescenta um bloco;
> nada é reescrito.
