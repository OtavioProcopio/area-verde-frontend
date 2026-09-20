# Especificação — Sistema de notificação de sucesso/erro nos formulários

> Descreve **o quê** e **por quê**. Não descreve como implementar: sem nome de biblioteca,
> sem esquema de banco, sem assinatura de função.

## Problema

Não existe nenhum sistema de notificação (toast/snackbar) no frontend. O padrão atual é
inconsistente: erro usa `window.alert` em alguns pontos (interações de item de comanda) e
mensagem inline (`InlineFeedback`) em outros (formulários de produto, cliente, configurações,
login, estoque, caixa); sucesso, na maior parte do sistema, não tem nenhuma confirmação visível
— o formulário ou modal só fecha silenciosamente, ou a interação simplesmente não mostra nada.
Isso foi marcado como problema **grave** em teste real de uso: o usuário não tem como saber, com
confiança, se uma ação foi salva — o que incentiva cliques repetidos e pode ter contribuído para
o cadastro de produtos duplicados (issue #41, já corrigida no backend).

## Objetivo

Toda ação de escrita relevante do sistema (cadastrar, editar, ativar, inativar, remover, alterar
quantidade, quitar, fechar, abrir, etc.) dá ao usuário uma confirmação visível quando funciona, e
uma mensagem clara quando falha — sem depender de `window.alert` e sem deixar o usuário
adivinhando se algo foi salvo.

## Fora de escopo

- Mudar a regra de negócio de qualquer fluxo (o que é validado continua o mesmo).
- Histórico ou central de notificações (a notificação é transitória, não fica registrada).
- Notificação push, e-mail ou qualquer canal fora da própria tela do sistema.
- Internacionalização das mensagens (continuam em português).
- Mudar o conteúdo das mensagens de sucesso/erro já existentes nos hooks (`msg` retornado por
  `addProduct`, `addItemToComanda` etc.) — a feature exibe a mensagem que já existe, não
  reescreve o texto de cada uma.

## Personas e cenários de uso

- **Operador do bar**: cadastra um produto, adiciona um item numa comanda, quita um fiado — e em
  cada uma dessas ações, vê uma confirmação rápida na tela de que funcionou, sem precisar
  verificar manualmente na listagem se a ação realmente aconteceu.
- **Operador do bar diante de um erro**: tenta uma ação que a API rejeita (ex.: nome duplicado,
  saldo insuficiente) e vê uma mensagem clara do que deu errado, sem um alerta de navegador que
  trava a tela até ser fechado no clique.

## Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | O sistema deve ter um componente de notificação reutilizável que aparece na tela e desaparece sozinho depois de um tempo, sem exigir clique do usuário para sumir. | obrigatório |
| RF-02 | Toda ação de escrita disparada por um formulário, modal ou interação rápida (como os controles de quantidade de item na comanda) deve mostrar essa notificação com a mensagem de sucesso já retornada pela camada de dados, quando a ação funcionar. | obrigatório |
| RF-03 | Toda ação de escrita que falhar deve mostrar essa notificação (ou, nos casos definidos em RF-06, a mensagem já existente no formulário) com a mensagem de erro já retornada pela camada de dados — nunca `window.alert`. | obrigatório |
| RF-04 | Formulário ou modal que hoje fecha automaticamente ao salvar com sucesso deve continuar fechando, mas a notificação de sucesso deve ficar visível mesmo depois do fechamento (não pode ser descartada junto com o formulário). | obrigatório |
| RF-05 | As interações de item de comanda (adicionar, aumentar quantidade, diminuir quantidade, remover) devem passar a mostrar notificação de sucesso e de erro — hoje não mostram nada em caso de sucesso e usam `window.alert` em caso de erro. | obrigatório |
| RF-06 | A notificação por toast **não** substitui a mensagem de erro inline (`InlineFeedback`) já usada em formulários que permanecem abertos após falhar (ex.: nome duplicado ao salvar produto) — esse erro continua inline, junto do formulário. O toast cobre sucesso em todo lugar (RF-02) e erro nas interações sem formulário aberto (RF-05). | obrigatório |
| RF-07 | Os dois avisos que hoje usam `window.alert` sem ser erro de chamada à API ("itens manuais ainda não são suportados pela API real", "reabrir comanda não é suportado pela API atual") também devem virar notificação por toast, pelo mesmo motivo de RF-03: nenhum `window.alert` deve sobrar nos fluxos tocados por esta feature. | obrigatório |

## Requisitos não funcionais

| ID | Requisito | Critério mensurável |
|---|---|---|
| RNF-01 | Notificação de sucesso não deve exigir ação do usuário para sumir da tela. | Desaparece sozinha em até 5 segundos |
| RNF-02 | Múltiplas notificações em sequência rápida (ex.: adicionar vários itens seguidos) não podem empilhar de forma que cubram o conteúdo principal da tela. | No máximo 3 notificações visíveis ao mesmo tempo; a mais antiga some antes de uma quarta aparecer |

## Critérios de aceite

```gherkin
# language: pt
Funcionalidade: Sistema de notificação de sucesso/erro nos formulários

  Cenário: Confirmar sucesso ao cadastrar um produto
    Dado o formulário de novo produto aberto e preenchido corretamente
    Quando o operador salva o produto
    Então o formulário fecha
    E uma notificação de sucesso aparece na tela
    Mas a notificação não exige clique para desaparecer

  Cenário: Notificar sucesso ao adicionar item na comanda
    Dado uma comanda aberta sem o item que será adicionado
    Quando o operador adiciona um item ao carrinho da comanda
    Então uma notificação de sucesso aparece na tela
    Mas nenhum `window.alert` é disparado

  Cenário: Notificar erro ao adicionar item na comanda
    Dado uma comanda aberta e uma falha simulada na chamada de adicionar item
    Quando o operador tenta adicionar o item
    Então uma notificação de erro aparece na tela com a mensagem retornada pela API
    Mas nenhum `window.alert` é disparado

  Cenário: Notificação de sucesso soma ao invés de sobrepor
    Dado três ações de sucesso disparadas em sequência rápida
    Quando a quarta notificação apareceria
    Então a mais antiga já desapareceu antes da quarta aparecer
    Mas nunca mais de três notificações ficam visíveis ao mesmo tempo
```

## Ambiguidades

Nenhuma pendente — ver tabela `Esclarecimentos` ao final.

## Métricas de sucesso

- Nenhum `window.alert` restante nos fluxos de escrita cobertos por esta feature.
- Todo formulário/modal auditado (produtos, categorias, clientes, comandas — incluindo item —,
  fiados, caixa, configurações) mostra confirmação visível de sucesso.

## Esclarecimentos

| Pergunta | Resposta | Data |
|---|---|---|
| O toast substitui o erro inline de formulário aberto, ou só cobre sucesso + erro sem formulário? | Não substitui: erro inline com formulário aberto continua `InlineFeedback`; toast cobre sucesso em todo lugar e erro de interações sem formulário aberto (itens de comanda). | 2026-09-19 |
| Os dois avisos de limitação atual (item manual, reabrir comanda) também viram notificação? | Sim, também viram notificação — nenhum `window.alert` deve sobrar nos fluxos tocados por esta feature. | 2026-09-19 |
