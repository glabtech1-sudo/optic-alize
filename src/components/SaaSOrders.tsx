import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ShoppingCart, Eye, FileText, CheckCircle2, Plus, 
  Trash2, User, Download, UserPlus, Percent, Printer, Clock, 
  Coins, Filter, ShieldCheck, X, RefreshCw, Barcode, Volume2, 
  AlertTriangle, CreditCard, Landmark, Banknote
} from 'lucide-react';
import SAVModule from './SAVModule';

// Shared types
interface Order {
  id: string;
  customer: string;
  customerBirthDate?: string;
  date: string;
  time: string;
  itemCount: number;
  total: number;
  discountAmount: number;
  paymentMethod: string;
  shop: string;
  cashier: string;
  items: CartItem[];
  status: 'Paid' | 'Partial' | 'Cancelled';
  paidAmount: number;
  balanceRemaining: number;
  paymentSplits?: PaymentSplit[];
}

interface CartItem {
  id: string;
  name: string;
  brand: string;
  priceFCFA: number;
  qty: number;
  eyeSide: 'LEFT' | 'RIGHT' | 'BOTH' | 'NONE';
  discountPercent: number; // Item-level discount
}

interface ClinicPatient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
}

interface PaymentSplit {
  method: 'Espèces' | 'MOMO / Wave / Flooz' | 'Virement Bancaire' | 'Carte / Autre';
  amount: number;
  reference?: string;
}

// Unified Preset products (Lomé & Europe inventory fused entirely in FCFA)
interface FusedProduct {
  id: string;
  name: string;
  brand: string;
  category: 'Montures' | 'Verres' | 'Accessoires';
  priceFCFA: number;
  barcode: string;
  icon: string;
}

const DEFAULT_FUSED_CATALOG: FusedProduct[] = [
  { id: 'FC-101', name: 'Ray-Ban Wayfarer Classic (RB2140)', brand: 'Luxottica', category: 'Montures', priceFCFA: 104000, barcode: '805289122012', icon: '🕶️' },
  { id: 'FC-102', name: 'Essilor Varilux Physio Eye-Protect', brand: 'Essilor', category: 'Verres', priceFCFA: 140000, barcode: '321045230910', icon: '🔍' },
  { id: 'FC-103', name: 'Oakley Holbrook Sport polarized', brand: 'Luxottica', category: 'Montures', priceFCFA: 123000, barcode: '805289122055', icon: '🏂' },
  { id: 'FC-104', name: 'Chanel Cat-Eye Prestige Signature', brand: 'Chanel', category: 'Montures', priceFCFA: 210000, barcode: '313045920381', icon: '👓' },
  { id: 'FC-105', name: 'Zeiss SmartLife progressive Platinum', brand: 'Zeiss', category: 'Verres', priceFCFA: 95000, barcode: '321045100025', icon: '🔬' },
  { id: 'FC-106', name: 'Persol Steve McQueen Selection', brand: 'Luxottica', category: 'Montures', priceFCFA: 186000, barcode: '805289122099', icon: '🕶️' },
  { id: 'FC-107', name: 'Alcon Dailies Aquacomfort Plus (90)', brand: 'Alcon', category: 'Accessoires', priceFCFA: 45000, barcode: '350104100529', icon: '💧' },
  { id: 'FC-108', name: 'Prada Cinema Round Metal Luxe', brand: 'Prada', category: 'Montures', priceFCFA: 160000, barcode: '350104200150', icon: '👓' },
  { id: 'P-109', name: 'Wayfarer Black Matte Classic', brand: 'Ray-Ban', category: 'Montures', priceFCFA: 85000, barcode: '805289122013', icon: '👓' },
  { id: 'P-110', name: 'Cat-Eye Prestige Gold Filigree', brand: 'Chanel', category: 'Montures', priceFCFA: 185000, barcode: '313045920382', icon: '👓' },
  { id: 'P-111', name: 'Clubmaster Classic Acetate Vente', brand: 'Ray-Ban', category: 'Montures', priceFCFA: 95000, barcode: '805289122056', icon: '👓' },
  { id: 'P-112', name: 'Platinum Pilot Aviator Frame', brand: 'Cartier', category: 'Montures', priceFCFA: 450000, barcode: '761326442651', icon: '👓' },
  { id: 'P-113', name: 'Varilux Physio Crizal Sapphire HR', brand: 'Essilor', category: 'Verres', priceFCFA: 125000, barcode: '321045230912', icon: '🔍' },
  { id: 'P-114', name: 'Zeiss SmartLife Single Platinum HD', brand: 'Zeiss', category: 'Verres', priceFCFA: 90000, barcode: '321045100026', icon: '🔍' },
  { id: 'P-115', name: 'Kit Nettoyant Optic Alizé Anti-Buée Spray', brand: 'Optic Alizé', category: 'Accessoires', priceFCFA: 5000, barcode: '350104100530', icon: '💧' },
  { id: 'P-116', name: 'Étui Premium Cuir Grainé Optic Alizé Custom', brand: 'Optic Alizé', category: 'Accessoires', priceFCFA: 15000, barcode: '350104200151', icon: '📦' }
];

// Clinic patients database for search automatic filling
const CLINIC_PATIENTS: ClinicPatient[] = [
  { id: 'c1-7501', firstName: 'Hélène', lastName: 'Dubois-Chambery', birthDate: '1974-05-12', email: 'helene.dubois@gmail.com', phone: '06 12 45 78 90' },
  { id: 'c2-6902', firstName: 'Jean-Pierre', lastName: 'Gomez-Viguier', birthDate: '1961-11-20', email: 'jp.gomez@orange.fr', phone: '06 91 82 73 64' },
  { id: 'c3-1303', firstName: 'Sarah', lastName: 'El-Amri', birthDate: '1989-08-04', email: 'sarah.amri@live.fr', phone: '07 81 29 45 61' },
  { id: 'c4-8402', firstName: 'Mamadi', lastName: 'Diarra', birthDate: '1981-10-15', email: 'm.diarra@gmail.com', phone: '+228 90 12 34 56' },
  { id: 'c5-9204', firstName: 'Awa', lastName: 'Niang', birthDate: '1993-02-28', email: 'awa.niang@hotmail.com', phone: '+228 91 45 67 89' }
];

