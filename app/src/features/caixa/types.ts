import type {ApiPagamento} from '../comandas/types';

export type ApiCaixaMovement = {
  id: number;
  tipo: 'ABERTURA' | 'REFORCO' | 'SANGRIA';
  valor: string | number;
  observacao?: string | null;
  criadoEm: string;
};

export type ApiCaixaPagamento = ApiPagamento & {
  id: number;
  comandaId: number;
};

export type ApiCaixaDetail = {
  id: number;
  status: 'ABERTO' | 'FECHADO';
  valorInicial: string | number;
  dinheiroEsperado: string | number;
  dinheiroInformado?: string | number | null;
  abertoEm: string;
  fechadoEm?: string | null;
  pagamentos: ApiCaixaPagamento[];
  movimentos: ApiCaixaMovement[];
};

export type ApiCaixaSummary = {
  id: number;
  status: 'ABERTO' | 'FECHADO';
  valorInicial: string | number;
  dinheiroEsperado: string | number;
  abertoEm: string;
  fechadoEm?: string | null;
};
