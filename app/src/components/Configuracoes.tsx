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
    <div id="settings-module" className="space-y-5 pb-10">
      <div>
        <span className="mb-1 block text-xs font-bold text-gold-400">
          Ajustes do Sistema
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight text-cream-100">
          Configuracoes <span className="text-gold-400">Gerais</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-12 xl:col-span-6">
          <div className="rounded-2xl border border-counter-700 bg-counter-900 p-5">
            <h4 className="mb-4 flex items-center gap-1.5 border-b border-counter-700 pb-3 font-display text-base font-bold text-cream-100">
              <Store size={22} className="text-gold-400" />
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

            <form onSubmit={handleSaveConfiguracoes} className="space-y-4">
              <div>
                <label
                  htmlFor="input-bar-name"
                  className="mb-1 block text-xs font-bold text-cream-400"
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
                  className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3.5 py-2.5 text-sm font-bold text-cream-100 outline-none transition focus:border-gold-500"
                  placeholder="Ex: Buteco do Primo - Area Verde"
                  required
                />
              </div>

              <div className="space-y-4 rounded-xl border border-counter-700 bg-counter-800 p-4">
                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs font-bold text-cream-400">
                    Permitir estoque fisico negativo
                  </label>
                  <p className="mb-2 text-sm text-cream-400">
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
                    className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      allowNegativeStock
                        ? 'border-gold-500/30 bg-gold-500/10 text-gold-300'
                        : 'border-counter-700 bg-counter-950 text-cream-300 hover:bg-counter-700'
                    }`}
                  >
                    {allowNegativeStock ? (
                      <ToggleRight size={19} />
                    ) : (
                      <ToggleLeft size={19} />
                    )}
                    {allowNegativeStock ? 'PERMITIDO' : 'BLOQUEADO'}
                  </button>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs font-bold text-cream-400">
                    Dias para alerta de fiado
                  </label>
                  <p className="mb-2 text-xs text-cream-400">
                    Novas pendencias usam este prazo padrao para destacar
                    vencimentos e alertas.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={fiadoDays}
                      onChange={(event) => {
                        setFiadoDays(event.target.value);
                        setLocalConfigError(null);
                        onClearConfiguracaoFeedback();
                      }}
                      className="w-24 rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 font-mono text-sm font-bold text-cream-100 outline-none focus:border-gold-500"
                      min="1"
                      step="1"
                    />
                    <span className="flex items-center text-sm font-bold text-cream-400">
                      dias
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-cream-400">
                    Observacao interna
                  </label>
                  <textarea
                    value={observacao}
                    onChange={(event) => {
                      setObservacao(event.target.value);
                      setLocalConfigError(null);
                      onClearConfiguracaoFeedback();
                    }}
                    className="min-h-24 w-full resize-none rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm text-cream-100 outline-none transition focus:border-gold-500"
                    placeholder="Anotacoes operacionais do estabelecimento."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingConfiguracao || !configuracao}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-bold text-counter-950 transition hover:bg-gold-400 disabled:bg-counter-800 disabled:text-cream-400"
              >
                {isSavingConfiguracao ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Settings size={17} />
                )}
                Salvar configuracoes
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-12 xl:col-span-6">
          <div className="rounded-2xl border border-counter-700 bg-counter-900 p-5">
            <h4 className="mb-4 flex items-center gap-1.5 border-b border-counter-700 pb-3 font-display text-base font-bold text-cream-100">
              <Key size={22} className="text-gold-400" />
              Acesso e seguranca
            </h4>

            <div className="mb-4 flex items-center justify-between rounded-xl border border-counter-700 bg-counter-800 p-3">
              <div>
                <span className="block text-xs font-bold uppercase text-cream-400">
                  Status da senha
                </span>
                <span className="text-sm font-semibold text-cream-100">
                  {configuracao?.senhaConfigurada
                    ? 'Senha configurada'
                    : 'Senha pendente'}
                </span>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  configuracao?.senhaConfigurada
                    ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                    : 'border border-gold-500/30 bg-gold-500/10 text-gold-300'
                }`}
              >
                <ShieldCheck size={14} className="mr-1 inline" />
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
                  className="mb-1 block text-xs font-bold text-cream-400"
                >
                  Senha atual
                </label>
                <input
                  id="ipt-current-pin"
                  type="password"
                  placeholder="****"
                  className="w-full rounded-lg border border-counter-700 bg-counter-950 p-2.5 text-center font-mono text-sm tracking-widest text-cream-100 outline-none transition focus:border-gold-500"
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
                    className="mb-1 block text-xs font-bold text-cream-400"
                  >
                    Nova senha
                  </label>
                  <input
                    id="ipt-new-pin"
                    type="password"
                    placeholder="****"
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 p-2.5 text-center font-mono text-sm tracking-widest text-cream-100 outline-none transition focus:border-gold-500"
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
                    className="mb-1 block text-xs font-bold text-cream-400"
                  >
                    Confirmar nova
                  </label>
                  <input
                    id="ipt-confirm-pin"
                    type="password"
                    placeholder="****"
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 p-2.5 text-center font-mono text-sm tracking-widest text-cream-100 outline-none transition focus:border-gold-500"
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
                className="mt-2 w-full rounded-lg bg-gold-500 py-2.5 text-xs font-bold uppercase text-counter-950 shadow-sm transition hover:bg-gold-400 disabled:bg-counter-800 disabled:text-cream-400"
              >
                {isUpdatingPassword ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={17} className="animate-spin" />
                    Salvando senha
                  </span>
                ) : (
                  'Salvar nova senha'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-4 rounded-2xl border border-counter-700 bg-counter-900 p-5">
            <h4 className="mb-2 flex items-center gap-1.5 border-b border-counter-700 pb-3 font-display text-base font-bold text-cream-100">
              <FolderSync size={22} className="text-gold-400" />
              Backup Geral e Recuperacao
            </h4>
            <p className="text-sm leading-relaxed text-cream-400">
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
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-counter-700 bg-counter-800 px-3 py-2.5 text-sm font-bold text-cream-200 transition hover:border-gold-500/50 hover:text-gold-300"
              >
                <Download size={17} /> Exportar Backup (copiar JSON)
              </button>
            </div>

            <form
              onSubmit={handleImport}
              className="space-y-3.5 border-t border-counter-700 pt-4"
            >
              <div>
                <label
                  htmlFor="tx-import-backup"
                  className="mb-1 block text-xs font-bold text-cream-400"
                >
                  Cole o JSON do backup para restaurar
                </label>
                <textarea
                  id="tx-import-backup"
                  value={backupText}
                  onChange={(event) => setBackupText(event.target.value)}
                  className="h-28 w-full resize-none rounded-lg border border-counter-700 bg-counter-950 p-2.5 font-mono text-xs text-cream-200 outline-none transition focus:border-gold-500"
                  placeholder="Cole seu objeto JSON de backup aqui..."
                  required
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold-500 py-2.5 text-xs font-bold uppercase text-counter-950 shadow-sm transition hover:bg-gold-400"
              >
                <Upload size={17} />
                Importar backup no frontend
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-counter-700 bg-counter-900 p-5">
            <h4 className="mb-2 flex items-center gap-1.5 border-b border-rose-400/30 pb-3 font-display text-base font-bold text-rose-400">
              <RotateCcw size={19} />
              Redefinicao de sessao
            </h4>
            <p className="mb-4 text-sm leading-relaxed text-cream-400">
              Encerra a sessao atual e recarrega os dados reais da API.
            </p>

            <button
              id="btn-master-purge"
              onClick={() => void handleMasterPurge()}
              className="w-full rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-center text-sm font-bold text-rose-400 transition hover:bg-rose-400/20"
            >
              Recarregar sessao do sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
