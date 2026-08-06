# Mapa de Fluxos e Cobertura de Testes — Area Verde Frontend

## Objetivo

Documento de referência para decidir o que falta testar antes de considerar o
MVP validado para deploy real no bar. Lista todo módulo, todo fluxo de uso
(não só o caminho feliz) e o status real de cobertura hoje.

**Contexto importante:** a suíte E2E existente (`app/e2e/fluxo-atendimento-bar.spec.ts`,
Playwright) cobre **um caminho por tela**, aproximadamente 10% da superfície
real do sistema. Este documento existe para corrigir isso antes de qualquer
conversa de release.

## Nota sobre convenção de testes do projeto

`docs/policies/frontend-agent-policy.md` (seção 13) define a stack oficial de
testes como **Vitest + Testing Library + jsdom, com mocks de `fetch`/services**,
não testes end-to-end contra a API real. A suíte Playwright que criamos é
complementar a isso, não substitui — ela já provou valor real (achou 3 bugs
que um mock jamais revelaria, porque mock não expõe divergência de contrato
entre front e back), mas:

- Os hooks corrigidos nesta sessão (`useCaixaState`, `useProductsState`,
  `useCategoriesState`, `useCustomersState`, `useFiadosState`) **não ganharam
  teste unitário Vitest**, que é o que o checklist da própria política pede
  ("Criar ou ajustar testes quando houver lógica extraída").
- A política (seção 12) já classifica `window.alert()` como "dívida
  temporária" e diz que a direção correta é feedback contextual na tela —
  então os `alert()` que sobraram (comanda vazia/caixa fechado no
  `handleLaunchCheckout`, sangria excedendo caixa, etc.) são gaps conhecidos
  e aceitos pelo próprio projeto, não urgência nova.
- Duas partes da política parecem desatualizadas frente ao código atual:
  diz que "Configurações ainda não possui endpoint backend oficial" e que o
  PIN é "provisório em localStorage" — mas hoje `Configuracoes.tsx` e o
  login já usam API real (`/api/configuracoes`, `/api/acesso/*`) e não usam
  `localStorage`. Vale uma atualização de doc separada.

**Recomendação:** tratar como duas frentes paralelas — Vitest unitário
(hooks/services com mock, seguindo a política) para lógica e regressão
rápida, Playwright E2E (o que já existe) para os fluxos de negócio
ponta-a-ponta mais críticos (venda, fiado, fechamento de caixa). Não é
"ou/ou".

## Legenda

- ✅ Coberto por E2E (Playwright)
- ⚠️ Parcialmente coberto (só o caminho feliz, faltam variações)
- ❌ Sem cobertura nenhuma
- 🐛 Bug encontrado nesta auditoria (corrigido ou não)

---

## 1. Acesso / Login

| Fluxo | Status | Observações |
|---|---|---|
| Primeiro acesso — definir senha inicial | ✅ | |
| Login normal — senha correta | ✅ | |
| Login — senha inválida | ❌ | Mensagem de erro existe no código (`Senha inválida...`), não testada |
| Setup — senha < 4 caracteres | ❌ | Validação client-side existe, não testada |
| Setup — senhas não coincidem | ❌ | Validação client-side existe, não testada |
| Trocar senha (em Configurações) — senha atual errada | ❌ | |
| Trocar senha — nova senha < 4 caracteres | ❌ | |
| Logout | ❌ | `window.confirm` antes de sair, não testado |

## 2. Caixa Diário

| Fluxo | Status | Observações |
|---|---|---|
| Abrir caixa — valor + observação | ✅ | |
| Abrir caixa — presets de valor (50/100/150/200) | ❌ | |
| Fechar caixa — sem comandas pendentes | ✅ | |
| Fechar caixa — com comanda **ABERTA** (deve bloquear) | ❌ | Regra de negócio documentada no backend (`fecha_test.py`); frontend agora mostra erro (fix aplicado), sem teste de regressão |
| Fechar caixa — com comanda **PENDENTE** (deve permitir) | ❌ | |
| Registrar reforço/suprimento | ❌ | |
| Registrar reforço — valores inválidos (negativo, zero, sem descrição) | ❌ | |
| Registrar sangria | ❌ | |
| Sangria — valor maior que dinheiro em caixa | ❌ | Bloqueio client-side existe (`alert`), não testado |
| Histórico de caixas fechados | ❌ | Tabela só de leitura |
| 🐛 `abrirCaixa/fecharCaixa/adicionarSuprimento/realizarSangria` sem try/catch | **Corrigido** nesta sessão | `bugfix/tratamento-erro-crud-caixa-produtos-clientes-fiados` |

