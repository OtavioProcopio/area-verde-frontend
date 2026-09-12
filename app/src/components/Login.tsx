/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, Loader2, Lock, ShieldCheck, Sprout } from 'lucide-react';
import { InlineFeedback } from '../features/shared/components/InlineFeedback';

interface LoginProps {
  onLogin: (pin: string) => Promise<boolean>;
  onSetupInitialPassword: (newPassword: string) => Promise<boolean>;
  isLoading: boolean;
  senhaConfigurada: boolean;
  feedback: { tone: 'success' | 'error' | 'info'; message: string } | null;
  onClearFeedback: () => void;
}

export default function Login({
  onLogin,
  onSetupInitialPassword,
  isLoading,
  senhaConfigurada,
  feedback,
  onClearFeedback,
}: LoginProps) {
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const clearMessages = () => {
    setLocalError(null);
    onClearFeedback();
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!pin) {
      return;
    }

    clearMessages();
    await onLogin(pin);
  };

  const handleInitialPasswordSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (newPassword.length < 4) {
      setLocalError('A senha precisa ter pelo menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('As senhas informadas nao coincidem.');
      return;
    }

    const success = await onSetupInitialPassword(newPassword);

    if (success) {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const primaryDisabled = senhaConfigurada
    ? !pin || isLoading
    : !newPassword || !confirmPassword || isLoading;

  return (
    <div
      id="login-screen"
      className="flex min-h-screen items-center justify-center bg-counter-950 p-6 selection:bg-gold-500 selection:text-counter-950"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-counter-700 bg-counter-900 p-8">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gold-500" />

        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold-500" />
            <span className="text-xs font-bold text-gold-400">
              {senhaConfigurada ? 'Acesso Restrito' : 'Configuracao Inicial'}
            </span>
          </div>

          <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-cream-100">
            Area <span className="text-gold-400">Verde</span>
          </h1>
          <p className="text-sm font-medium text-cream-400">
            {senhaConfigurada
              ? 'Entre com a senha cadastrada no backend.'
              : 'Defina a primeira senha operacional do sistema.'}
          </p>
        </div>

        {feedback && (
          <InlineFeedback tone={feedback.tone} message={feedback.message} />
        )}
        {localError && (
          <div className="mt-4">
            <InlineFeedback tone="error" message={localError} />
          </div>
        )}

        {senhaConfigurada ? (
          <form onSubmit={handleLogin} className="mt-5 space-y-5">
            <div>
              <label className="mb-2 block text-center text-xs font-bold text-cream-400">
                Digite sua senha
              </label>
              <div className="relative">
                <Lock
                  size={24}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-400"
                />
                <input
                  type="password"
                  value={pin}
                  onChange={(event) => {
                    setPin(event.target.value);
                    clearMessages();
                  }}
                  disabled={isLoading}
                  className="w-full rounded-xl border-2 border-counter-700 bg-counter-950 py-3.5 pl-11 pr-4 text-center text-xl font-bold tracking-widest text-cream-100 outline-none transition focus:border-gold-500"
                  placeholder="****"
                  data-testid="login-senha-input"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={primaryDisabled}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 py-4 text-base font-bold text-counter-950 transition hover:bg-gold-400 disabled:bg-counter-800 disabled:text-cream-400"
            >
              {isLoading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleInitialPasswordSetup}
            className="mt-5 space-y-4"
          >
            <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-gold-300">
              O backend ainda nao possui uma senha configurada. Defina uma senha
              com no minimo 4 caracteres para liberar o acesso.
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-cream-400">
                Nova senha
              </label>
              <div className="relative">
                <KeyRound
                  size={24}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-400"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    clearMessages();
                  }}
                  disabled={isLoading}
                  className="w-full rounded-xl border-2 border-counter-700 bg-counter-950 py-3.5 pl-11 pr-4 text-center text-lg font-bold tracking-widest text-cream-100 outline-none transition focus:border-gold-500"
                  placeholder="****"
                  data-testid="setup-nova-senha-input"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-cream-400">
                Confirmar senha
              </label>
              <div className="relative">
                <ShieldCheck
                  size={24}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-400"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    clearMessages();
                  }}
                  disabled={isLoading}
                  className="w-full rounded-xl border-2 border-counter-700 bg-counter-950 py-3.5 pl-11 pr-4 text-center text-lg font-bold tracking-widest text-cream-100 outline-none transition focus:border-gold-500"
                  placeholder="****"
                  data-testid="setup-confirmar-senha-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={primaryDisabled}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 py-4 text-base font-bold text-counter-950 transition hover:bg-gold-400 disabled:bg-counter-800 disabled:text-cream-400"
            >
              {isLoading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                'Definir senha e entrar'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 flex gap-3 rounded-xl border border-counter-700 bg-counter-950 p-4 text-sm text-cream-300">
          <Sprout size={26} className="mt-0.5 shrink-0 text-gold-400" />
          <div>
            <span className="mb-0.5 block font-bold text-cream-100">
              Acesso centralizado
            </span>
            A validacao da senha e feita pela API do bar. O frontend so mantem a
            sessao atual em memoria.
          </div>
        </div>
      </div>
    </div>
  );
}
