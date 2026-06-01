import {useEffect, useState} from 'react';

const PIN_STORAGE_KEY = 'av_pin';
const DEFAULT_PIN = '1234';

export function useAccessPin() {
  const [accessPin, setAccessPin] = useState(DEFAULT_PIN);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    setAccessPin(storedPin || DEFAULT_PIN);
  }, []);

  const login = (pin: string): boolean => {
    if (pin === accessPin) {
      setIsLoggedIn(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const savePin = (newPin: string) => {
    setAccessPin(newPin);
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
  };

  const resetPin = () => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    setAccessPin(DEFAULT_PIN);
  };

  return {
    accessPin,
    isLoggedIn,
    login,
    logout,
    setAccessPin: savePin,
    resetPin,
  };
}
