import { ApiError } from '../../../lib/api';

const CODE_MESSAGES: Record<string, string> = {
  senha_nao_configurada:
    'Nenhuma senha foi configurada ainda. Defina uma senha para liberar o acesso.',
  senha_invalida: 'Senha inválida. Confira e tente novamente.',
  senha_atual_obrigatoria:
    'Informe a senha atual para alterar a senha cadastrada.',
  senha_atual_invalida: 'A senha atual informada não confere.',
  nova_senha_invalida: 'A nova senha precisa ter pelo menos 4 caracteres.',
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const payload = error.payload;

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      if (
        'message' in payload &&
        typeof payload.message === 'string' &&
        payload.message.trim()
      ) {
        return payload.message;
      }

      if (
        'detail' in payload &&
        typeof payload.detail === 'string' &&
        payload.detail.trim()
      ) {
        return payload.detail;
      }

      if ('code' in payload && typeof payload.code === 'string') {
        return CODE_MESSAGES[payload.code] || fallback;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
