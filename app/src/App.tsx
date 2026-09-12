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

import { motion, AnimatePresence, type Variants } from 'motion/react';
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

  // Tela de venda ocupa a largura toda (sem menu lateral) enquanto o
  // operador está atendendo uma comanda — evita layout de dashboard
  // "sobrando" espaço no momento em que a tela mais importa: o balcão.
  const [isImmersive, setIsImmersive] = useState(false);
  useEffect(() => {
    if (activeTab !== 'comandas') setIsImmersive(false);
  }, [activeTab]);

  // Real-time dynamic clock tracking state
  const [time, setTime] = useState(new Date());

  // Clock runner
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const moduleFallback = (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gold-500 border-t-transparent" />
        <span className="block font-mono text-sm text-cream-400">
          Carregando módulo...
        </span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-counter-950">
        <div className="space-y-4 text-center">
          <div className="mx-auto mr-2 inline-block h-10 w-10 animate-spin rounded-full border-4 border-gold-500 border-t-transparent"></div>
          <span className="block font-mono text-sm text-cream-300">
            Iniciando sistema Area Verde...
          </span>
        </div>
      </div>
    );
  }

  if (!configuracao && bootstrapError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-counter-950 p-6">
        <div className="w-full max-w-md rounded-2xl border-2 border-rose-500/30 bg-counter-900 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <Lock size={24} />
          </div>
          <h1 className="font-display text-2xl font-bold text-cream-100">
            Nao foi possivel iniciar o sistema
          </h1>
          <p className="mt-3 text-sm text-cream-400">{bootstrapError}</p>
          <button
            type="button"
            onClick={() => void refreshState()}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gold-500 px-4 py-3 text-sm font-bold text-counter-950 transition hover:bg-gold-400"
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
  const tabVariants: Variants = {
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
    <div className="flex min-h-screen flex-col bg-counter-950 text-cream-200 antialiased selection:bg-gold-500 selection:text-counter-950">
      {/* TOP HEADER STATUS PANEL */}
      <header className="sticky top-0 z-30 flex flex-col items-center justify-between gap-3 border-b-2 border-counter-700 bg-counter-900 px-6 py-3 md:flex-row md:gap-4">
        {/* Brand identity area */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gold-500 p-2 text-counter-950">
            <Sprout size={24} />
          </div>
          <div>
            <span className="block text-xs font-bold leading-normal text-gold-400">
              Boteco Familiar S.O.
            </span>
            <h1 className="font-display text-lg font-bold tracking-tight text-cream-100">
              {configuracao?.nomeBar || 'Area Verde - Balcao Principal'}
            </h1>
          </div>
        </div>

        {/* Dynamic micro widgets & status badges */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-cream-300">
          {/* Caixa Status Widget */}
          <div className="flex items-center gap-2 rounded-lg border border-counter-700 bg-counter-800 px-3 py-2 select-none">
            {caixa.isOpen ? (
              <>
                <Unlock size={19} className="text-emerald-400" />
                <span className="font-semibold text-emerald-400">
                  Caixa Aberto: {`R$ ${caixa.currentCashInMoney.toFixed(2)}`}
                </span>
              </>
            ) : (
              <>
                <Lock size={19} className="text-rose-400" />
                <span className="font-semibold text-rose-400">
                  Caixa Fechado
                </span>
              </>
            )}
          </div>

          {/* Comanda Status Widget */}
          {activeComandasCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-gold-300">
              <ShoppingBag size={19} />
              <span className="font-semibold">
                {activeComandasCount} Comandas (R${' '}
                {activeComandasSum.toFixed(2)})
              </span>
            </div>
          )}

          {/* Clock tracker badge */}
          <div className="flex items-center gap-1.5 rounded-lg border border-counter-700 bg-counter-800 px-3 py-2 font-semibold text-cream-200 select-none">
            <Clock size={19} className="text-gold-400" />
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
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-counter-700 bg-counter-800 px-3 py-2 font-bold text-cream-300 transition duration-150 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
            title="Sair do Sistema"
          >
            <LogOut size={19} />
            Sair
          </button>
        </div>
      </header>

      {/* SYSTEM BODY CONTAINER — sem max-width: usa a largura real da tela */}
      <div
        className={`flex-1 w-full grid grid-cols-1 ${
          isImmersive ? '' : 'gap-5 p-4 md:p-6 lg:grid-cols-12 2xl:p-8'
        }`}
      >
        {/* NAV SYTEM BAR: Left Drawer style on desktop, top scrolling bar on mobile */}
        {!isImmersive && (
          <aside
            className="lg:col-span-2 lg:sticky lg:top-[68px] h-auto lg:max-h-[calc(100vh-88px)] flex flex-col justify-between"
            id="side-drawer"
          >
            <nav className="grid select-none grid-cols-3 gap-1.5 rounded-xl border border-counter-700 bg-counter-900 p-2 sm:grid-cols-4 lg:flex lg:grid-cols-none lg:flex-col">
              {[
                {
                  id: 'dashboard',
                  label: 'Painel Geral',
                  icon: LayoutDashboard,
                },
                { id: 'comandas', label: 'Comandas POS', icon: ShoppingBag },
                { id: 'caixa', label: 'Controle Caixa', icon: Coins },
                {
                  id: 'produtos',
                  label: 'Produtos & Estoque',
                  icon: Package,
                },
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
                    className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-3 text-center text-xs font-bold transition duration-150 lg:flex-row lg:justify-start lg:gap-3 lg:px-3.5 lg:text-left lg:text-sm ${
                      isActive
                        ? 'bg-gold-500 text-counter-950'
                        : 'text-cream-300 hover:bg-counter-800 hover:text-cream-100'
                    }`}
                  >
                    <TabIcon size={24} />
                    <span className="leading-tight">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick legal credentials attribution inside navigation margins - NO tech larp indicators */}
            <div className="mt-3 hidden rounded-xl border border-counter-700 bg-counter-900 p-3 text-xs leading-normal text-cream-400 lg:block">
              <span className="mb-1 block font-bold text-gold-400">
                Area Verde S.O.
              </span>
              Gestão simplificada e ágil para o balcão. Todos os direitos
              reservados.
            </div>
          </aside>
        )}

        {/* WORKSPACE CONTENT AREA */}
        <main
          className={isImmersive ? '' : 'lg:col-span-10'}
          id="main-workspace-box"
        >
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
                    onImmersiveChange={setIsImmersive}
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
