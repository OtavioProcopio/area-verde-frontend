import React, { useState } from 'react';
import { Product, RecipeItem, Category } from '../types';
import {
  Package,
  Edit3,
  Trash2,
  Save,
  Layers,
  PlusCircle,
  X,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Tags,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { InlineFeedback } from '../features/shared/components/InlineFeedback';
import Estoque from './Estoque';

type OperationResult = { success: boolean; msg: string };

interface ProdutosProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (p: Omit<Product, 'id'>) => Promise<OperationResult>;
  onUpdateProduct: (p: Product) => Promise<OperationResult>;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (name: string) => Promise<OperationResult>;
  onUpdateCategory: (c: Category) => Promise<OperationResult>;
  onRefreshState: () => Promise<void>;
}

export default function Produtos({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct: _onDeleteProduct,
  onAddCategory,
  onUpdateCategory,
  onRefreshState,
}: ProdutosProps) {
  const [activeTab, setActiveTab] = useState<
    'produtos' | 'estoque' | 'categorias' | 'composicao'
  >('produtos');
  const [compositionProductId, setCompositionProductId] = useState<
    string | null
  >(null);

  // Composicao modal state
  const [showCompModal, setShowCompModal] = useState(false);
  const [compEditIndex, setCompEditIndex] = useState<number | null>(null);
  const [compIngrId, setCompIngrId] = useState('');
  const [compQty, setCompQty] = useState('');

  // Product viewer state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tudo');
  const [filterStatus, setFilterStatus] = useState<
    'Tudo' | 'Ativos' | 'Inativos'
  >('Tudo');
  const [filterType, setFilterType] = useState<'Tudo' | 'Simples' | 'Composto'>(
    'Tudo',
  );

  // Product forms
  const [showProductForm, setShowProductForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [price, setPrice] = useState('0.00');
  const [costPrice, setCostPrice] = useState('0.00');
  const [stock, setStock] = useState('10');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState<'un' | 'ml'>('un');
  const [isComposite, setIsComposite] = useState(false);
  const [active, setActive] = useState(true);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);

  // Recipe Builder Help States
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState('');

  // Category State
  const [showCatForm, setShowCatForm] = useState(false);
  const [catFormMode, setCatFormMode] = useState<'create' | 'edit'>('create');
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');

  // Feedback de erro dos formulários
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [catFormError, setCatFormError] = useState<string | null>(null);

  // ----- HANDLERS: PRODUCTS -----
  const handleStartEdit = (p: Product) => {
    setProductFormError(null);
    setFormMode('edit');
    setEditingProductId(p.id);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price.toString());
    setCostPrice(p.costPrice.toString());
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
    setUnit(p.unit);
    setIsComposite(p.isComposite);
    setActive(p.active ?? true); // Default to true if not present
    setRecipe(p.recipe ? [...p.recipe] : []);

    setSelectedIngredientId('');
    setIngredientQty('');

    setShowProductForm(true);
  };

  const handleStartCreate = () => {
    setProductFormError(null);
    setFormMode('create');
    setEditingProductId(null);
    setName('');
    setCategory(categories[0]?.name || '');
    setPrice('0.00');
    setCostPrice('0.00');
    setStock('24');
    setMinStock('12');
    setUnit('un');
    setIsComposite(false);
    setActive(true);
    setRecipe([]);

    setSelectedIngredientId('');
    setIngredientQty('');

    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;

    if (isComposite && recipe.length === 0) {
      setProductFormError(
        'Produto composto precisa de pelo menos um componente na composição antes de salvar.',
      );
      return;
    }

    const parsedPrice = parseFloat(price) || 0;
    const parsedCostPrice = parseFloat(costPrice) || 0;
    const parsedStock = parseFloat(stock) || 0;
    const parsedMinStock = parseFloat(minStock) || 0;

    const productPayload = {
      name,
      category,
      price: parsedPrice,
      costPrice: parsedCostPrice,
      stock: parsedStock,
      minStock: parsedMinStock,
      unit,
      isComposite,
      active,
      recipe: isComposite ? recipe : undefined,
    };

    setProductFormError(null);
    const res =
      formMode === 'create'
        ? await onAddProduct(productPayload)
        : editingProductId
          ? await onUpdateProduct({ ...productPayload, id: editingProductId })
          : null;

    if (res && !res.success) {
      setProductFormError(res.msg);
      return;
    }
    setShowProductForm(false);
  };

  const handleAddRecipeIngredient = () => {
    if (selectedIngredientId === '' || isNaN(parseFloat(ingredientQty))) return;
    const parsedQty = parseFloat(ingredientQty);
    if (parsedQty <= 0) return;

    if (editingProductId && selectedIngredientId === editingProductId) {
      alert('Um item composto não pode conter ele mesmo como ingrediente!');
      return;
    }

    if (recipe.some((item) => item.ingredientId === selectedIngredientId)) {
      setRecipe(
        recipe.map((item) =>
          item.ingredientId === selectedIngredientId
            ? { ...item, quantity: item.quantity + parsedQty }
            : item,
        ),
      );
    } else {
      setRecipe([
        ...recipe,
        { ingredientId: selectedIngredientId, quantity: parsedQty },
      ]);
    }

    setSelectedIngredientId('');
    setIngredientQty('');
  };

  const handleRemoveRecipeIngredient = (ingredientId: string) => {
    setRecipe(recipe.filter((item) => item.ingredientId !== ingredientId));
  };

  const handleToggleProductStatus = (p: Product) => {
    onUpdateProduct({
      ...p,
      active: !(p.active ?? true),
    });
  };

  const handleManageComposition = (p: Product) => {
    setCompositionProductId(p.id);
    setActiveTab('composicao');
  };

  const activeComposite = products.find((p) => p.id === compositionProductId);

  const startAddComp = () => {
    setCompEditIndex(null);
    setCompIngrId('');
    setCompQty('');
    setShowCompModal(true);
  };

  const startEditComp = (idx: number, item: RecipeItem) => {
    setCompEditIndex(idx);
    setCompIngrId(item.ingredientId);
    setCompQty(item.quantity.toString());
    setShowCompModal(true);
  };

  const handleSaveComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComposite) return;
    if (!compIngrId || isNaN(parseFloat(compQty))) return;

    const parsedQty = parseFloat(compQty);
    if (parsedQty <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    if (compIngrId === activeComposite.id) {
      alert('Produto componente não pode ser o próprio produto pai!');
      return;
    }

    const updatedRecipe = [...(activeComposite.recipe || [])];

    if (compEditIndex !== null) {
      if (
        updatedRecipe.some(
          (r, i) => i !== compEditIndex && r.ingredientId === compIngrId,
        )
      ) {
        alert('Este componente já está na receita!');
        return;
      }
      updatedRecipe[compEditIndex] = {
        ingredientId: compIngrId,
        quantity: parsedQty,
      };
    } else {
      if (updatedRecipe.some((r) => r.ingredientId === compIngrId)) {
        alert('Este componente já está na receita!');
        return;
      }
      updatedRecipe.push({ ingredientId: compIngrId, quantity: parsedQty });
    }

    onUpdateProduct({
      ...activeComposite,
      recipe: updatedRecipe,
    });

    setShowCompModal(false);
  };

  const handleRemoveComp = (idx: number) => {
    if (!activeComposite) return;
    if (!window.confirm('Remover este componente da composição?')) return;

    const updatedRecipe = [...(activeComposite.recipe || [])];
    updatedRecipe.splice(idx, 1);

    onUpdateProduct({
      ...activeComposite,
      recipe: updatedRecipe,
    });
  };

  // ----- HANDLERS: CATEGORIES -----
  const handleStartCreateCat = () => {
    setCatFormError(null);
    setCatFormMode('create');
    setCatEditingId(null);
    setCatName('');
    setShowCatForm(true);
  };

  const handleStartEditCat = (c: Category) => {
    setCatFormError(null);
    setCatFormMode('edit');
    setCatEditingId(c.id);
    setCatName(c.name);
    setShowCatForm(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setCatFormError(null);
    let res: OperationResult | null = null;

    if (catFormMode === 'create') {
      res = await onAddCategory(catName);
    } else if (catFormMode === 'edit' && catEditingId) {
      const c = categories.find((x) => x.id === catEditingId);
      if (c) {
        res = await onUpdateCategory({ ...c, name: catName });
      }
    }

    if (res && !res.success) {
      setCatFormError(res.msg);
      return;
    }
    setShowCatForm(false);
  };

  const handleToggleCatStatus = (c: Category) => {
    onUpdateCategory({
      ...c,
      active: !c.active,
    });
  };

  // Filters calculation
  const filteredProducts = products.filter((p) => {
    const pActive = p.active ?? true;

    // Status
    if (filterStatus === 'Ativos' && !pActive) return false;
    if (filterStatus === 'Inativos' && pActive) return false;

    // Category
    if (selectedCategory !== 'Tudo' && p.category !== selectedCategory)
      return false;

    // Type
    if (filterType === 'Simples' && p.isComposite) return false;
    if (filterType === 'Composto' && !p.isComposite) return false;

    // Text search
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;

    return true;
  });

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div id="produtos-module" className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="mb-1 block text-xs font-semibold text-gold-400">
            Catálogo de Vendas
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-cream-100">
            Estoque & <span className="text-gold-400">Produtos</span>
          </h2>
        </div>

        <div className="flex rounded-xl border border-counter-700 bg-counter-900 p-1">
          <button
            id="produtos-subtab-produtos"
            onClick={() => setActiveTab('produtos')}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'produtos' ? 'bg-gold-500 text-counter-950' : 'text-cream-300 hover:text-cream-100'}`}
          >
            Produtos
          </button>
          <button
            id="produtos-subtab-estoque"
            onClick={() => setActiveTab('estoque')}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'estoque' ? 'bg-gold-500 text-counter-950' : 'text-cream-300 hover:text-cream-100'}`}
          >
            Estoque
          </button>
          <button
            id="produtos-subtab-categorias"
            onClick={() => setActiveTab('categorias')}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'categorias' ? 'bg-gold-500 text-counter-950' : 'text-cream-300 hover:text-cream-100'}`}
          >
            Categorias
          </button>
        </div>
      </div>

      {activeTab === 'produtos' && (
        <div className="space-y-4">
          {/* Action Bar & Filters */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-counter-700 bg-counter-900 p-4 xl:flex-row xl:items-center">
            <div className="grid w-full flex-1 grid-cols-1 gap-3 md:grid-cols-4">
              <div className="relative">
                <Search
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400"
                />
                <input
                  type="text"
                  placeholder="Buscar pelo nome..."
                  className="w-full rounded-xl border border-counter-700 bg-counter-950 py-2.5 pl-9 pr-3 text-sm text-cream-100 outline-none focus:border-gold-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="relative">
                <select
                  className="w-full cursor-pointer appearance-none rounded-xl border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm text-cream-200 outline-none focus:border-gold-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="Tudo">Todas as Categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Filter
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cream-400"
                />
              </div>

              <div className="relative">
                <select
                  className="w-full cursor-pointer appearance-none rounded-xl border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm text-cream-200 outline-none focus:border-gold-500"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <option value="Tudo">Todos os Tipos</option>
                  <option value="Simples">Apenas Simples</option>
                  <option value="Composto">Apenas Compostos</option>
                </select>
                <Filter
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cream-400"
                />
              </div>

              <div className="relative">
                <select
                  className="w-full cursor-pointer appearance-none rounded-xl border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm text-cream-200 outline-none focus:border-gold-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="Tudo">Qualquer Status</option>
                  <option value="Ativos">Apenas Ativos</option>
                  <option value="Inativos">Apenas Inativos</option>
                </select>
                <Filter
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cream-400"
                />
              </div>
            </div>

            <button
              onClick={handleStartCreate}
              className="flex w-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-counter-950 shadow-md transition hover:bg-gold-400 xl:w-auto"
            >
              <PlusCircle size={19} />
              Novo Produto
            </button>
          </div>

          {/* Products Table */}
          <div className="overflow-hidden rounded-2xl border border-counter-700 bg-counter-900">
            <div className="flex items-center justify-between border-b border-counter-700 bg-counter-950 p-4">
              <h4 className="flex items-center gap-2 font-display text-base font-bold text-cream-100">
                <Package size={22} className="text-gold-400" />
                Destaque ({filteredProducts.length})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left leading-normal">
                <thead>
                  <tr className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
                    <th className="px-5 py-3.5">Nome & Categoria</th>
                    <th className="px-3 py-3.5 text-center">Und</th>
                    <th className="px-3 py-3.5 text-center">Tipo</th>
                    <th className="px-4 py-3.5 text-center">Estoque</th>
                    <th className="px-4 py-3.5 text-right">Preço</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-counter-800">
                  {filteredProducts.map((p) => {
                    const isUnderMin = !p.isComposite && p.stock <= p.minStock;
                    const isOutOfStock = !p.isComposite && p.stock === 0;
                    const pActive = p.active ?? true;

                    return (
                      <tr
                        key={p.id}
                        className={`transition duration-150 ${!pActive ? 'bg-counter-950/60 opacity-60' : 'hover:bg-counter-800'}`}
                      >
                        <td className="max-w-[220px] px-5 py-3.5 align-middle">
                          <div>
                            <span
                              className="block truncate text-sm font-bold text-cream-100"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs uppercase tracking-wide text-cream-400">
                              {p.category}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-center align-middle">
                          <span className="font-mono text-xs font-bold text-cream-300">
                            {p.unit.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center align-middle">
                          {p.isComposite ? (
                            <span className="rounded border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-xs font-bold text-sky-400">
                              COMP
                            </span>
                          ) : (
                            <span className="rounded border border-counter-700 bg-counter-800 px-2 py-0.5 text-xs font-bold text-cream-300">
                              SIMPLES
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center align-middle">
                          {p.isComposite ? (
                            <span className="font-mono text-xs text-cream-400">
                              --
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-center justify-center">
                              <span
                                className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                                  isOutOfStock
                                    ? 'border border-rose-400/30 bg-rose-400/10 text-rose-400'
                                    : isUnderMin
                                      ? 'border border-gold-500/30 bg-gold-500/10 text-gold-300'
                                      : 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                                }`}
                              >
                                {p.stock}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right align-middle font-mono font-bold text-cream-100">
                          {fmt(p.price)}
                        </td>

                        <td className="px-4 py-3 text-center align-middle">
                          <button
                            onClick={() => handleToggleProductStatus(p)}
                            className={`inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-bold uppercase transition ${
                              pActive
                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                                : 'border-counter-700 bg-counter-800 text-cream-400 hover:bg-counter-700'
                            }`}
                          >
                            {pActive ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <XCircle size={14} />
                            )}
                            {pActive ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>

                        <td className="px-5 py-3 text-right align-middle">
                          <div className="flex flex-nowrap items-center justify-end gap-1.5">
                            {p.isComposite && (
                              <button
                                onClick={() => handleManageComposition(p)}
                                className="flex h-8 w-8 items-center justify-center rounded border border-sky-400/30 bg-sky-400/10 text-sky-400 transition hover:bg-sky-400/20"
                                title="Gerenciar Composição"
                              >
                                <Layers size={17} />
                              </button>
                            )}
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="flex h-8 w-8 items-center justify-center rounded border border-counter-700 bg-counter-800 text-cream-300 transition hover:border-gold-500/50 hover:text-gold-300"
                              title="Editar Produto"
                            >
                              <Edit3 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="bg-counter-950/40 py-12 text-center text-sm italic text-cream-400"
                      >
                        Nenhum produto atende aos filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'estoque' && (
        <div className="-mt-2">
          <Estoque
            products={products}
            categories={categories}
            onUpdateProduct={onUpdateProduct}
            onRefreshState={onRefreshState}
          />
        </div>
      )}

      {activeTab === 'categorias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-counter-700 bg-counter-900 p-4">
            <div className="flex-1">
              <h3 className="font-display font-bold text-cream-100">
                Categorias
              </h3>
              <p className="text-sm text-cream-400">
                Classificação para filtros e PDV
              </p>
            </div>
            <button
              onClick={handleStartCreateCat}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-bold text-counter-950 shadow-md transition hover:bg-gold-400"
            >
              <PlusCircle size={19} /> Nova
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition ${c.active ? 'border-counter-700 bg-counter-900' : 'border-counter-700 bg-counter-950/60 opacity-60'}`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2 text-cream-100">
                    <Tags
                      size={22}
                      className={c.active ? 'text-gold-400' : 'text-cream-400'}
                    />
                    <h4 className="font-display font-bold">{c.name}</h4>
                  </div>
                  <button
                    onClick={() => handleToggleCatStatus(c)}
                    className={
                      c.active
                        ? 'text-gold-400 hover:text-gold-300'
                        : 'text-cream-400 hover:text-cream-200'
                    }
                  >
                    {c.active ? (
                      <ToggleRight size={26} />
                    ) : (
                      <ToggleLeft size={26} />
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEditCat(c)}
                    className="flex-1 rounded border border-counter-700 bg-counter-800 py-2 text-xs font-bold uppercase text-cream-300 transition hover:bg-counter-700"
                  >
                    Editar Nome
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'composicao' && activeComposite && (
        <div className="space-y-4 pb-10">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-400/30 bg-counter-900 p-4">
            <div>
              <button
                onClick={() => setActiveTab('produtos')}
                className="mb-1 block text-xs font-bold uppercase text-cream-400 transition hover:text-cream-100"
              >
                &larr; Voltar
              </button>
              <h3 className="flex items-center gap-2 font-display text-xl font-bold text-cream-100">
                {activeComposite.name}
                <span className="rounded border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-xs font-bold uppercase text-sky-400">
                  Produto Composto
                </span>
              </h3>
            </div>
            <button
              onClick={startAddComp}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-sky-400"
            >
              <PlusCircle size={19} /> Adicionar Componente
            </button>
          </div>

          <div className="mx-1 flex items-start gap-4 rounded-xl border border-sky-400/30 bg-sky-400/10 p-4 text-sm text-sky-300">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/15 sm:flex">
              <Layers className="text-sky-400" size={22} />
            </div>
            <div>
              <h4 className="mb-1 font-display font-bold text-sky-200">
                Como funciona a composição da receita?
              </h4>
              <p className="mt-2 leading-relaxed text-sky-300/90">
                Ao vender{' '}
                <strong className="border-b border-sky-400/40 pb-0.5 text-sky-100">
                  1 {activeComposite.unit}
                </strong>{' '}
                de{' '}
                <strong className="border-b border-sky-400/40 pb-0.5 text-sky-100">
                  {activeComposite.name}
                </strong>
                , o sistema descontará automaticamente do estoque físico as
                quantidades exatas dos insumos configurados abaixo.
              </p>
            </div>
          </div>

          {!activeComposite.recipe || activeComposite.recipe.length === 0 ? (
            <div className="mx-1 mt-2 rounded-xl border border-counter-700 bg-counter-900 p-12 text-center text-cream-400">
              <Layers size={58} className="mx-auto mb-4 text-cream-400" />
              <h5 className="mb-2 font-bold text-cream-200">
                Composição Vazia
              </h5>
              <p className="mx-auto max-w-sm text-sm">
                Este produto composto não tem componentes. Se ele for vendido
                agora, nenhum estoque extra será baixado. Adicione componentes
                para ligar o controle de estoque.
              </p>
            </div>
          ) : (
            <div className="mx-1 mt-2 overflow-hidden rounded-xl border border-counter-700 bg-counter-900">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left leading-normal">
                  <thead>
                    <tr className="border-b border-counter-700 bg-counter-950 text-xs font-bold uppercase tracking-wide text-cream-400">
                      <th className="px-5 py-3">Produto Componente</th>
                      <th className="px-4 py-3 text-center">Unidade</th>
                      <th className="px-4 py-3 text-right">Quantidade Baixa</th>
                      <th className="px-4 py-3 text-center">Status Físico</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-counter-800">
                    {activeComposite.recipe.map((r, idx) => {
                      const ingr = products.find(
                        (p) => p.id === r.ingredientId,
                      );
                      return (
                        <tr
                          key={idx}
                          className="transition duration-150 hover:bg-counter-800"
                        >
                          <td className="px-5 py-3">
                            <span className="font-bold text-cream-100">
                              {ingr ? ingr.name : 'Desconhecido'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-cream-400">
                            {ingr ? ingr.unit.toUpperCase() : '--'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-black text-sky-400">
                            {r.quantity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {ingr ? (
                              (ingr.active ?? true) ? (
                                <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-bold uppercase text-emerald-400">
                                  ATIVO
                                </span>
                              ) : (
                                <span className="rounded border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs font-bold uppercase text-rose-400">
                                  INATIVO
                                </span>
                              )
                            ) : (
                              '--'
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => startEditComp(idx, r)}
                                className="flex h-8 w-8 flex-col items-center justify-center rounded border border-counter-700 bg-counter-800 text-cream-300 transition hover:bg-counter-700"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleRemoveComp(idx)}
                                className="flex h-8 w-8 flex-col items-center justify-center rounded border border-counter-700 bg-counter-800 text-cream-300 transition hover:border-rose-400/40 hover:text-rose-400"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowCompModal(false)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>
            <h3 className="mb-4 font-display text-lg font-bold text-cream-100">
              {compEditIndex !== null
                ? 'Editar Componente'
                : 'Adicionar Componente'}
            </h3>

            <form onSubmit={handleSaveComp} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Insumo Físico <span className="text-rose-400">*</span>
                </label>
                <select
                  value={compIngrId}
                  onChange={(e) => setCompIngrId(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm font-bold text-cream-100 outline-none focus:border-sky-400"
                  required
                >
                  <option value="">Selecione um produto...</option>
                  {products
                    .filter((p) => !p.isComposite && (p.active ?? true))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <span className="mt-1 block text-xs text-cream-400">
                  Apenas produtos simples e ativos.
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Quantidade a Baixar <span className="text-rose-400">*</span>
                </label>
                <div className="relative flex">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={compQty}
                    onChange={(e) => setCompQty(e.target.value)}
                    className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 pr-12 font-mono text-sm font-bold text-cream-100 outline-none focus:border-sky-400"
                    placeholder="Ex: 50"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold uppercase text-cream-400">
                    {compIngrId
                      ? products.find((p) => p.id === compIngrId)?.unit || 'UN'
                      : 'UN'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white transition hover:bg-sky-400"
              >
                Salvar Componente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: Create or Edit Category */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <button
              onClick={() => setShowCatForm(false)}
              className="absolute right-4 top-4 text-cream-400 hover:text-cream-100"
            >
              <X size={22} />
            </button>
            <h3 className="mb-4 font-display text-lg font-bold text-cream-100">
              {catFormMode === 'create'
                ? 'Nova Categoria'
                : 'Renomear Categoria'}
            </h3>

            {catFormError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={catFormError} />
              </div>
            )}

            <form onSubmit={handleSaveCat} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-cream-400">
                  Nome:
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-gold-500"
                  data-testid="categoria-nome-input"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gold-500 py-2.5 text-sm font-bold text-counter-950 transition hover:bg-gold-400"
              >
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: Create or Edit Product */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative flex max-h-[95vh] w-full max-w-3xl flex-col rounded-2xl border-2 border-counter-700 bg-counter-900 p-5 shadow-2xl">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <div>
                <h3 className="flex items-center gap-1.5 font-display text-xl font-bold text-cream-100">
                  <Package size={24} className="text-gold-400" />
                  {formMode === 'create'
                    ? 'Cadastrar Novo Item'
                    : 'Editar Ficha do Produto'}
                </h3>
                <p className="text-xs text-cream-400">
                  Controle preciso de custo, venda e estoque seguro do balcão.
                </p>
              </div>
              <button
                onClick={() => setShowProductForm(false)}
                className="rounded-lg bg-counter-800 p-2 text-cream-300 hover:text-cream-100"
              >
                <X size={22} />
              </button>
            </div>

            {productFormError && (
              <div className="mb-4 shrink-0">
                <InlineFeedback tone="error" message={productFormError} />
              </div>
            )}

            <form
              onSubmit={handleSaveProduct}
              className="form-scrollbar flex-1 space-y-5 overflow-y-auto pr-2"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Basic fields */}
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-cream-400">
                      Nome do Produto <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2.5 text-sm font-bold text-cream-100 outline-none focus:border-gold-500"
                      placeholder="Ex: Bohemia Long Neck 355ml"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="produto-nome-input"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-cream-400">
                        Categoria <span className="text-rose-400">*</span>
                      </label>
                      <select
                        className="w-full cursor-pointer rounded-lg border border-counter-700 bg-counter-950 px-2 py-2.5 text-sm text-cream-100 outline-none focus:border-gold-500"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        data-testid="produto-categoria-select"
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-cream-400">
                        Status
                      </label>
                      <select
                        className="w-full cursor-pointer rounded-lg border border-counter-700 bg-counter-950 px-2 py-2.5 text-sm font-bold text-cream-100 outline-none focus:border-gold-500"
                        value={active ? 'true' : 'false'}
                        onChange={(e) => setActive(e.target.value === 'true')}
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-b border-counter-700 pb-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-cream-400">
                        Preço Custo (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full rounded-lg border border-counter-700 bg-counter-950 px-3 py-2.5 font-mono text-sm text-cream-100 outline-none focus:border-gold-500"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        data-testid="produto-preco-custo-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-gold-400">
                        Venda (R$) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2.5 font-mono text-base font-bold text-gold-300 outline-none focus:border-gold-500"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        data-testid="produto-preco-venda-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Toggle IsComposite product */}
                  <div
                    className={`flex items-start gap-2.5 rounded-xl border p-3 transition ${isComposite ? 'border-sky-400/30 bg-sky-400/10' : 'border-counter-700 bg-counter-800'}`}
                  >
                    <input
                      id="checkbox-is-composite"
                      type="checkbox"
                      checked={isComposite}
                      onChange={(e) => setIsComposite(e.target.checked)}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-counter-700 text-sky-500 focus:ring-sky-400"
                    />
                    <label
                      htmlFor="checkbox-is-composite"
                      className="cursor-pointer text-sm text-cream-300"
                    >
                      <span className="mb-0.5 block font-bold text-cream-100">
                        Produto Composto? (Receita)
                      </span>
                      Ex: Caipirinha. A venda desconta estoque proporcionalmente
                      de insumos.
                    </label>
                  </div>

                  {/* Stock configs (If not composite product) */}
                  {!isComposite && (
                    <div className="grid grid-cols-3 gap-3 rounded-xl border border-counter-700 bg-counter-800 p-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-cream-400">
                          Unidade
                        </label>
                        <select
                          className="w-full cursor-pointer rounded-lg border border-counter-700 bg-counter-950 px-2 py-1.5 text-sm text-cream-100 outline-none focus:border-gold-500"
                          value={unit}
                          onChange={(e) =>
                            setUnit(e.target.value as 'un' | 'ml')
                          }
                        >
                          <option value="un">UNIDADE</option>
                          <option value="ml">ML</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-cream-400">
                          Estoque
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full rounded-lg border border-counter-700 bg-counter-950 px-2 py-1.5 font-mono text-sm text-cream-100 outline-none focus:border-gold-500"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          data-testid="produto-estoque-input"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-cream-400">
                          Alerta Mín
                        </label>
                        <input
                          type="number"
                          step="1"
                          className="w-full rounded-lg border border-counter-700 bg-counter-950 px-2 py-1.5 font-mono text-sm text-cream-100 outline-none focus:border-gold-500"
                          value={minStock}
                          onChange={(e) => setMinStock(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {isComposite && (
                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-counter-700 bg-counter-800 p-3">
                      <div className="text-sm leading-relaxed text-cream-400">
                        Produto composto na API não possui unidade de estoque
                        própria. A baixa acontece pelos componentes cadastrados
                        na composição.
                      </div>
                    </div>
                  )}
                </div>

                {/* Right block */}
                <div className="flex flex-col">
                  {isComposite ? (
                    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-sky-400/30 bg-counter-950 p-4">
                      <div className="flex items-center gap-2 text-cream-200">
                        <Layers size={19} className="shrink-0 text-sky-400" />
                        <h5 className="text-xs font-bold uppercase tracking-wide">
                          Composição da receita
                        </h5>
                      </div>

                      <div className="flex gap-2">
                        <select
                          className="min-w-0 flex-1 cursor-pointer rounded-lg border border-counter-700 bg-counter-900 px-2 py-2 text-sm text-cream-100 outline-none focus:border-sky-400"
                          value={selectedIngredientId}
                          onChange={(e) =>
                            setSelectedIngredientId(e.target.value)
                          }
                          data-testid="produto-composicao-select-ingrediente"
                        >
                          <option value="">Selecione um componente...</option>
                          {products
                            .filter(
                              (p) =>
                                !p.isComposite &&
                                p.id !== editingProductId &&
                                (p.active ?? true),
                            )
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.unit})
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="Qtd."
                          className="w-16 rounded-lg border border-counter-700 bg-counter-900 px-2 py-2 font-mono text-sm text-cream-100 outline-none focus:border-sky-400"
                          value={ingredientQty}
                          onChange={(e) => setIngredientQty(e.target.value)}
                          data-testid="produto-composicao-qtd-input"
                        />
                        <button
                          type="button"
                          onClick={handleAddRecipeIngredient}
                          disabled={
                            !selectedIngredientId ||
                            isNaN(parseFloat(ingredientQty))
                          }
                          className="shrink-0 rounded-lg bg-sky-500 px-3 text-white transition hover:bg-sky-400 disabled:bg-sky-500/20 disabled:text-sky-400/50"
                          data-testid="produto-composicao-add-btn"
                        >
                          <PlusCircle size={19} />
                        </button>
                      </div>

                      {recipe.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center text-sm text-cream-400">
                          <Layers size={34} className="mb-2 text-cream-400" />
                          Nenhum componente adicionado ainda. Adicione pelo
                          menos um para poder salvar este produto composto.
                        </div>
                      ) : (
                        <ul
                          className="flex-1 space-y-1.5 overflow-y-auto pr-1"
                          data-testid="produto-composicao-lista"
                        >
                          {recipe.map((item) => {
                            const ingr = products.find(
                              (p) => p.id === item.ingredientId,
                            );
                            return (
                              <li
                                key={item.ingredientId}
                                className="flex items-center justify-between gap-2 rounded-lg border border-counter-700 bg-counter-900 px-3 py-2 text-sm"
                              >
                                <span className="truncate font-semibold text-cream-100">
                                  {ingr ? ingr.name : 'Desconhecido'}
                                </span>
                                <span className="shrink-0 font-mono font-bold text-sky-400">
                                  {item.quantity} {ingr?.unit.toUpperCase()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveRecipeIngredient(
                                      item.ingredientId,
                                    )
                                  }
                                  className="shrink-0 text-cream-400 transition hover:text-rose-400"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-counter-700 bg-counter-950 p-6 text-center text-cream-400">
                      <Layers size={43} className="mb-3 text-cream-400" />
                      <h5 className="text-sm font-bold text-cream-300">
                        Configuração de Físico
                      </h5>
                      <p className="mt-2 max-w-[200px] text-xs leading-relaxed text-cream-400">
                        Este produto deduzirá o estoque direto dele mesmo na
                        hora venda.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action operations buttons */}
              <div className="flex shrink-0 justify-end gap-3 border-t border-counter-700 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="rounded-xl border border-counter-700 bg-counter-800 px-6 py-2.5 text-sm font-semibold text-cream-200 transition duration-150 hover:bg-counter-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-gold-500 px-8 py-2.5 text-sm font-bold text-counter-950 shadow-md shadow-gold-500/10 transition duration-150 hover:bg-gold-400"
                >
                  <Save size={17} />
                  Salvar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
