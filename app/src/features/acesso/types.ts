export type ApiAccessValidationRequest = {
  senha: string;
};

export type ApiAccessValidationResponse = {
  valido: boolean;
};

export type ApiAccessPasswordRequest = {
  senhaAtual?: string | null;
  novaSenha: string;
};

export type ApiAccessPasswordResponse = {
  senhaConfigurada: boolean;
};