interface SaaSOrdersProps {
  darkMode?: boolean;
  currentLanguage?: 'FR' | 'EN';
  currentCompany?: {
    id: string;
    name: string;
    currency: string;
    taxRate: number;
    symbol: string;
  };
  isOffline?: boolean;
}

export default function SaaSOrders({ 
  darkMode = false,
  currentLanguage = 'FR',
  currentCompany,
  isOffline = false
}: SaaSOrdersProps) {
  const currentShop = currentCompany?.name || "Optic Alizé - Dépôt Central";
  const currentCashier = "M. Diallo (Caisse Globale Unifiée)";
  
  // Tab layout aligns strictly: caisse; sav; historique
  const [activeSubTab, setActiveSubTab] = useState<'caisse' | 'sav' | 'history'>('caisse');
  
  // Custom alerts
  const [notification, setNotification] = useState<string | null>(null);

  // Sales History List State (preset with historic sales in FCFA)
  const [orders, setOrders] = useState<Order[]>([]);

  // Catalog State - Empty by default as requested by user ("vider tout les 18 articles")
  const [catalog, setCatalog] = useState<FusedProduct[]>([]);

  // Load orders and catalog per boutique when currentShop changes
  React.useEffect(() => {
    const orderKey = `optic_saas_orders_${currentShop}`;
    const savedOrders = localStorage.getItem(orderKey);
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          setOrders(parsed);
          return;
        }
      } catch (e) {}
    }

    // Preseeded orders for central boutique, empty for new ones!
    if (currentShop === "Optic Alizé - Dépôt Central" && localStorage.getItem('optic_system_factory_reset') !== 'true') {
      const defaults: Order[] = [
        { 
          id: 'ORD-9842', 
          customer: 'Hélène Dubois-Chambery', 
          customerBirthDate: '1974-05-12',
          date: '2026-06-11', 
          time: '09:20:15',
          itemCount: 2, 
          total: 244000, 
          discountAmount: 15000,
          paymentMethod: 'Carte Bancaire / MOMO', 
          shop: 'Optic Alizé - Dépôt Central',
          cashier: 'M. Diallo (Gérant principal)',
          items: [
            { id: 'FC-101', name: 'Ray-Ban Wayfarer Classic (RB2140)', brand: 'Luxottica', priceFCFA: 104000, qty: 1, eyeSide: 'NONE', discountPercent: 0 },
            { id: 'FC-102', name: 'Essilor Varilux Physio Eye-Protect', brand: 'Essilor', priceFCFA: 140000, qty: 1, eyeSide: 'BOTH', discountPercent: 0 }
          ],
          status: 'Paid',
          paidAmount: 244000,
          balanceRemaining: 0
        },
        { 
          id: 'ORD-9841', 
          customer: 'Awa Niang', 
          customerBirthDate: '1993-02-28',
          date: '2026-06-11', 
          time: '08:45:00',
          itemCount: 1, 
          total: 123000, 
          discountAmount: 0,
          paymentMethod: 'MOMO / Wave', 
          shop: 'Optic Alizé - Dépôt Central',
          cashier: 'M. Diallo (Gérant principal)',
          items: [
            { id: 'FC-103', name: 'Oakley Holbrook Sport polarized', brand: 'Luxottica', priceFCFA: 123000, qty: 1, eyeSide: 'NONE', discountPercent: 0 }
          ],
          status: 'Paid',
          paidAmount: 123000,
          balanceRemaining: 0
        },
        { 
          id: 'ORD-9840', 
          customer: 'Jean-Pierre Gomez-Viguier', 
          customerBirthDate: '1961-11-20',
          date: '2026-06-10', 
          time: '16:04:11',
          itemCount: 1, 
          total: 95000, 
          discountAmount: 10000,
          paymentMethod: 'Espèces', 
          shop: 'Optic Alizé - Dépôt Central',
          cashier: 'M. Diallo (Gérant principal)',
          items: [
            { id: 'FC-105', name: 'Zeiss SmartLife progressive Platinum', brand: 'Zeiss', priceFCFA: 95000, qty: 1, eyeSide: 'BOTH', discountPercent: 10 }
          ],
          status: 'Paid',
          paidAmount: 95000,
          balanceRemaining: 0
        }
      ];
      setOrders(defaults);
      localStorage.setItem(orderKey, JSON.stringify(defaults));
    } else {
      setOrders([]);
    }
  }, [currentShop]);

  React.useEffect(() => {
    const catalogKey = `optic_fused_catalog_${currentShop}`;
    const savedCatalog = localStorage.getItem(catalogKey);
    if (savedCatalog) {
      try {
        const parsed = JSON.parse(savedCatalog);
        if (Array.isArray(parsed)) {
          setCatalog(parsed);
          return;
        }
      } catch (e) {}
    }
    setCatalog([]);
  }, [currentShop]);

  React.useEffect(() => {
    if (orders.length > 0 || localStorage.getItem(`optic_saas_orders_${currentShop}`)) {
      localStorage.setItem(`optic_saas_orders_${currentShop}`, JSON.stringify(orders));
    }
  }, [orders, currentShop]);

  React.useEffect(() => {
    localStorage.setItem(`optic_fused_catalog_${currentShop}`, JSON.stringify(catalog));
  }, [catalog, currentShop]);

  React.useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(`optic_saas_orders_${currentShop}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        } else if (localStorage.getItem('optic_system_factory_reset') === 'true') {
          setOrders([]);
        }
      } catch (e) {}
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, [currentShop]);

  // Unified Scanner & Search State
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'Tous' | 'Montures' | 'Verres' | 'Accessoires'>('Tous');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Form states to add custom products to the POS catalog
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'Montures' | 'Verres' | 'Accessoires'>('Montures');
  const [newProdIcon, setNewProdIcon] = useState('👓');

  const handleAddProductToCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) {
      showBannerToast('Veuillez remplir le nom et le prix.');
      return;
    }
    const newProduct: FusedProduct = {
      id: `FC-${Date.now()}`,
      name: newProdName.trim(),
      brand: newProdBrand.trim() || 'G-LAB',
      category: newProdCategory,
      priceFCFA: parseFloat(newProdPrice) || 0,
      barcode: newProdBarcode.trim() || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      icon: newProdIcon
    };
    setCatalog(prev => [...prev, newProduct]);
    setShowAddForm(false);
    
    setNewProdName('');
    setNewProdBrand('');
    setNewProdPrice('');
    setNewProdBarcode('');
    setNewProdCategory('Montures');
    setNewProdIcon('👓');
    
    showBannerToast(`Produit "${newProduct.name}" ajouté avec succès !`);
  };

  // Cart State Variables
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number>(0);
  
  // Clinical Patient & Direct counter Sale attachment
  const [selectedPatientId, setSelectedPatientId] = useState<string>('anonymous');
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');
  const [showPatientDropdown, setShowPatientDropdown] = useState<boolean>(false);
  const [customClientName, setCustomClientName] = useState<string>('');
  const [customClientBirth, setCustomClientBirth] = useState<string>('');

  // Multiple & Split Payments State representation (Paris register legacy feature)
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    { method: 'Espèces', amount: 0 }
  ]);

  // Acompte Tracking: Deposit payment or partial sale
  const [customAcompteAmount, setCustomAcompteAmount] = useState<string>('');

  // Filter variables for History Tab
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  // Currently viewing receipt popup state
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Active cashier detail (Unified shop metadata)
  // Already defined dynamically at the top of the component

  // --- SOUND BEEPER SYNTHESIZER ---
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(1150, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio Context non-supporté par le navigateur pour le bip.");
    }
  };

  // --- BARCODE SCANNER ACTION ---
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const matched = catalog.find(p => p.barcode === barcodeInput.trim());
    if (matched) {
      playBeep();
      addToCart(matched);
      setBarcodeInput('');
      showBannerToast(`Produit "${matched.name}" scanné avec succès !`);
    } else {
      showBannerToast(`Erreur : Aucun produit rattaché au code-barres "${barcodeInput}"`);
    }
  };

  const showBannerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // --- INTERACTIVE CART METHODS ---
  const addToCart = (product: FusedProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        brand: product.brand, 
        priceFCFA: product.priceFCFA, 
        qty: 1,
        eyeSide: 'NONE',
        discountPercent: 0
      }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const updateCartSide = (id: string, side: 'LEFT' | 'RIGHT' | 'BOTH' | 'NONE') => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, eyeSide: side } : item));
  };

  const updateCartItemDiscount = (id: string, disc: number) => {
    const capped = Math.max(0, Math.min(100, disc));
    setCart(prev => prev.map(item => item.id === id ? { ...item, discountPercent: capped } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setGlobalDiscountPercent(0);
    setPaymentSplits([{ method: 'Espèces', amount: 0 }]);
    setCustomAcompteAmount('');
  };

  // --- FINANCIAL CALCULATION ENGINE ---
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const rawPrice = item.priceFCFA * item.qty;
      const itemDiscount = Math.round(rawPrice * (item.discountPercent / 100));
      return sum + (rawPrice - itemDiscount);
    }, 0);
  }, [cart]);

  const globalDiscountAmount = useMemo(() => {
    return Math.round(cartSubtotal * (globalDiscountPercent / 100));
  }, [cartSubtotal, globalDiscountPercent]);

  const cartTotalTTC = useMemo(() => {
    return Math.max(0, cartSubtotal - globalDiscountAmount);
  }, [cartSubtotal, globalDiscountAmount]);

  // Update total default split payment to match total price automatically if not manual
  const syncDefaultSplitValue = () => {
    if (paymentSplits.length === 1) {
      setPaymentSplits([{ ...paymentSplits[0], amount: cartTotalTTC }]);
    }
  };

  // --- SPLIT PAYMENTS MANAGEMENT ---
  const addPaymentSplit = () => {
    setPaymentSplits(prev => [...prev, { method: 'MOMO / Wave / Flooz', amount: 0 }]);
  };

  const removePaymentSplit = (index: number) => {
    setPaymentSplits(prev => prev.filter((_, i) => i !== index));
  };

  const updatePaymentSplit = (index: number, key: keyof PaymentSplit, val: any) => {
    setPaymentSplits(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: val };
      }
      return item;
    }));
  };

  const totalSplitRegistered = useMemo(() => {
    return paymentSplits.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [paymentSplits]);

  // --- PATIENT AUT0-FILLING ---
  const foundPatients = useMemo(() => {
    return CLINIC_PATIENTS.filter(p => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      p.phone.includes(clientSearchQuery)
    );
  }, [clientSearchQuery]);

  const handleSelectPatient = (patient: ClinicPatient) => {
    setSelectedPatientId(patient.id);
    setCustomClientName(`${patient.firstName} ${patient.lastName}`);
    setCustomClientBirth(patient.birthDate);
    setClientSearchQuery(`${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);
  };

  const handleSetAnonymous = () => {
    setSelectedPatientId('anonymous');
    setCustomClientName('Client de passage / Vente Directe');
    setCustomClientBirth('');
    setClientSearchQuery('');
    setShowPatientDropdown(false);
  };

  // --- PROCESS TRANSACTION & ACCOMPTES ---
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Le panier de vente est vide, veuillez sélectionner au moins un article.");
      return;
    }

    // Determine final payment ledger parameters
    const depositSpecified = parseFloat(customAcompteAmount);
    const useSplitPayments = paymentSplits.length > 1 || totalSplitRegistered > 0;
    
    const paidAmount = !isNaN(depositSpecified) && depositSpecified > 0 
      ? depositSpecified 
      : (useSplitPayments ? totalSplitRegistered : cartTotalTTC);

    if (paidAmount < 0) {
      alert("Le solde versé ne peut pas être un montant négatif.");
      return;
    }

    const isPartial = paidAmount < cartTotalTTC;
    const balanceRemaining = Math.max(0, cartTotalTTC - paidAmount);
    const finalClientName = selectedPatientId === 'anonymous' 
      ? (customClientName.trim() || 'Client de passage / Vente Directe')
      : customClientName;

    // Concoct the transaction payment methods labels
    let transactionMethods = paymentSplits.map(s => s.method).filter((v, i, a) => a.indexOf(v) === i).join(' + ');
    if (isPartial) {
      transactionMethods += " (Acompte partiel)";
    }

    const newOrderId = `ORD-${Math.floor(9843 + Math.random() * 500)}`;
    const now = new Date();
    const currentDateString = now.toISOString().split('T')[0];
    const currentTimeString = now.toTimeString().split(' ')[0];

    const completedOrder: Order = {
      id: newOrderId,
      customer: finalClientName,
      customerBirthDate: selectedPatientId === 'anonymous' ? (customClientBirth || undefined) : customClientBirth,
      date: currentDateString,
      time: currentTimeString,
      itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
      total: cartTotalTTC,
      discountAmount: globalDiscountAmount,
      paymentMethod: transactionMethods || 'Espèces',
      shop: currentShop,
      cashier: currentCashier,
      items: [...cart],
      status: isPartial ? 'Partial' : 'Paid',
      paidAmount: paidAmount,
      balanceRemaining: balanceRemaining,
      paymentSplits: [...paymentSplits]
    };

    setOrders(prev => [completedOrder, ...prev]);
    setSelectedReceiptOrder(completedOrder);
    clearCart();
    handleSetAnonymous();
    showBannerToast(`Transaction ${newOrderId} enregistrée (${isPartial ? 'Acompte partiel' : 'Paiement complet'}) !`);
  };

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return '';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} ans`;
  };

  // --- HIGH FIDELITY 2-UP INVOICE PRINTING ---
  const handlePrintReceipt = (receipt: Order) => {
    const formattedDate = new Date(`${receipt.date}T${receipt.time}`).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const ageStr = calculateAge(receipt.customerBirthDate);

    const receiptHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Recu_Optic_Alize_${receipt.id}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 15mm;
        }
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            background-color: #fff;
            color: #1e293b;
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .container {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 275mm; /* Hauteur de tchat A4 sans rompre sur la page suivante */
            box-sizing: border-box;
        }
        .receipt-card {
            border: 1.5px solid #cbd5e1;
            border-radius: 12px;
            padding: 24px;
            width: 100%;
            box-sizing: border-box;
            background: #fff;
            position: relative;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .divider { border-bottom: 1.5px dashed #94a3b8; margin: 12px 0; }
        .title { font-size: 15px; font-weight: 800; text-transform: uppercase; margin-bottom: 3px; color: #075E54; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
        th { font-weight: 700; background-color: #f8fafc; color: #475569; text-transform: uppercase; font-size: 9px; }
        .font-mono { font-family: 'JetBrains Mono', monospace; font-size: 10px; }
        .mb-2 { margin-bottom: 10px; }
        .scissors-line {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            margin: 8px 0;
            position: relative;
            user-select: none;
        }
        .scissors-line::before {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            border-top: 2px dashed #94a3b8;
            z-index: 1;
        }
        .scissors-icon {
            background-color: #fff;
            padding: 0 16px;
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            z-index: 2;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .badge {
            display: inline-block;
            background-color: #f1f5f9;
            color: #334155;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- RENDER INNER CARDS IN VERTICAL HEAD & FOOT POSITION -->
        ${[1, 2].map((num) => `
            <div class="receipt-card">
                <div class="text-center">
                    <div class="title">Optic Alizé Studio SA</div>
                    <span style="font-size: 9px; color: #64748b; font-weight: 500;">Caisse Globale Unifiée • Réseau National</span><br/>
                    <span style="font-size: 9px; color: #94a3b8; font-weight: 500;">Succursales Unifiées</span>
                </div>
                
                <div class="divider"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; line-height: 1.5;">
                    <div>
                        <strong>Ticket N° :</strong> <span class="font-mono">${receipt.id}</span> <span class="badge">${num === 1 ? 'COPIE CLIENT' : 'COPIE MAGASIN'}</span><br/>
                        <strong>Date d'Émission :</strong> ${formattedDate} à ${receipt.time}<br/>
                        <strong>Opérateur / Caissier :</strong> ${receipt.cashier}
                    </div>
                    <div style="text-align: right;">
                        <strong>Bénéficiaire :</strong> ${receipt.customer}<br/>
                        ${ageStr ? `<strong>Âge :</strong> ${ageStr}<br/>` : ''}
                        <strong>Mode de Règlement :</strong> ${receipt.paymentMethod}
                    </div>
                </div>
                
                <div class="divider"></div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Désignation Article / Composant Optique</th>
                            <th>Côté</th>
                            <th class="text-center">Qté</th>
                            <th class="text-right">Remise</th>
                            <th class="text-right">Sous-Total (FCFA)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${receipt.items.map(it => {
                          const rawPrice = it.priceFCFA * it.qty;
                          const discount = Math.round(rawPrice * ((it.discountPercent || 0) / 100));
                          return `
                            <tr>
                                <td style="font-weight: 600; color: #0f172a;">${it.name}</td>
                                  <td><span class="badge">${it.eyeSide || 'Standard'}</span></td>
                                  <td class="text-center">${it.qty}</td>
                                  <td class="text-right">${it.discountPercent > 0 ? it.discountPercent + '%' : '-'}</td>
                                  <td class="text-right font-mono">${(rawPrice - discount).toLocaleString()}</td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
                
                <div class="divider"></div>
                
                <div class="mb-2" style="display: flex; justify-content: flex-end;">
                    <table style="border: none; margin: 0; width: 320px;">
                        <tr style="border: none;">
                            <td style="border: none; padding: 3px 0;">Total Brut :</td>
                            <td style="border: none; padding: 3px 0;" class="text-right font-mono">${(receipt.total + receipt.discountAmount).toLocaleString()} XOF</td>
                        </tr>
                        ${receipt.discountAmount > 0 ? `
                            <tr style="border: none; color: #ef4444;">
                                <td style="border: none; padding: 3px 0;">Remise générale :</td>
                                <td style="border: none; padding: 3px 0;" class="text-right font-mono">-${receipt.discountAmount.toLocaleString()} XOF</td>
                            </tr>
                        ` : ''}
                        <tr style="border: none; font-weight: bold; font-size: 12px; border-top: 1px solid #e1e8f0;">
                            <td style="border: none; padding: 5px 0;">Net à Payer :</td>
                            <td style="border: none; padding: 5px 0;" class="text-right font-mono text-emerald-700">${receipt.total.toLocaleString()} FCFA</td>
                        </tr>
                        <tr style="border: none; color: #1e3a8a; font-weight: 600;">
                            <td style="border: none; padding: 3px 0;">Acompte Encaissé :</td>
                            <td style="border: none; padding: 3px 0;" class="text-right font-mono">${receipt.paidAmount.toLocaleString()} FCFA</td>
                        </tr>
                        ${receipt.balanceRemaining > 0 ? `
                            <tr style="border: none; color: #b91c1c; font-weight: 700; border-top: 1px dotted #ef4444;">
                                <td style="border: none; padding: 4px 0;">Reste à payer (Solde dû) :</td>
                                <td style="border: none; padding: 4px 0;" class="text-right font-mono">${receipt.balanceRemaining.toLocaleString()} FCFA</td>
                            </tr>
                        ` : `
                            <tr style="border: none; color: #16a34a; font-weight: 700;">
                                <td style="border: none; padding: 4px 0;">Statut Facture :</td>
                                <td style="border: none; padding: 4px 0;" class="text-right font-mono">SOLDE INTÉGRALEMENT PAYÉ</td>
                            </tr>
                        `}
                    </table>
                </div>
                
                <div class="divider"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #64748b;">
                    <span>Mode de certification d'opération : Double scellage numérique conforme UEMOA.</span>
                    <span>Merci pour votre confiance • Optic Alizé v1.2.5</span>
                </div>
            </div>
        `).join('<div class="scissors-line"><span class="scissors-icon">✂--- LIGNE DE COUPE - COPIE CLIENT EN HAUT &bull; COPIE MAGASIN EN BAS ---✂</span></div>')}
    </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Erreur de blocage publicitaire, veuillez autoriser les fenêtres pop-up.");
      return;
    }
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter Catalog lists
  const filteredCatalog = useMemo(() => {
    return catalog.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
                            p.brand.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                            p.barcode.includes(productSearchQuery);
      const matchesCat = selectedCategory === 'Tous' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [catalog, productSearchQuery, selectedCategory]);

  // Filter History lists
  const filteredHistory = useMemo(() => {
    return orders.filter(ord => {
      const matchesSearch = ord.id.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                            ord.customer.toLowerCase().includes(historySearchQuery.toLowerCase());
      const matchesStatus = historyStatusFilter === 'All' || ord.status === historyStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, historySearchQuery, historyStatusFilter]);

  return (
    <div className="space-y-6">
      
      {/* Banner Toast Alerts */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e293b] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-in text-xs font-semibold">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* POS Segmented Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
            <ShoppingCart className="w-3.5 h-3.5" />
            {currentLanguage === 'FR' ? 'Terminal de Règlement' : 'Checkout Merchant Terminal'}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 mt-2">
            {currentLanguage === 'FR' ? "Point de Vente d'Optique" : "Optical Point of Sale (POS)"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentLanguage === 'FR' 
              ? "Note : Toutes les transactions en zone Afrique de l'Ouest de G-LAB opèrent uniquement en XOF / FCFA." 
              : "Note: All transactions for G-LAB West African regional zone operate solely in XOF / FCFA."}
          </p>
        </div>

        {/* Unified Tab toggling */}
        <div className="flex bg-slate-50 border border-slate-150 p-1 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('caisse')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition ${activeSubTab === 'caisse' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'FR' ? 'Caisse' : 'Checkout Register'}</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition ${activeSubTab === 'history' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'FR' ? 'Historique' : 'Sales Logs'}</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE PREVIEW */}
      {activeSubTab === 'caisse' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: PRODUCTS CATALOG OR SCANNER (8-COLUMNS) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* Catalog list + Search options */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
              
              {/* Dual Scan and Search Inputs Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 border-b border-slate-100/60">
                {/* 1. Barcode Scanning Action (Auto-submit on Enter / Hardware Scanner compatibility) */}
                <form onSubmit={handleBarcodeScan} className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Barcode className="w-4 h-4 text-blue-500" />
                  </div>
                  <input 
                    type="text" 
                    placeholder={currentLanguage === 'FR' ? "Scanner Code-barres [Entrée]..." : "Scan Barcode [Enter]..."} 
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    className="w-full bg-blue-50/40 border border-blue-200 text-xs text-blue-900 rounded-xl pl-9 pr-20 py-2 focus:outline-none focus:border-blue-500 focus:bg-white transition font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg transition select-none cursor-pointer"
                  >
                    {currentLanguage === 'FR' ? 'Valider' : 'Submit'}
                  </button>
                </form>

                {/* 2. Textual Search Query */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder={currentLanguage === 'FR' ? "Chercher par nom, marque..." : "Search by product name, brand..."} 
                    value={productSearchQuery}
                    onChange={e => setProductSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">
                    {currentLanguage === 'FR' ? 'Catalogue Général' : 'General Catalog'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    ({filteredCatalog.length} {currentLanguage === 'FR' ? 'articles trouvés' : 'articles found'})
                  </span>
                </div>
                
                {/* Catalog management tools */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition select-none cursor-pointer border border-blue-200"
                    title={currentLanguage === 'FR' ? "Ajouter un article" : "Add an article"}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{currentLanguage === 'FR' ? "Ajouter" : "Add"}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(currentLanguage === 'FR' ? "Voulez-vous restaurer les 16 articles par défaut dans le Point de Vente ?" : "Do you want to restore the 16 default articles?")) {
                        setCatalog(DEFAULT_FUSED_CATALOG);
                        showBannerToast(currentLanguage === 'FR' ? "Catalogue par défaut restauré !" : "Default catalog restored!");
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg transition select-none cursor-pointer border border-slate-200"
                    title={currentLanguage === 'FR' ? "Restaurer défauts" : "Restore defaults"}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{currentLanguage === 'FR' ? "Restaurer" : "Restore"}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(currentLanguage === 'FR' ? "Voulez-vous vider tous les articles du Point de Vente ?" : "Do you want to clear all articles?")) {
                        setCatalog([]);
                        showBannerToast(currentLanguage === 'FR' ? "Le Point de Vente est maintenant vide !" : "The POS is now empty!");
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition select-none cursor-pointer border border-rose-200"
                    title={currentLanguage === 'FR' ? "Tout vider" : "Clear all"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{currentLanguage === 'FR' ? "Tout vider" : "Clear All"}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible form to add product */}
              {showAddForm && (
                <form onSubmit={handleAddProductToCatalog} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 animate-fade-in text-xs text-slate-700">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-1">
                    <span className="font-extrabold text-[#111827] uppercase tracking-wider text-[10px]">
                      {currentLanguage === 'FR' ? 'Ajouter un nouvel article au POS' : 'Add New Item to POS'}
                    </span>
                    <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 transition">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nom du produit *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Ray-Ban Aviator Noir" 
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Marque / Fabricant</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Luxottica" 
                        value={newProdBrand}
                        onChange={e => setNewProdBrand(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prix de vente (FCFA) *</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Ex: 95000" 
                        value={newProdPrice}
                        onChange={e => setNewProdPrice(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Code-barres / EAN</label>
                      <input 
                        type="text" 
                        placeholder="Laisser vide pour auto-générer" 
                        value={newProdBarcode}
                        onChange={e => setNewProdBarcode(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Catégorie *</label>
                      <select 
                        value={newProdCategory}
                        onChange={e => setNewProdCategory(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 transition"
                      >
                        <option value="Montures">{currentLanguage === 'FR' ? 'Montures' : 'Frames'}</option>
                        <option value="Verres">{currentLanguage === 'FR' ? 'Verres' : 'Lenses'}</option>
                        <option value="Accessoires">{currentLanguage === 'FR' ? 'Accessoires' : 'Accessories'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Icône :</span>
                      {['👓', '🕶️', '🔍', '🔬', '💧', '📦'].map(ico => (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => setNewProdIcon(ico)}
                          className={`text-base p-1.5 rounded-lg border transition ${newProdIcon === ico ? 'bg-blue-50 border-blue-300 scale-110 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-100'}`}
                        >
                          {ico}
                        </button>
                      ))}
                    </div>
                    <button 
                      type="submit" 
                      className="px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold uppercase tracking-wider rounded-lg transition text-[10px] cursor-pointer"
                    >
                      {currentLanguage === 'FR' ? 'Enregistrer' : 'Save Product'}
                    </button>
                  </div>
                </form>
              )}

              {/* Taxonomy categories pills */}
              <div className="flex gap-2.5 flex-wrap overflow-x-auto pb-1 border-b border-slate-100">
                {(['Tous', 'Montures', 'Verres', 'Accessoires'] as const).map(cat => {
                  const label = currentLanguage === 'FR' 
                    ? cat 
                    : (cat === 'Tous' ? 'All' : cat === 'Montures' ? 'Frames' : cat === 'Verres' ? 'Lenses' : 'Accessories');
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition select-none cursor-pointer ${selectedCategory === cat ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Products list styled as a high density vertical stack list */}
              <div className="flex flex-col gap-2">
                {filteredCatalog.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    className="group flex items-center justify-between border border-slate-100 hover:border-blue-200 rounded-xl p-3 bg-slate-50/50 hover:bg-white transition cursor-pointer hover:shadow-2xs select-none"
                  >
                    {/* Brand icon and name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xl shrink-0">{p.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider font-mono shrink-0">{p.brand}</span>
                          <span className="text-[10px] font-bold font-mono text-slate-400">Code: {p.barcode}</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-800 truncate mt-1 leading-tight group-hover:text-blue-700 font-sans">{p.name}</h4>
                      </div>
                    </div>
                    {/* Price and Add item icon */}
                    <div className="flex items-center gap-4 shrink-0 pl-1">
                      <span className="text-xs font-black text-slate-900 font-mono">{p.priceFCFA.toLocaleString()} FCFA</span>
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: BASKET / CURRENT CART TICKET & CHECKOUT SETTINGS (4-COLUMNS / 5-COLUMNS) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden text-slate-800">
              
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Ticket de Vente actif</span>
                </div>
                <button 
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-white font-bold cursor-pointer"
                >
                  Vider
                </button>
              </div>

              {/* Patient Autocomplete links with prescriptions database */}
              <div className="p-4 bg-slate-50 border-b border-slate-150 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-widest">
                  <span>Client / Prescrit Patient</span>
                  {selectedPatientId !== 'anonymous' && (
                    <button type="button" onClick={handleSetAnonymous} className="text-rose-500 font-bold hover:underline">X Détacher</button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-300 absolute left-2.5 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Attacher patient clinique (Entrez son nom...)"
                    value={clientSearchQuery}
                    onChange={e => {
                      setClientSearchQuery(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                  {showPatientDropdown && clientSearchQuery.trim() !== '' && (
                    <div className="absolute top-10 left-0 right-0 z-10 bg-white border border-slate-200 rounded-lg shadow-xl divide-y max-h-48 overflow-y-auto">
                      {foundPatients.length > 0 ? (
                        foundPatients.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => handleSelectPatient(p)}
                            className="p-2 text-xs hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-bold text-slate-800">{p.firstName} {p.lastName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.phone}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-xs text-slate-400 text-center">Aucun dossier patient correspondant</div>
                      )}
                    </div>
                  )}
                </div>

                {selectedPatientId === 'anonymous' ? (
                  <div className="space-y-1.5 pt-1.5">
                    <input 
                      type="text" 
                      placeholder="Nom client passager (Enregistrement libre)"
                      value={customClientName}
                      onChange={e => setCustomClientName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-lg flex items-center justify-between text-xs mt-1">
                    <div>
                      <span className="font-extrabold text-blue-900 block">{customClientName}</span>
                      <span className="text-[10px] text-blue-600 block">Dossier : #{selectedPatientId} • Né le : {customClientBirth}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-150 text-blue-800 rounded text-[9px] font-bold uppercase tracking-wider font-sans">Lié</span>
                  </div>
                )}
              </div>

              {/* Basket list items */}
              <div className="p-4 divide-y divide-slate-100 max-h-60 overflow-y-auto space-y-2.5">
                {cart.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <div className="text-3xl">🛒</div>
                    <span className="text-xs text-slate-450 font-bold block">Le panier est actuellement vide</span>
                  </div>
                ) : (
                  cart.map(item => {
                    const lineTotal = item.priceFCFA * item.qty;
                    const lineDisc = Math.round(lineTotal * (item.discountPercent / 100));
                    return (
                      <div key={item.id} className="pt-2.5 first:pt-0 space-y-2 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-extrabold text-slate-800 block leading-tight">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase font-mono">{item.brand}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-350 hover:text-rose-500 cursor-pointer select-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line settings: Sides options & specific item discount */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5 border-t border-slate-50">
                          {/* Side selectors */}
                          <div className="flex bg-slate-50 border p-0.5 rounded-lg shrink-0">
                            {(['LEFT', 'RIGHT', 'BOTH', 'NONE'] as const).map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => updateCartSide(item.id, s)}
                                className={`px-1.5 py-1 text-[9px] font-black rounded-md select-none transition ${item.eyeSide === s ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}
                              >
                                {s === 'LEFT' ? 'OG' : s === 'RIGHT' ? 'OD' : s === 'BOTH' ? 'Paire' : 'Std'}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1">
                            <Percent className="w-3 h-3 text-slate-400" />
                            <input 
                              type="number" 
                              min="0" 
                              max="100" 
                              placeholder="Rem." 
                              value={item.discountPercent || ''}
                              onChange={e => updateCartItemDiscount(item.id, parseInt(e.target.value) || 0)}
                              className="w-11 bg-slate-50 border rounded p-1 text-[10px] text-right focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          {/* Quantity control actions */}
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 bg-slate-50 border rounded-lg hover:bg-slate-100 flex items-center justify-center font-bold text-xs">-</button>
                            <span className="font-mono font-extrabold px-1 text-slate-700">{item.qty}</span>
                            <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 bg-slate-50 border rounded-lg hover:bg-slate-100 flex items-center justify-center font-bold text-xs">+</button>
                          </div>
                          <span className="font-mono font-semibold text-slate-800">
                            {lineDisc > 0 ? (
                              <>
                                <span className="line-through text-slate-350 text-[10px] mr-1">{lineTotal.toLocaleString()}</span>
                                <span className="text-blue-900 font-bold">{(lineTotal - lineDisc).toLocaleString()} F</span>
                              </>
                            ) : (
                              <span>{lineTotal.toLocaleString()} F</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Shopping parameters and totals panel */}
              {cart.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3.5 text-xs">
                  
                  {/* General Cart global discount */}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500">Remise globale ticket</span>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={globalDiscountPercent || ''}
                        onChange={e => setGlobalDiscountPercent(parseInt(e.target.value) || 0)}
                        className="w-12 bg-white border border-slate-200 rounded p-1 text-xs text-right focus:outline-none focus:border-blue-500 font-semibold"
                      />
                      <span className="font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {/* Calculations and Summary listing */}
                  <div className="space-y-1.5 border-t border-dashed border-slate-200 pt-3">
                    <div className="flex justify-between text-slate-500">
                      <span>Sous-total articles :</span>
                      <span className="font-mono font-bold">{cartSubtotal.toLocaleString()} FCFA</span>
                    </div>
                    {globalDiscountAmount > 0 && (
                      <div className="flex justify-between text-red-500 font-semibold">
                        <span>Remise globale ticket :</span>
                        <span className="font-mono font-bold">-{globalDiscountAmount.toLocaleString()} FCFA</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-850 font-black text-sm pt-1 border-t border-slate-150">
                      <span>Net TTC à payer :</span>
                      <span className="font-mono text-blue-900 font-black text-base">{cartTotalTTC.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  {/* Split payments ledger block (Multiple Payment Methods) */}
                  <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-2.5">
                    <div className="flex justify-between items-center font-bold text-[10px] text-slate-500 uppercase tracking-widest">
                      <span>Modes d'occupation multiples</span>
                      <button 
                        type="button" 
                        onClick={addPaymentSplit} 
                        className="text-blue-600 hover:underline text-[9px] font-black"
                      >
                        + Ajouter split
                      </button>
                    </div>

                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {paymentSplits.map((split, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <select
                            value={split.method}
                            onChange={e => updatePaymentSplit(idx, 'method', e.target.value)}
                            className="bg-slate-50 border rounded px-1.5 py-1 text-[10px] focus:outline-none w-1/2 cursor-pointer font-bold text-slate-700"
                          >
                            <option value="Espèces">💵 Espèces</option>
                            <option value="MOMO / Wave / Flooz">📱 Momo / Wave</option>
                            <option value="Virement Bancaire">🏦 Virement</option>
                            <option value="Carte / Autre">💳 Carte / Autre</option>
                          </select>
                          
                          <input 
                            type="number"
                            placeholder="Montant FCFA"
                            value={split.amount || ''}
                            onChange={e => {
                              updatePaymentSplit(idx, 'amount', parseFloat(e.target.value) || 0);
                            }}
                            className="bg-slate-50 border rounded px-1.5 py-1 text-[10px] focus:outline-none text-right w-1/3 text-slate-700 font-bold font-mono"
                          />

                          {paymentSplits.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removePaymentSplit(idx)}
                              className="text-rose-500 hover:text-rose-700 font-bold font-sans select-none"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {paymentSplits.length > 1 && (
                      <div className="flex justify-between border-t border-dashed pt-1.5 text-[10px] items-center">
                        <span className="font-bold text-slate-400">Total splits alloué :</span>
                        <span className={`font-mono font-extrabold ${totalSplitRegistered === cartTotalTTC ? 'text-green-600' : 'text-amber-600'}`}>
                          {totalSplitRegistered.toLocaleString()} / {cartTotalTTC.toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Optional Single-step Acompte deposit field override */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-500 text-[10px] uppercase block tracking-wider">Acompte d'Arriéré versé (Optionnel)</span>
                    <input 
                      type="number" 
                      placeholder="Saisissez si acompte partiel (Ex : 50000)" 
                      value={customAcompteAmount}
                      onChange={e => setCustomAcompteAmount(e.target.value)}
                      className="bg-white border rounded p-1.5 text-xs w-full focus:outline-none focus:border-blue-500 font-mono text-slate-700 font-bold"
                    />
                    <p className="text-[9px] text-slate-400">Laisser vide si règlement total complet.</p>
                  </div>

                  {/* Checkout CTA Trigger */}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition cursor-pointer shadow-sm text-center tracking-wider block"
                  >
                    🚀 ENCAISSER ET CRÉER LE REÇU
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* --- SERVICE APRES VENTE (SAV) MODULE INLINE --- */}
      {activeSubTab === 'sav' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <SAVModule 
            currentLanguage={currentLanguage}
            currentCompany={currentCompany || { id: 'TG', name: 'G-LAB Optic', currency: 'XOF', taxRate: 18, symbol: 'FCFA' }}
            isOffline={isOffline}
          />
        </div>
      )}

      {/* --- SALES HISTORY LIST TAB --- */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          
          {/* Filtering rows */}
          <div className="p-4 bg-white rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 text-[#0F172A]"
                placeholder="Rechercher par n° de ticket, nom de client..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="All">Tous les statuts</option>
                <option value="Paid">Facture Payée</option>
                <option value="Partial">Acomptes Partiels</option>
              </select>
            </div>
          </div>

          {/* Table list rows */}
          <div className="overflow-x-auto rounded-xl bg-white border border-slate-100 shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3">Ticket N°</th>
                  <th className="px-5 py-3">Client / Patient</th>
                  <th className="px-5 py-3">Date & Heure de vente</th>
                  <th className="px-5 py-3 text-center">Articles</th>
                  <th className="px-5 py-3">Règlement</th>
                  <th className="px-5 py-3">Crédité</th>
                  <th className="px-5 py-3">Dû / Solde</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition border-b border-slate-50">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-650">{ord.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-800">{ord.customer}</div>
                        {ord.customerBirthDate && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Né : {ord.customerBirthDate} ({calculateAge(ord.customerBirthDate)})</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-slate-600 font-bold">{ord.date}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">à {ord.time}</div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-700">{ord.itemCount}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-[10px] font-semibold text-slate-600 truncate max-w-xs">{ord.paymentMethod}</div>
                        {ord.status === 'Partial' ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-full border border-amber-100">Acompte</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold rounded-full border border-green-100">Soldé</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-extrabold text-[#3b82f6]">
                        {ord.paidAmount?.toLocaleString() || ord.total.toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-3.5 font-mono font-extrabold text-rose-600">
                        {ord.balanceRemaining ? `${ord.balanceRemaining.toLocaleString()} FCFA` : '0 FCFA'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                            title="Visualiser le Reçu"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(ord)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                            title="Télécharger / Imprimer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-450 font-medium">
                      Aucune transaction trouvée pour ces sélections.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SECURE MODAL FOR VIEWING PRE-PRINTING RECEIPTS */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col justify-between text-slate-800">
            
            {/* Header Dialog */}
            <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-bold font-mono tracking-wide uppercase">REÇU CAISSE DE VENTE G-LAB (2-UP)</h3>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-slate-400 hover:text-white transition p-1 font-bold cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            {/* Receipt detail view */}
            <div className="p-6 overflow-y-auto max-h-[450px] space-y-4 bg-slate-50 divide-y divide-dashed divide-slate-200 text-xs">
              
              <div className="text-center pb-2">
                <span className="text-sm font-black tracking-wider text-slate-900 block font-sans">G-LAB OPTIC Studio SA</span>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Caisse Globale Unifiée</span>
              </div>

              <div className="pt-3 space-y-1 bg-white p-3 rounded-lg border border-slate-150">
                <div><strong>Ticket ID :</strong> <span className="font-mono text-blue-800 font-bold">{selectedReceiptOrder.id}</span></div>
                <div><strong>Date d'émission :</strong> {selectedReceiptOrder.date} à {selectedReceiptOrder.time}</div>
                <div><strong>Acheteur :</strong> {selectedReceiptOrder.customer}</div>
                <div><strong>Caisse d'opération :</strong> {selectedReceiptOrder.shop}</div>
                <div><strong>Opérateur caisse :</strong> {selectedReceiptOrder.cashier}</div>
              </div>

              <table className="w-full text-left font-sans pt-3 text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th>Libellé article</th>
                    <th className="text-center">Qté</th>
                    <th className="text-right">Rem.</th>
                    <th className="text-right">Total FCFA</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReceiptOrder.items.map(it => {
                    const rPrice = it.priceFCFA * it.qty;
                    const rDisc = Math.round(rPrice * ((it.discountPercent || 0) / 100));
                    return (
                      <tr key={it.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-2">
                          <span className="font-bold text-slate-850 block">{it.name}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">Modèle : {it.brand} {it.eyeSide && it.eyeSide !== 'NONE' ? `• Verre: ${it.eyeSide}` : ''}</span>
                        </td>
                        <td className="text-center font-bold text-slate-700">{it.qty}</td>
                        <td className="text-right text-slate-400">{it.discountPercent > 0 ? `${it.discountPercent}%` : '-'}</td>
                        <td className="text-right font-bold text-slate-800 font-mono">{(rPrice - rDisc).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pt-3 space-y-1.5 text-right bg-white p-3 rounded-lg border border-slate-150">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Total Brut Ticket :</span>
                  <span className="font-mono text-slate-700">{(selectedReceiptOrder.total + selectedReceiptOrder.discountAmount).toLocaleString()} FCFA</span>
                </div>
                {selectedReceiptOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-red-500 font-bold">
                    <span>Remise Générale :</span>
                    <span className="font-mono">-{selectedReceiptOrder.discountAmount.toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t pt-1">
                  <span>Montant Net Vente :</span>
                  <span className="font-mono text-blue-900">{selectedReceiptOrder.total.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs text-blue-700 pt-0.5">
                  <span>Acompte Perçu / Encaissé :</span>
                  <span className="font-mono">{selectedReceiptOrder.paidAmount.toLocaleString()} FCFA</span>
                </div>
                {selectedReceiptOrder.balanceRemaining > 0 ? (
                  <div className="flex justify-between font-extrabold text-xs text-rose-600 pt-0.5">
                    <span>Solde restant d'Arriéré d'Acompte :</span>
                    <span className="font-mono font-black">{selectedReceiptOrder.balanceRemaining.toLocaleString()} FCFA</span>
                  </div>
                ) : (
                  <div className="text-green-600 font-bold font-sans text-[10px] tracking-wider uppercase pt-0.5">Règlement entièrement soldé ✔</div>
                )}
              </div>

            </div>

            {/* Footer triggers */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-150 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handlePrintReceipt(selectedReceiptOrder)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer 2-UP</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
