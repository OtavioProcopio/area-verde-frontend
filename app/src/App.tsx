/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useSystemState } from './useSystemState';
const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Comandas = lazy(() => import('./components/Comandas'));
const Caixa = lazy(() => import('./components/Caixa'));
const Produtos = lazy(() => import('./components/Produtos'));
const Estoque = lazy(() => import('./components/Estoque'));
const Clientes = lazy(() => import('./components/Clientes'));
const Fiados = lazy(() => import('./components/Fiados'));
const Relatorios = lazy(() => import('./components/Relatorios'));
const Configuracoes = lazy(() => import('./components/Configuracoes'));

import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Coins, 
  Package, 
  Users, 
  Wallet,
  BarChart3, 
  Settings, 
  LogOut, 
  Clock, 
  Lock, 
  Unlock,
  Sprout,
  UserCheck
} from 'lucide-react';

export default function App() {
  const {
    isLoading,
    bootstrapError,
    isLoggedIn,
    login,
    logout,
    isAuthenticatingAccess,
    accessFeedback,
    clearAccessFeedback,
    setupInitialPassword,
    changeAccessPassword,
    configuracao,
    isSavingConfiguracao,
    configuracaoFeedback,
    clearConfiguracaoFeedback,
    saveConfiguracao,
    products,
    categories,
    addCategory,
    updateCategory,
    customers,
    comandas,
    fiados,
    caixa,
    caixasHistory,
    abrirCaixa,
    fecharCaixa,
    adicionarSuprimento,
    realizarSangria,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    pagarFiado,
    addComanda,
    updateComanda,
    cancelarComanda,
    addItemToComanda,
    updateComandaItemQty,
    removeItemFromComanda,
    pagarComanda,
    resetAllData,
    importBackup,
    exportBackup,
    refreshState,
  } = useSystemState();

  // Active module tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Real-time dynamic clock tracking state
  const [time, setTime] = useState(new Date());

  // Clock runner
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const moduleFallback = (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="text-xs font-mono text-slate-500">Carregando módulo...</span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d13]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mr-2 inline-block"></div>
          <span className="text-gray-400 text-sm font-mono block">Iniciando sistema Area Verde...</span>
        </div>
      </div>
    );
  }

  if (!configuracao && bootstrapError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d13] p-6">
        <div className="w-full max-w-md rounded-3xl border border-rose-900 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-800/60 bg-rose-950/40 text-rose-500">
            <Lock size={20} />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-50">
            Nao foi possivel iniciar o sistema
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            {bootstrapError}
          </p>
          <button
            type="button"
            onClick={() => void refreshState()}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Guard login checkpoint
  if (!isLoggedIn) {
    return (
      <Suspense fallback={moduleFallback}>
        <Login
          onLogin={login}
          onSetupInitialPassword={setupInitialPassword}
          isLoading={isAuthenticatingAccess}
          senhaConfigurada={configuracao?.senhaConfigurada ?? true}
          feedback={accessFeedback}
          onClearFeedback={clearAccessFeedback}
        />
      </Suspense>
    );
  }

  // Tab switching animations specs
  const tabVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.15 } }
  };

  // Compute live active statistics indicators for header badge
  const activeComandasCount = comandas.filter(c => c.status === 'active').length;
  const activeComandasSum = comandas
    .filter(c => c.status === 'active')
    .reduce((sum, c) => {
      const comSum = c.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
      return sum + (comSum - c.discount + c.addition);
    }, 0);

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col text-slate-200 antialiased selection:bg-emerald-600 selection:text-white">
      
      {/* GEOMETRIC BALANCE THEME CONTAINER */}

      {/* TOP HEADER STATUS PANEL */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        
        {/* Brand identity area */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-xl shadow-lg shadow-emerald-600/15">
            <Sprout size={20} className="animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-emerald-500 font-bold block leading-normal">Boteco Familiar S.O.</span>
            <h1 className="text-lg font-display font-bold text-slate-50 tracking-tight">
              {configuracao?.nomeBar || 'Area Verde - Balcao Principal'}
            </h1>
          </div>
        </div>

        {/* Dynamic micro widgets & status badges */}
        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs text-slate-500 font-mono">
          
          {/* Caixa Status Widget */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-800 rounded-xl select-none">
            {caixa.isOpen ? (
              <>
                <Unlock size={14} className="text-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-400">Caixa Aberto: {`R$ ${caixa.currentCashInMoney.toFixed(2)}`}</span>
              </>
            ) : (
              <>
                <Lock size={14} className="text-rose-500" />
                <span className="font-semibold text-rose-500">Caixa Fechado</span>
              </>
            )}
          </div>

          {/* Comanda Status Widget */}
          {activeComandasCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 border border-amber-800/60 text-amber-400 rounded-xl">
              <ShoppingBag size={14} />
              <span className="font-semibold">{activeComandasCount} Comandas (R$ {activeComandasSum.toFixed(2)})</span>
            </div>
          )}

          {/* Clock tracker badge */}
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold bg-slate-800/50 px-3 py-1.5 border border-slate-800 rounded-xl select-none">
            <Clock size={14} className="text-emerald-500" />
            <span>{time.toLocaleTimeString('pt-BR')}</span>
          </div>

          {/* Operator Logout button */}
          <button
            onClick={() => {
              if (window.confirm('Deseja realmente sair da sessão do balcão?')) {
                logout();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-slate-500 hover:text-rose-500 font-bold rounded-xl cursor-pointer duration-150 shrink-0"
            title="Sair do Sistema"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </header>

      {/* SYSTEM BODY CONTAINER */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* NAV SYTEM BAR: Left Drawer style on desktop, top scrolling bar on mobile */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 h-auto lg:max-h-[calc(100vh-140px)] flex flex-col justify-between" id="side-drawer">
          <nav className="flex overflow-x-auto lg:overflow-visible lg:flex-col gap-2 bg-emerald-950 border border-emerald-900 p-3 lg:p-4 rounded-2xl shadow-xl select-none no-scrollbar snap-x">
            {[
              { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
              { id: 'comandas', label: 'Comandas POS', icon: ShoppingBag },
              { id: 'caixa', label: 'Controle Caixa', icon: Coins },
              { id: 'estoque', label: 'Estoque do Balcão', icon: Package },
              { id: 'produtos', label: 'Catálogo de Produtos', icon: LayoutDashboard },
              { id: 'clientes', label: 'Clientes', icon: Users },
              { id: 'fiados', label: 'Fiado / Pendências', icon: Wallet },
              { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
              { id: 'configuracoes', label: 'Ajustes', icon: Settings }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  id={`nav-link-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-xs font-bold transition duration-155 cursor-pointer text-left whitespace-nowrap shrink-0 snap-center ${
                    isActive 
                      ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/20' 
                      : 'text-emerald-200/80 hover:text-white hover:bg-emerald-900/60'
                  }`}
                >
                  <TabIcon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick legal credentials attribution inside navigation margins - NO tech larp indicators */}
          <div className="hidden lg:block p-4 border border-slate-800 rounded-2xl bg-slate-900 text-[10px] text-slate-500 font-mono mt-4 leading-normal shadow-sm">
            <span className="text-emerald-400 font-bold block mb-1">Area Verde S.O.</span>
            Gestão simplificada e ágil para o balcão. Todos os direitos reservados.
          </div>
        </aside>

        {/* WORKSPACE CONTENT AREA (9 cols) */}
        <main className="lg:col-span-9" id="main-workspace-box">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabVariants}
              className="min-h-[400px]"
            >
              <Suspense fallback={moduleFallback}>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  products={products}
                  customers={customers}
                  comandas={comandas}
                  caixa={caixa}
                  onChangeTab={setActiveTab}
                  onOpenCaixaTrigger={() => setActiveTab('caixa')}
                />
              )}

              {activeTab === 'comandas' && (
                <Comandas 
                  comandas={comandas}
                  products={products}
                  categories={categories}
                  customers={customers}
                  caixaIsOpen={caixa.isOpen}
                  onAddComanda={addComanda}
                  onUpdateComanda={(id, updates) => {
                    const c = comandas.find(com => com.id === id);
                    if (c) updateComanda({ ...c, ...updates });
                  }}
                  onCancelarComanda={cancelarComanda}
                  onAddItemToComanda={addItemToComanda}
                  onUpdateComandaItemQty={updateComandaItemQty}
                  onRemoveItemFromComanda={removeItemFromComanda}
                  onPagarComanda={pagarComanda}
                  onAddCustomer={addCustomer}
                />
              )}

              {activeTab === 'caixa' && (
                <Caixa 
                  caixa={caixa}
                  caixasHistory={caixasHistory}
                  onAbrirCaixa={abrirCaixa}
                  onFecharCaixa={fecharCaixa}
                  onAdicionarSuprimento={adicionarSuprimento}
                  onRealizarSangria={realizarSangria}
                />
              )}

              {activeTab === 'estoque' && (
                <Estoque 
                  products={products}
                  categories={categories}
                  onUpdateProduct={updateProduct}
                  onRefreshState={refreshState}
                />
              )}

              {activeTab === 'produtos' && (
                <Produtos 
                  products={products}
                  categories={categories}
                  onAddProduct={addProduct}
                  onUpdateProduct={updateProduct}
                  onDeleteProduct={deleteProduct}
                  onAddCategory={addCategory}
                  onUpdateCategory={updateCategory}
                />
              )}

              {activeTab === 'clientes' && (
                <Clientes 
                  customers={customers}
                  caixaIsOpen={caixa.isOpen}
                  onAddCustomer={addCustomer}
                  onUpdateCustomer={updateCustomer}
                  onDeleteCustomer={deleteCustomer}
                  onPagarFiado={pagarFiado}
                />
              )}

              {activeTab === 'fiados' && (
                <Fiados
                  fiados={fiados}
                  customers={customers}
                  caixaIsOpen={caixa.isOpen}
                  onPagarFiado={pagarFiado}
                />
              )}

              {activeTab === 'relatorios' && (
                <Relatorios 
                  products={products}
                  comandas={comandas}
                  customers={customers}
                  caixa={caixa}
                />
              )}

              {activeTab === 'configuracoes' && (
                <Configuracoes 
                  configuracao={configuracao}
                  isSavingConfiguracao={isSavingConfiguracao}
                  configuracaoFeedback={configuracaoFeedback}
                  onSaveConfiguracao={saveConfiguracao}
                  onClearConfiguracaoFeedback={clearConfiguracaoFeedback}
                  onChangePassword={changeAccessPassword}
                  accessFeedback={accessFeedback}
                  onClearAccessFeedback={clearAccessFeedback}
                  isUpdatingPassword={isAuthenticatingAccess}
                  onResetAllData={resetAllData}
                  onImportBackup={importBackup}
                  onExportBackup={exportBackup}
                />
              )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
