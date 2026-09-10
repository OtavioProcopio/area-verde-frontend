import React, { useState } from 'react';
import { Product, RecipeItem, Category } from '../types';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Save,
  TrendingUp,
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
  onDeleteProduct,
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

    let updatedRecipe = [...(activeComposite.recipe || [])];

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

    let updatedRecipe = [...(activeComposite.recipe || [])];
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
    <div id="produtos-module" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-emerald-600 font-semibold block mb-1">
            Catálogo de Vendas
          </span>
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight animate-fade-in">
            Estoque &{' '}
            <span className="text-emerald-600 font-bold">Produtos</span>
          </h2>
        </div>

        <div className="flex bg-slate-200/60 p-1 rounded-xl shadow-inner border border-slate-200">
          <button
            id="produtos-subtab-produtos"
            onClick={() => setActiveTab('produtos')}
            className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all ${activeTab === 'produtos' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 cursor-pointer'}`}
          >
            Produtos
          </button>
          <button
            id="produtos-subtab-estoque"
            onClick={() => setActiveTab('estoque')}
            className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all ${activeTab === 'estoque' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 cursor-pointer'}`}
          >
            Estoque
          </button>
          <button
            id="produtos-subtab-categorias"
            onClick={() => setActiveTab('categorias')}
            className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all ${activeTab === 'categorias' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 cursor-pointer'}`}
          >
            Categorias
          </button>
        </div>
      </div>

      {activeTab === 'produtos' && (
        <div className="space-y-4 animate-fade-in">
          {/* Action Bar & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Buscar pelo nome..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="relative">
                <select
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 cursor-pointer appearance-none text-slate-600"
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
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>

              <div className="relative">
                <select
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 cursor-pointer appearance-none text-slate-600"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <option value="Tudo">Todos os Tipos</option>
                  <option value="Simples">Apenas Simples</option>
                  <option value="Composto">Apenas Compostos</option>
                </select>
                <Filter
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>

              <div className="relative">
                <select
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 cursor-pointer appearance-none text-slate-600"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="Tudo">Qualquer Status</option>
                  <option value="Ativos">Apenas Ativos</option>
                  <option value="Inativos">Apenas Inativos</option>
                </select>
                <Filter
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            <button
              onClick={handleStartCreate}
              className="w-full xl:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer shadow-md transition shrink-0 whitespace-nowrap"
            >
              <PlusCircle size={14} />
              Novo Produto
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-100/50">
              <h4 className="text-sm font-display font-bold text-slate-700 flex items-center gap-2">
                <Package size={16} className="text-emerald-600" />
                Destaque ({filteredProducts.length})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse leading-normal text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase font-mono tracking-wider text-slate-500 bg-slate-100">
                    <th className="px-5 py-3.5">Nome & Categoria</th>
                    <th className="px-3 py-3.5 text-center">Und</th>
                    <th className="px-3 py-3.5 text-center">Tipo</th>
                    <th className="px-4 py-3.5 text-center">Estoque</th>
                    <th className="px-4 py-3.5 text-right">Preço</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right text-slate-600">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredProducts.map((p) => {
                    const isUnderMin = !p.isComposite && p.stock <= p.minStock;
                    const isOutOfStock = !p.isComposite && p.stock === 0;
                    const pActive = p.active ?? true;

                    return (
                      <tr
                        key={p.id}
                        className={`transition duration-150 ${!pActive ? 'bg-slate-100/50 opacity-60 grayscale-[30%]' : 'hover:bg-slate-100/80'}`}
                      >
                        <td className="px-5 py-3.5 align-middle max-w-[220px]">
                          <div>
                            <span
                              className="font-bold text-slate-700 block text-sm truncate"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1 font-mono uppercase">
                              {p.category}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-center font-mono align-middle">
                          <span className="text-xs font-bold text-slate-500">
                            {p.unit.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center align-middle">
                          {p.isComposite ? (
                            <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[11px] font-bold font-mono text-blue-700">
                              COMP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-200 border border-slate-200 rounded text-[11px] font-bold font-mono text-slate-500">
                              SIMPLES
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center align-middle">
                          {p.isComposite ? (
                            <span className="text-[11px] text-slate-500 font-mono">
                              --
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-center justify-center">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                  isOutOfStock
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : isUnderMin
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {p.stock}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-bold font-mono text-slate-700 align-middle">
                          {fmt(p.price)}
                        </td>

                        <td className="px-4 py-3 text-center align-middle">
                          <button
                            onClick={() => handleToggleProductStatus(p)}
                            className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase font-bold px-2 py-1 rounded transition border cursor-pointer ${
                              pActive
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
                                : 'bg-slate-200 border-slate-200 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {pActive ? (
                              <CheckCircle2 size={10} />
                            ) : (
                              <XCircle size={10} />
                            )}
                            {pActive ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>

                        <td className="px-5 py-3 text-right align-middle">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            {p.isComposite && (
                              <button
                                onClick={() => handleManageComposition(p)}
                                className="w-7 h-7 flex items-center justify-center bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-400 text-blue-600 rounded transition cursor-pointer"
                                title="Gerenciar Composição"
                              >
                                <Layers size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-500 hover:text-emerald-700 rounded transition cursor-pointer"
                              title="Editar Produto"
                            >
                              <Edit3 size={13} />
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
                        className="text-center py-12 text-slate-500 italic text-xs bg-slate-100/30"
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
        <div className="animate-fade-in -mt-2">
          <Estoque
            products={products}
            categories={categories}
            onUpdateProduct={onUpdateProduct}
            onRefreshState={onRefreshState}
          />
        </div>
      )}

      {activeTab === 'categorias' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex-1">
              <h3 className="font-display font-bold text-slate-700">
                Categorias
              </h3>
              <p className="text-xs text-slate-500">
                Classificação para filtros e PDV
              </p>
            </div>
            <button
              onClick={handleStartCreateCat}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
            >
              <PlusCircle size={14} /> Nova
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition ${c.active ? 'border-slate-200' : 'border-slate-200 bg-slate-100/50 opacity-60'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Tags
                      size={16}
                      className={
                        c.active ? 'text-emerald-600' : 'text-slate-500'
                      }
                    />
                    <h4 className="font-bold font-display">{c.name}</h4>
                  </div>
                  <button
                    onClick={() => handleToggleCatStatus(c)}
                    className={`cursor-pointer ${c.active ? 'text-emerald-600 hover:text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {c.active ? (
                      <ToggleRight size={20} />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEditCat(c)}
                    className="flex-1 py-1.5 text-[11px] font-bold font-mono uppercase bg-slate-200 hover:bg-slate-200 text-slate-500 rounded transition cursor-pointer border border-slate-200"
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
        <div className="space-y-4 animate-fade-in pb-10">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex-wrap gap-2">
            <div>
              <button
                onClick={() => setActiveTab('produtos')}
                className="text-[11px] uppercase font-mono font-bold text-slate-500 hover:text-slate-900 transition block mb-1 cursor-pointer"
              >
                &larr; Voltar
              </button>
              <h3 className="font-display font-bold text-slate-700 text-xl flex items-center gap-2">
                {activeComposite.name}
                <span className="text-[11px] uppercase font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                  Produto Composto
                </span>
              </h3>
            </div>
            <button
              onClick={startAddComp}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
            >
              <PlusCircle size={14} /> Adicionar Componente
            </button>
          </div>

          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 shadow-sm flex items-start gap-4 mx-1">
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-blue-100 items-center justify-center shrink-0 border border-blue-200">
              <Layers className="text-blue-600" size={18} />
            </div>
            <div>
              <h4 className="font-bold mb-1 font-display">
                Como funciona a composição da receita?
              </h4>
              <p className="text-blue-700/80 leading-relaxed font-mono mt-2">
                Ao vender{' '}
                <strong className="text-blue-900 border-b border-blue-300 pb-0.5">
                  1 {activeComposite.unit}
                </strong>{' '}
                de{' '}
                <strong className="text-blue-900 border-b border-blue-300 pb-0.5">
                  {activeComposite.name}
                </strong>
                , o sistema descontará automaticamente do estoque físico as
                quantidades exatas dos insumos configurados abaixo.
              </p>
            </div>
          </div>

          {!activeComposite.recipe || activeComposite.recipe.length === 0 ? (
            <div className="text-center bg-white border border-slate-200 rounded-xl p-12 shadow-sm text-slate-500 mt-2 mx-1">
              <Layers size={48} className="mx-auto text-slate-700 mb-4" />
              <h5 className="font-bold text-slate-600 mb-2">
                Composição Vazia
              </h5>
              <p className="text-xs max-w-sm mx-auto">
                Este produto composto não tem componentes. Se ele for vendido
                agora, nenhum estoque extra será baixado. Adicione componentes
                para ligar o controle de estoque.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-2 mx-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse leading-normal text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] uppercase font-mono tracking-wider text-slate-500 bg-slate-100">
                      <th className="px-5 py-3">Produto Componente</th>
                      <th className="px-4 py-3 text-center">Unidade</th>
                      <th className="px-4 py-3 text-right">Quantidade Baixa</th>
                      <th className="px-4 py-3 text-center">Status Físico</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {activeComposite.recipe.map((r, idx) => {
                      const ingr = products.find(
                        (p) => p.id === r.ingredientId,
                      );
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-100/50 transition duration-150"
                        >
                          <td className="px-5 py-3">
                            <span className="font-bold text-slate-700">
                              {ingr ? ingr.name : 'Desconhecido'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-500 bg-slate-100/30">
                            {ingr ? ingr.unit.toUpperCase() : '--'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-black text-blue-700 text-sm bg-blue-50/10">
                            {r.quantity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {ingr ? (
                              (ingr.active ?? true) ? (
                                <span className="px-2 py-0.5 rounded text-[11px] uppercase font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                  ATIVO
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] uppercase font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
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
                                className="w-7 h-7 flex flex-col justify-center items-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded border border-slate-200 transition cursor-pointer"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => handleRemoveComp(idx)}
                                className="w-7 h-7 flex flex-col justify-center items-center bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 rounded transition cursor-pointer"
                              >
                                <Trash2 size={12} />
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
        <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowCompModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-display font-bold text-slate-700 mb-4">
              {compEditIndex !== null
                ? 'Editar Componente'
                : 'Adicionar Componente'}
            </h3>

            <form onSubmit={handleSaveComp} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                  Insumo Físico <span className="text-rose-600">*</span>
                </label>
                <select
                  value={compIngrId}
                  onChange={(e) => setCompIngrId(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-slate-700 rounded-lg outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-bold"
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
                <span className="text-[11px] text-slate-500 block mt-1">
                  Apenas produtos simples e ativos.
                </span>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                  Quantidade a Baixar <span className="text-rose-600">*</span>
                </label>
                <div className="flex relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={compQty}
                    onChange={(e) => setCompQty(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 px-3 py-2 pr-12 text-sm text-slate-700 font-mono rounded-lg outline-none focus:border-blue-500 focus:bg-white font-bold"
                    placeholder="Ex: 50"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase font-mono font-bold text-slate-500">
                    {compIngrId
                      ? products.find((p) => p.id === compIngrId)?.unit || 'UN'
                      : 'UN'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Salvar Componente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: Create or Edit Category */}
      {showCatForm && (
        <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCatForm(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-display font-bold text-slate-700 mb-4">
              {catFormMode === 'create'
                ? 'Nova Categoria'
                : 'Renomear Categoria'}
            </h3>

            {catFormError && (
              <div className="mb-4">
                <InlineFeedback tone="error" message={catFormError} />
              </div>
            )}

            <form onSubmit={handleSaveCat} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                  Nome:
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:bg-white"
                  data-testid="categoria-nome-input"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: Create or Edit Product */}
      {showProductForm && (
        <div className="fixed inset-0 bg-white/45 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h3 className="text-xl font-display font-bold text-slate-900 flex items-center gap-1.5">
                  <Package size={20} className="text-emerald-600" />
                  {formMode === 'create'
                    ? 'Cadastrar Novo Item'
                    : 'Editar Ficha do Produto'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Controle preciso de custo, venda e estoque seguro do balcão.
                </p>
              </div>
              <button
                onClick={() => setShowProductForm(false)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer p-2 bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {productFormError && (
              <div className="mb-4 shrink-0">
                <InlineFeedback tone="error" message={productFormError} />
              </div>
            )}

            <form
              onSubmit={handleSaveProduct}
              className="flex-1 overflow-y-auto pr-2 space-y-6 form-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Basic fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                      Nome do Produto <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-100 border border-slate-200 px-3 py-2 text-xs text-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:bg-white font-bold"
                      placeholder="Ex: Bohemia Long Neck 355ml"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="produto-nome-input"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                        Categoria <span className="text-rose-600">*</span>
                      </label>
                      <select
                        className="w-full bg-slate-100 border border-slate-200 px-2 py-2 text-xs text-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
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
                      <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                        Status
                      </label>
                      <select
                        className="w-full bg-slate-100 border border-slate-200 px-2 py-2 text-xs text-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:bg-white cursor-pointer font-bold"
                        value={active ? 'true' : 'false'}
                        onChange={(e) => setActive(e.target.value === 'true')}
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                        Preço Custo (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-mono text-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:bg-white"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        data-testid="produto-preco-custo-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-mono text-emerald-700 mb-1 font-bold">
                        Venda (R$) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm font-mono text-emerald-800 rounded-lg outline-none focus:border-emerald-500 focus:bg-white font-bold"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        data-testid="produto-preco-venda-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Toggle IsComposite product */}
                  <div
                    className={`flex items-start gap-2.5 p-3 border rounded-xl transition ${isComposite ? 'bg-blue-50 border-blue-200' : 'bg-slate-100 border-slate-200'}`}
                  >
                    <input
                      id="checkbox-is-composite"
                      type="checkbox"
                      checked={isComposite}
                      onChange={(e) => setIsComposite(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="checkbox-is-composite"
                      className="text-xs text-slate-600 cursor-pointer"
                    >
                      <span className="font-bold block text-slate-900 mb-0.5">
                        Produto Composto? (Receita)
                      </span>
                      Ex: Caipirinha. A venda desconta estoque proporcionalmente
                      de insumos.
                    </label>
                  </div>

                  {/* Stock configs (If not composite product) */}
                  {!isComposite && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-white shadow-xs rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                          Unidade
                        </label>
                        <select
                          className="w-full bg-slate-100 border border-slate-200 px-2 py-1.5 text-xs text-slate-700 rounded-lg outline-none focus:border-emerald-500 cursor-pointer"
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
                        <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                          Estoque
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-slate-100 border border-slate-200 px-2 py-1.5 text-xs font-mono text-slate-700 rounded-lg outline-none focus:border-emerald-500"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          data-testid="produto-estoque-input"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase font-mono text-slate-500 mb-1">
                          Alerta Mín
                        </label>
                        <input
                          type="number"
                          step="1"
                          className="w-full bg-slate-100 border border-slate-200 px-2 py-1.5 text-xs font-mono text-slate-700 rounded-lg outline-none focus:border-emerald-500"
                          value={minStock}
                          onChange={(e) => setMinStock(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {isComposite && (
                    <div className="grid grid-cols-1 gap-3 p-3 bg-slate-100 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 leading-relaxed">
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
                    <div className="rounded-2xl border border-blue-200 bg-blue-950/20 h-full flex flex-col p-4 gap-3 overflow-hidden">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Layers size={16} className="text-blue-700 shrink-0" />
                        <h5 className="text-xs font-bold uppercase tracking-wide">
                          Composição da receita
                        </h5>
                      </div>

                      <div className="flex gap-2">
                        <select
                          className="flex-1 min-w-0 bg-slate-100 border border-slate-200 px-2 py-2 text-xs text-slate-700 rounded-lg outline-none focus:border-emerald-500 cursor-pointer"
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
                          className="w-16 bg-slate-100 border border-slate-200 px-2 py-2 text-xs font-mono text-slate-700 rounded-lg outline-none focus:border-emerald-500"
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
                          className="px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-100 disabled:text-blue-400/60 text-white rounded-lg transition cursor-pointer shrink-0"
                          data-testid="produto-composicao-add-btn"
                        >
                          <PlusCircle size={16} />
                        </button>
                      </div>

                      {recipe.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs py-6 px-4">
                          <Layers size={28} className="text-slate-700 mb-2" />
                          Nenhum componente adicionado ainda. Adicione pelo
                          menos um para poder salvar este produto composto.
                        </div>
                      ) : (
                        <ul
                          className="flex-1 overflow-y-auto space-y-1.5 pr-1"
                          data-testid="produto-composicao-lista"
                        >
                          {recipe.map((item) => {
                            const ingr = products.find(
                              (p) => p.id === item.ingredientId,
                            );
                            return (
                              <li
                                key={item.ingredientId}
                                className="flex items-center justify-between gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                              >
                                <span className="text-slate-700 font-semibold truncate">
                                  {ingr ? ingr.name : 'Desconhecido'}
                                </span>
                                <span className="font-mono text-blue-700 font-bold shrink-0">
                                  {item.quantity} {ingr?.unit.toUpperCase()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveRecipeIngredient(
                                      item.ingredientId,
                                    )
                                  }
                                  className="text-slate-500 hover:text-rose-600 transition cursor-pointer shrink-0"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 h-full flex flex-col justify-center items-center text-center p-6 text-slate-500 bg-slate-100/50">
                      <Layers size={36} className="text-slate-600 mb-3" />
                      <h5 className="text-sm font-bold text-slate-500">
                        Configuração de Físico
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-2 max-w-[200px] leading-relaxed">
                        Este produto deduzirá o estoque direto dele mesmo na
                        hora venda.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action operations buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition duration-150 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition duration-150 shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={14} />
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
