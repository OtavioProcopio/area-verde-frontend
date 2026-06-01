export function mapUnit(unit?: string | null): 'un' | 'ml' {
  switch (unit) {
    case 'UNIDADE':
      return 'un';
    case 'ML':
      return 'ml';
    default:
      return 'un';
  }
}

export function mapUnitToApi(unit: string): 'UNIDADE' | 'ML' {
  switch (unit.toLowerCase()) {
    case 'un':
    case 'unidade':
      return 'UNIDADE';
    case 'ml':
      return 'ML';
    default:
      return 'UNIDADE';
  }
}

export function mapPaymentMethod(
  method?: 'DINHEIRO' | 'PIX' | 'CARTAO' | 'FIADO',
): 'dinheiro' | 'pix' | 'cartao' | 'fiado' | undefined {
  switch (method) {
    case 'DINHEIRO':
      return 'dinheiro';
    case 'PIX':
      return 'pix';
    case 'CARTAO':
      return 'cartao';
    case 'FIADO':
      return 'fiado';
    default:
      return undefined;
  }
}

export function toApiPaymentMethod(
  method: 'dinheiro' | 'pix' | 'cartao' | 'fiado',
): 'DINHEIRO' | 'PIX' | 'CARTAO' | 'FIADO' {
  switch (method) {
    case 'dinheiro':
      return 'DINHEIRO';
    case 'pix':
      return 'PIX';
    case 'cartao':
      return 'CARTAO';
    case 'fiado':
      return 'FIADO';
  }
}

export function mapComandaStatus(
  status: 'ABERTA' | 'FECHADA' | 'PENDENTE' | 'CANCELADA',
): 'active' | 'paid' | 'cancelled' {
  if (status === 'ABERTA') return 'active';
  if (status === 'CANCELADA') return 'cancelled';
  return 'paid';
}
