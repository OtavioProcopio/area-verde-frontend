import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, ApiError } from '@/lib/api/client';

function mockFetchResponse(init: { status: number; body?: string }): Response {
  return {
    status: init.status,
    ok: init.status >= 200 && init.status < 300,
    text: () => Promise.resolve(init.body ?? ''),
  } as unknown as Response;
}

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna o corpo JSON quando a resposta é de sucesso', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ status: 200, body: JSON.stringify({ id: 1 }) }),
    );

    const result = await apiRequest<{ id: number }>('/produtos/1');

    expect(result).toEqual({ id: 1 });
  });

  it('lança ApiError com o payload JSON quando a resposta é de erro', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({
        status: 400,
        body: JSON.stringify({ code: 'dados_invalidos' }),
      }),
    );

    await expect(apiRequest('/produtos')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      payload: { code: 'dados_invalidos' },
    });
  });

  it('lança ApiError com o payload como texto quando o corpo de erro não é JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ status: 500, body: 'Internal Server Error' }),
    );

    await expect(apiRequest('/produtos')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      payload: 'Internal Server Error',
    });
  });

  it('retorna undefined em uma resposta 204, sem tentar ler o corpo', async () => {
    const text = vi.fn();
    vi.mocked(fetch).mockResolvedValue({
      status: 204,
      ok: true,
      text,
    } as unknown as Response);

    const result = await apiRequest('/caixas/1/fechar', { method: 'POST' });

    expect(result).toBeUndefined();
    expect(text).not.toHaveBeenCalled();
  });

  it('é uma instância de Error e carrega status/payload', () => {
    const error = new ApiError('Erro na API', 404, { code: 'nao_encontrado' });

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.payload).toEqual({ code: 'nao_encontrado' });
  });
});
