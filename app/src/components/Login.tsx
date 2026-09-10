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
      className="min-h-screen flex items-center justify-center bg-slate-50 p-6 selection:bg-emerald-600 selection:text-white"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />

        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span className="text-xs uppercase tracking-widest font-mono text-emerald-700 font-bold">
              {senhaConfigurada ? 'Acesso Restrito' : 'Configuracao Inicial'}
            </span>
          </div>

          <h1 className="mb-2 text-3xl font-display font-bold tracking-tight text-slate-900">
            Area <span className="text-emerald-600">Verde</span>
          </h1>
          <p className="text-sm font-medium text-slate-500">
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
              <label className="mb-2 block text-center text-xs uppercase font-mono font-bold text-slate-500">
                Digite sua senha
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  value={pin}
                  onChange={(event) => {
                    setPin(event.target.value);
                    clearMessages();
                  }}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-center text-xl font-mono font-bold tracking-widest text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                  placeholder="****"
                  data-testid="login-senha-input"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={primaryDisabled}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-emerald-200 disabled:text-emerald-500"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
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
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              O backend ainda nao possui uma senha configurada. Defina uma senha
              com no minimo 4 caracteres para liberar o acesso.
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase font-mono font-bold text-slate-500">
                Nova senha
              </label>
              <div className="relative">
                <KeyRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    clearMessages();
                  }}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-center text-lg font-mono font-bold tracking-widest text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                  placeholder="****"
                  data-testid="setup-nova-senha-input"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase font-mono font-bold text-slate-500">
                Confirmar senha
              </label>
              <div className="relative">
                <ShieldCheck
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    clearMessages();
                  }}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-center text-lg font-mono font-bold tracking-widest text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                  placeholder="****"
                  data-testid="setup-confirmar-senha-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={primaryDisabled}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-emerald-200 disabled:text-emerald-500"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Definir senha e entrar'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <Sprout size={20} className="shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <span className="mb-0.5 block font-bold text-slate-700">
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
