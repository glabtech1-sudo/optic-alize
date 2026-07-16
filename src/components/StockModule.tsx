import React, { useState } from 'react';
import { safeLocalStorage as localStorage, globalMemoryStore, syncCollectionToSupabase, loadCollectionFromSupabase } from '../lib/supabaseSync';
import { 
  Package, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ClipboardList, RotateCcw,
  Search, Plus, Printer, AlertTriangle, QrCode, Barcode, CheckCircle2, 
  Trash2, TrendingUp, TrendingDown, RefreshCw, Layers, MapPin, Sliders,
  HelpCircle, ShieldCheck, Download, ShoppingBag, Eye, Calendar, User, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for our Stock System
interface StockItem {
  id: string;
  name: string;
  brand: string;
  category: 'Monture' | 'Verre' | 'Accessoire';
  price: number;
  qty: number;
  lowStockThreshold: number;
  barcode: string;
  qrCodeValue: string;
  locationCode: string; // Shelf position like 'Aisle B - Shelf 3'
}

interface StockHistoryEvent {
  id: string;
  timestamp: string;
  type: 'ENTREE' | 'SORTIE' | 'INVENTAIRE' | 'RETOUR' | 'TRANSFERT' | 'AJUSTEMENT';
  productName: string;
  qtyChange: number;
  detail: string;
  operator: string;
  status: 'Complété' | 'En attente' | 'Approuvé';
}

const INITIAL_STOCK_ITEMS: StockItem[] = [
  // Montures
  { id: 's1', name: 'Original Wayfarer Black Matte', brand: 'Ray-Ban', category: 'Monture', price: 139.00, qty: 12, lowStockThreshold: 5, barcode: '805289122012', qrCodeValue: 'https://g-lab.com/s/805289122012', locationCode: 'Rayon R-A1' },
  { id: 's2', name: 'Cat-Eye Prestige Gold Filigree', brand: 'Chanel', category: 'Monture', price: 345.00, qty: 2, lowStockThreshold: 4, barcode: '313045920381', qrCodeValue: 'https://g-lab.com/s/313045920381', locationCode: 'Vitrine V-G2' },
  { id: 's3', name: 'Clubmaster Classic Acetate', brand: 'Ray-Ban', category: 'Monture', price: 149.00, qty: 8, lowStockThreshold: 3, barcode: '805289122055', qrCodeValue: 'https://g-lab.com/s/805289122055', locationCode: 'Rayon R-A3' },
  { id: 's4', name: 'Platinum Pilot Aviator Frame', brand: 'Cartier', category: 'Monture', price: 890.00, qty: 0, lowStockThreshold: 2, barcode: '761326442651', qrCodeValue: 'https://g-lab.com/s/761326442651', locationCode: 'Coffre-Fort B-C1' },
  // Verres Correcteurs
  { id: 's5', name: 'Varilux Physio Crizal Sapphire HR Duo', brand: 'Essilor', category: 'Verre', price: 210.00, qty: 140, lowStockThreshold: 20, barcode: '321045230910', qrCodeValue: 'https://g-lab.com/s/321045230910', locationCode: 'Tiroir T-V1' },
  { id: 's6', name: 'Shamir Autograph Intelligence Single-Eye', brand: 'Shamir', category: 'Verre', price: 245.00, qty: 15, lowStockThreshold: 10, barcode: '321045230911', qrCodeValue: 'https://g-lab.com/s/321045230911', locationCode: 'Tiroir T-V2' },
  { id: 's7', name: 'Zeiss SmartLife single Platinum HD', brand: 'Zeiss', category: 'Verre', price: 165.00, qty: 4, lowStockThreshold: 15, barcode: '321045100025', qrCodeValue: 'https://g-lab.com/s/321045100025', locationCode: 'Tiroir T-V3' },
  // Accessoires
  { id: 's8', name: 'Kit Nettoyant G-LAB Anti-Buée Spray', brand: 'Generic', category: 'Accessoire', price: 12.50, qty: 45, lowStockThreshold: 5, barcode: '350104100529', qrCodeValue: 'https://g-lab.com/s/350104100529', locationCode: 'Comptoir C-02' },
  { id: 's9', name: 'Étui Premium Cuir Grainé G-LAB', brand: 'Generic', category: 'Accessoire', price: 34.00, qty: 3, lowStockThreshold: 10, barcode: '350104200150', qrCodeValue: 'https://g-lab.com/s/350104200150', locationCode: 'Armoire A-01' },
  { id: 's10', name: 'Cordon d\'Attache Sécurité Sport Premium', brand: 'Chums', category: 'Accessoire', price: 8.00, qty: 0, lowStockThreshold: 5, barcode: '350104300712', qrCodeValue: 'https://g-lab.com/s/350104300712', locationCode: 'Bac Solde B-S4' }
];

const INITIAL_HISTORY: StockHistoryEvent[] = [
  { id: 'evt-101', timestamp: '2026-06-09T08:34:00Z', type: 'ENTREE', productName: 'Varilux Physio Crizal Sapphire HR Duo', qtyChange: 50, detail: 'Livraison fournisseur Essilor France - BL#889210', operator: 'Léonard Dupont', status: 'Complété' },
  { id: 'evt-102', timestamp: '2026-06-09T09:12:00Z', type: 'SORTIE', productName: 'Original Wayfarer Black Matte', qtyChange: -1, detail: 'Casse d\'exposition - Monture détériorée en boutique', operator: 'Antoine Roussel', status: 'Complété' },
  { id: 'evt-103', timestamp: '2026-06-08T14:40:00Z', type: 'TRANSFERT', productName: 'Shamir Autograph Intelligence Single-Eye', qtyChange: -5, detail: 'Transfert de G-LAB Paris Nation vers Bastille', operator: 'Léonard Dupont', status: 'Complété' },
  { id: 'evt-104', timestamp: '2026-06-08T16:15:00Z', type: 'RETOUR', productName: 'Cat-Eye Prestige Gold Filigree', qtyChange: 1, detail: 'Retour client - Clapet d\'ajustement desserré', operator: 'Mathilde Martin', status: 'Approuvé' },
  { id: 'evt-105', timestamp: '2026-06-07T11:00:00Z', type: 'INVENTAIRE', productName: 'Kit Nettoyant G-LAB Anti-Buée Spray', qtyChange: 3, detail: 'Correction inventaire tournant de juin', operator: 'Antoine Roussel', status: 'Complété' }
];

const BOTIQUE_OPTIONS = [
  { id: 'b1', name: 'G-LAB Paris Nation (Boutique Principale)' },
  { id: 'b2', name: 'G-LAB Paris Bastille' },
  { id: 'b3', name: 'G-LAB Lyon Presqu\'île' },
  { id: 'b4', name: 'G-LAB Marseille Prado' }
];

export default function StockModule() {
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = globalMemoryStore['optic_stock_items'];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });
  const [historyEvents, setHistoryEvents] = useState<StockHistoryEvent[]>(() => {
    const saved = globalMemoryStore['optic_stock_history'];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  React.useEffect(() => {
    const serialized = JSON.stringify(stockItems);
    globalMemoryStore['optic_stock_items'] = serialized;
    syncCollectionToSupabase('optic_stock_items', serialized).catch(() => {});
  }, [stockItems]);

  React.useEffect(() => {
    const serialized = JSON.stringify(historyEvents);
    globalMemoryStore['optic_stock_history'] = serialized;
    syncCollectionToSupabase('optic_stock_history', serialized).catch(() => {});
  }, [historyEvents]);

  React.useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const dbItems = await loadCollectionFromSupabase('optic_stock_items');
        if (dbItems && active) {
          const parsed = typeof dbItems === 'string' ? JSON.parse(dbItems) : dbItems;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStockItems(parsed);
          }
        }
        const dbHistory = await loadCollectionFromSupabase('optic_stock_history');
        if (dbHistory && active) {
          const parsed = typeof dbHistory === 'string' ? JSON.parse(dbHistory) : dbHistory;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistoryEvents(parsed);
          }
        }
      } catch (e) {
        console.warn('[StockModule] Direct Supabase fetch failed, using local caching:', e);
      }
    };
    loadData();
    return () => { active = false; };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Monture' | 'Verre' | 'Accessoire'>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Rupture'>('All');

  // Interactive transaction state tabs
  const [activeActionTab, setActiveActionTab] = useState<'entrées' | 'sorties' | 'inventaire' | 'retours' | 'transferts' | 'ajustements'>('entrées');

  // Dialog visual print card
  const [selectedLabelItem, setSelectedLabelItem] = useState<StockItem | null>(null);

  // States for sub-forms
  // Form Entrée
  const [inProduct, setInProduct] = useState<string>('s1');
  const [inQty, setInQty] = useState<string>('10');
  const [inProvider, setInProvider] = useState<string>('');
  const [inDocRef, setInDocRef] = useState<string>('');

  // Form Sortie
  const [outProduct, setOutProduct] = useState<string>('s1');
  const [outQty, setOutQty] = useState<string>('1');
  const [outReason, setOutReason] = useState<string>('Casse');
  const [outLogRef, setOutLogRef] = useState<string>('');

  // Form Inventaire
  const [reconciledItems, setReconciledItems] = useState<Record<string, number>>({});
  
  // Form Retour
  const [retProduct, setRetProduct] = useState<string>('s1');
  const [retQty, setRetQty] = useState<string>('1');
  const [retDirection, setRetDirection] = useState<'CLIENT_VERS_STOCK' | 'STOCK_VERS_FOURNISSEUR'>('CLIENT_VERS_STOCK');
  const [retReason, setRetReason] = useState<string>('');

  // Form Transfert
  const [transProduct, setTransProduct] = useState<string>('s1');
  const [transQty, setTransQty] = useState<string>('2');
  const [transFrom, setTransFrom] = useState<string>('b1');
  const [transTo, setTransTo] = useState<string>('b2');
  const [transCourier, setTransCourier] = useState<string>('Chronopost Optic');

  // Form Ajustement manuel direct
  const [adjProduct, setAdjProduct] = useState<string>('s1');
  const [adjValue, setAdjValue] = useState<string>('+5');
  const [adjNote, setAdjNote] = useState<string>('');

  // Notifications
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'warn' | 'info' } | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Action submissions handlers
  // ENTREE
  const handleSubmitEntree = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = stockItems.find(item => item.id === inProduct);
    const qtyNum = parseInt(inQty);
    if (!targetItem || isNaN(qtyNum) || qtyNum <= 0) {
      triggerToast('Veuillez saisir des informations valides.', 'warn');
      return;
    }

    // Mutate stock level
    setStockItems(prev => prev.map(item => {
      if (item.id === inProduct) {
        return { ...item, qty: item.qty + qtyNum };
      }
      return item;
    }));

    // Add logging history event
    const newEvent: StockHistoryEvent = {
      id: `evt-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      type: 'ENTREE',
      productName: targetItem.name,
      qtyChange: qtyNum,
      detail: `Arrivée Fournisseur : ${inProvider || 'Générique'} • DocRef: ${inDocRef || 'N/A'}`,
      operator: 'Antoine Roussel (Opticien Principal)',
      status: 'Complété'
    };

    setHistoryEvents(prev => [newEvent, ...prev]);
    triggerToast(`Entrée de stock enregistrée : +${qtyNum} ${targetItem.name}.`, 'success');
    
    // reset simple input values
    setInQty('10');
    setInDocRef('');
    setInProvider('');
  };

  // SORTIE
  const handleSubmitSortie = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = stockItems.find(item => item.id === outProduct);
    const qtyNum = parseInt(outQty);
    if (!targetItem || isNaN(qtyNum) || qtyNum <= 0) {
      triggerToast('Informations de sortie erronées.', 'warn');
      return;
    }

    if (targetItem.qty < qtyNum) {
      triggerToast(`Le stock disponible (${targetItem.qty}) est inférieur à la sortie demandée.`, 'warn');
      return;
    }

    setStockItems(prev => prev.map(item => {
      if (item.id === outProduct) {
        return { ...item, qty: item.qty - qtyNum };
      }
      return item;
    }));

    const newEvent: StockHistoryEvent = {
      id: `evt-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      type: 'SORTIE',
      productName: targetItem.name,
      qtyChange: -qtyNum,
      detail: `Sortie de stock motivo : ${outReason} • Réf: ${outLogRef || 'Sans'}`,
      operator: 'Antoine Roussel',
      status: 'Complété'
    };

    setHistoryEvents(prev => [newEvent, ...prev]);
    triggerToast(`Sortie enregistrée : -${qtyNum} ${targetItem.name}.`, 'success');
    setOutQty('1');
    setOutLogRef('');
  };

  // RECONCIL / INVENTAIRE
  const handleUpdateReconciledValue = (itemId: string, valStr: string) => {
    const val = parseInt(valStr);
    setReconciledItems(prev => ({
      ...prev,
      [itemId]: isNaN(val) ? 0 : val
    }));
  };

  const handleSubmitInventaireAll = () => {
    // Collect all entered reconciled values
    const adjustedLogs: string[] = [];
    const newHistoryEntries: StockHistoryEvent[] = [];
    
    setStockItems(prev => {
      return prev.map(item => {
        if (reconciledItems[item.id] !== undefined) {
          const physicalVal = reconciledItems[item.id];
          const diff = physicalVal - item.qty;
          
          if (diff !== 0) {
            adjustedLogs.push(`${item.name}: ${item.qty} ➔ ${physicalVal} (${diff > 0 ? '+' : ''}${diff})`);
            
            newHistoryEntries.push({
              id: `evt-inv-${Math.floor(10000 + Math.random() * 90000)}`,
              timestamp: new Date().toISOString(),
              type: 'INVENTAIRE',
              productName: item.name,
              qtyChange: diff,
              detail: `Inventaire Général tournant • Écart constaté et corrigé en boutique.`,
              operator: 'Léonard Dupont',
              status: 'Complété'
            });
          }
          return { ...item, qty: physicalVal };
        }
        return item;
      });
    });

    if (newHistoryEntries.length > 0) {
      setHistoryEvents(prev => [...newHistoryEntries, ...prev]);
      triggerToast(`Inventaire sauvegardé ! ${newHistoryEntries.length} ajustement(s) opéré(s).`, 'success');
    } else {
      triggerToast(`Inventaire validé. Aucun écart constaté sur les zones comptées.`, 'info');
    }

    setReconciledItems({});
  };

  // RETOUR
  const handleSubmitRetour = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = stockItems.find(item => item.id === retProduct);
    const qtyNum = parseInt(retQty);
    if (!targetItem || isNaN(qtyNum) || qtyNum <= 0) {
      triggerToast('Informations invalides.', 'warn');
      return;
    }

    const directionLabel = retDirection === 'CLIENT_VERS_STOCK' ? 'Retour client (+ stock)' : 'Retour au fabricant (- stock)';
    const coeff = retDirection === 'CLIENT_VERS_STOCK' ? 1 : -1;

    if (coeff === -1 && targetItem.qty < qtyNum) {
      triggerToast(`Impossible de renvoyer ${qtyNum} verres/montures car le stock restant est seulement de ${targetItem.qty}.`, 'warn');
      return;
    }

    setStockItems(prev => prev.map(item => {
      if (item.id === retProduct) {
        return { ...item, qty: item.qty + (qtyNum * coeff) };
      }
      return item;
    }));

    const newEvent: StockHistoryEvent = {
      id: `evt-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      type: 'RETOUR',
      productName: targetItem.name,
      qtyChange: qtyNum * coeff,
      detail: `${directionLabel} • Motifs : ${retReason || 'Pas de motif'}`,
      operator: 'Mathilde Martin',
      status: 'Approuvé'
    };

    setHistoryEvents(prev => [newEvent, ...prev]);
    triggerToast(`Saisie de retour enregistrée avec succès.`, 'success');
    setRetQty('1');
    setRetReason('');
  };

  // TRANSFERTS ENTRE BOUTIQUES
  const handleSubmitTransfert = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = stockItems.find(item => item.id === transProduct);
    const qtyNum = parseInt(transQty);
    if (!targetItem || isNaN(qtyNum) || qtyNum <= 0) {
      triggerToast('Quantité erronée.', 'warn');
      return;
    }

    if (transFrom === transTo) {
      triggerToast('La boutique d\'origine doit être différente du point de livraison.', 'warn');
      return;
    }

    if (targetItem.qty < qtyNum) {
      triggerToast(`Stock de départ insuffisant : ${targetItem.qty} disponibles alors que vous tentez d'en transférer ${qtyNum}.`, 'warn');
      return;
    }

    // Deduct stock levels in current boutique simulation
    setStockItems(prev => prev.map(item => {
      if (item.id === transProduct) {
        return { ...item, qty: item.qty - qtyNum };
      }
      return item;
    }));

    const boutiqueFromName = BOTIQUE_OPTIONS.find(b => b.id === transFrom)?.name || 'Groupe';
    const boutiqueToName = BOTIQUE_OPTIONS.find(b => b.id === transTo)?.name || 'Cession';

    const newEvent: StockHistoryEvent = {
      id: `evt-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      type: 'TRANSFERT',
      productName: targetItem.name,
      qtyChange: -qtyNum,
      detail: `Transfert G-LAB de [${boutiqueFromName}] vers [${boutiqueToName}] par "${transCourier}"`,
      operator: 'Antoine Roussel',
      status: 'Complété'
    };

    setHistoryEvents(prev => [newEvent, ...prev]);
    triggerToast(`Fiche logistique de transfert validée vers ${boutiqueToName}.`, 'success');
    setTransQty('2');
  };

  // AJUSTEMENT DIRECT
  const handleSubmitAjustement = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = stockItems.find(item => item.id === adjProduct);
    const offset = parseInt(adjValue);
    if (!targetItem || isNaN(offset) || offset === 0) {
      triggerToast('Veuillez saisir un décalage d\'ajustement non-nul (+x ou -x).', 'warn');
      return;
    }

    if (targetItem.qty + offset < 0) {
      triggerToast('La soustraction de stock dépasse la quantité actuellement détenue.', 'warn');
      return;
    }

    setStockItems(prev => prev.map(item => {
      if (item.id === adjProduct) {
        return { ...item, qty: item.qty + offset };
      }
      return item;
    }));

    const newEvent: StockHistoryEvent = {
      id: `evt-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      type: 'AJUSTEMENT',
      productName: targetItem.name,
      qtyChange: offset,
      detail: `Ajustement managérial de correction : ${adjNote || 'Non spécifié'}`,
      operator: 'Antoine Roussel',
      status: 'Complété'
    };

    setHistoryEvents(prev => [newEvent, ...prev]);
    triggerToast(`Correction manuelle de stock appliquée avec succès.`, 'success');
    setAdjValue('+5');
    setAdjNote('');
  };

  // Helper filters computation
  const filteredStock = stockItems.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    // Search constraints
    const matchesSearch = q === '' || 
      item.name.toLowerCase().includes(q) || 
      item.brand.toLowerCase().includes(q) || 
      item.barcode.includes(q) ||
      item.locationCode.toLowerCase().includes(q);

    // Category constraints
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    // Warning/Alert stock levels filters
    if (stockFilter === 'Low') {
      return matchesSearch && matchesCategory && item.qty > 0 && item.qty < item.lowStockThreshold;
    }
    if (stockFilter === 'Rupture') {
      return matchesSearch && matchesCategory && item.qty === 0;
    }
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = stockItems.filter(i => i.qty > 0 && i.qty < i.lowStockThreshold).length;
  const outOfStockCount = stockItems.filter(i => i.qty === 0).length;
  const totalItemsAvailable = stockItems.reduce((acc, current) => acc + current.qty, 0);

  // CSV/Excel Exporter for the pharmacy / shop manager
  const handleExportCSV = () => {
    const headers = ['ID', 'Nom du Produit', 'Marque', 'Catégorie', 'Prix Unitaire TTC (FCFA)', 'Quantité en Stock', 'Seuil d\'alerte', 'Emplacement Physique', 'Code-barres'];
    const rows = stockItems.map(item => [
      item.id,
      item.name,
      item.brand,
      item.category,
      item.price.toFixed(2),
      item.qty,
      item.lowStockThreshold,
      item.locationCode,
      item.barcode
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `GLAB_Inventaire_Stock_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Rapport d\'inventaire brut CSV téléchargé.', 'info');
  };

  return (
    <div className="w-full flex flex-col gap-6" id="g-lab-stock-manager">
      
      {/* Dynamic Toast Alert banner */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-[#001d24] border-[#0097a7]/50 text-[#00bcd4]' 
                : toast.type === 'warn'
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-cyan-400" /> : <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-400" />}
            <span className="text-xs font-semibold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP HEADER KPI CARDS (BENTO-STYLE INFRASTRUCTURE) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Item Count Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">VOLUME ACTUEL</span>
            <span className="p-1 px-1.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">Unité stock</span>
          </div>
          <p className="text-3xl font-display font-medium text-slate-800 font-mono mt-2">{totalItemsAvailable}</p>
          <div className="text-[11px] font-mono text-slate-500 mt-2 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-[#0097a7]" />
            <span>Tous types d'équipements</span>
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className={`p-5 rounded-2xl border transition ${
          lowStockCount > 0 
            ? 'bg-amber-50 border-amber-200 shadow-sm' 
            : 'bg-white border border-slate-100 hover:shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-amber-600 uppercase">ALERTE STOCK FAIBLE</span>
            <span className="p-1 px-1.5 rounded text-[10px] bg-amber-100 text-amber-700 font-mono">Seuil atteint</span>
          </div>
          <p className="text-3xl font-display font-medium text-amber-700 font-mono mt-2">{lowStockCount}</p>
          <div className="text-[11px] font-mono text-amber-800/80 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Optique à réapprovisionner rapidement</span>
          </div>
        </div>

        {/* Severe Rupture Card */}
        <div className={`p-5 rounded-2xl border transition ${
          outOfStockCount > 0 
            ? 'bg-rose-50 border-rose-200 shadow-sm' 
            : 'bg-white border border-slate-100 hover:shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-rose-600 uppercase">RUPTURES CRITIQUES</span>
            <span className="p-1 px-1.5 rounded text-[10px] bg-rose-100 text-rose-700 font-mono">Stock 0</span>
          </div>
          <p className="text-3xl font-display font-medium text-rose-700 font-mono mt-2">{outOfStockCount}</p>
          <div className="text-[11px] font-mono text-rose-800/80 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Ventes impossibles en caisse POS</span>
          </div>
        </div>

        {/* Active Outlets Quick Actions */}
        <div className="bg-[#0097a7]/5 p-5 rounded-2xl border border-[#0097a7]/10 hover:border-[#0097a7]/20 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#0097a7] uppercase">EXPORTATION REPR.</span>
            <span className="p-1 px-1.5 rounded text-[10px] bg-[#0097a7]/15 text-[#0097a7] font-mono font-bold">ERP CSV</span>
          </div>
          <button 
            onClick={handleExportCSV}
            className="w-full mt-4 bg-[#0097a7] hover:bg-[#00bcd4] text-white py-1.5 rounded-lg text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer border-0"
          >
            <Download className="w-4 h-4" />
            Télécharger Inventaire (.CSV)
          </button>
        </div>

      </div>

      {/* 2. CORE CONTENT COLLABORATIVE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: STOCK REGISTRY & LABELS PRINTING (COL SPAN 7) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 flex flex-col gap-4 shadow-sm">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#0097a7]">Boutique G-LAB • Répertoire Stock</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Cliquez sur un produit pour voir son QR Code / imprimer d'étiquettes professionnelles</p>
            </div>

            {/* Micro search container */}
            <div className="relative w-full md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-450 absolute left-3 top-2.5 pointer-events-none" />
              <input 
                type="text"
                placeholder="Chercher par code / rayon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 pl-8 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097A7] font-mono"
              />
            </div>
          </div>

          {/* Triple level quick filters (Category & Stock Warning Alerts) */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
            
            {/* 1. Category tabs */}
            <div className="flex bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              {(['All', 'Monture', 'Verre', 'Accessoire'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition border-0 ${
                    selectedCategory === cat 
                      ? 'bg-white text-[#0097a7] shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  {cat === 'All' ? 'Tous' : cat === 'Monture' ? 'Montures' : cat === 'Verre' ? 'Verres' : 'Accessoires'}
                </button>
              ))}
            </div>

            {/* 2. Alert tabs */}
            <div className="flex bg-slate-50 p-1.5 rounded-lg border border-slate-200 gap-1 font-mono">
              <button
                onClick={() => setStockFilter('All')}
                className={`px-2 py-1 text-[10px] rounded cursor-pointer border-0 ${
                  stockFilter === 'All' ? 'bg-white text-slate-800 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tout Stock
              </button>
              <button
                onClick={() => setStockFilter('Low')}
                className={`px-2 py-1 text-[10px] rounded cursor-pointer text-amber-600 font-bold border-0 ${
                  stockFilter === 'Low' ? 'bg-amber-100/80' : 'opacity-70 hover:opacity-100'
                }`}
              >
                Faible ({lowStockCount})
              </button>
              <button
                onClick={() => setStockFilter('Rupture')}
                className={`px-2 py-1 text-[10px] rounded cursor-pointer text-rose-600 font-bold border-0 ${
                  stockFilter === 'Rupture' ? 'bg-rose-100/80' : 'opacity-70 hover:opacity-100'
                }`}
              >
                Rupture ({outOfStockCount})
              </button>
            </div>

          </div>

          {/* Interactive list layout of items with visual barcodes and shelf codes */}
          <div className="space-y-2 h-[380px] overflow-y-auto pr-1">
            {filteredStock.map(item => {
              const isLow = item.qty > 0 && item.qty < item.lowStockThreshold;
              const isRupture = item.qty === 0;

              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedLabelItem(item)}
                  className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition flex items-center justify-between gap-4 cursor-pointer relative group"
                >
                  
                  {/* Front detail */}
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      item.category === 'Monture' 
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                        : item.category === 'Verre'
                          ? 'bg-sky-50 text-sky-600 border border-sky-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {item.category[0]}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase">{item.brand}</span>
                        <span className="px-1 py-0.2 rounded text-[9px] font-mono text-slate-600 bg-slate-100 border border-slate-200">
                          {item.locationCode}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-850">{item.name}</h4>
                      <p className="text-[10px] font-mono text-slate-500">COD: {item.barcode}</p>
                    </div>
                  </div>

                  {/* Rear inventory status */}
                  <div className="flex items-center gap-4 text-right">
                    
                    <div className="flex flex-col font-mono text-right">
                      <span className={`text-sm font-bold ${
                        isRupture 
                          ? 'text-rose-600 font-extrabold line-through' 
                          : isLow 
                            ? 'text-amber-600' 
                            : 'text-emerald-600'
                      }`}>
                        {item.qty} dispo
                      </span>
                      <span className="text-[9px] text-slate-500">Valeur: {item.price.toLocaleString()} FCFA</span>
                    </div>

                    {/* Show quick alert warning indicator */}
                    {isRupture ? (
                      <span className="h-5 px-1.5 bg-rose-50 text-rose-650 border border-rose-100 rounded flex items-center justify-center text-[9px] font-mono font-bold uppercase shrink-0">
                        rupture
                      </span>
                    ) : isLow ? (
                      <span className="h-5 px-1.5 bg-amber-50 text-amber-650 border border-amber-100 rounded flex items-center justify-center text-[9px] font-mono font-bold uppercase shrink-0">
                        faible
                      </span>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                        ✓
                      </div>
                    )}

                    {/* Hidden label tag print preview hover action */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLabelItem(item);
                      }}
                      className="p-1 px-1.5 bg-white hover:bg-[#0097a7] border border-slate-200 rounded text-[9.5px] font-semibold text-slate-700 hover:text-white cursor-pointer transition shrink-0"
                    >
                      Étiquette
                    </button>

                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: LOGISTIQUE CONTROLLER AND FLUX ACTIONS (COL SPAN 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="g-lab-delivery-channels">
          
          {/* Main logistical activities Console */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col shadow-sm">
            
            {/* Top Log Tab switcher heading scroll */}
            <div className="flex gap-1 overflow-x-auto border-b border-slate-100 pb-2 mb-4 scrollbar-hide">
              {([
                { k: 'entrées', label: 'Arrivage Supplier', i: ArrowDownLeft },
                { k: 'sorties', label: 'Casse / Perte', i: ArrowUpRight },
                { k: 'inventaire', label: 'Inventaire', i: ClipboardList },
                { k: 'retours', label: 'Retours', i: RotateCcw },
                { k: 'transferts', label: 'Transferts', i: ArrowLeftRight },
                { k: 'ajustements', label: 'Ajustement', i: Sliders }
              ] as const).map(tab => {
                const SelectedIcon = tab.i;
                return (
                  <button
                    key={tab.k}
                    onClick={() => setActiveActionTab(tab.k)}
                    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide rounded-md transition flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 border-0 ${
                      activeActionTab === tab.k 
                        ? 'bg-[#0097a7] text-white shadow' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <SelectedIcon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Render form dependent on the selected logarithmic action tab */}
            <div className="flex-1">
              
              {/* TAB A: ENTREES FOURNISSEUR */}
              {activeActionTab === 'entrées' && (
                <form onSubmit={handleSubmitEntree} className="space-y-4">
                  <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-lg flex gap-2 items-center text-[11px] font-mono text-sky-800">
                    <ArrowDownLeft className="w-4 h-4 shrink-0" />
                    <span>Inscrire des entrées additionnelles d'équipements livrées.</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 text-xs text-slate-700">
                    
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Produit Répertorié</label>
                      <select 
                        value={inProduct}
                        onChange={(e) => setInProduct(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097a7]"
                      >
                        {stockItems.map(p => (
                          <option key={p.id} value={p.id}>{p.brand} - {p.name} (Dispo : {p.qty})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Quantité à ajouter</label>
                        <input 
                          type="number"
                          value={inQty}
                          min="1"
                          onChange={(e) => setInQty(e.target.value)}
                          className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Référence Colis/BL</label>
                        <input 
                          type="text"
                          placeholder="BL#778210"
                          value={inDocRef}
                          onChange={(e) => setInDocRef(e.target.value)}
                          className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Nom du Distributeur / Fabricant</label>
                      <input 
                        type="text"
                        placeholder="Essilor France / Safilo"
                        value={inProvider}
                        onChange={(e) => setInProvider(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#0097a7] hover:bg-[#00bcd4] text-white py-2 rounded-lg text-xs font-bold transition cursor-pointer mt-2 border-0"
                    >
                      Enregistrer validation d'arrivage +
                    </button>

                  </div>
                </form>
              )}

              {/* TAB B: SORTIES / PERTES */}
              {activeActionTab === 'sorties' && (
                <form onSubmit={handleSubmitSortie} className="space-y-4">
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg flex gap-2 items-center text-[11px] font-mono text-rose-700">
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                    <span>Déduire des montures fêlées, verres brisés ou vols suspectés.</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 text-xs text-slate-700">
                    
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Produit Abîmé/Volé</label>
                      <select 
                        value={outProduct}
                        onChange={(e) => setOutProduct(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097a7]"
                      >
                        {stockItems.map(p => (
                          <option key={p.id} value={p.id}>{p.brand} - {p.name} (Dispo : {p.qty})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Quantité perdue</label>
                        <input 
                          type="number"
                          value={outQty}
                          min="1"
                          onChange={(e) => setOutQty(e.target.value)}
                          className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Raison de la sortie</label>
                        <select 
                          value={outReason}
                          onChange={(e) => setOutReason(e.target.value)}
                          className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097a7]"
                        >
                          <option value="Casse d'atelier">Casse d'atelier de montage</option>
                          <option value="Verre rayé">Verre rayé au calibrage</option>
                          <option value="Vol suspecté">Vol suspecté en vitrine</option>
                          <option value="Modèle Exposition usé">Modèle exposition usé</option>
                          <option value="Cadeau commercial">Don de monture humanitaire</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Note / Incident de caisse ID</label>
                      <input 
                        type="text"
                        placeholder="Rupture charnière lors du serrage meuleuse..."
                        value={outLogRef}
                        onChange={(e) => setOutLogRef(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-xs font-bold transition cursor-pointer mt-2 border-0"
                    >
                      Enregistrer la perte ou vol -
                    </button>

                  </div>
                </form>
              )}

              {/* TAB C: INVENTAIRE TOURNANT */}
              {activeActionTab === 'inventaire' && (
                <div className="space-y-4">
                  <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg flex gap-2 items-center text-[11px] font-mono text-slate-600">
                    <ClipboardList className="w-4 h-4 shrink-0 text-cyan-600" />
                    <span>Remplir le décompte physique réel pour recalculer l'inventaire boutique.</span>
                  </div>

                  {/* List of elements to invent */}
                  <div className="rounded-xl max-h-56 overflow-y-auto space-y-1.5 p-1 pr-2">
                    {stockItems.map(itm => (
                      <div key={itm.id} className="flex justify-between items-center text-xs font-mono py-1.5 px-2 bg-slate-50 rounded border border-slate-100">
                        <div className="truncate max-w-[210px]">
                          <span className="text-slate-500">[{itm.brand}] </span>
                          <span className="text-slate-800 font-medium">{itm.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-slate-500 text-[10px]">Sys: {itm.qty}</span>
                          <input 
                            type="number"
                            placeholder="Reel"
                            value={reconciledItems[itm.id] !== undefined ? reconciledItems[itm.id] : ''}
                            onChange={(e) => handleUpdateReconciledValue(itm.id, e.target.value)}
                            className="w-12 bg-white border border-slate-300 rounded p-0.5 text-center text-amber-600 font-extrabold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleSubmitInventaireAll}
                    className="w-full bg-[#0097a7] hover:bg-[#00bcd4] text-white py-2 rounded-lg text-xs font-bold transition cursor-pointer block text-center border-0"
                  >
                    Valider le décompte de caisse
                  </button>
                </div>
              )}

              {/* TAB D: RETOURS COORDONNES */}
              {activeActionTab === 'retours' && (
                <form onSubmit={handleSubmitRetour} className="space-y-4">
                  <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-lg flex gap-2 items-center text-[11px] font-mono text-sky-800">
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span>Prendre en compte un retour vers le fabricant ou depuis un client.</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 text-xs text-slate-700">
                    
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Produit visé</label>
                      <select 
                        value={retProduct}
                        onChange={(e) => setRetProduct(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097a7]"
                      >
                        {stockItems.map(p => (
                          <option key={p.id} value={p.id}>{p.brand} - {p.name} (Dispo : {p.qty})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Sens de Circulation</label>
                        <select 
                          value={retDirection}
                          onChange={(e) => setRetDirection(e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097a7]"
                        >
                          <option value="CLIENT_VERS_STOCK">Client ➔ Cab. (+1 Unité)</option>
                          <option value="STOCK_VERS_FOURNISSEUR">Cab ➔ Fournisseur (-1 Unité)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Quantité Retour</label>
                        <input 
                          type="number"
                          value={retQty}
                          min="1"
                          onChange={(e) => setRetQty(e.target.value)}
                          className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-550 uppercase font-semibold">Motif d'Échange ou Retractation</label>
                      <input 
                        type="text"
                        placeholder="Aberration de teinte sur le traitement anti-bleu..."
                        value={retReason}
                        onChange={(e) => setRetReason(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#0097a7]/15 hover:bg-[#0097a7]/25 border border-[#0097a7]/30 text-[#0097a7] py-2 rounded-lg text-xs font-bold transition cursor-pointer mt-2"
                    >
                      Enregistrer le dossier retour
                    </button>

                  </div>
                </form>
              )}

              {/* TAB E: TRANSFERTS INTER-BOUTIQUES */}
              {activeActionTab === 'transferts' && (
                <form onSubmit={handleSubmitTransfert} className="space-y-4">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-2 items-center text-[11px] font-mono text-indigo-700">
                    <ArrowLeftRight className="w-4 h-4 shrink-0 text-indigo-550" />
                    <span>Transférer du matériel entre succursales (Ajustera le point d'origine Nation).</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 text-xs text-slate-700">
                    
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase font-bold text-slate-500">Optique à acheminer</label>
                      <select 
                        value={transProduct}
                        onChange={(e) => setTransProduct(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097a7]"
                      >
                        {stockItems.map(p => (
                          <option key={p.id} value={p.id}>{p.brand} - {p.name} (Nation : {p.qty} dispo)</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[9px] text-slate-500 uppercase">De (Origine)</label>
                        <select 
                          value={transFrom}
                          onChange={(e) => setTransFrom(e.target.value)}
                          className="bg-slate-50 border border-slate-200 p-1.5 rounded text-slate-800 text-[11px]"
                        >
                          <option value="b1">Nation</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[9px] text-slate-500 uppercase">Vers (Cible)</label>
                        <select 
                          value={transTo}
                          onChange={(e) => setTransTo(e.target.value)}
                          className="bg-slate-50 border border-slate-200 p-1.5 rounded text-slate-800 text-[11px]"
                        >
                          <option value="b2">Bastille</option>
                          <option value="b3">Lyon Presqu'île</option>
                          <option value="b4">Marseille Prado</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[9px] text-slate-500 uppercase">Qté à bouger</label>
                        <input 
                          type="number"
                          value={transQty}
                          min="1"
                          onChange={(e) => setTransQty(e.target.value)}
                          className="bg-slate-50 border border-slate-200 p-1 text-center font-mono rounded text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase font-semibold">Livreur / Société Mandataire</label>
                      <input 
                        type="text"
                        value={transCourier}
                        onChange={(e) => setTransCourier(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-750 text-white py-2 rounded-lg text-xs font-bold transition cursor-pointer mt-2 border-0"
                    >
                      Initier la navette logistique 📦
                    </button>

                  </div>
                </form>
              )}

              {/* TAB F: AJUSTEMENT DIRECT */}
              {activeActionTab === 'ajustements' && (
                <form onSubmit={handleSubmitAjustement} className="space-y-4">
                  <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex gap-2 items-center text-[11px] font-mono text-amber-800">
                    <Sliders className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Correction d'anomalies de stock directes par administration.</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 text-xs text-slate-700">
                    
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase font-semibold">Matériel concerné</label>
                      <select 
                        value={adjProduct}
                        onChange={(e) => setAdjProduct(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097a7]"
                      >
                        {stockItems.map(p => (
                          <option key={p.id} value={p.id}>{p.brand} - {p.name} (Dispo : {p.qty})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase font-semibold">Facteur rectificatif de l'unité (+5, -3...)</label>
                      <input 
                        type="text"
                        placeholder="Ex: -2 ou +1"
                        value={adjValue}
                        onChange={(e) => setAdjValue(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-amber-700 font-bold focus:outline-none font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase font-semibold">Explications pour l'audit G-LAB</label>
                      <input 
                        type="text"
                        placeholder="Audit interne de fin d'exercice..."
                        value={adjNote}
                        onChange={(e) => setAdjNote(e.target.value)}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-800 focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#0097a7] hover:bg-[#00bcd4] text-white py-2 rounded-lg text-xs font-bold transition cursor-pointer mt-2 border-0"
                    >
                      Valider la rectification d'audit
                    </button>

                  </div>
                </form>
              )}

            </div>

          </div>

          {/* LEDGER OF ARCHITECTURAL EVENTS LOGS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col gap-2.5 shadow-sm">
            <h4 className="text-xs font-bold font-mono tracking-widest text-slate-500 uppercase">Flux logistiques récents</h4>
            
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {historyEvents.map(evt => (
                <div 
                  key={evt.id} 
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-1 text-[11px] font-mono hover:border-slate-200 transition"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold tracking-wider ${
                      evt.type === 'ENTREE' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : evt.type === 'SORTIE' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : evt.type === 'TRANSFERT'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {evt.type}
                    </span>
                    <span className="text-slate-400">{new Date(evt.timestamp).toLocaleTimeString('fr-FR')}</span>
                  </div>

                  <p className="text-slate-800 font-semibold">{evt.productName}</p>
                  <p className="text-slate-600 font-normal leading-normal">{evt.detail}</p>
                  
                  <div className="flex justify-between items-center mt-1 border-t border-slate-100 pt-1 text-[9.5px] text-slate-500">
                    <span>Ajustement : <strong className={evt.qtyChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {evt.qtyChange > 0 ? `+${evt.qtyChange}` : evt.qtyChange}
                    </strong></span>
                    <span>Hôte : {evt.operator}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* 3. QR CODE / PRINTABLE LABEL MODAL BOX */}
      {selectedLabelItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-950 rounded-2xl border border-slate-800 p-6 max-w-sm w-full space-y-5 shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
              <span className="text-xs font-bold font-mono text-[#00bcd4] uppercase">Étiquette d'Optique RFID/Code-barres</span>
              <button 
                onClick={() => setSelectedLabelItem(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Simulated Printed medical Label card layout */}
            <div className="p-5 bg-white text-slate-900 rounded-xl border border-slate-300 shadow-xl font-sans text-center flex flex-col items-center justify-center gap-2" id="printable-thermal-sticker-card">
              
              <div className="flex justify-between items-center w-full border-b border-slate-300 pb-1.5 mb-1.5 text-[9px] font-mono text-slate-600">
                <span>G-LAB OPTIC SAS</span>
                <span>RAYON : {selectedLabelItem.locationCode}</span>
              </div>

              {/* Product Info */}
              <span className="text-[10px] font-bold tracking-widest text-[#0097a7] uppercase">{selectedLabelItem.brand}</span>
              <h4 className="text-xs font-bold text-slate-950 leading-tight block max-w-[240px] truncate-2-lines line-clamp-2">{selectedLabelItem.name}</h4>
              <p className="text-[11px] font-mono font-bold text-slate-850 bg-slate-100 p-1 px-2 rounded-md mt-1 mb-2">
                PRIX : {selectedLabelItem.price.toLocaleString()} FCFA (TTC)
              </p>

              {/* Visual simulated QR-Code and Barcode */}
              <div className="flex items-center justify-center gap-6 my-1 p-2 bg-slate-50 rounded-lg border border-slate-200">
                
                {/* Simulated QR block layout */}
                <div className="p-1.5 bg-white border border-slate-300 rounded shrink-0 flex flex-col items-center gap-1">
                  <div className="w-14 h-14 bg-slate-950 flex flex-col items-center justify-center p-1 rounded">
                    {/* Simulated white pixel dots of qr */}
                    <QrCode className="w-12 h-12 text-white" />
                  </div>
                  <span className="text-[7.5px] font-mono text-slate-600">QR-CODE G-LAB</span>
                </div>

                {/* Simulated Barcode lines */}
                <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                  <Barcode className="w-16 h-8 text-slate-950 shrink-0" />
                  <span className="text-[8px] font-mono font-bold tracking-wider text-slate-900">
                    {selectedLabelItem.barcode}
                  </span>
                </div>

              </div>

              <div className="w-full border-t border-dashed border-slate-300 pt-2 mt-2 text-[8px] font-mono text-slate-500 uppercase leading-normal">
                Dispositif médical Certifié conforme aux normes<br/>NF EN ISO 21987 (CE) • G-LAB ERP
              </div>

            </div>

            {/* Dialog Footer options */}
            <div className="flex justify-between items-center pt-1.5">
              <span className="text-[10px] text-slate-500 font-mono">Format sticker : 50mm * 40mm</span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="p-1.5 px-3 bg-[#0097a7] hover:bg-[#00bcd4] font-semibold text-xs text-white rounded transition cursor-pointer flex items-center gap-1 shrink-0 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimer l'étiquette
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}
