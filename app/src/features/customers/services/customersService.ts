import {apiRequest} from '../../../lib/api';
import type {Customer} from '../../../types';
import {mapCustomer} from '../mappers/customerMapper';
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
        apiRequest<ApiCustomerPendencias>(`/clientes/${customer.id}/pendencias`),
      ]);
      return mapCustomer(detail, pendencias);
    }),
  );

  return detailedCustomers;
}

export async function createCustomer(
  customer: Omit<Customer, 'id' | 'balance' | 'history'>,
) {
  const created = await apiRequest<ApiCustomerDetail>('/clientes', {
    method: 'POST',
    body: {
      nome: customer.name,
      apelido: customer.nickname,
      telefone: customer.phone,
      observacao: customer.notes,
    },
  });

  if (customer.active === false) {
    await apiRequest(`/clientes/${created.id}/inativar`, {method: 'PATCH'});
  }
}

export async function saveCustomer(
  customer: Customer,
  activeChanged?: boolean,
) {
  await apiRequest(`/clientes/${customer.id}`, {
    method: 'PUT',
    body: {
      nome: customer.name,
      apelido: customer.nickname,
      telefone: customer.phone,
      observacao: customer.notes,
    },
  });

  if (activeChanged !== undefined) {
    await apiRequest(`/clientes/${customer.id}/${activeChanged ? 'ativar' : 'inativar'}`, {
      method: 'PATCH',
    });
  }
}

export async function inactivateCustomer(id: string) {
  await apiRequest(`/clientes/${id}/inativar`, {
    method: 'PATCH',
  });
}
