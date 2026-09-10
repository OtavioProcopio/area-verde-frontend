/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Download,
  FolderSync,
  Key,
  Loader2,
  RotateCcw,
  Settings,
  ShieldCheck,
  Store,
  ToggleLeft,
  ToggleRight,
  Upload,
} from 'lucide-react';
import type {
  Configuracao,
  ConfiguracaoUpdateInput,
} from '../features/configuracoes/types';
import { InlineFeedback } from '../features/shared/components/InlineFeedback';

type Feedback = {
  tone: 'success' | 'error' | 'info';
  message: string;
} | null;

interface ConfiguracoesProps {
  configuracao: Configuracao | null;
  isSavingConfiguracao: boolean;
  configuracaoFeedback: Feedback;
  onSaveConfiguracao: (input: ConfiguracaoUpdateInput) => Promise<void>;
  onClearConfiguracaoFeedback: () => void;
  onChangePassword: (senhaAtual: string, novaSenha: string) => Promise<boolean>;
  accessFeedback: Feedback;
  onClearAccessFeedback: () => void;
  isUpdatingPassword: boolean;
  onResetAllData: () => Promise<void>;
  onImportBackup: (data: string) => { success: boolean; msg: string };
  onExportBackup: () => string;
}

export default function Configuracoes({
  configuracao,
  isSavingConfiguracao,
  configuracaoFeedback,
  onSaveConfiguracao,
  onClearConfiguracaoFeedback,
  onChangePassword,
  accessFeedback,
  onClearAccessFeedback,
  isUpdatingPassword,
  onResetAllData,
  onImportBackup,
  onExportBackup,
}: ConfiguracoesProps) {
  const [nomeBarInput, setNomeBarInput] = useState('');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [fiadoDays, setFiadoDays] = useState('30');
  const [observacao, setObservacao] = useState('');
  const [localConfigError, setLocalConfigError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localPasswordError, setLocalPasswordError] = useState<string | null>(
    null,
  );
  const [backupText, setBackupText] = useState('');
  const [backupMsg, setBackupMsg] = useState<Feedback>(null);

  useEffect(() => {
    if (!configuracao) {
      return;
    }

    setNomeBarInput(configuracao.nomeBar);
    setAllowNegativeStock(configuracao.permitirEstoqueNegativo);
    setFiadoDays(String(configuracao.diasParaAlertaFiado));
    setObservacao(configuracao.observacao || '');
  }, [configuracao]);

  const handleSaveConfiguracoes = async (event: React.FormEvent) => {
    event.preventDefault();

    const dias = Number(fiadoDays);
    if (!Number.isFinite(dias) || dias < 1) {
      setLocalConfigError('Informe ao menos 1 dia para o alerta de fiado.');
      onClearConfiguracaoFeedback();
      return;
    }

    setLocalConfigError(null);

    try {
      await onSaveConfiguracao({
        nomeBar: nomeBarInput.trim(),
        diasParaAlertaFiado: dias,
        permitirEstoqueNegativo: allowNegativeStock,
        observacao: observacao.trim(),
      });
    } catch {
      // Feedback contextual ja e preenchido no hook de configuracoes.
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalPasswordError(null);
    onClearAccessFeedback();

    if (newPassword.length < 4) {
      setLocalPasswordError(
        'A nova senha precisa ter pelo menos 4 caracteres.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalPasswordError('As novas senhas informadas nao coincidem.');
      return;
    }

    const success = await onChangePassword(currentPassword, newPassword);

    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleCopyBackup = async () => {
    try {
      await navigator.clipboard.writeText(onExportBackup());
      setBackupMsg({
        tone: 'success',
        message: 'Backup copiado para a area de transferencia.',
      });
    } catch {
      setBackupMsg({
        tone: 'error',
        message: 'Nao foi possivel copiar automaticamente o backup.',
      });
    }
  };

  const handleImport = (event: React.FormEvent) => {
    event.preventDefault();
    setBackupMsg(null);

    if (!backupText.trim()) {
      return;
    }

    if (
      window.confirm(
        'Importar este backup substituira os dados exibidos no frontend. Deseja continuar?',
      )
    ) {
      const result = onImportBackup(backupText);
      setBackupMsg({
        tone: result.success ? 'success' : 'error',
        message: result.msg,
      });

      if (result.success) {
        setBackupText('');
      }
    }
  };

  const handleMasterPurge = async () => {
    if (
      window.confirm(
        'Deseja encerrar a sessao e recarregar os dados atuais da API?',
      )
    ) {
      await onResetAllData();
    }
  };

  return (
    <div id="settings-module" className="space-y-6 animate-fade-in pb-10">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-emerald-600 font-bold block mb-1">
          Ajustes do Sistema
        </span>
        <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
          Configuracoes <span className="text-emerald-600">Gerais</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 xl:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-display font-bold text-slate-700 mb-4 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Store size={18} className="text-emerald-600" />
              Sistema
            </h4>

            {configuracaoFeedback && (
              <div className="mb-4">
                <InlineFeedback
                  tone={configuracaoFeedback.tone}
                  message={configuracaoFeedback.message}
                />
              </div>
            )}

            {localConfigError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={localConfigError} />
              </div>
            )}

            <form onSubmit={handleSaveConfiguracoes} className="space-y-5">
              <div>
                <label
                  htmlFor="input-bar-name"
                  className="block text-[11px] uppercase font-mono text-slate-500 font-bold mb-1"
                >
                  Nome do estabelecimento
                </label>
                <input
                  id="input-bar-name"
                  type="text"
                  value={nomeBarInput}
                  onChange={(event) => {
                    setNomeBarInput(event.target.value);
                    setLocalConfigError(null);
                    onClearConfiguracaoFeedback();
                  }}
                  className="w-full bg-slate-100 border border-slate-200 px-3.5 py-2 text-xs text-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:bg-white font-bold transition"
                  placeholder="Ex: Buteco do Primo - Area Verde"
                  required
                />
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-100 p-4">
                <div>
                  <label className="flex items-center gap-2 text-[11px] uppercase font-mono text-slate-500 mb-1 font-bold">
                    Permitir estoque fisico negativo
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Quando ativo, o backend permite venda mesmo sem saldo,
                    deixando a quantidade negativa para conferencia posterior.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setAllowNegativeStock((current) => !current);
                      setLocalConfigError(null);
                      onClearConfiguracaoFeedback();
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      allowNegativeStock
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {allowNegativeStock ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                    {allowNegativeStock ? 'PERMITIDO' : 'BLOQUEADO'}
                  </button>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[11px] uppercase font-mono text-slate-500 mb-1 font-bold">
                    Dias para alerta de fiado
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Novas pendencias usam este prazo padrao para destacar
                    vencimentos e alertas.
                  </p>

                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={fiadoDays}
                      onChange={(event) => {
                        setFiadoDays(event.target.value);
                        setLocalConfigError(null);
                        onClearConfiguracaoFeedback();
                      }}
                      className="w-24 bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-mono font-bold text-slate-700 rounded-lg outline-none focus:border-emerald-500"
                      min="1"
                      step="1"
                    />
                    <span className="text-xs font-bold text-slate-500 flex items-center">
                      dias
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-mono text-slate-500 font-bold mb-1">
                    Observacao interna
                  </label>
                  <textarea
                    value={observacao}
                    onChange={(event) => {
                      setObservacao(event.target.value);
                      setLocalConfigError(null);
                      onClearConfiguracaoFeedback();
                    }}
                    className="w-full min-h-24 resize-none rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
                    placeholder="Anotacoes operacionais do estabelecimento."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingConfiguracao || !configuracao}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:bg-emerald-100 disabled:text-emerald-400"
              >
                {isSavingConfiguracao ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Settings size={14} />
                )}
                Salvar configuracoes
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-display font-bold text-slate-700 mb-4 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Key size={18} className="text-emerald-600" />
              Acesso e seguranca
            </h4>

            <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100 p-3">
              <div>
                <span className="block text-[11px] uppercase font-mono font-bold text-slate-500">
                  Status da senha
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {configuracao?.senhaConfigurada
                    ? 'Senha configurada'
                    : 'Senha pendente'}
                </span>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                  configuracao?.senhaConfigurada
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                <ShieldCheck size={12} className="inline mr-1" />
                {configuracao?.senhaConfigurada ? 'Ativa' : 'A definir'}
              </span>
            </div>

            {accessFeedback && (
              <div className="mb-4">
                <InlineFeedback
                  tone={accessFeedback.tone}
                  message={accessFeedback.message}
                />
              </div>
            )}

            {localPasswordError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={localPasswordError} />
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label
                  htmlFor="ipt-current-pin"
                  className="block text-[11px] font-mono text-slate-500 uppercase font-bold mb-1"
                >
                  Senha atual
                </label>
                <input
                  id="ipt-current-pin"
                  type="password"
                  placeholder="****"
                  className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-lg text-sm text-center text-slate-700 font-mono tracking-widest outline-none focus:border-emerald-500 focus:bg-white transition"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setLocalPasswordError(null);
                    onClearAccessFeedback();
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="ipt-new-pin"
                    className="block text-[11px] font-mono text-slate-500 uppercase font-bold mb-1"
                  >
                    Nova senha
                  </label>
                  <input
                    id="ipt-new-pin"
                    type="password"
                    placeholder="****"
                    className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-lg text-sm text-center text-slate-700 font-mono tracking-widest outline-none focus:border-emerald-500 focus:bg-white transition"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setLocalPasswordError(null);
                      onClearAccessFeedback();
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="ipt-confirm-pin"
                    className="block text-[11px] font-mono text-slate-500 uppercase font-bold mb-1"
                  >
                    Confirmar nova
                  </label>
                  <input
                    id="ipt-confirm-pin"
                    type="password"
                    placeholder="****"
                    className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-lg text-sm text-center text-slate-700 font-mono tracking-widest outline-none focus:border-emerald-500 focus:bg-white transition"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setLocalPasswordError(null);
                      onClearAccessFeedback();
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] uppercase transition cursor-pointer shadow-sm disabled:bg-emerald-100 disabled:text-emerald-400"
              >
                {isUpdatingPassword ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Salvando senha
                  </span>
                ) : (
                  'Salvar nova senha'
                )}
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-base font-display font-bold text-slate-700 mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <FolderSync size={18} className="text-emerald-600" />
              Backup Geral e Recuperacao
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
              Enquanto a aplicacao usa a API real, o backup exportado serve como
              leitura operacional dos dados carregados no frontend.
            </p>

            {backupMsg && (
              <InlineFeedback
                tone={backupMsg.tone}
                message={backupMsg.message}
              />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleCopyBackup()}
                className="flex-1 py-2.5 px-3 border border-slate-200 hover:border-emerald-500 bg-slate-100 text-xs font-bold rounded-lg text-slate-600 hover:text-emerald-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download size={14} /> Exportar Backup (copiar JSON)
              </button>
            </div>

            <form
              onSubmit={handleImport}
              className="space-y-3.5 border-t border-slate-200 pt-4"
            >
              <div>
                <label
                  htmlFor="tx-import-backup"
                  className="block text-[11px] uppercase font-mono text-slate-500 font-bold mb-1"
                >
                  Cole o JSON do backup para restaurar
                </label>
                <textarea
                  id="tx-import-backup"
                  value={backupText}
                  onChange={(event) => setBackupText(event.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-lg text-[11px] text-slate-600 h-28 resize-none font-mono outline-none focus:border-emerald-500 focus:bg-white transition"
                  placeholder="Cole seu objeto JSON de backup aqui..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] uppercase transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Upload size={14} />
                Importar backup no frontend
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-display font-bold text-rose-600 mb-2 flex items-center gap-1.5 border-b border-rose-200 pb-2">
              <RotateCcw size={16} />
              Redefinicao de sessao
            </h4>
            <p className="text-[11px] text-slate-500 mb-4 font-mono leading-relaxed">
              Encerra a sessao atual e recarrega os dados reais da API.
            </p>

            <button
              id="btn-master-purge"
              onClick={() => void handleMasterPurge()}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold border border-rose-200 hover:border-rose-300 transition text-xs rounded-lg cursor-pointer shadow-xs w-full text-center"
            >
              Recarregar sessao do sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
