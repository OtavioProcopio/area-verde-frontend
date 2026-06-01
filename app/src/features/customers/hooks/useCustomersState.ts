import {useState} from 'react';
import {createCustomer, inactivateCustomer, saveCustomer} from '../services/customersService';
import type {Customer} from '../../../types';

type RefreshRef = {
  current: () => Promise<void>;
};

export function useCustomersState(refreshRef: RefreshRef) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const addCustomer = async (
    customer: Omit<Customer, 'id' | 'balance' | 'history'>,
  ) => {
    await createCustomer(customer);
    await refreshRef.current();
  };

  const updateCustomer = async (updated: Customer) => {
    const original = customers.find((customer) => customer.id === updated.id);
    await saveCustomer(
      updated,
      original && (original.active ?? true) !== (updated.active ?? true)
        ? (updated.active ?? true)
        : undefined,
    );
    await refreshRef.current();
  };

  const deleteCustomer = async (id: string) => {
    await inactivateCustomer(id);
    await refreshRef.current();
  };

  return {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