## 3. Produtos e Categorias

| Fluxo | Status | Observações |
|---|---|---|
| Criar categoria | ✅ | |
| Criar categoria — nome duplicado (deve bloquear com mensagem) | ⚠️ | Teste escrito, não commitado ainda (`bloqueia... regressão`) |
| Renomear categoria | ❌ | |
| Ativar/inativar categoria | ❌ | |
| Criar produto simples | ✅ | |
| Criar produto — nome vazio, preço inválido | ❌ | Validação `required` no HTML, sem teste do bloqueio real |
| Editar produto existente | ❌ | |
| Ativar/inativar produto (toggle na lista) | ❌ | |
| Restock rápido (botão "+" na listagem) | ❌ | Não passa por formulário/modal |
| Criar produto **composto** | ❌ | Fluxo inteiro não testado — é o caminho mais complexo do domínio (produto + composição em transação) |
| Gerenciar composição — adicionar componente | ❌ | |
| Gerenciar composição — editar/remover componente | ❌ | |
| Composição — validações (componente duplicado, produto conter a si mesmo, quantidade inválida) | ❌ | |
| Filtros de listagem (busca, categoria, status, tipo) | ❌ | |
| 🐛 `addProduct/updateProduct/deleteProduct/addCategory/updateCategory` sem try/catch | **Corrigido** nesta sessão | |

## 4. Estoque

| Fluxo | Status | Observações |
|---|---|---|
| Entrada de estoque | ❌ | |
| Ajuste manual de estoque | ❌ | Tem `window.confirm` antes de salvar |
| Histórico de movimentações por produto | ❌ | |
| Filtros (status baixo/negativo/normal, categoria, busca) | ❌ | |
| 🐛 `handleSaveEntrada`/`handleSaveAjuste` sem try/catch | **NÃO corrigido** | Mesmo padrão de falha silenciosa dos outros módulos — ficou fora do escopo combinado nesta sessão. Módulo inteiro sem nenhum teste. |

## 5. Comandas (POS)

| Fluxo | Status | Observações |
|---|---|---|
| Criar comanda (rápida, sem cliente) | ✅ | |
| Criar comanda vinculada a cliente já cadastrado | ❌ | |
| Adicionar item ao carrinho | ✅ | |
| Adicionar item — produto sem estoque (`window.confirm` de aviso) | ❌ | |
| Incrementar/decrementar quantidade de item | ❌ | Decrementar a 0 dispara `confirm` de remoção |
| Remover item inteiro (ícone lixeira) | ❌ | |
| Cancelar comanda | ❌ | Tem `window.confirm`; devolve estoque proporcional (regra testada no backend, não no front) |
| Fechar comanda — pagamento **Dinheiro** | ✅ | |
| Fechar comanda — pagamento **Pix** | ❌ | |
| Fechar comanda — pagamento **Cartão** | ❌ | |
| Bloqueio — comanda vazia | ✅ | Corrigido + testado nesta sessão |
| Bloqueio — caixa fechado | ❌ | Guard existe (`handleLaunchCheckout`), sem teste |
| Lançar no caderno (fiado) — cliente já cadastrado | ❌ | Só testamos com cliente **novo** criado inline |
| Lançar no caderno — cliente novo (inline no checkout) | ✅ | |
| Vincular cliente a uma comanda já aberta | ❌ | |
| Busca de produto + filtro por categoria no POS | ⚠️ | Usado incidentalmente nos testes, sem asserção própria |
| Listagem — filtros por status (aberta/paga/cancelada/fiado) | ❌ | |

## 6. Clientes

