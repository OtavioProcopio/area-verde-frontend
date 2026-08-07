# Mapa de Fluxos e Cobertura de Testes — Area Verde Frontend

## Objetivo

Documento de referência para decidir o que falta testar antes de considerar o
MVP validado para deploy real no bar. Lista todo módulo, todo fluxo de uso
(não só o caminho feliz) e o status real de cobertura hoje.

**Atualização:** a cobertura E2E saiu de ~10% (um caminho por tela) pra cobrir
a maioria dos fluxos de negócio críticos — pagamentos em todas as formas,
bloqueios de regra de negócio, produto composto, CRUD completo de produtos/
categorias/clientes, fiado. Ver seção "O que ainda falta" pro que ficou de
fora conscientemente.

## Nota sobre convenção de testes do projeto

`docs/policies/frontend-agent-policy.md` (seção 13) define a stack oficial de
testes como **Vitest + Testing Library + jsdom, com mocks de `fetch`/services**,
não testes end-to-end contra a API real. A suíte Playwright que criamos é
complementar a isso, não substitui — ela já provou valor real: achou **5
bugs reais** que mock nenhum revelaria, porque mock não expõe divergência de
contrato entre front e back nem lacunas na fonte de dados. Ver lista de bugs
abaixo.

- Os hooks corrigidos (`useCaixaState`, `useProductsState`,
  `useCategoriesState`, `useCustomersState`, `useFiadosState`,
  `useComandasState`) **não ganharam teste unitário Vitest**, que é o que o
  checklist da própria política pede ("Criar ou ajustar testes quando houver
  lógica extraída"). Ainda pendente.
- A política (seção 12) já classifica `window.alert()` como "dívida
  temporária" e diz que a direção correta é feedback contextual na tela —
  então os `alert()` que sobraram (guards de comanda vazia/caixa fechado,
  sangria excedendo caixa, itens de comanda sem slot de UI dedicado) são
  gaps conhecidos e aceitos pelo próprio projeto, não urgência nova.
- Duas partes da política parecem desatualizadas frente ao código atual:
  diz que "Configurações ainda não possui endpoint backend oficial" e que o
  PIN é "provisório em localStorage" — mas hoje `Configuracoes.tsx` e o
  login já usam API real (`/api/configuracoes`, `/api/acesso/*`) e não usam
  `localStorage`. Vale uma atualização de doc separada.

**Recomendação:** tratar como duas frentes paralelas — Vitest unitário
(hooks/services com mock, seguindo a política) para lógica e regressão
rápida, Playwright E2E (o que já existe) para os fluxos de negócio
ponta-a-ponta mais críticos. Não é "ou/ou".

## Bugs encontrados durante a auditoria E2E

| # | Bug | Módulo | Status |
|---|---|---|---|
| 1 | `handleLaunchCheckout` (validação de comanda vazia/caixa fechado) existia mas não era chamado por nenhum botão — dead code | Comandas | **Corrigido** |
| 2 | `pagarComanda` sem try/catch — erro de pagamento falhava silenciosamente | Comandas | **Corrigido** |
| 3 | `addComanda/cancelarComanda/addItemToComanda/updateComandaItemQty/removeItemFromComanda` sem try/catch (mesmo padrão do #2, hooks diferentes) | Comandas | **Corrigido** |
| 4 | `abrirCaixa/fecharCaixa/adicionarSuprimento/realizarSangria`, `addProduct/updateProduct/deleteProduct`, `addCategory/updateCategory`, `addCustomer/updateCustomer/deleteCustomer`, `pagarFiado` (loop de quitação) sem try/catch | Caixa, Produtos, Categorias, Clientes, Fiado | **Corrigido** |
| 5 | `handleSaveEntrada`/`handleSaveAjuste` sem try/catch | Estoque | **Corrigido** |
| 6 | Editar cliente **direto da lista** não salvava nada — form usava `selectedCustomer` (só populado ao entrar no detalhe) em vez de rastrear o id em edição | Clientes | **Corrigido** |
| 7 | Filtro "Histórico de Quitados" nunca mostra nada, pra nenhum cliente — `GET /api/fiados` filtra no banco só `status == PENDENTE` (`comanda_repository.py list_pendencias`), então o front nunca recebe um registro com status `FECHADA` pra mapear como `'quitado'`. Existe histórico real em `/api/relatorios/fiados`, mas essa tela não usa | Fiado / Pendências | **Não corrigido** — decisão consciente, ver `AskUserQuestion` na sessão: requer mudar fonte de dados, maior escopo. Documentado no código (`fiados-fluxos.spec.ts`) |

Branches: `bugfix/comandas-checkout-erro-silencioso` (#1, #2),
`bugfix/tratamento-erro-crud-caixa-produtos-clientes-fiados` (#4),
`bugfix/comandas-criar-cancelar-alterar-item-erro-silencioso` (#3, e o #6
está no commit de testes junto com o Clientes).

## Legenda

- ✅ Coberto por E2E (Playwright)
- ⚠️ Parcialmente coberto (só o caminho feliz, faltam variações)
- ❌ Sem cobertura nenhuma

---

## 1. Acesso / Login

| Fluxo | Status | Observações |
|---|---|---|
| Primeiro acesso — definir senha inicial | ✅ | |
| Login normal — senha correta | ✅ | |
| Login — senha inválida | ❌ | Mensagem de erro existe no código, não testada |
| Setup — senha < 4 caracteres / senhas não coincidem | ❌ | Validação client-side existe, não testada |
| Trocar senha (em Configurações) | ❌ | |
| Logout | ❌ | `window.confirm` antes de sair, não testado |

## 2. Caixa Diário

| Fluxo | Status | Observações |
|---|---|---|
| Abrir caixa — valor + observação | ✅ | |
| Fechar caixa — sem comandas pendentes | ✅ | |
| Fechar caixa — com comanda **ABERTA** (deve bloquear) | ✅ | `caixa-fluxos.spec.ts` |
| Fechar caixa — com comanda **PENDENTE** (deve permitir) | ❌ | |
| Registrar reforço/suprimento | ✅ | |
| Registrar sangria | ✅ | |
| Sangria — valor maior que dinheiro em caixa | ✅ | |
| Histórico de caixas fechados | ✅ | Confirma que a lista cresce após fechar |
| Abrir caixa — presets de valor (50/100/150/200) | ❌ | |

## 3. Produtos e Categorias

| Fluxo | Status | Observações |
|---|---|---|
| Criar categoria | ✅ | |
| Criar categoria — nome duplicado (deve bloquear com mensagem) | ✅ | |
| Renomear categoria | ✅ | |
| Ativar/inativar categoria | ❌ | |
| Criar produto simples | ✅ | |
| Editar produto existente | ✅ | |
| Ativar/inativar produto (toggle na lista) | ✅ | |
| Criar produto **composto** + adicionar componente na composição | ✅ | Fluxo mais complexo do domínio, coberto |
| Gerenciar composição — editar/remover componente | ❌ | Só "adicionar" está coberto |
| Restock rápido (botão "+" na listagem) | ❌ | |
| Composição — validações (componente duplicado, produto conter a si mesmo) | ❌ | |
| Filtros de listagem (busca, categoria, status, tipo) | ❌ | |

## 4. Estoque

| Fluxo | Status | Observações |
|---|---|---|
| Entrada de estoque | ❌ | |
| Ajuste manual de estoque | ❌ | |
| Histórico de movimentações por produto | ❌ | |
| Filtros | ❌ | Bug de erro silencioso já corrigido (#5), mas sem teste E2E ainda |

## 5. Comandas (POS)

| Fluxo | Status | Observações |
|---|---|---|
| Criar comanda (rápida, sem cliente) | ✅ | |
| Criar comanda vinculada a cliente já cadastrado | ✅ | Indireto, via `fiados-fluxos.spec.ts`/`clientes-fluxos.spec.ts` |
| Adicionar item ao carrinho | ✅ | |
| Incrementar/decrementar quantidade de item | ✅ | |
| Remover item inteiro (ícone lixeira, decrementar até 0) | ❌ | |
| Cancelar comanda | ✅ | |
| Fechar comanda — pagamento **Dinheiro / Pix / Cartão** | ✅ | Todas as 3 formas testadas |
| Bloqueio — comanda vazia | ✅ | |
| Bloqueio — criar comanda com caixa fechado | ✅ | |
| Lançar no caderno (fiado) — cliente novo (inline) e cliente já cadastrado | ✅ | |
| Adicionar item — produto sem estoque (`window.confirm` de aviso) | ❌ | |
| Busca de produto + filtro por categoria no POS | ⚠️ | Usado incidentalmente, sem asserção própria |
| Listagem — filtros por status (aberta/paga/cancelada/fiado) | ❌ | |

## 6. Clientes

| Fluxo | Status | Observações |
|---|---|---|
| Criar cliente (tela própria) | ✅ | |
| Editar cliente — pela tela de detalhe | ✅ | |
| Editar cliente — direto da lista | ✅ | Regressão do bug #6 |
| Ativar/inativar cliente | ✅ | |
| Pagar fiado pela tela de detalhe do cliente | ✅ | |
| Ver detalhe do cliente + histórico de pendências | ⚠️ | Visitado nos testes acima, sem asserção de conteúdo do histórico |
| Busca/filtro de clientes | ⚠️ | Usado como workaround de robustez num teste, sem cobertura própria |

## 7. Fiado / Pendências

| Fluxo | Status | Observações |
|---|---|---|
| Listar pendências em aberto | ✅ | |
| Quitar fiado — **Dinheiro / Pix / Cartão** | ✅ | Todas as 3 formas testadas |
| Quitar — valor não corresponde à soma exata (pagamento parcial, API não suporta) | ✅ | |
| Quitar — valor maior que o saldo devedor | ✅ | |
| Filtro — "Apenas vencidos" | ❌ | Precisa manipular data de vencimento, não testado |
| Filtro — "Histórico de quitados" | ❌🐛 | **Bug #7, não corrigido** — o filtro é estruturalmente inoperante, ver acima |
| Quitar — caixa fechado bloqueando pagamento em dinheiro | ❌ | |

## 8. Relatórios

| Fluxo | Status | Observações |
|---|---|---|
| Todas as 6 abas (Diário, Produtos, Fiados, Estoque, Consumido, Comandas) | ❌ | Nenhuma testada |
| Filtro de período | ❌ | |
| Falha ao carregar relatório só loga `console.error`, sem feedback na tela | ❌🐛 | Não corrigido, severidade baixa (tela read-only) |

## 9. Configurações

| Fluxo | Status | Observações |
|---|---|---|
| Salvar configurações gerais | ❌ | Já tem tratamento de erro correto no código (bom exemplo, não precisou de fix) |
| Trocar senha | ❌ | |
| Backup (exportar/importar) | ❌ | |
| Redefinir sessão | ❌ | |

## 10. Dashboard

Só navegação e visão geral — baixa prioridade para E2E.

---

## O que ainda falta (nesta ordem de prioridade)

1. **Vitest unitário** para os 6 hooks corrigidos nesta sessão (checklist da
   política do projeto pede isso pra qualquer lógica extraída/alterada).
2. **Bug #7** (histórico de fiados quitados) — decidir: reaproveitar
   `/api/relatorios/fiados` na tela, ou criar endpoint dedicado.
3. Estoque: nenhum fluxo testado ainda (entrada, ajuste, histórico).
4. Relatórios: pelo menos 1 asserção por aba.
5. Configurações: salvar config, trocar senha, backup.
6. Validações negativas restantes: login com senha errada, setup com senha
   curta, ativar/inativar categoria, filtros de listagem em geral, remover
   item de comanda, editar/remover componente de produto composto.
7. Estabilidade: ao rodar a suíte completa localmente em sessão headed muito
   longa (30+ testes seguidos), houve uma falha ambiental pontual (browser
   fechou sozinho) sempre no mesmo teste por posição — não reproduz isolado.
   CI já tem `retries: 1` configurado, o que deve absorver esse tipo de
   flake; vale confirmar quando rodar em CI de verdade.
