/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Lock, Sprout, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (pin: string) => boolean;
}

export default function Login({ onLogin }: LoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    
    setError(false);
    setIsLoading(true);

    // Simulate backend loading state
    setTimeout(() => {
      const success = onLogin(pin);
      setIsLoading(false);
      if (!success) {
        setError(true);
      }
    }, 800);
  };

  return (
    <div id="login-screen" className="min-h-screen flex items-center justify-center bg-slate-800/50 p-6 selection:bg-emerald-600">
      {/* Background Decorative Forest Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-900/50/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-100/30 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm bg-slate-900 border border-slate-205 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Top Accent Color Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-bold">Acesso Restrito</span>
          </div>
          
          <h1 className="text-4xl font-display font-bold text-slate-50 tracking-tight mb-2">
            Area <span className="text-emerald-500">Verde</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Sistema de gestão do bar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase font-mono text-slate-500 mb-2 font-bold text-center">Digite sua Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                disabled={isLoading}
                className={`w-full pl-11 pr-4 py-3 bg-slate-800/50 border ${error ? 'border-rose-300 bg-rose-950/40 text-rose-900' : 'border-slate-800 focus:border-emerald-500'} rounded-xl text-center text-xl tracking-widest font-mono font-bold outline-none transition`}
                placeholder="****"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-rose-500 text-xs font-semibold mt-2 text-center animate-pulse">
                Senha inválida! Tente novamente.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !pin}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-950/400 disabled:bg-emerald-300 text-white font-bold rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md mb-6"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <div className="bg-emerald-950/40 border border-emerald-900 rounded-2xl p-4 flex gap-3 text-xs text-emerald-300 mt-6">
          <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-300 block mb-0.5">Acesso de Segurança</span>
            Senha padrão de fábrica do bar é <strong className="text-emerald-200 font-mono bg-emerald-900/50/70 px-1.5 py-0.5 rounded">1234</strong>. Pode redefini-la no painel de ajustes.
          </div>
        </div>
      </div>
    </div>
  );
}
