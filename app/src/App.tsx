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
const Clientes = lazy(() => import('./components/Clientes'));
const Relatorios = lazy(() => import('./components/Relatorios'));
const Configuracoes = lazy(() => import('./components/Configuracoes'));

import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ShoppingBag,
  Coins,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Clock,
  Lock,
  Unlock,
  Sprout,
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
        <span className="text-xs font-mono text-slate-500">
          Carregando módulo...
        </span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mr-2 inline-block"></div>
          <span className="text-slate-500 text-sm font-mono block">
            Iniciando sistema Area Verde...
          </span>
        </div>
      </div>
    );
  }

  if (!configuracao && bootstrapError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600">
            <Lock size={20} />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            Nao foi possivel iniciar o sistema
          </h1>
          <p className="mt-3 text-sm text-slate-500">{bootstrapError}</p>
          <button
            type="button"
            onClick={() => void refreshState()}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
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
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
  };

  // Compute live active statistics indicators for header badge
  const activeComandasCount = comandas.filter(
    (c) => c.status === 'active',
  ).length;
  const activeComandasSum = comandas
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => {
      const comSum = c.items.reduce(
        (itemSum, item) => itemSum + item.price * item.quantity,
        0,
      );
      return sum + (comSum - c.discount + c.addition);
    }, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-700 antialiased selection:bg-emerald-600 selection:text-white">
      {/* TOP HEADER STATUS PANEL */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
        {/* Brand identity area */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-lg">
            <Sprout size={18} />
          </div>
          <div>
            <span className="text-[11px] uppercase font-mono text-emerald-700 font-bold block leading-normal">
              Boteco Familiar S.O.
            </span>
            <h1 className="text-base font-display font-bold text-slate-900 tracking-tight">
              {configuracao?.nomeBar || 'Area Verde - Balcao Principal'}
            </h1>
          </div>
        </div>

        {/* Dynamic micro widgets & status badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
          {/* Caixa Status Widget */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg select-none">
            {caixa.isOpen ? (
              <>
                <Unlock size={14} className="text-emerald-600" />
                <span className="font-semibold text-emerald-700">
                  Caixa Aberto: {`R$ ${caixa.currentCashInMoney.toFixed(2)}`}
                </span>
              </>
            ) : (
              <>
                <Lock size={14} className="text-rose-600" />
                <span className="font-semibold text-rose-600">
                  Caixa Fechado
                </span>
              </>
            )}
          </div>

          {/* Comanda Status Widget */}
          {activeComandasCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
              <ShoppingBag size={14} />
              <span className="font-semibold">
                {activeComandasCount} Comandas (R${' '}
                {activeComandasSum.toFixed(2)})
              </span>
            </div>
          )}

          {/* Clock tracker badge */}
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-lg select-none">
            <Clock size={14} className="text-emerald-600" />
            <span>{time.toLocaleTimeString('pt-BR')}</span>
          </div>

          {/* Operator Logout button */}
          <button
            onClick={() => {
              if (
                window.confirm('Deseja realmente sair da sessão do balcão?')
              ) {
                logout();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 font-bold rounded-lg cursor-pointer transition duration-150 shrink-0"
            title="Sair do Sistema"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </header>

      {/* SYSTEM BODY CONTAINER */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* NAV SYTEM BAR: Left Drawer style on desktop, top scrolling bar on mobile */}
        <aside
          className="lg:col-span-2 lg:sticky lg:top-[68px] h-auto lg:max-h-[calc(100vh-88px)] flex flex-col justify-between"
          id="side-drawer"
        >
          <nav className="flex overflow-x-auto lg:overflow-visible lg:flex-col gap-1 bg-white border border-slate-200 p-2 rounded-xl select-none no-scrollbar snap-x">
            {[
              { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
              { id: 'comandas', label: 'Comandas POS', icon: ShoppingBag },
              { id: 'caixa', label: 'Controle Caixa', icon: Coins },
              { id: 'produtos', label: 'Produtos & Estoque', icon: Package },
              { id: 'clientes', label: 'Clientes & Fiado', icon: Users },
              { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
              { id: 'configuracoes', label: 'Ajustes', icon: Settings },
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
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition duration-150 cursor-pointer text-left whitespace-nowrap shrink-0 snap-center ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <TabIcon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick legal credentials attribution inside navigation margins - NO tech larp indicators */}
          <div className="hidden lg:block p-3 border border-slate-200 rounded-xl bg-white text-[11px] text-slate-500 font-mono mt-3 leading-normal">
            <span className="text-emerald-700 font-bold block mb-1">
              Area Verde S.O.
            </span>
            Gestão simplificada e ágil para o balcão. Todos os direitos
            reservados.
          </div>
        </aside>

        {/* WORKSPACE CONTENT AREA */}
        <main className="lg:col-span-10" id="main-workspace-box">
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
                    permitirEstoqueNegativo={
                      configuracao?.permitirEstoqueNegativo ?? false
                    }
                    onAddComanda={addComanda}
                    onUpdateComanda={(id, updates) => {
                      const c = comandas.find((com) => com.id === id);
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

                {activeTab === 'produtos' && (
                  <Produtos
                    products={products}
                    categories={categories}
                    onAddProduct={addProduct}
                    onUpdateProduct={updateProduct}
                    onDeleteProduct={deleteProduct}
                    onAddCategory={addCategory}
                    onUpdateCategory={updateCategory}
                    onRefreshState={refreshState}
                  />
                )}

                {activeTab === 'clientes' && (
                  <Clientes
                    customers={customers}
                    fiados={fiados}
                    caixaIsOpen={caixa.isOpen}
                    onAddCustomer={addCustomer}
                    onUpdateCustomer={updateCustomer}
                    onDeleteCustomer={deleteCustomer}
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
