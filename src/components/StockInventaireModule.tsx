import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { safeLocalStorage as localStorage } from '../lib/supabaseSync';
import { 
  Package, Search, Plus, ArrowUpRight, History, BarChart3, 
  AlertCircle, CheckCircle2, ShieldCheck, Layers, RefreshCw, 
  DownloadCloud, Trash2, Sliders, Sparkles, Send, Info
} from 'lucide-react';
import { fetchProducts, saveProduct } from '../lib/api';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  barcode: string;
  stock: number;
  icon?: string;
}

interface TransferLog {
  id: string;
  date: string;
  time: string;
  productName: string;
  productId: string;
  quantity: number;
  from: string;
  to: string;
  operator: string;
}

export default function StockInventaireModule({ currentLanguage = 'FR' }: { currentLanguage?: 'FR' | 'EN' }) {
  const currentShop = typeof window !== 'undefined' 
    ? (localStorage.getItem('optic_boutique_name') || 'Optic Alizé - DIRECTION') 
    : 'Optic Alizé - DIRECTION';

  const [products, setProducts] = useState<Product[]>([]);
  const [localStocks, setLocalStocks] = useState<Record<string, number>>({});
  const [transferLogs, setTransferLogs] = useState<TransferLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUS');

  // Modal states
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [replenishQty, setReplenishQty] = useState<number>(10);
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);
  const [isErrorMessage, setIsErrorMessage] = useState<string | null>(null);

  // Initialize or load logs and stocks with silent refresh
  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 1500);
    
    const handleStorageChange = () => {
      loadData(true);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentShop]);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // 1. Fetch unified master catalog products
      const masterProducts = await fetchProducts();
      setProducts(Array.isArray(masterProducts) ? masterProducts.filter(Boolean) : []);

      // 2. Load agency specific stocks
      const savedStocksKey = `optic_agency_stocks_${currentShop}`;
      const savedStocks = localStorage.getItem(savedStocksKey);
      if (savedStocks) {
        setLocalStocks(JSON.parse(savedStocks));
      } else {
        // If empty, initialize some default stocks for demo purposes
        const initial: Record<string, number> = {};
        if (Array.isArray(masterProducts)) {
          masterProducts.filter(Boolean).forEach((p: any) => {
            if (p && p.id) {
              // Set some initial random or standard stocks
              initial[p.id] = Math.floor(Math.random() * 8) + 3;
            }
          });
        }
        localStorage.setItem(savedStocksKey, JSON.stringify(initial));
        setLocalStocks(initial);
      }

      // 3. Load transfer logs
      const savedLogsKey = `optic_agency_transfers_${currentShop}`;
      const savedLogs = localStorage.getItem(savedLogsKey);
      if (savedLogs) {
        setTransferLogs(JSON.parse(savedLogs));
      } else {
        setTransferLogs([]);
      }
    } catch (e) {
      console.error("Error loading stock and inventory data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Virtual replenishment handler
  const handleReplenish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsErrorMessage(null);
    setIsSuccessMessage(null);

    if (!selectedProductId) {
      setIsErrorMessage(currentLanguage === 'FR' ? "Veuillez sélectionner un produit." : "Please select a product.");
      return;
    }

    if (replenishQty <= 0) {
      setIsErrorMessage(currentLanguage === 'FR' ? "La quantité doit être supérieure à 0." : "Quantity must be greater than 0.");
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) {
      setIsErrorMessage(currentLanguage === 'FR' ? "Produit introuvable." : "Product not found.");
      return;
    }

    // Central stock verification (from Gestion Optic)
    const centralStock = selectedProduct.stock !== undefined ? selectedProduct.stock : 999;
    if (centralStock < replenishQty) {
      // Allow it but with a warning, or block it. Let's show a helpful error/warning and also allow "forcing" it by generating from factory
      setIsErrorMessage(
        currentLanguage === 'FR'
          ? `Stock central insuffisant dans "Gestion Optic" (${centralStock} disponibles). Veuillez d'abord approvisionner le stock central ou réduire la quantité.`
          : `Insufficient central stock in "Optic Management" (${centralStock} available). Please replenish central stock first or reduce quantity.`
      );
      return;
    }

    try {
      // 1. Deduct from Central Stock in "Gestion Optic"
      const updatedCentralProduct = {
        ...selectedProduct,
        stock: Math.max(0, centralStock - replenishQty)
      };
      await saveProduct(updatedCentralProduct);

      // 2. Add to local agency stock
      const updatedLocalStocks = { ...localStocks };
      updatedLocalStocks[selectedProductId] = (updatedLocalStocks[selectedProductId] || 0) + replenishQty;
      localStorage.setItem(`optic_agency_stocks_${currentShop}`, JSON.stringify(updatedLocalStocks));
      setLocalStocks(updatedLocalStocks);

      // 3. Save transfer log
      const newLog: TransferLog = {
        id: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        productName: selectedProduct.name,
        productId: selectedProductId,
        quantity: replenishQty,
        from: 'Gestion Optic (Siège / Atelier)',
        to: currentShop,
        operator: 'Gérant d\'Agence / Opticien'
      };
      const updatedLogs = [newLog, ...transferLogs];
      localStorage.setItem(`optic_agency_transfers_${currentShop}`, JSON.stringify(updatedLogs));
      setTransferLogs(updatedLogs);

      // Refresh list to keep central stock state updated in local state
      const refreshedProducts = products.map(p => p.id === selectedProductId ? updatedCentralProduct : p);
      setProducts(refreshedProducts);

      setIsSuccessMessage(
        currentLanguage === 'FR' 
          ? `Ravitaillement virtuel réussi ! ${replenishQty} x "${selectedProduct.name}" transférés de l'Atelier central vers le stock local.`
          : `Virtual replenishment successful! ${replenishQty} x "${selectedProduct.name}" transferred from central Atelier to local stock.`
      );

      // Clear fields
      setReplenishQty(10);
      setSelectedProductId('');
      
      // Close modal after delay
      setTimeout(() => {
        setIsReplenishOpen(false);
        setIsSuccessMessage(null);
      }, 2000);

    } catch (error: any) {
      setIsErrorMessage(currentLanguage === 'FR' ? `Erreur: ${error.message}` : `Error: ${error.message}`);
    }
  };

  // Auto-fill all products to the agency local stocks if any is missing
  const handleAutoInit = () => {
    const updatedLocal = { ...localStocks };
    let added = 0;
    products.forEach(p => {
      if (updatedLocal[p.id] === undefined) {
        updatedLocal[p.id] = 5; // Default 5 items
        added++;
      }
    });
    localStorage.setItem(`optic_agency_stocks_${currentShop}`, JSON.stringify(updatedLocal));
    setLocalStocks(updatedLocal);
    alert(currentLanguage === 'FR' 
      ? `Félicitations ! ${added} nouveaux produits du catalogue central ont été ajoutés à votre stock local.` 
      : `Success! ${added} new products from the central catalog have been added to your local stock.`
    );
  };

  // Stats calculators
  const stats = useMemo(() => {
    let totalItems = 0;
    let outOfStockCount = 0;
    let totalEstimatedValue = 0;

    products.forEach(p => {
      const qty = localStocks[p.id] || 0;
      totalItems += qty;
      if (qty === 0) outOfStockCount++;
      totalEstimatedValue += qty * (p.price || 0);
    });

    return {
      totalItems,
      outOfStockCount,
      totalEstimatedValue
    };
  }, [products, localStocks]);

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const catUpper = (p.category || '').toUpperCase();
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.barcode || '').includes(searchQuery);
      const matchesCat = selectedCategory === 'TOUS' || catUpper === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div id="stock-inventaire-module" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {currentLanguage === 'FR' ? "Stock & Inventaire Local" : "Local Stock & Inventory"}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {currentLanguage === 'FR' 
                  ? `Gestion des approvisionnements locaux pour l'agence : ${currentShop}` 
                  : `Local inventory supply management for agency: ${currentShop}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAutoInit}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {currentLanguage === 'FR' ? "Synchroniser Catalogue" : "Sync Central Catalog"}
          </button>
          
          <button
            onClick={() => setIsReplenishOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            {currentLanguage === 'FR' ? "Ravitaillement Virtuel" : "Virtual Replenishment"}
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {currentLanguage === 'FR' ? "Unités en Stock Local" : "Total Local Units"}
            </span>
            <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">
              {stats.totalItems.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {currentLanguage === 'FR' ? "Articles en Rupture" : "Out of Stock Items"}
            </span>
            <span className={`text-2xl font-black font-mono mt-1 block ${stats.outOfStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.outOfStockCount}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${stats.outOfStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {currentLanguage === 'FR' ? "Valeur Estimée Stock" : "Estimated Stock Value"}
            </span>
            <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">
              {stats.totalEstimatedValue.toLocaleString()} FCFA
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & INVENTORY LIST */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={currentLanguage === 'FR' ? "Rechercher par nom, marque, code barres..." : "Search by name, brand, barcode..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-700 transition-all font-sans font-medium"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['TOUS', 'MONTURE', 'VERRE', 'LENTILLE', 'ACCESSOIRE'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm font-semibold">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
            {currentLanguage === 'FR' ? "Chargement de l'inventaire d'agence..." : "Loading agency inventory..."}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold">
              {currentLanguage === 'FR' ? "Aucun produit trouvé dans le catalogue d'approvisionnement" : "No products found in the supply catalog"}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {currentLanguage === 'FR'
                ? "Cliquez sur 'Synchroniser Catalogue' pour charger les composants créés dans 'Gestion Optic'."
                : "Click on 'Sync Central Catalog' to fetch components created in 'Optic Management'."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">{currentLanguage === 'FR' ? "Composant / Produit" : "Component / Product"}</th>
                  <th className="p-4">{currentLanguage === 'FR' ? "Catégorie" : "Category"}</th>
                  <th className="p-4">{currentLanguage === 'FR' ? "Marque" : "Brand"}</th>
                  <th className="p-4 font-mono">{currentLanguage === 'FR' ? "Code / SKU" : "Code / SKU"}</th>
                  <th className="p-4 font-mono">{currentLanguage === 'FR' ? "Prix Public (TTC)" : "Public Price"}</th>
                  <th className="p-4 pr-6 text-center font-bold">{currentLanguage === 'FR' ? "Stock en Agence" : "Local Stock (Agency)"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredProducts.map(p => {
                  const localQty = localStocks[p.id] !== undefined ? localStocks[p.id] : 0;
                  const centralQty = p.stock !== undefined ? p.stock : 0;
                  const isLow = localQty === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg shrink-0">{p.icon || '👓'}</span>
                          <div>
                            <span className="font-extrabold text-slate-800 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{p.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                          {p.category || 'MONTURE'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{p.brand || 'G-LAB Premium'}</td>
                      <td className="p-4 font-mono text-slate-500">{p.barcode || p.id}</td>
                      <td className="p-4 font-mono text-slate-800 font-bold">{(p.price || 0).toLocaleString()} FCFA</td>
                      <td className="p-4 pr-6 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs inline-block min-w-[45px] ${
                          isLow 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : localQty <= 3 
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {localQty}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REPLENISHMENT LOGS */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <History className="w-5 h-5 text-indigo-500" />
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            {currentLanguage === 'FR' ? "Historique des Ravitaillements d'Agence" : "Agency Replenishment Audit Trail"}
          </h2>
        </div>

        {transferLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {currentLanguage === 'FR' ? "Aucun transfert enregistré pour cette agence." : "No virtual transfers recorded for this agency."}
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {transferLogs.map((log) => (
              <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.productName}</span>
                      <span className="text-[10px] font-bold px-1.5 bg-indigo-100 text-indigo-700 rounded font-mono">+{log.quantity}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Code: {log.productId} • Opérateur: {log.operator}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                  <span className="font-mono text-slate-500 text-[10px]">{log.date} @ {log.time}</span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    {currentLanguage === 'FR' ? `Ravitaillement ${log.to}` : `Refilled ${log.to}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REPLENISHMENT MODAL */}
      <AnimatePresence>
        {isReplenishOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden text-slate-800"
            >
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {currentLanguage === 'FR' ? "Ravitaillement Virtuel d'Agence" : "Virtual Agency Supply Transfer"}
                  </span>
                </div>
                <button
                  onClick={() => setIsReplenishOpen(false)}
                  className="text-white hover:text-slate-300 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReplenish} className="p-6 space-y-4">
                
                {isSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 font-bold animate-pulse">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSuccessMessage}</span>
                  </div>
                )}

                {isErrorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{isErrorMessage}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    {currentLanguage === 'FR' ? "Sélectionner Composant (Atelier)" : "Select Component (Atelier)"}
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setIsErrorMessage(null);
                    }}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 p-2.5 rounded-xl text-slate-800 cursor-pointer"
                  >
                    <option value="">-- {currentLanguage === 'FR' ? "Choisir un article" : "Choose an item"} --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Marque: {p.brand} | Central Stock: {p.stock !== undefined ? p.stock : 0})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    {currentLanguage === 'FR' 
                      ? "Le produit sera transféré virtuellement depuis le stock d'usine 'Gestion Optic'."
                      : "The product will be virtually subtracted from the central d'usine stock."}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    {currentLanguage === 'FR' ? "Quantité à Transférer" : "Quantity to Transfer"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={replenishQty}
                    onChange={(e) => setReplenishQty(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-bold bg-white border border-slate-200 p-2.5 rounded-xl text-slate-800 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsReplenishOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {currentLanguage === 'FR' ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {currentLanguage === 'FR' ? "Valider le Transfert" : "Confirm Supply"}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
