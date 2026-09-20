import { useState } from 'react';
import {
  createCustomer,
  inactivateCustomer,
  saveCustomer,
} from '../services/customersService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Customer } from '../../../types';

type OperationResult = { success: boolean; msg: string };

export function useCustomersState() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const upsertCustomer = (updated: Customer) =>
    setCustomers((prev) => {
      const exists = prev.some((customer) => customer.id === updated.id);
      return exists
        ? prev.map((customer) =>
            customer.id === updated.id ? updated : customer,
          )
        : [...prev, updated];
    });

  const addCustomer = async (
    customer: Omit<Customer, 'id' | 'balance' | 'history'>,
  ): Promise<OperationResult> => {
    try {
      upsertCustomer(await createCustomer(customer));
      return { success: true, msg: 'Cliente cadastrado com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível cadastrar o cliente.'),
      };
    }
  };

  const updateCustomer = async (
    updated: Customer,
  ): Promise<OperationResult> => {
    try {
      const original = customers.find((customer) => customer.id === updated.id);
      const saved = await saveCustomer(
        updated,
        original && (original.active ?? true) !== (updated.active ?? true)
          ? (updated.active ?? true)
          : undefined,
      );
      upsertCustomer(saved);
      return { success: true, msg: 'Cliente atualizado com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível atualizar o cliente.'),
      };
    }
  };

  const deleteCustomer = async (id: string): Promise<OperationResult> => {
    try {
      upsertCustomer(await inactivateCustomer(id));
      return { success: true, msg: 'Cliente inativado com sucesso.' };
    } catch (error) {
      return {
        success: false,
        msg: getApiErrorMessage(error, 'Não foi possível inativar o cliente.'),
      };
    }
  };

  return {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
