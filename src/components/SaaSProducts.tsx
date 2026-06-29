import React, { useState } from 'react';
import { Search, Package, Plus, Sparkles, Filter, Grid, List, AlertTriangle } from 'lucide-react';
import { ComponentItem, INITIAL_COMPONENTS } from './GestionOpticModule';

interface SaaSProductsProps {
  darkMode?: boolean;
  currentLanguage?: 'FR' | 'EN';
}

export default function SaaSProducts({ darkMode = false, currentLanguage = 'FR' }: SaaSProductsProps) {
  const [products, setProducts] = useState<ComponentItem[]>(() => {
    const saved = localStorage.getItem('optic_components_list');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }
    return INITIAL_COMPONENTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const getFriendlyType = (type: ComponentItem['type']) => {
    switch (type) {
      case 'MONTURE':
        return currentLanguage === 'FR' ? 'Montures' : 'Frames';
      case 'ACCESSOIRE':
        return currentLanguage === 'FR' ? 'Accessoires' : 'Accessories';
      case 'VERRE':
        return currentLanguage === 'FR' ? 'Verres' : 'Lenses';
      case 'TRAITEMENT':
        return currentLanguage === 'FR' ? 'Traitements & Options' : 'Coatings & Extras';
      default:
        return type;
    }
  };

  const getProductStatus = (p: ComponentItem) => {
    if (p.stock === 999) return 'In Stock';
    if (p.stock === 0) return 'Out of Stock';
    if (p.stock < 15) return 'Low Stock';
    return 'In Stock';
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.type === selectedCategory;
    
    const probStatus = getProductStatus(p);
    const matchesStatus = selectedStatus === 'All' || probStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-[#DCFCE7] text-[#166534] border border-[#DCFCE7]'; // Success Group
      case 'Low Stock':
        return 'bg-[#FEF3C7] text-[#92400E] border border-[#FEF3C7]'; // Warning Group
      case 'Out of Stock':
        return 'bg-[#FEE2E2] text-[#991B1B] border border-[#FEE2E2]'; // Error Group
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getEmojiIcon = (type: ComponentItem['type']) => {
    switch (type) {
      case 'MONTURE': return '🕶️';
      case 'ACCESSOIRE': return '🧼';
      case 'VERRE': return '🔍';
      case 'TRAITEMENT': return '✨';
      default: return '📦';
    }
  };

  return (
    <div className={`p-1 space-y-6 ${darkMode ? 'dark text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h2 className="text-xl font-black tracking-tight font-display text-slate-850">
            {currentLanguage === 'FR' ? "Catalogue Optic" : "Optical Catalog"}
          </h2>
          <p className="text-xs text-[#64748B] mt-1 dark:text-slate-400">
            {currentLanguage === 'FR' 
              ? "Consultez les prix, les niveaux de stock d'atelier et les spécifications synchronisées du module Gestion Optique."
              : "Review prices, workshop inventory levels, and specifications synchronized with the Optical Management workspace."}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{currentLanguage === 'FR' ? "Niveaux synchronisés en temps réel" : "Real-time stock synchronization status"}</span>
          </div>
        </div>
      </div>

      {/* Filter widgets */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-[#0F172A]/40 border border-slate-800' : 'bg-white shadow-sm border border-slate-200/60'} flex flex-col md:flex-row gap-3 items-center justify-between`}>
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-[#64748B] dark:text-slate-400" />
          </span>
          <input
            type="text"
            className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${darkMode ? 'border border-slate-800 bg-[#0F172A]' : 'bg-slate-100/50 text-[#0F172A]'}`}
            placeholder={currentLanguage === 'FR' ? "Rechercher par référence, modèle, marque..." : "Search by brand, SKU reference, metadata..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer border border-slate-200 bg-white text-slate-800`}
          >
            <option value="All">{currentLanguage === 'FR' ? "Toutes les composantes" : "All Components"}</option>
            <option value="MONTURE">🕶️ {currentLanguage === 'FR' ? "Montures" : "Frames"}</option>
            <option value="ACCESSOIRE">🧼 {currentLanguage === 'FR' ? "Accessoires" : "Accessories"}</option>
            <option value="VERRE">🔍 {currentLanguage === 'FR' ? "Verres" : "Lenses"}</option>
            <option value="TRAITEMENT">✨ {currentLanguage === 'FR' ? "Traitements" : "Coatings"}</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer border border-slate-200 bg-white text-slate-800`}
          >
            <option value="All">{currentLanguage === 'FR' ? "Tous les niveaux" : "All Inventory Levels"}</option>
            <option value="In Stock">{currentLanguage === 'FR' ? "Disponible" : "In Stock"}</option>
            <option value="Low Stock">{currentLanguage === 'FR' ? "Stock Faible" : "Low Stock"}</option>
            <option value="Out of Stock">{currentLanguage === 'FR' ? "Rupture" : "Out of Stock"}</option>
          </select>
        </div>
      </div>

      {/* Product Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {filteredProducts.map((p) => {
          const status = getProductStatus(p);
          return (
            <div 
              key={p.id} 
              className={`rounded-xl overflow-hidden border border-slate-200/80 transition duration-150 flex flex-col justify-between ${darkMode ? 'bg-[#0F172A]/40 border border-slate-800 shadow-sm' : 'bg-white shadow-3xs hover:shadow-md'}`}
            >
              <div className={`p-6 flex items-center justify-center text-4xl select-none ${darkMode ? 'bg-slate-900/30' : 'bg-slate-50/50 border-b border-slate-100'}`}>
                {getEmojiIcon(p.type)}
              </div>
              <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-widest font-bold">{p.brand}</span>
                    <span className="text-[10px] font-mono font-bold text-[#2563EB]">{p.sku}</span>
                  </div>
                  <h3 className="font-extrabold text-xs text-[#0F172A] dark:text-white line-clamp-1 mt-0.5" title={p.name}>
                    {p.name}
                  </h3>
                  <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5 font-bold uppercase">{getFriendlyType(p.type)}</p>
                  {p.spec && (
                    <p className="text-[10px] text-slate-400 italic mt-0.5 font-medium line-clamp-2">Specs: {p.spec}</p>
                  )}
                </div>

                <div className={`pt-2 space-y-1.5 border-t border-slate-100`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">{currentLanguage === 'FR' ? "Prix de vente :" : "Selling Price :"}</span>
                    <span className="text-xs font-black text-[#0F172A] dark:text-white font-mono">{p.priceFCFA.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black ${getStockBadge(status)}`}>
                      {status === 'In Stock' 
                        ? (currentLanguage === 'FR' ? 'Disponible' : 'Available') 
                        : status === 'Low Stock' 
                          ? (currentLanguage === 'FR' ? 'Alerte' : 'Low Stock') 
                          : (currentLanguage === 'FR' ? 'Rupture' : 'Refill required')}
                    </span>
                    <span className="text-xs font-mono font-black text-[#64748B] dark:text-slate-400">
                      Stock: {p.stock === 999 ? '∞' : `${p.stock} p`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
