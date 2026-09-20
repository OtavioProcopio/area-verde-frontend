# Checklist — Testes unitários de API/mappers, scripts E2E e atualização de documentação / requisitos

> Avalia a **qualidade da especificação**, não do código. `[x]` significa "requisito
> aprovado por revisor humano". O agente não se autoaprova.

## Completude

- [ ] Todo requisito funcional (RF-01 a RF-08) tem ao menos um critério de aceite em DADO/QUANDO/ENTÃO
- [ ] Todo requisito não funcional (RNF-01, RNF-02) tem critério mensurável, com número e unidade
- [ ] O que está fora de escopo está escrito (E2E em CI, componentes de tela, docs do backend, docker-compose.local.yml)

## Clareza

- [ ] Nenhuma marca `[NECESSITA ESCLARECIMENTO]` restante
- [ ] Nenhum requisito admite duas leituras conflitantes
- [ ] Nenhum requisito descreve implementação em vez de comportamento (ex.: RF-01 não nomeia biblioteca de mock)

## Consistência

- [ ] Nenhum requisito contradiz outro
- [ ] Nenhum requisito contradiz a constituição (Princípios 7, 10, 11)
- [ ] Vocabulário do domínio é o mesmo em todo o documento (mapper, apiRequest, E2E, caixa fechado)

## Testabilidade

- [ ] Todo critério de aceite pode virar cenário executável sem reinterpretação
- [ ] Todo caminho de erro relevante tem cenário próprio (erro JSON, erro texto, 404 esperado)
