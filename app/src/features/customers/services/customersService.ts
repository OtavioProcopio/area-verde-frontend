import { apiRequest } from '../../../lib/api';
import type { Customer } from '../../../types';
import { mapCustomer } from '../mappers/customerMapper';
import type {
  ApiCustomerDetail,
  ApiCustomerPendencias,
  ApiCustomerSummary,
} from '../types';

export async function fetchCustomers(): Promise<Customer[]> {
  const customers = await apiRequest<ApiCustomerSummary[]>('/clientes');
  const detailedCustomers = await Promise.all(
    customers.map(async (customer) => {
      const [detail, pendencias] = await Promise.all([
        apiRequest<ApiCustomerDetail>(`/clientes/${customer.id}`),
        apiRequest<ApiCustomerPendencias>(
          `/clientes/${customer.id}/pendencias`,
        ),
      ]);
      return mapCustomer(detail, pendencias);
    }),
  );

  return detailedCustomers;
}

async function fetchCustomerPendencias(
  customerId: string | number,
): Promise<ApiCustomerPendencias> {
  return apiRequest<ApiCustomerPendencias>(
    `/clientes/${customerId}/pendencias`,
  );
}

export async function fetchCustomerById(id: string): Promise<Customer> {
  const [detail, pendencias] = await Promise.all([
    apiRequest<ApiCustomerDetail>(`/clientes/${id}`),
    fetchCustomerPendencias(id),
  ]);
  return mapCustomer(detail, pendencias);
}

export async function createCustomer(
  customer: Omit<Customer, 'id' | 'balance' | 'history'>,
): Promise<Customer> {
  let created = await apiRequest<ApiCustomerDetail>('/clientes', {
    method: 'POST',
    body: {
      nome: customer.name,
      apelido: customer.nickname,
      telefone: customer.phone,
      observacao: customer.notes,
    },
  });

  if (customer.active === false) {
    created = await apiRequest<ApiCustomerDetail>(
      `/clientes/${created.id}/inativar`,
      { method: 'PATCH' },
    );
  }

  return mapCustomer(created, await fetchCustomerPendencias(created.id));
}

export async function saveCustomer(
  customer: Customer,
  activeChanged?: boolean,
): Promise<Customer> {
  let saved = await apiRequest<ApiCustomerDetail>(`/clientes/${customer.id}`, {
    method: 'PUT',
    body: {
      nome: customer.name,
      apelido: customer.nickname,
      telefone: customer.phone,
      observacao: customer.notes,
    },
  });

  if (activeChanged !== undefined) {
    saved = await apiRequest<ApiCustomerDetail>(
      `/clientes/${customer.id}/${activeChanged ? 'ativar' : 'inativar'}`,
      {
        method: 'PATCH',
      },
    );
  }

  return mapCustomer(saved, await fetchCustomerPendencias(saved.id));
}

export async function inactivateCustomer(id: string): Promise<Customer> {
  const saved = await apiRequest<ApiCustomerDetail>(
    `/clientes/${id}/inativar`,
    {
      method: 'PATCH',
    },
  );
  return mapCustomer(saved, await fetchCustomerPendencias(saved.id));
}
