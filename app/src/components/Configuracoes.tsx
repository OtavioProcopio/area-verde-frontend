/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  RotateCcw, 
  Upload, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  Store,
  CheckCircle,
  Copy,
  FolderSync,
  Box,
  CircleDollarSign,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface ConfiguracoesProps {
  accessPin: string;
  onChangePin: (newPin: string) => void;
  onResetAllData: () => void;
  onImportBackup: (data: string) => { success: boolean; msg: string };
  onExportBackup: () => string;
  barName: string;
  onChangeBarName: (name: string) => void;
}

export default function Configuracoes({
  accessPin,
  onChangePin,
  onResetAllData,
  onImportBackup,
  onExportBackup,
  barName,
  onChangeBarName
}: ConfiguracoesProps) {
  
  // Local pin state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMsg, setPinMsg] = useState<{ type: 'ok' | 'err', text: string } | null>(null);

  // Bar Custom brand name
  const [barNameInput, setBarNameInput] = useState(barName);

  // Backup restore state
  const [backupText, setBackupText] = useState('');
  const [backupMsg, setBackupMsg] = useState<{ type: 'ok' | 'err', text: string } | null>(null);

  // Mock settings for Estoque
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);

  // Mock settings for Fiado
  const [fiadoDays, setFiadoDays] = useState('30');

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);
    
    if (currentPinInput !== accessPin) {
      setPinMsg({ type: 'err', text: 'A senha atual está incorreta.' });
      return;
    }
    
    if (newPin.length < 4) {
      setPinMsg({ type: 'err', text: 'A nova senha precisa ter pelo menos 4 caracteres.' });
      return;
    }

    if (newPin !== pinConfirm) {
      setPinMsg({ type: 'err', text: 'As novas senhas inseridas não coincidem.' });
      return;
    }

    onChangePin(newPin);
    setCurrentPinInput('');
    setNewPin('');
    setPinConfirm('');
    setPinMsg({ type: 'ok', text: 'Senha PIN alterada com sucesso!' });
  };

  const handleUpdateBarName = (e: React.FormEvent) => {
    e.preventDefault();
    if (barNameInput.trim() !== '') {
      onChangeBarName(barNameInput);
      alert('Nome do bar salvo com sucesso! Confira na barra superior do sistema.');
    }
  };

  const handleSaveEstoqueConfig = () => {
    alert('Configurações de estoque salvas! (Mock)');
  };

  const handleSaveFiadoConfig = () => {
    alert('Configurações de fiado salvas! (Mock)');
  };

  const handleCopyBackup = () => {
    try {
      const backupStr = onExportBackup();
      navigator.clipboard.writeText(backupStr);
      alert('Código de backup copiado para a área de transferência! Cole em um editor de sua preferência.');
    } catch (e) {
      alert('Não foi possível copiar automaticamente. Use a visualização para copiar.');
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setBackupMsg(null);
    if (backupText.trim() === '') return;

    if (window.confirm('Atenção: Importar este arquivo substituirá TODOS os dados atuais de caixa, clientes e produtos. Prosseguir?')) {
      const res = onImportBackup(backupText);
      if (res.success) {
        setBackupText('');
        setBackupMsg({ type: 'ok', text: res.msg });
      } else {
        setBackupMsg({ type: 'err', text: res.msg });
      }
    }
  };

  const handleMasterPurge = () => {
    if (window.confirm('⚠️ ALERTA DE SEGURANÇA ⚠️\n\nDeseja realmente APAGAR TODO O LOCALSTORAGE e retornar as definições de fábrica? Isso limpará todas as comandas novas, produtos criados e históricos de cadastros de fiados.')) {
      onResetAllData();
      alert('Sistema restaurado aos originais com sucesso! A página irá atualizar.');
      window.location.reload();
    }
  };

  return (
    <div id="settings-module" className="space-y-6 animate-fade-in pb-10">
      
      {/* Title */}
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-emerald-500 font-bold block mb-1">Ajustes do Sistema</span>
        <h2 className="text-3xl font-display font-bold text-slate-50 tracking-tight">
          Configurações <span className="text-emerald-500">Gerais</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Column 1: Sistema e Estoque */}
        <div className="lg:col-span-12 xl:col-span-6 space-y-6">
          
          {/* Seção Sistema */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-display font-bold text-slate-200 mb-4 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Store size={18} className="text-emerald-500" />
              Sistema
            </h4>
            
            <form onSubmit={handleUpdateBarName} className="space-y-2">
              <label htmlFor="input-bar-name" className="block text-[10px] uppercase font-mono text-slate-500 font-bold">Nome do Estabelecimento:</label>
              <div className="flex gap-2">
                <input
                  id="input-bar-name"
                  type="text"
                  value={barNameInput}
                  onChange={(e) => setBarNameInput(e.target.value)}
                  className="flex-1 bg-slate-800/50 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 rounded-lg outline-none focus:border-emerald-600 focus:bg-slate-900 font-bold transition"
                  placeholder="Ex: Buteco do Primo - Area Verde"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-950/400 font-bold text-xs text-white transition cursor-pointer shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>

          {/* Seção Estoque */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-display font-bold text-slate-200 mb-4 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Box size={18} className="text-emerald-500" />
              Estoque
            </h4>
            
            <div className="space-y-4">
               <div>
                  <label className="flex items-center gap-2 text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">
                    Permitir Estoque Físico Negativo?
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    <span className="font-bold text-amber-500">Atenção:</span> Ao ativar isso, o sistema venderá produtos mesmo sem saldo, deixando a quantidade negativa para conferência futura.
                  </p>
                  
                  <div className="flex items-center gap-4">
                     <button
                        type="button"
                        onClick={() => setAllowNegativeStock(!allowNegativeStock)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                          allowNegativeStock ? 'bg-amber-950/40 text-amber-400 border-amber-800/60' : 'bg-slate-800/50 text-slate-500 border-slate-800 hover:bg-slate-800'
                        }`}
                     >
                        {allowNegativeStock ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {allowNegativeStock ? 'PERMITIDO' : 'BLOQUEADO'}
                     </button>
                     
                     <button
                       type="button"
                       onClick={handleSaveEstoqueConfig}
                       className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-950/400 font-bold text-xs text-white transition cursor-pointer shadow-sm"
                     >
                       Salvar
                     </button>
                  </div>
               </div>
            </div>
          </div>

          {/* Seção Fiado */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-display font-bold text-slate-200 mb-4 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <CircleDollarSign size={18} className="text-emerald-500" />
              Fiados e Pendências
            </h4>
            
            <div className="space-y-4">
               <div>
                  <label className="flex items-center gap-2 text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">
                    Dias padrão para vencimento (Alerta)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">
                    As vendas novas no caderninho (fiado) usarão este prazo para alertar a dívida na tela de cobranças.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={fiadoDays}
                      onChange={(e) => setFiadoDays(e.target.value)}
                      className="w-24 bg-slate-800/50 border border-slate-800 px-3 py-1.5 text-xs font-mono font-bold text-slate-200 rounded-lg outline-none focus:border-emerald-600"
                      min="1"
                      step="1"
                    />
                    <span className="text-xs font-bold text-slate-500 flex items-center">dias</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveFiadoConfig}
                    className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-950/400 font-bold text-xs text-white transition cursor-pointer shadow-sm"
                  >
                    Salvar
                  </button>
               </div>
            </div>
          </div>

        </div>

        {/* Column 2: Access, Backup, Danger Zone */}
        <div className="lg:col-span-12 xl:col-span-6 space-y-6">
          
          {/* Seção Acesso */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-display font-bold text-slate-200 mb-4 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Key size={18} className="text-emerald-500" />
              Acesso e Segurança
            </h4>
            <p className="text-[10px] text-slate-500 mb-4 font-mono leading-relaxed">
              Modifique a senha (PIN) local de acesso no teclado numérico para restringir quem abre o caixa ou finaliza com contas do caderno.
            </p>

            <form onSubmit={handleUpdatePin} className="space-y-3">
              <div>
                <label htmlFor="ipt-current-pin" className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Senha Atual:</label>
                <input
                  id="ipt-current-pin"
                  type="password"
                  placeholder="****"
                  className="w-full bg-slate-800/50 border border-slate-800 p-2.5 rounded-lg text-sm text-center text-slate-200 font-mono tracking-widest outline-none focus:border-emerald-600 focus:bg-slate-900 transition"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ipt-new-pin" className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Nova Senha:</label>
                  <input
                    id="ipt-new-pin"
                    type="password"
                    placeholder="****"
                    className="w-full bg-slate-800/50 border border-slate-800 p-2.5 rounded-lg text-sm text-center text-slate-200 font-mono tracking-widest outline-none focus:border-emerald-600 focus:bg-slate-900 transition"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ipt-confirm-pin" className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Confirmar Nova:</label>
                  <input
                    id="ipt-confirm-pin"
                    type="password"
                    placeholder="****"
                    className="w-full bg-slate-800/50 border border-slate-800 p-2.5 rounded-lg text-sm text-center text-slate-200 font-mono tracking-widest outline-none focus:border-emerald-600 focus:bg-slate-900 transition"
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>

              {pinMsg && (
                <div className={`p-3 rounded-lg text-xs font-semibold border ${pinMsg.type === 'ok' ? 'bg-emerald-950/40 border-emerald-250 text-emerald-400' : 'bg-rose-950/40 border-rose-250 text-rose-400'}`}>
                  {pinMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-950/400 text-white font-bold rounded-lg text-[10px] uppercase transition cursor-pointer shadow-sm"
              >
                Salvar Nova Senha PIN
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-base font-display font-bold text-slate-200 mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <FolderSync size={18} className="text-emerald-500" />
              Backup Geral & Recuperação (Local)
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
              Os dados do seu bar ficam armazenados com segurança no modo local. Caso queira trocar de dispositivo ou guardar cópias digitadas, exporte ou cole novos backups em formato JSON abaixo:
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyBackup}
                className="flex-1 py-2.5 px-3 border border-slate-800 hover:border-emerald-600 bg-slate-800/50 text-xs font-bold rounded-lg text-slate-300 hover:text-emerald-400 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download size={14} /> Exportar Backup (Copiar JSON)
              </button>
            </div>

            <form onSubmit={handleImport} className="space-y-3.5 border-t border-slate-800 pt-4">
              <div>
                <label htmlFor="tx-import-backup" className="block text-[10px] uppercase font-mono text-slate-500 font-bold mb-1">Coloque o Código JSON do Backup para Restaurar:</label>
                <textarea
                  id="tx-import-backup"
                  value={backupText}
                  onChange={(e) => setBackupText(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-300 h-28 resize-none font-mono outline-none focus:border-emerald-600 focus:bg-slate-900 transition"
                  placeholder='Cole seu objeto JSON de backup aqui...'
                  required
                />
              </div>

              {backupMsg && (
                <div className={`p-3 rounded-lg text-xs font-semibold border ${backupMsg.type === 'ok' ? 'bg-emerald-950/40 border-emerald-250 text-emerald-400' : 'bg-rose-950/40 border-rose-250 text-rose-400'}`}>
                  {backupMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-950/400 text-white font-bold rounded-lg text-[10px] uppercase transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Upload size={14} />
                Substituir Sistema com Backup Local
              </button>
            </form>
          </div>

          {/* Master reset warnings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-display font-bold text-rose-500 mb-2 flex items-center gap-1.5 border-b border-rose-900 pb-2">
              <RotateCcw size={16} />
              Redefinição de Fábrica
            </h4>
            <p className="text-[10px] text-slate-500 mb-4 font-mono leading-relaxed">
              Excluir permanentemente todos os registros locais e recarregar a demonstração base original do bar.
            </p>

            <button
               id="btn-master-purge"
              onClick={handleMasterPurge}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-500 font-bold border border-rose-800/60 hover:border-rose-300 transition text-[11px] rounded-lg cursor-pointer shadow-xs w-full text-center"
            >
              Apagar Todo o LocalStorage e Repor Demonstração
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
