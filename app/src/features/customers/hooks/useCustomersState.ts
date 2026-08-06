import { useState } from 'react';
import {
  createCustomer,
  inactivateCustomer,
  saveCustomer,
} from '../services/customersService';
import { getApiErrorMessage } from '../../shared/utils/getApiErrorMessage';
import type { Customer } from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

type OperationResult = { success: boolean; msg: string };

export function useCustomersState(refreshRef: RefreshRef) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const addCustomer = async (
    customer: Omit<Customer, 'id' | 'balance' | 'history'>,
  ): Promise<OperationResult> => {
    try {
      await createCustomer(customer);
      await refreshRef.current();
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
      const original = customers.find(
        (customer) => customer.id === updated.id,
      );
      await saveCustomer(
        updated,
        original && (original.active ?? true) !== (updated.active ?? true)
          ? (updated.active ?? true)
          : undefined,
      );
      await refreshRef.current();
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
      await inactivateCustomer(id);
      await refreshRef.current();
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
