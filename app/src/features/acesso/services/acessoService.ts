import {apiRequest} from '../../../lib/api';
import type {
  ApiAccessPasswordRequest,
  ApiAccessPasswordResponse,
  ApiAccessValidationRequest,
  ApiAccessValidationResponse,
} from '../types';

export async function validateAccess(
  input: ApiAccessValidationRequest,
): Promise<ApiAccessValidationResponse> {
  return apiRequest<ApiAccessValidationResponse>('/acesso/validar', {
    method: 'POST',
    body: input,
  });
}

export async function updateAccessPassword(
  input: ApiAccessPasswordRequest,
): Promise<ApiAccessPasswordResponse> {
  return apiRequest<ApiAccessPasswordResponse>('/acesso/senha', {
    method: 'PUT',
    body: input,
  });
}
