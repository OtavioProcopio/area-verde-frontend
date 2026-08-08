# Mapa de Fluxos e Cobertura de Testes — Area Verde Frontend

## Objetivo

Documento de referência para decidir o que falta testar antes de considerar o
MVP validado para deploy real no bar. Lista todo módulo, todo fluxo de uso
(não só o caminho feliz) e o status real de cobertura hoje.

**Atualização:** a cobertura E2E saiu de ~10% (um caminho por tela) pra cobrir
a maioria dos fluxos de negócio críticos — pagamentos em todas as formas,
bloqueios de regra de negócio, produto composto (incluindo editar/remover
componente), CRUD completo de produtos/categorias/clientes, fiado, estoque,
todas as 6 abas de Relatórios e Configurações (salvar config/trocar
senha/redefinir sessão), filtros de listagem de produtos, remoção de item de
comanda, e as validações negativas de acesso (login errado, setup de senha
curta/senhas divergentes). Ver seção "O que ainda falta" pro que ficou de
fora conscientemente.

## Nota sobre convenção de testes do projeto

`docs/policies/frontend-agent-policy.md` (seção 13) define a stack oficial de
testes como **Vitest + Testing Library + jsdom, com mocks de `fetch`/services**,
não testes end-to-end contra a API real. A suíte Playwright que criamos é
complementar a isso, não substitui — ela já provou valor real: achou **12
bugs reais** que mock nenhum revelaria, porque mock não expõe divergência de
contrato entre front e back nem lacunas na fonte de dados. Ver lista de bugs
abaixo — os últimos 5 (#8 a #12) foram achados escrevendo os testes E2E de
Relatórios: cada aba menos "Diário" consumia o endpoint errado (array plano
vs. objeto `{resumo, ...}`) ou um nome de campo errado (`produtoNome` vs.
`nome`/`nomeProduto`, `total` vs. `valorTotal`), sempre engolido pelo
`catch (e) { console.error(...) }` genérico da tela — silêncio total pro
usuário.

- Os hooks corrigidos (`useCaixaState`, `useProductsState`,
  `useCategoriesState`, `useCustomersState`, `useFiadosState`,
  `useComandasState`) ganharam teste unitário Vitest
  (`test/hooks-tratamento-erro-vitest`), fechando o item que a política
  cobra ("Criar ou ajustar testes quando houver lógica extraída").
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
| 7 | Filtro "Histórico de Quitados" nunca mostrava nada, pra nenhum cliente — `GET /api/fiados` filtrava no banco só `status == PENDENTE` (`comanda_repository.py list_pendencias`) | Fiado / Pendências | **Corrigido** — backend `feature/fiados-historico-quitados` (novo parâmetro `quitados`) + frontend `bugfix/fiados-historico-quitados` (`fiadosService.ts` busca abertos e quitados juntos) |
| 8 | `fetchStockReport` (aba Alerta de Estoque) esperava um array plano; `/relatorios/estoque` retorna `{resumo, baixo, negativo}`, e o campo de nome do produto é `nome`, não `produtoNome` — `.map()` estourava e a tela sempre mostrava "Relatório Vazio" | Relatórios | **Corrigido** |
| 9 | `fetchBestSellingProducts` (aba Produtos Vendidos) usava `item.produtoNome`; o campo real do backend é `nomeProduto` — nome do produto sempre em branco na tabela | Relatórios | **Corrigido** |
| 10 | `fetchConsumedStockReport` (aba Estoque Consumido) usava `item.produtoNome`; o campo real é `nome` — mesmo sintoma do #9 | Relatórios | **Corrigido** |
| 11 | `fetchFiadosReport` (aba Inadimplência/Fiados) esperava array plano com campos `clienteNome`/`status`/`abertaEm` que não existem; `/relatorios/fiados` retorna `{resumo, pendencias}` com `nomeExibicao`/`pendenteEm` — aba sempre vazia | Relatórios | **Corrigido** |
| 12 | `fetchCommandasReport` (aba Comandas) esperava array plano e campo `total`; `/relatorios/comandas` retorna `{resumo, porStatus}` com campo `valorTotal` — aba sempre vazia | Relatórios | **Corrigido** |

Branches: `bugfix/comandas-checkout-erro-silencioso` (#1, #2),
`bugfix/tratamento-erro-crud-caixa-produtos-clientes-fiados` (#4),
`bugfix/comandas-criar-cancelar-alterar-item-erro-silencioso` (#3, e o #6
está no commit de testes junto com o Clientes), `bugfix/fiados-historico-
quitados` (#7, PR aberta), `test/e2e-estoque-relatorios-configuracoes`
(#8–#12).

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
| Login — senha inválida | ✅ | Backend rejeita com `senha_invalida`; a tela mostra a mensagem própria da API |
| Setup — senha < 4 caracteres / senhas não coincidem | ✅ | Validação client-side. Só é alcançável com banco sem senha configurada (num dev DB de sessão longa isso só existe uma vez — testado isoladamente com reset do volume local; roda normal em CI, que sempre sobe com banco novo) |
| Trocar senha (em Configurações) | ✅ | Ver seção 9 — sucesso + senha atual incorreta |
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
| Ativar/inativar categoria | ✅ | |
| Criar produto simples | ✅ | |
| Editar produto existente | ✅ | |
| Ativar/inativar produto (toggle na lista) | ✅ | |
| Criar produto **composto** + adicionar componente na composição | ✅ | Fluxo mais complexo do domínio, coberto |
| Gerenciar composição — editar/remover componente | ✅ | |
| Restock rápido (botão "+" na listagem) | ❌ | |
| Composição — validações (componente duplicado, produto conter a si mesmo) | ❌ | |
| Filtros de listagem (busca, categoria, status, tipo) | ✅ | |

## 4. Estoque

| Fluxo | Status | Observações |
|---|---|---|
| Entrada de estoque | ✅ | |
| Ajuste manual de estoque | ✅ | |
| Histórico de movimentações por produto | ✅ | |
| Filtros | ❌ | Bug de erro silencioso já corrigido (#5), mas sem teste E2E ainda |

## 5. Comandas (POS)

| Fluxo | Status | Observações |
|---|---|---|
| Criar comanda (rápida, sem cliente) | ✅ | |
| Criar comanda vinculada a cliente já cadastrado | ✅ | Indireto, via `fiados-fluxos.spec.ts`/`clientes-fluxos.spec.ts` |
| Adicionar item ao carrinho | ✅ | |
| Incrementar/decrementar quantidade de item | ✅ | |
| Remover item inteiro (ícone lixeira, decrementar até 0) | ✅ | Ambos os caminhos: ícone de lixeira direto e decrementar quantidade até 0 (com confirmação) |
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
| Filtro — "Histórico de quitados" | ✅ | Bug #7 corrigido; `fiados-fluxos.spec.ts` cobre o fluxo real (quitar → aparece no histórico) |
| Quitar — caixa fechado bloqueando pagamento em dinheiro | ❌ | |

## 8. Relatórios

| Fluxo | Status | Observações |
|---|---|---|
| Aba Diário Operacional | ✅ | |
| Aba Produtos Mais Vendidos | ✅ | Achou e corrigiu bug #9 (`nomeProduto`) |
| Aba Alerta de Estoque | ✅ | Achou e corrigiu bug #8 (shape do endpoint) |
| Aba Estoque Consumido | ✅ | Achou e corrigiu bug #10 (`nome`) |
| Aba Inadimplência / Fiados | ✅ | Achou e corrigiu bug #11 (shape + campos do endpoint) |
| Aba Comandas | ✅ | Achou e corrigiu bug #12 (`valorTotal`) |
| Filtro de período | ✅ | Smoke test — troca o período e a tela não quebra |
| Falha ao carregar relatório só loga `console.error`, sem feedback na tela | ❌🐛 | Não corrigido, severidade baixa (tela read-only). Foi o motivo dos bugs #8–#12 passarem despercebidos até agora — vale trocar por um `InlineFeedback` de erro |

## 9. Configurações

| Fluxo | Status | Observações |
|---|---|---|
| Salvar configurações gerais | ✅ | Nome, estoque negativo, dias de alerta — persiste após reload |
| Trocar senha | ✅ | Sucesso + senha atual incorreta (erro tratado) |
| Backup (exportar/importar) | ⚠️ | Import é um stub proposital (`useBackupState.importBackup` sempre retorna "não suportado enquanto usa API real") — não há feature real pra testar. Export usa clipboard, não coberto por depender de permissão de browser |
| Redefinir sessão | ✅ | Confirma dialog, encerra sessão, volta pro login |

## 10. Dashboard

Só navegação e visão geral — baixa prioridade para E2E.

---

## O que ainda falta (nesta ordem de prioridade)

1. Trocar o `catch (e) { console.error(...) }` genérico de `Relatorios.tsx`
   por um `InlineFeedback` de erro — é o motivo dos bugs #8–#12 terem ficado
   invisíveis pro usuário (tela real, não só teste).
2. Gaps residuais, baixa prioridade: abrir caixa com presets de valor
   (50/100/150/200); fechar caixa com comanda **PENDENTE** (deve permitir,
   só o caso ABERTA-bloqueia está coberto); adicionar item de produto sem
   estoque (`window.confirm` de aviso); comandas — filtro de listagem por
   status; fiados — filtro "apenas vencidos" e quitação com caixa fechado
   bloqueando pagamento em dinheiro; restock rápido (botão "+" na
   listagem); composição — validações de componente duplicado / produto
   conter a si mesmo; logout (`window.confirm` antes de sair).
3. **Causa raiz encontrada** pra falha pontual sempre no mesmo teste
   (`fluxo-atendimento-bar.spec.ts` › "adiciona item na comanda e fecha com
   pagamento em dinheiro") ao rodar a suíte completa: não é crash de
   browser — é o seletor de categorias no picker de produtos (Comandas)
   renderizando **um botão por categoria sem paginação/busca**. Cada
   arquivo de teste cria categoria(s) via API com nome único e nunca
   limpa, então numa suíte de 55 testes o picker já tem 35+ botões de
   categoria por essa altura; combinado com `slowMo: 250` local (headed),
   a interação fica lenta o suficiente pra estourar o timeout de 30s.
   Confirmado isolando a variável: com banco resetado, o arquivo sozinho
   roda em ~20s sem falha; rodando a suíte inteira do zero, a mesma
   categoria de erro reaparece na mesma posição, porque as 34 categorias
   criadas pelos testes anteriores já bastam pra pesar o picker. Isso é
   principalmente um problema de higiene do banco de dev local (nunca
   resetado nesta sessão) — mas também aponta um gap de UX/performance
   real: um bar de verdade com muitas categorias cadastradas teria esse
   mesmo picker pesado. Não corrigido no app (fora de escopo desta
   rodada); mitigação local: resetar o volume (`docker compose down -v`)
   antes de rodar a suíte completa. Em CI isso deve incomodar menos —
   roda headless e sem `slowMo` — mas o crescimento do picker por
   posição na suíte é o mesmo, então vale monitorar se aparecer lá
   também.
