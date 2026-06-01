import type { ApiPendenciaResumo } from '../fiados/types';

export type ApiCustomerSummary = {
  id: number;
  nome: string;
  apelido?: string | null;
  telefone?: string | null;
  ativo: boolean;
};

export type ApiCustomerDetail = ApiCustomerSummary & {
  observacao?: string | null;
};

export type ApiCustomerPendencias = {
  totalPendente: string | number;
  totalVencido: string | number;
  pendencias: ApiPendenciaResumo[];
};
