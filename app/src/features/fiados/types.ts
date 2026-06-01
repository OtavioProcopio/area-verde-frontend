export type ApiPendenciaResumo = {
  comandaId: number;
  cliente?: { id: number; nome: string; apelido?: string | null } | null;
  total: string | number;
  abertaEm: string;
  pendenteEm?: string | null;
  vencimentoEm?: string | null;
  status: 'PENDENTE' | 'FECHADA';
  vencida: boolean;
};
