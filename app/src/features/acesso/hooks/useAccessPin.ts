import {useState} from 'react';
import {updateAccessPassword, validateAccess} from '../services/acessoService';
import {getApiErrorMessage} from '../../shared/utils/getApiErrorMessage';

type AccessFeedback = {
  tone: 'success' | 'error' | 'info';
  message: string;
} | null;

export function useAccessPin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthenticatingAccess, setIsAuthenticatingAccess] = useState(false);
  const [accessFeedback, setAccessFeedback] = useState<AccessFeedback>(null);

  const login = async (senha: string) => {
    setIsAuthenticatingAccess(true);
    setAccessFeedback(null);

    try {
      const response = await validateAccess({senha});

      if (!response.valido) {
        setAccessFeedback({
          tone: 'error',
          message: 'Senha inválida. Confira e tente novamente.',
        });
        return false;
      }

      setIsLoggedIn(true);
      return true;
    } catch (error) {
      setAccessFeedback({
        tone: 'error',
        message: getApiErrorMessage(
          error,
          'Nao foi possivel validar o acesso agora.',
        ),
      });
      return false;
    } finally {
      setIsAuthenticatingAccess(false);
    }
  };

  const changePassword = async (
    senhaAtual: string | null,
    novaSenha: string,
    successMessage: string,
  ) => {
    setIsAuthenticatingAccess(true);
    setAccessFeedback(null);

    try {
      await updateAccessPassword({
        senhaAtual,
        novaSenha,
      });
      setAccessFeedback({
        tone: 'success',
        message: successMessage,
      });
      return true;
    } catch (error) {
      setAccessFeedback({
        tone: 'error',
        message: getApiErrorMessage(
          error,
          'Nao foi possivel atualizar a senha de acesso.',
        ),
      });
      return false;
    } finally {
      setIsAuthenticatingAccess(false);
    }
  };

  const setupInitialPassword = async (novaSenha: string) => {
    const success = await changePassword(
      null,
      novaSenha,
      'Senha inicial configurada com sucesso. A sessao foi liberada.',
    );

    if (success) {
      setIsLoggedIn(true);
    }

    return success;
  };

  const updatePassword = async (senhaAtual: string, novaSenha: string) =>
    changePassword(
      senhaAtual,
      novaSenha,
      'Senha de acesso atualizada com sucesso.',
    );

  const logout = () => {
    setIsLoggedIn(false);
    setAccessFeedback(null);
  };

  const resetPin = () => {
    setIsLoggedIn(false);
    setAccessFeedback(null);
  };

  return {
    isLoggedIn,
    isAuthenticatingAccess,
    accessFeedback,
    clearAccessFeedback: () => setAccessFeedback(null),
    login,
    logout,
    resetPin,
    setupInitialPassword,
    changePassword: updatePassword,
  };
}
