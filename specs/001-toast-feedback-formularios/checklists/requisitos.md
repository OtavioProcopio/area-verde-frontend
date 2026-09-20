# Checklist — Sistema de notificação de sucesso/erro / Requisitos

> Avalia a **qualidade da especificação**, não do código. `[x]` significa "requisito
> aprovado por revisor humano". O agente não se autoaprova.

## Completude

- [ ] Todo requisito funcional (RF-01 a RF-07) tem ao menos um critério de aceite em DADO/QUANDO/ENTÃO
- [ ] Todo requisito não funcional (RNF-01, RNF-02) tem critério mensurável, com número e unidade
- [ ] Fora de escopo deixa claro que o conteúdo das mensagens não muda, só a forma de exibição

## Clareza

- [ ] Nenhuma marca `[NECESSITA ESCLARECIMENTO]` restante
- [ ] Está claro quando um erro é inline (formulário aberto) e quando é toast (RF-06)
- [ ] Nenhum requisito descreve implementação (nome de componente, biblioteca) em vez de comportamento

## Consistência

- [ ] Nenhum requisito contradiz outro (RF-03 "nunca window.alert" não contradiz RF-06 manter inline, pois inline não é window.alert)
- [ ] Nenhum requisito contradiz a constituição do projeto ou `docs/policies/frontend-agent-policy.md` §12
- [ ] Vocabulário (notificação, toast, inline, formulário, modal) é usado de forma consistente

## Testabilidade

- [ ] Todo critério de aceite pode virar cenário executável sem reinterpretação
- [ ] O critério de empilhamento (RNF-02) é verificável por contagem, não por julgamento visual
- [ ] Todo caminho de erro relevante (com e sem formulário aberto) tem cenário próprio