| Fluxo | Status | Observações |
|---|---|---|
| Criar cliente (tela própria, não via checkout) | ❌ | Só testamos via "+ Novo" dentro do checkout de comanda |
| Editar cliente — pela tela de detalhe | ❌ | |
| Editar cliente — direto da lista | 🐛❌ | **Bug funcional corrigido nesta sessão** (não salvava nada); ainda sem teste de regressão |
| Ativar/inativar cliente | ❌ | |
| Ver detalhe do cliente + histórico de pendências | ❌ | |
| Pagar fiado pela tela de detalhe do cliente | ❌ | Só testamos a quitação pela tela "Fiado/Pendências" |
| Busca/filtro de clientes (nome, apelido, telefone, status) | ❌ | |
| 🐛 `addCustomer/updateCustomer/deleteCustomer` sem try/catch | **Corrigido** nesta sessão | |

## 7. Fiado / Pendências

| Fluxo | Status | Observações |
|---|---|---|
| Listar pendências em aberto | ✅ | Indireto (verificado ao quitar) |
| Filtro — "Apenas vencidos" | ❌ | |
| Filtro — "Histórico de quitados" | ❌ | |
| Quitar fiado — Dinheiro | ✅ | |
| Quitar fiado — Pix | ❌ | |
| Quitar fiado — Cartão | ❌ | |
| Quitar — valor não corresponde à soma exata das pendências (API não suporta parcial) | ❌ | Mensagem de erro existe, não testada |
| Quitar — caixa fechado bloqueando pagamento em dinheiro | ❌ | |
| 🐛 `settleFiado` dentro do loop sem try/catch | **Corrigido** nesta sessão | |

## 8. Relatórios

| Fluxo | Status | Observações |
|---|---|---|
| Aba Diário Operacional | ❌ | |
| Aba Produtos Mais Vendidos | ❌ | |
| Aba Inadimplência/Fiados | ❌ | |
| Aba Alerta de Estoque | ❌ | |
| Aba Estoque Consumido | ❌ | |
| Aba Comandas | ❌ | |
| Filtro de período (hoje/ontem/7d/30d) | ❌ | |
| 🐛 Falha ao carregar relatório só loga `console.error`, sem feedback na tela | **Não corrigido** | Severidade baixa (tela read-only), mas é o mesmo padrão de silêncio |

## 9. Configurações

| Fluxo | Status | Observações |
|---|---|---|
| Salvar configurações gerais (nome do bar, estoque negativo, dias de alerta, observação) | ❌ | Já tem tratamento de erro correto no código (bom exemplo a copiar pros outros módulos) |
| Trocar senha | ❌ | |
| Exportar backup (clipboard) | ❌ | |
| Importar backup | ❌ | Tem `window.confirm` |
| Redefinir sessão | ❌ | Tem `window.confirm` |

## 10. Dashboard

Só navegação e visão geral (sem formulários/mutação própria) — baixa
prioridade para E2E, mas vale um smoke test de que os atalhos levam pra tela
certa.

---

## Resumo por severidade (o que eu priorizaria)

**Antes de qualquer release:**
1. Aplicar o mesmo fix de tratamento de erro no módulo **Estoque** (bug
   confirmado, mesmo padrão dos outros 5 já corrigidos).
2. Testar E2E: pagamento **Pix** e **Cartão** (hoje só Dinheiro está
   provado end-to-end).
3. Testar E2E: fechar caixa com comanda **aberta** (deve bloquear) — regra
   de negócio central, hoje sem nenhuma prova automatizada no front.
4. Testar E2E: criar e vender um **produto composto** — é o fluxo mais
   complexo do domínio e zero coberto.
5. Escrever testes Vitest unitários (com mock) para os 5 hooks corrigidos
   nesta sessão, conforme checklist da política do projeto.

**Depois, para fechar a cobertura:**
6. Edição/inativação em Produtos, Categorias, Clientes.
7. Fluxo de estoque (entrada, ajuste, histórico).
8. Relatórios (pelo menos 1 asserção por aba).
9. Configurações e troca de senha.
10. Validações negativas restantes (senha curta, sangria excedente, fiado
    parcial, etc.).
