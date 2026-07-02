import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import defaultLogo from '../assets/images/optic_alize_logo_1781336757710.jpg';
import { 
  CreditCard, Search, Percent, ShieldCheck, QrCode, Ticket, Check, Sparkles, 
  Printer, Coins, Landmark, PhoneCall, Gift, ShoppingBag, Plus, Minus, Trash2, 
  User, CheckCircle2, Clipboard, ArrowRight, Download, RefreshCw, Barcode, HelpCircle,
  FileCheck, ShieldAlert, BadgePercent, Calculator, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for our POS Simulator
interface POSProduct {
  id: string;
  name: string;
  brand: string;
  category: 'Monture' | 'Verre' | 'Accessoire';
  price: number;
  tva: number; // Percentage like 20 for frames, 5.5 for corrective lenses
  stock: number;
  barcode: string;
  imageColor: string; // Tailwind representation
}

interface CartItem {
  product: POSProduct;
  qty: number;
  discountPercent: number; // Individual item discount
  eyeSide: 'LEFT' | 'RIGHT' | 'BOTH' | 'NONE'; // Specific to lenses and frames optionally
}

interface PaymentSplit {
  method: 'espèces' | 'Mobile Money' | 'Mixx by Yas' | 'Flooz' | 'virement bancaire';
  amount: number;
  reference: string;
}

const PRESET_PRODUCTS_DEFAULT: POSProduct[] = [
  // Montures
  { id: 'p1', name: 'Original Wayfarer Black Matte', brand: 'Ray-Ban', category: 'Monture', price: 85000, tva: 18, stock: 12, barcode: '805289122012', imageColor: 'bg-slate-800' },
  { id: 'p2', name: 'Cat-Eye Prestige Gold Filigree', brand: 'Chanel', category: 'Monture', price: 185000, tva: 18, stock: 5, barcode: '313045920381', imageColor: 'bg-yellow-800/80' },
  { id: 'p3', name: 'Clubmaster Classic Acetate', brand: 'Ray-Ban', category: 'Monture', price: 95000, tva: 18, stock: 8, barcode: '805289122055', imageColor: 'bg-[#5c4033]' },
  { id: 'p4', name: 'Platinum Pilot Aviator Frame', brand: 'Cartier', category: 'Monture', price: 450000, tva: 18, stock: 3, barcode: '761326442651', imageColor: 'bg-zinc-400' },
  // Verres Correcteurs (TVA dispositif médical / standard 18%)
  { id: 'p5', name: 'Varilux Physio Crizal Sapphire HR Duo', brand: 'Essilor', category: 'Verre', price: 125000, tva: 18, stock: 100, barcode: '321045230910', imageColor: 'bg-sky-950/40 text-sky-400 border border-sky-800/50' },
  { id: 'p6', name: 'Shamir Autograph Intelligence Single-Eye', brand: 'Shamir', category: 'Verre', price: 145000, tva: 18, stock: 100, barcode: '321045230911', imageColor: 'bg-blue-950/40 text-blue-400 border border-blue-800/50' },
  { id: 'p7', name: 'Zeiss SmartLife single Platinum HD', brand: 'Zeiss', category: 'Verre', price: 90000, tva: 18, stock: 100, barcode: '321045100025', imageColor: 'bg-indigo-950/40 text-[#00bcd4] border border-[#00bcd4]/50' },
  // Accessoires
  { id: 'p8', name: 'Kit Nettoyant Optic Alizé Anti-Buée Spray + Chiffon', brand: 'Generic', category: 'Accessoire', price: 5000, tva: 18, stock: 45, barcode: '350104100529', imageColor: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' },
  { id: 'p9', name: 'Étui Premium Cuir Grainé Optic Alizé Custom', brand: 'Generic', category: 'Accessoire', price: 15000, tva: 18, stock: 15, barcode: '350104200150', imageColor: 'bg-amber-950/40 text-amber-500 border border-amber-800/30' },
  { id: 'p10', name: 'Cordon d\'Attache Sécurité Sport Premium', brand: 'Chums', category: 'Accessoire', price: 3000, tva: 18, stock: 30, barcode: '350104300712', imageColor: 'bg-slate-900 border border-slate-800' }
];

const formatCFA = (amount: number): string => {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} CFA`;
};

export default function POSModule() {
  const [posProducts, setPosProducts] = useState<POSProduct[]>(() => {
    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }
    const saved = localStorage.getItem('optic_pos_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return PRESET_PRODUCTS_DEFAULT;
  });

  useEffect(() => {
    localStorage.setItem('optic_pos_products', JSON.stringify(posProducts));
  }, [posProducts]);

  useEffect(() => {
    const handleSync = () => {
      if (localStorage.getItem('optic_system_factory_reset') === 'true') {
        setPosProducts([]);
        return;
      }
      const saved = localStorage.getItem('optic_pos_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPosProducts(parsed);
          }
        } catch (e) {}
      } else {
        setPosProducts(PRESET_PRODUCTS_DEFAULT);
      }
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const handleClearCatalog = () => {
    setPosProducts([]);
    triggerToast('Le catalogue général a été entièrement vidé.', 'info');
  };

  const handleResetCatalogToDefault = () => {
    setPosProducts(PRESET_PRODUCTS_DEFAULT);
    triggerToast('Le catalogue général a été restauré avec succès.', 'success');
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Monture' | 'Verre' | 'Accessoire'>('All');
  
  // Cart level pricing adjustment
  const [cartDiscount, setCartDiscount] = useState<number>(0); // Global discount percentage
  const [depositAmount, setDepositAmount] = useState<number>(0); // Acompte versé
  const [totalPaidSoFar, setTotalPaidSoFar] = useState<number>(0);
  
  // Multiple Payments Splitting
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const [currentPayMethod, setCurrentPayMethod] = useState<'espèces' | 'Mobile Money' | 'Mixx by Yas' | 'Flooz' | 'virement bancaire'>('espèces');
  const [currentPayAmount, setCurrentPayAmount] = useState<string>('');
  const [currentPayRef, setCurrentPayRef] = useState<string>('');
  
  // Custom interactive scanner simulations
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannerFeedback, setScannerFeedback] = useState<string>('');
  const [scannerAudioBeep, setScannerAudioBeep] = useState<boolean>(true);

  // Modals / Final Receipt states
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);

  // Patient attachment state (linked to Clinique module and prescriptions)
  const [attachedPatient, setAttachedPatient] = useState<string>('');
  const [clinicalPatients, setClinicalPatients] = useState<any[]>([]);

  useEffect(() => {
    const savedPrescriptions = localStorage.getItem('optic_my_prescriptions');
    const clinicPatientsMap = new Map();
    
    // Default fallback presets to ensure nice data selection on first load
    const presets = [
      { name: 'Hélène Dubois-Chambery', id: 'PRES-4001' },
      { name: 'Jean-Pierre Gomez-Viguier', id: 'PRES-4002' },
      { name: 'Khadija Sy', id: 'EXAM-301' },
      { name: 'Mamadou Diop', id: 'EXAM-302' }
    ];
    presets.forEach(p => clinicPatientsMap.set(p.name, p.id));

    if (savedPrescriptions) {
      try {
        const parsed = JSON.parse(savedPrescriptions);
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            if (p.patientName) {
              clinicPatientsMap.set(p.patientName, p.id || 'PRES-GEN');
            }
          });
        }
      } catch (e) {}
    }

    const savedCrm = localStorage.getItem('optic_crm_customers');
    if (savedCrm) {
      try {
        const parsed = JSON.parse(savedCrm);
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            const name = `${p.firstName} ${p.lastName}`;
            clinicPatientsMap.set(name, p.id || 'CRM-CL');
          });
        }
      } catch (e) {}
    }
    
    // Create list
    const list: any[] = [];
    clinicPatientsMap.forEach((id, name) => {
      list.push({ name, id });
    });
    setClinicalPatients(list);
  }, []);
  
  // Storage synchronize listener for incoming orders from the Commande/Atelier module
  const [incomingOrder, setIncomingOrder] = useState<any | null>(null);

  useEffect(() => {
    const checkIncoming = () => {
      const raw = localStorage.getItem('pending_optic_pos_order');
      if (raw) {
        try {
          setIncomingOrder(JSON.parse(raw));
        } catch (e) {
          setIncomingOrder(null);
        }
      } else {
        setIncomingOrder(null);
      }
    };

    checkIncoming();

    // Attach listener for storage updates (cross tabs/local action)
    const handleStorageChange = () => {
      checkIncoming();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('optic-pos-incoming-order' as any, handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('optic-pos-incoming-order' as any, handleStorageChange);
    };
  }, []);

  const handleImportIncomingOrder = () => {
    if (!incomingOrder) return;
    
    // Create custom virtual product representation of the order
    const importedProd: POSProduct = {
      id: incomingOrder.orderId,
      name: `Fiche d'Atelier : ${incomingOrder.frameModel} + ${incomingOrder.lensesType}`,
      brand: 'Atelier Optic Alizé',
      category: 'Monture',
      price: incomingOrder.totalTtc,
      tva: 18,
      stock: 1,
      barcode: incomingOrder.orderId,
      imageColor: 'bg-indigo-900'
    };

    // Load into the register basket
    setCart([{
      product: importedProd,
      qty: 1,
      discountPercent: 0,
      eyeSide: 'BOTH'
    }]);

    // Apply the pre-paid deposit from laboratory registration
    if (incomingOrder.amountPaid > 0) {
      setPayments([
        {
          method: 'espèces',
          amount: incomingOrder.amountPaid,
          reference: `ACOMPTE ${incomingOrder.orderId}`
        }
      ]);
      setTotalPaidSoFar(incomingOrder.amountPaid);
    } else {
      setPayments([]);
      setTotalPaidSoFar(0);
    }

    if (incomingOrder.customerName) {
      setAttachedPatient(incomingOrder.customerName);
    }

    triggerToast(`Commande ${incomingOrder.orderId} chargée en caisse ! Reste à solder : ${formatCFA(incomingOrder.totalTtc - incomingOrder.amountPaid)}`, 'success');
  };

  const handleClearIncomingOrder = () => {
    localStorage.removeItem('pending_optic_pos_order');
    setIncomingOrder(null);
    triggerToast('Notification de commande d\'atelier réinitialisée.', 'info');
  };

  // Toast notifications
  const [posToast, setPosToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setPosToast({ message, type });
    setTimeout(() => setPosToast(null), 3000);
  };

  // Sound beep simulator
  const playBeep = () => {
    if (!scannerAudioBeep) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // High pitch sharp beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08); // Short duration beep
    } catch (e) {
      // AudioContext blocker catch
    }
  };

  // Filter products
  const filteredProducts = posProducts.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = q === '' || 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) || 
      p.barcode.includes(q);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate Subtotals, Discounts, Taxes
  const getCartCalculations = () => {
    let subtotalRaw = 0;
    let totalDiscountInWaf = 0;
    let tvaMap: Record<number, number> = { 18: 0 }; // map rate to tax amount

    cart.forEach(item => {
      const itemBase = item.product.price * item.qty;
      const itemDiscount = itemBase * (item.discountPercent / 100);
      const itemNet = itemBase - itemDiscount;

      subtotalRaw += itemBase;
      totalDiscountInWaf += itemDiscount;

      // Apply proportional part of tax (computed backwards from Net Price TTC)
      // Net TTC = Net HT * (1 + (TVA / 100))
      // Tax Amount = Net TTC - (Net TTC / (1 + (TVA / 100)))
      const taxRateDecimal = item.product.tva / 100;
      const taxAmount = itemNet - (itemNet / (1 + taxRateDecimal));
      tvaMap[item.product.tva] = (tvaMap[item.product.tva] || 0) + taxAmount;
    });

    // Global discount logic
    const baseAfterItemDiscounts = subtotalRaw - totalDiscountInWaf;
    const globalDiscountInWaf = baseAfterItemDiscounts * (cartDiscount / 100);
    const finalAmountTtc = Math.max(0, baseAfterItemDiscounts - globalDiscountInWaf);
    
    // Distribute global discount on taxes proportionally
    let finalTvaAmount = 0;
    Object.keys(tvaMap).forEach(rate => {
      const rateNum = parseFloat(rate);
      // Proportionally adjust taxes based on global discount
      const ratio = baseAfterItemDiscounts > 0 ? finalAmountTtc / baseAfterItemDiscounts : 0;
      tvaMap[rateNum] = tvaMap[rateNum] * ratio;
      finalTvaAmount += tvaMap[rateNum];
    });

    const isAcompte = depositAmount > 0;
    const balanceRemaining = Math.max(0, finalAmountTtc - totalPaidSoFar);

    return {
      subtotalRaw,
      totalDiscount: totalDiscountInWaf + globalDiscountInWaf,
      tva18: tvaMap[18] || 0,
      totalTva: finalTvaAmount,
      totalTtc: finalAmountTtc,
      isAcompte,
      acompteDeduction: depositAmount,
      balanceRemaining,
      isValidCheckout: finalAmountTtc > 0 && balanceRemaining <= 0
    };
  };

  const calcs = getCartCalculations();

  // Add Item to cart helper
  const handleAddToCart = (product: POSProduct, customSide: 'LEFT' | 'RIGHT' | 'BOTH' | 'NONE' = 'NONE') => {
    // If it's a Lens 'Verre', default side to BOTH
    const targetSide = product.category === 'Verre' && customSide === 'NONE' ? 'BOTH' : customSide;

    const existingIndex = cart.findIndex(item => 
      item.product.id === product.id && 
      item.eyeSide === targetSide
    );

    if (existingIndex > -1) {
      const nextCart = [...cart];
      nextCart[existingIndex].qty += 1;
      setCart(nextCart);
    } else {
      setCart([...cart, {
        product,
        qty: 1,
        discountPercent: 0,
        eyeSide: targetSide
      }]);
    }
    triggerToast(`Produit "${product.name}" ajouté.`);
  };

  // Change cart item quantity
  const handleUpdateQty = (index: number, val: number) => {
    const nextCart = [...cart];
    nextCart[index].qty = Math.max(1, nextCart[index].qty + val);
    setCart(nextCart);
  };

  // Change individual item discount
  const handleItemDiscount = (index: number, percent: number) => {
    const nextCart = [...cart];
    nextCart[index].discountPercent = Math.min(100, Math.max(0, percent));
    setCart(nextCart);
  };

  // Change lens eyeSide
  const handleItemEyeSide = (index: number, side: 'LEFT' | 'RIGHT' | 'BOTH' | 'NONE') => {
    const nextCart = [...cart];
    nextCart[index].eyeSide = side;
    setCart(nextCart);
  };

  // Remove individual item
  const handleRemoveItem = (index: number) => {
    const nextCart = cart.filter((_, i) => i !== index);
    setCart(nextCart);
    triggerToast('Produit retiré du panier.', 'info');
  };

  // Handle manual/auto barcode scan emulator
  const triggerSimulationScan = (barcodeToScan?: string) => {
    const targetCode = barcodeToScan || scannedBarcode.trim();
    if (!targetCode) {
      triggerToast('Code-barres vide ou non reconnu.', 'error');
      return;
    }

    const matched = posProducts.find(p => p.barcode === targetCode);
    if (matched) {
      playBeep();
      setScannerFeedback(`SCAN OK : ${matched.name} (${matched.brand})`);
      handleAddToCart(matched, matched.category === 'Verre' ? 'BOTH' : 'NONE');
      setScannedBarcode('');
      setTimeout(() => setScannerFeedback(''), 4000);
    } else {
      triggerToast(`Code-barres "${targetCode}" non répertorié.`, 'error');
    }
  };

  // Quick preset bar scan clicks
  const barcodeScanPreset = (p: POSProduct) => {
    setScannedBarcode(p.barcode);
    triggerSimulationScan(p.barcode);
  };

  // Add multiple split payment
  const handleAddPaymentSplit = () => {
    const amt = parseFloat(currentPayAmount);
    if (isNaN(amt) || amt <= 0) {
      triggerToast('Saisir un montant d\'encaissement valide supérieur à 0.', 'error');
      return;
    }

    // Check we do not overpay excess balance too much
    if (amt > calcs.balanceRemaining) {
      triggerToast(`Le montant dépasse le reste à payer de ${formatCFA(calcs.balanceRemaining)}.`, 'info');
    }

    const newPayment: PaymentSplit = {
      method: currentPayMethod,
      amount: amt,
      reference: currentPayRef.trim() || `TX-REF-${Math.floor(100000 + Math.random() * 900000)}`
    };

    const nextPayments = [...payments, newPayment];
    setPayments(nextPayments);
    
    // Accumulate total paid
    const nextPaid = totalPaidSoFar + amt;
    setTotalPaidSoFar(nextPaid);

    // Reset payment fields
    setCurrentPayAmount('');
    setCurrentPayRef('');

    triggerToast(`Encaissement partiel de ${formatCFA(amt)} enregistré.`);
  };

  // Reset current payment block
  const handleClearPayments = () => {
    setPayments([]);
    setTotalPaidSoFar(0);
    triggerToast('Historique des règlements réinitialisé.', 'info');
  };

  // Lock register and checkout
  const handleCompleteTransaction = (isAcompteMode: boolean = false) => {
    if (cart.length === 0) {
      triggerToast('Le panier est vide !', 'error');
      return;
    }

    // Must have at least part paid if it's an deposit (acompte)
    if (isAcompteMode && totalPaidSoFar <= 0) {
      triggerToast('Veuillez encaisser au moins l\'acompte initial.', 'error');
      return;
    }

    if (!isAcompteMode && totalPaidSoFar < calcs.totalTtc) {
      triggerToast(`Veuillez solder la totalité de la commande ou basculer en mode Acompte.`, 'error');
      return;
    }

    // Successful mock order creation
    const finalOrder = {
      id: `G-POS-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: attachedPatient || (incomingOrder ? incomingOrder.customerName : 'Client de Passage'),
      date: new Date().toISOString(),
      items: [...cart],
      discountRate: cartDiscount,
      totalTtc: calcs.totalTtc,
      paidAmount: totalPaidSoFar,
      balanceRemaining: Math.max(0, calcs.totalTtc - totalPaidSoFar),
      payments: [...payments],
      isAcompte: isAcompteMode,
      depositRetained: isAcompteMode ? totalPaidSoFar : 0,
      cashier: 'Antoine Roussel (Opticien Nation)',
      barcodeKey: `*${Math.floor(1000000000 + Math.random() * 9000000000)}*`,
      qrValue: `https://g-lab-optic.com/pay-invoice/${Math.random().toString(36).substring(7)}`
    };

    setLastCompletedOrder(finalOrder);
    setShowReceiptModal(true);
    triggerToast('Transaction finalisée avec succès ! Ticket généré.', 'success');
  };

  // Reset entire POS state
  const handleResetPOS = () => {
    if (confirm("Êtes-vous sûr de vouloir vider le panier et réinitialiser la transaction en cours ?")) {
      setCart([]);
      setCartDiscount(0);
      setDepositAmount(0);
      setPayments([]);
      setTotalPaidSoFar(0);
      setScannedBarcode('');
      setScannerFeedback('');
      triggerToast('Caisse enregistreuse réinitialisée.', 'info');
    }
  };

  // Download Invoice HTML/Print template as we did for CRM
  const handleExportInvoice = () => {
    if (!lastCompletedOrder) return;
    const docTitle = `GLAB_Facture_${lastCompletedOrder.id}.html`;
    
    const logoImage = localStorage.getItem('optic_app_logo_base64') || localStorage.getItem('optic_app_logo') || defaultLogo;

    const fileHtmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Optic Alizé • Facture Officielle - ${lastCompletedOrder.id}</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; background-color: #f1f5f9; color: #1e293b; padding: 40px; margin: 0; position: relative; }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      width: 400px;
      height: 400px;
      opacity: 0.05;
      background-image: url('${logoImage}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      pointer-events: none;
      z-index: -1;
    }
    .invoice { background: white; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 800px; margin: 0 auto; padding: 40px; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .logo-header { border-bottom: 2px solid #0097a7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .logo-header h1 { color: #0097a7; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .info-block { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .address-box { font-size: 13px; color: #475569; line-height: 1.5; }
    .address-title { font-weight: bold; color: #0f172a; text-transform: uppercase; font-size: 11px; margin-bottom: 6px; font-family: monospace; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { text-align: left; background: #f0fdfa; color: #0f172a; padding: 12px; font-family: monospace; border-bottom: 2px solid #0097a7; }
    td { padding: 12px; border-bottom: 1px solid #cbd5e1; color: #1f2937; }
    .summary-block { margin-top: 35px; width: 320px; margin-left: auto; border: 1px solid #cbd5e1; border-radius: 8px; background: #f0fdfa; padding: 15px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
    .total-ttc { font-size: 18px; font-weight: bold; color: #0097a7; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px; }
    .footer-note { text-align: center; margin-top: 50px; font-size: 10px; color: #64748b; font-family: monospace; }
    .print-btn { display: block; background: #0097a7; color: white; border: none; padding: 10px 24px; font-weight: bold; border-radius: 6px; cursor: pointer; text-decoration: none; text-align: center; max-width: 140px; font-size: 12px; margin-top: 20px; }
    @media print {
      body { background: white; color: black; padding: 0; }
      .invoice { border: none; background: white; color: black; box-shadow: none; }
      th { background: #f1f5f9; color: black; }
      td { border-bottom: 1px solid #cbd5e1; }
      .summary-block { background: #f8fafc; border: 1px solid #cbd5e1; }
      .total-ttc { color: black; border-top: 1px dashed #94a3b8; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="watermark"></div>
  <div class="invoice">
    <div class="logo-header">
      <div style="display: flex; align-items: center; gap: 15px;">
        <img src="${logoImage}" style="width: 55px; height: 55px; border-radius: 50%; border: 2px solid rgba(0, 151, 167, 0.4); object-fit: cover;" referrerPolicy="no-referrer" />
        <div>
          <h1>Optic Alizé</h1>
          <div style="font-size: 11px; opacity: 0.8; margin-top: 4px; font-family: monospace; color: #0097a7; font-weight: bold;">ERP CAISSE & OPTOMÉTRIE INTEGRÉE</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: bold; font-family: monospace; font-size: 14px; color: #0f172a;">FACTURE : ${lastCompletedOrder.id}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 4px;">Émise le : ${new Date(lastCompletedOrder.date).toLocaleString('fr-FR')}</div>
      </div>
    </div>

    <div class="info-block">
      <div>
        <div class="address-title">PRESTATAIRE EMETTEUR</div>
        <div class="address-box">
          <strong>Optic Alizé (Agence Principale)</strong><br/>
          Réseau d'Agences conventionnées d'Optique<br/>
          80 Boulevard de la Libération, 75011 Paris<br/>
          Agrément Sécurité Sociale : AM-75102948-CL<br/>
          TVA Intracommunautaire : FR 85 921 048 291
        </div>
      </div>
      <div>
        <div class="address-title">INFORMATIONS DE CAISSE</div>
        <div class="address-box">
          <strong>Bénéficiaire / Client :</strong> <span style="font-weight: bold; color: #0097a7;">${lastCompletedOrder.customerName || 'Client de Passage'}</span><br/>
          <strong>Hôte de caisse :</strong> ${lastCompletedOrder.cashier}<br/>
          <strong>Statut Transaction :</strong> ${lastCompletedOrder.isAcompte ? 'ACOMPTE ENCAISSÉ (Solde requis à la livraison)' : 'FACTURE PAYÉE - SOLDE ENTIER'}<br/>
          <strong>Méthode(s) utilisée(s) :</strong> ${lastCompletedOrder.payments.map((p: any) => `${p.method}`).join(', ') || 'N/A'}<br/>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description de l'Équipement</th>
          <th>Côté face</th>
          <th>TVA %</th>
          <th>Quantité</th>
          <th>Prix Unitaire TTC</th>
          <th>Remise %</th>
          <th>Total TTC</th>
        </tr>
      </thead>
      <tbody>
        ${lastCompletedOrder.items.map((i: any) => `
          <tr>
            <td><strong>[${i.product.category}]</strong> ${i.product.brand} - ${i.product.name}</td>
            <td style="font-family: monospace;">${i.eyeSide}</td>
            <td style="font-family: monospace;">${i.product.tva}%</td>
            <td style="font-family: monospace;">${i.qty}</td>
            <td>${i.product.price.toLocaleString()} FCFA</td>
            <td style="color: #fbbf24; font-family: monospace;">${i.discountPercent}%</td>
            <td><strong>${((i.product.price * i.qty) * (1 - i.discountPercent/100)).toLocaleString()} FCFA</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="summary-block">
      <div class="summary-row">
        <span>Sous-total Brut :</span>
        <span>${lastCompletedOrder.items.reduce((acc: number, item: any) => acc + (item.product.price * item.qty), 0).toLocaleString()} FCFA</span>
      </div>
      <div class="summary-row" style="color: #fbbf24;">
        <span>Remises cumulées :</span>
        <span>- ${(lastCompletedOrder.items.reduce((acc: number, item: any) => acc + (item.product.price * item.qty * item.discountPercent/100), 0) + (lastCompletedOrder.items.reduce((acc: number, item: any) => acc + (item.product.price * item.qty * (1 - item.discountPercent/100)), 0) * lastCompletedOrder.discountRate/100)).toLocaleString()} FCFA</span>
      </div>
      <div class="summary-row">
        <span>Montant Global TVA (18%) :</span>
        <span>${(lastCompletedOrder.totalTtc * 18 / 118).toLocaleString()} FCFA</span> 
      </div>
      <div class="summary-row total-ttc">
        <span>NET À PAYER TTC:</span>
        <span>${lastCompletedOrder.totalTtc.toLocaleString()} FCFA</span>
      </div>
      <div class="summary-row" style="color: #10b981; font-weight: bold; margin-top: 8px;">
        <span>Montant Encaissé :</span>
        <span>${lastCompletedOrder.paidAmount.toLocaleString()} FCFA</span>
      </div>
      <div class="summary-row" style="color: #f43f5e; font-weight: bold;">
        <span>Indu Restant :</span>
        <span>${lastCompletedOrder.balanceRemaining.toLocaleString()} FCFA</span>
      </div>
    </div>

    <div>
      <button class="print-btn" onclick="window.print()">Imprimer la Facture</button>
    </div>

    <div class="footer-note">
      Optic Alizé SAS • Capital social : 10.000.000 FCFA • SIRET 489 123 456 00021<br/>
      L'équipement de verres correcteurs livré sous ordonnance a été calibré d'après les normes techniques NF EN ISO 21987.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([fileHtmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = docTitle;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Facture officielle réglementaire générée et téléchargée.');
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6" id="g-lab-professional-pos">
      
      {/* 1. Dynamic Top Toast Alert */}
      <AnimatePresence>
        {posToast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 ${
              posToast.type === 'success' 
                ? 'bg-cyan-50 border-[#0097a7]/20 text-cyan-850' 
                : posToast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            <span className="text-xs font-semibold">{posToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PORTION: PRODUCT GALLERY & SCANNERS (COL SPAN 7) */}
      <div className="lg:col-span-7 flex flex-col gap-6">

        {/* Incoming Lab Order integration banner */}
        <AnimatePresence>
          {incomingOrder && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-blue-900 to-indigo-950 p-[1.5px] rounded-2xl shadow-md border border-blue-800/10"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-[15px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2.5 bg-blue-105 text-blue-700 rounded-xl">
                    <ShoppingBag className="w-5 h-5 text-blue-600 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-black text-blue-600 tracking-wider block">Flux Caisse : Commande d'Atelier en attente</span>
                    <h5 className="text-xs font-bold text-slate-900 mt-0.5">
                      {incomingOrder.orderId} — {incomingOrder.customerName}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal text-left">
                      Lentilles/Verres : <span className="font-semibold text-slate-700">{incomingOrder.lensesType}</span> <br />
                      Total : <span className="font-sans font-bold text-slate-800">{incomingOrder.totalTtc.toLocaleString()} FCFA</span> | Reste à solder : <span className="font-mono text-indigo-700 font-extrabold">{incomingOrder.remainingBalance.toLocaleString()} FCFA</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto self-end sm:self-center">
                  <button
                    onClick={handleClearIncomingOrder}
                    className="px-3 py-1.5 bg-slate-105 hover:bg-slate-205 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer border-0"
                  >
                    Effacer
                  </button>
                  <button
                    onClick={handleImportIncomingOrder}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border-0 shadow-sm font-mono uppercase tracking-wider"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Importer
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Scanner Emulator Banner */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-cyan-600" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#0097a7]">Scanner Code-Barres Optic Alizé</h4>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
                <input 
                  type="checkbox" 
                  checked={scannerAudioBeep} 
                  onChange={(e) => setScannerAudioBeep(e.target.checked)}
                  className="rounded border-slate-350 accent-[#0097a7] cursor-pointer"
                />
                <span>Signal sonore {scannerAudioBeep ? '🔊' : '🔇'}</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Custom Barcode Manual input simulation */}
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Scanner ou saisir un EAS-13 (ex: 805289...)"
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && triggerSimulationScan()}
                className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097A7] font-mono"
              />
              <button
                onClick={() => triggerSimulationScan()}
                className="px-3 bg-cyan-50 hover:bg-cyan-100 text-[#0097a7] rounded-lg border border-[#0097a7]/30 text-xs font-semibold cursor-pointer shrink-0"
              >
                Scan!
              </button>
            </div>

            {/* Quick Emulator Buttons */}
            <div className="flex items-center flex-wrap gap-1.5 text-[10px] text-slate-600">
              <span className="font-mono">Scanners d'Optique :</span>
              {posProducts.length > 0 && (
                <button 
                  onClick={() => barcodeScanPreset(posProducts[0])}
                  className="p-1 px-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-250 text-[9.5px] font-mono truncate max-w-[130px] cursor-pointer"
                >
                  [Scan Wayfarer]
                </button>
              )}
              {posProducts.length > 1 && (
                <button 
                  onClick={() => barcodeScanPreset(posProducts[1])}
                  className="p-1 px-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-250 text-[9.5px] font-mono truncate max-w-[130px] cursor-pointer"
                >
                  [Scan Chanel]
                </button>
              )}
              {posProducts.length > 4 && (
                <button 
                  onClick={() => barcodeScanPreset(posProducts[4])}
                  className="p-1 px-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-250 text-[9.5px] font-mono truncate max-w-[130px] cursor-pointer"
                >
                  [Scan Varilux]
                </button>
              )}
            </div>

          </div>

          {/* Feedback log message */}
          {scannerFeedback && (
            <div className="mt-2 text-[11px] font-mono text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {scannerFeedback}
            </div>
          )}

        </div>

        {/* Gallery filter and lists */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-1 flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Categories filter tabs */}
            <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
              {(['All', 'Monture', 'Verre', 'Accessoire'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer border-0 ${
                    selectedCategory === cat 
                      ? 'bg-white text-slate-800 font-bold border border-slate-200 shadow-sm' 
                      : 'text-slate-550 hover:text-slate-850'
                  }`}
                >
                  {cat === 'All' ? 'Tous' : cat === 'Monture' ? 'Montures' : cat === 'Verre' ? 'Verres optiques' : 'Accessoires'}
                </button>
              ))}
            </div>

            {/* Gallery Search & Catalog Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Filtrer en agence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 pl-8 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
                />
              </div>
              <button
                onClick={handleClearCatalog}
                title="Vider entièrement le catalogue général de la caisse"
                className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1 border-0"
              >
                Vider Catalogue
              </button>
              <button
                onClick={handleResetCatalogToDefault}
                title="Restaurer le catalogue général de la caisse aux valeurs par défaut"
                className="px-2.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg border border-cyan-200 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1 border-0"
              >
                Réinitialiser
              </button>
            </div>

          </div>

          {/* Product Cards Grid with visual depth */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 h-[340px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 font-mono gap-3 border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/20">
                <ShieldAlert className="w-8 h-8 text-amber-500/80" />
                <div className="text-center">
                  <span className="text-xs font-semibold block text-slate-700">Catalogue général de caisse vide</span>
                  <span className="text-[10px] text-slate-450 block mt-1">Aucun produit configuré ou actif en agence</span>
                </div>
                <button 
                  onClick={handleResetCatalogToDefault} 
                  className="px-3.5 py-1.5 bg-[#0097a7] hover:bg-[#00bcd4] text-white border-0 rounded-lg text-xs font-bold cursor-pointer transition shadow-sm mt-1"
                >
                  Restaurer le Catalogue
                </button>
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div 
                  key={p.id}
                  className="bg-slate-50/40 rounded-xl border border-slate-100 p-3.5 flex flex-col justify-between hover:border-slate-200 hover:bg-slate-50 transition shadow-sm group relative"
                >
                  {/* Micro Category Tag */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider uppercase ${
                      p.category === 'Monture' 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                        : p.category === 'Verre'
                          ? 'bg-sky-50 text-[#0097a7] border border-sky-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {p.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Stock: {p.stock}</span>
                  </div>

                  {/* Product Meta */}
                  <div className="my-1.5">
                    <h5 className="text-[10px] font-mono font-bold tracking-wide uppercase text-slate-500">{p.brand}</h5>
                    <h4 className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 transition leading-tight mt-0.5">{p.name}</h4>
                  </div>

                  {/* Footer section of card with action buttons */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 font-mono">{p.price.toLocaleString()} FCFA</span>
                      <span className="text-[9px] font-mono text-slate-500">TVA incl: {p.tva}%</span>
                    </div>

                    {/* If product is glass/lens, permit option of LEFT / RIGHT / BOTH */}
                    {p.category === 'Verre' ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAddToCart(p, 'LEFT')}
                          className="py-1 px-1.5 bg-[#0097a7]/10 hover:bg-[#0097a7]/20 border border-[#0097a7]/30 rounded text-[9px] text-[#0097a7] font-bold cursor-pointer"
                          title="Ajouter Verre Gauche (OG)"
                        >
                          RG
                        </button>
                        <button
                          onClick={() => handleAddToCart(p, 'RIGHT')}
                          className="py-1 px-1.5 bg-[#0097a7]/10 hover:bg-[#0097a7]/20 border border-[#0097a7]/30 rounded text-[9px] text-[#0097a7] font-bold cursor-pointer"
                          title="Ajouter Verre Droit (OD)"
                        >
                          OD
                        </button>
                        <button
                          onClick={() => handleAddToCart(p, 'BOTH')}
                          className="py-1 px-2 bg-[#0097a7] hover:bg-[#00bcd4] rounded text-[9px] text-white font-bold cursor-pointer border-0"
                          title="Ajouter Paire de verres"
                        >
                          Paire
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(p, 'NONE')}
                        className="p-1 px-3 bg-white hover:bg-[#0097a7] border border-slate-200 hover:border-transparent rounded-lg text-[10px] font-semibold text-slate-700 hover:text-white transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Choisir
                      </button>
                    )}
                  </div>

                  {/* Hidden barcode barcode graphic decoration */}
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-10 text-slate-450 transition duration-300 pointer-events-none">
                    <Barcode className="w-8 h-8" />
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* RIGHT PORTION: CART CONSOLE & SPLIT PAYMENT WIDGETS (COL SPAN 5) */}
      <div className="lg:col-span-5 flex flex-col gap-6" id="g-lab-basket-console">
        
        {/* Cart Item Listing */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[320px]">
          
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4.5 h-4.5 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#0097a7]">Panier Client</h4>
            </div>
            {cart.length > 0 && (
              <button 
                onClick={handleResetPOS}
                className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vider
              </button>
            )}
          </div>

          {/* Attacher Patient Selector linked to Patient Clinique in Clinique & Prescription Module */}
          <div className="mb-3.5 p-2 bg-cyan-50/40 border border-[#0097a7]/25 rounded-xl space-y-1">
            <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#0097a7] flex items-center gap-1">
              <User className="w-3.5 h-3.5 shrink-0" />
              Attacher Patient Clinique (& Ordonnance)
            </label>
            <div className="flex gap-1.5">
              <select
                value={attachedPatient}
                onChange={(e) => setAttachedPatient(e.target.value)}
                className="w-full bg-white border border-slate-200 text-[11px] px-2.5 py-1 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097a7] cursor-pointer font-bold"
              >
                <option value="">-- Choisir un patient clinique --</option>
                {clinicalPatients.map((p, i) => (
                  <option key={i} value={p.name}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
              {attachedPatient && (
                <button
                  onClick={() => setAttachedPatient('')}
                  className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition cursor-pointer"
                  title="Détacher"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Core items scroll area */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 p-1 text-slate-500">
                <ShoppingBag className="w-8 h-8 stroke-1" />
                <p className="text-[11px] font-mono leading-normal">
                  Panier vide.<br/>Scannez un code-barres ou choisissez des montures, verres, verres optiques ou accessoires pour commencer.
                </p>
              </div>
            ) : (
              cart.map((item, index) => {
                const itemTotal = (item.product.price * item.qty) * (1 - item.discountPercent / 100);
                return (
                  <div 
                    key={`${item.product.id}-${item.eyeSide}`}
                    className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col gap-2 relative group"
                  >
                    {/* Item title line */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-slate-500">{item.product.brand}</span>
                          {item.eyeSide !== 'NONE' && (
                            <span className="px-1 text-[8.5px] font-mono font-bold shrink-0 bg-[#0097A7]/10 text-[#0097a7] border border-[#0097A7]/20 rounded">
                              Côté : {item.eyeSide === 'BOTH' ? 'Paire' : item.eyeSide === 'LEFT' ? 'Gauche (OG)' : 'Droit (OD)'}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-semibold text-slate-800 line-clamp-1">{item.product.name}</h5>
                      </div>
                      
                      {/* Delete item button */}
                      <button 
                        onClick={() => handleRemoveItem(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-600 rounded transition cursor-pointer border-0 bg-transparent"
                        title="Retirer cet article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quantities, Discounts and final pricing of line */}
                    <div className="flex items-center justify-between gap-4 mt-1 border-t border-slate-150 pt-2 flex-wrap">
                      
                      {/* Quantity selector button */}
                      <div className="flex items-center bg-white rounded border border-slate-200 px-1">
                        <button 
                          onClick={() => handleUpdateQty(index, -1)}
                          className="p-1 text-slate-500 hover:text-slate-850 cursor-pointer border-0 bg-transparent"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-semibold text-slate-800">{item.qty}</span>
                        <button 
                          onClick={() => handleUpdateQty(index, 1)}
                          className="p-1 text-slate-500 hover:text-slate-850 cursor-pointer border-0 bg-transparent"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remise line specific */}
                      <div className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] text-slate-600">Remise:</span>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent || ''}
                          placeholder="%"
                          onChange={(e) => handleItemDiscount(index, parseInt(e.target.value) || 0)}
                          className="w-11 bg-white border border-slate-200 text-xs px-1 text-center font-mono rounded text-[#fbbf24] focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">%</span>
                      </div>

                      {/* Net Price HT/TTC line */}
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 font-mono">{itemTotal.toLocaleString()} FCFA</span>
                        <p className="text-[8.5px] font-mono text-slate-500">TVA: {item.product.tva}%</p>
                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Pricing summarizer calculations before payment modules */}
          <div className="border-t border-slate-100 pt-3 mt-3 space-y-1 text-xs">
            <div className="flex justify-between items-center text-slate-650">
              <span>Sous-total HT/TTC :</span>
              <span className="font-mono text-slate-800">{calcs.subtotalRaw.toLocaleString()} FCFA</span>
            </div>
            
            <div className="flex justify-between items-center text-amber-700 font-semibold">
              <span className="flex items-center gap-1">
                <BadgePercent className="w-3.5 h-3.5" />
                Remise globale sur panier :
              </span>
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={cartDiscount || ''}
                  onChange={(e) => setCartDiscount(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-10 bg-slate-50 border border-slate-200 text-center font-mono text-[11px] rounded py-0.5 focus:outline-none focus:border-[#0097A7] text-amber-700 font-bold"
                />
                <span>%</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Montants Taxes (TVA 18%) :</span>
              <span className="font-mono text-slate-500">
                {calcs.tva18 > 0 ? `${calcs.tva18.toLocaleString()} FCFA` : "0 FCFA"}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-800 font-bold text-sm bg-cyan-50 p-1.5 rounded border border-cyan-100/40 mt-2">
              <span className="uppercase text-[11px] tracking-wider text-[#0097a7]">Net TTC à Solder :</span>
              <span className="font-mono text-xl text-[#0097a7]">{calcs.totalTtc.toLocaleString()} FCFA</span>
            </div>
          </div>

        </div>

        {/* Dynamic Split Billing & Payment Methods Widget */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-4.5 h-4.5 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#0097a7]">Modes d'Encaissement Multiples</h4>
            </div>
            {payments.length > 0 && (
              <button 
                onClick={handleClearPayments}
                className="text-[9px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer border-0 bg-transparent"
              >
                Reset Règl.
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            
            {/* Split payments ledger */}
            {payments.length > 0 && (
              <div className="p-2.5 bg-slate-50 rounded-lg space-y-1.5 border border-slate-150 h-28 overflow-y-auto">
                {payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] font-mono border-b border-slate-100 pb-1">
                    <span className="text-[#0097a7] font-semibold uppercase">{p.method}</span>
                    <span className="text-slate-500 max-w-[120px] truncate" title={p.reference}>Réf: {p.reference}</span>
                    <span className="text-slate-800 font-bold">{p.amount.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
            )}

            {/* Split payment entry fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Payment selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono">Méthode d'Encaiss.</label>
                <select 
                  value={currentPayMethod}
                  onChange={(e) => setCurrentPayMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-1.5 rounded text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="espèces">espèces (Cash)</option>
                  <option value="Mobile Money">Mobile Money (M-Mona)</option>
                  <option value="Mixx by Yas">Mixx by Yas (Y-Trans)</option>
                  <option value="Flooz">Flooz (F-Mona)</option>
                  <option value="virement bancaire">Virement Bancaire</option>
                </select>
              </div>

              {/* Amount input */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono">Montant Encaissé (FCFA)</label>
                <div className="relative">
                  <input 
                    type="number"
                    placeholder={`Reste : ${calcs.balanceRemaining.toLocaleString()}`}
                    value={currentPayAmount}
                    onChange={(e) => setCurrentPayAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-1.5 rounded text-slate-800 focus:outline-none font-mono"
                  />
                  <button 
                    onClick={() => setCurrentPayAmount(calcs.balanceRemaining.toString())}
                    className="absolute right-1 top-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[9px] px-1 py-1 rounded font-mono cursor-pointer border-0"
                    title="Solder le reste"
                  >
                    Max
                  </button>
                </div>
              </div>

            </div>

            {/* Transaction Reference input */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-9 space-y-1">
                <label className="text-[10px] text-slate-500 font-mono">Réf. de Transaction / Télétrav. ou ID Terminal</label>
                <input 
                  type="text"
                  placeholder="ID Transaction, No Secu / Mutuelle, chèque No..."
                  value={currentPayRef}
                  onChange={(e) => setCurrentPayRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-1.5 rounded text-slate-800 focus:outline-none font-mono"
                />
              </div>

              {/* Button Action click */}
              <button
                onClick={handleAddPaymentSplit}
                className="md:col-span-3 py-1.5 bg-[#0097a7]/10 hover:bg-[#0097a7]/20 border border-[#0097a7]/30 text-[#0097a7] rounded text-xs font-bold cursor-pointer h-8"
              >
                Inscrire Règl.
              </button>
            </div>

            {/* Verification summaries */}
            <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Reste à payer en caisse :</span>
                <span className={`font-bold ${calcs.balanceRemaining > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600 font-bold'}`}>
                  {calcs.balanceRemaining.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total perçu cumulé :</span>
                <span className="font-bold text-slate-800">{totalPaidSoFar.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Final checkout actions: normal solder or deposit/acompte */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => handleCompleteTransaction(true)} // Mode ACOMPTE versé
                disabled={cart.length === 0 || totalPaidSoFar <= 0}
                className={`py-2 px-3.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  cart.length > 0 && totalPaidSoFar > 0
                    ? 'bg-amber-50 text-amber-700 border-amber-250 hover:bg-amber-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                Facturer ACOMPTE
              </button>

              <button 
                onClick={() => handleCompleteTransaction(false)} // Mode SOLDER COMPLET
                disabled={cart.length === 0 || calcs.balanceRemaining > 0}
                className={`py-2 px-3.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-0 ${
                  cart.length > 0 && calcs.balanceRemaining <= 0
                    ? 'bg-gradient-to-tr from-[#0097a7] to-teal-500 text-white shadow' 
                    : 'bg-[#fbbf24]/10 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                SOLDER LE TICKET
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* DETAILED PRINTABLE THERMAL RECEIPT SLIP MODAL */}
      {showReceiptModal && lastCompletedOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 max-w-md w-full my-8 space-y-4 shadow-2xl"
          >
            
            {/* Modal header options */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <Ticket className="w-4 h-4 text-[#0097a7]" />
                <h3 className="text-sm font-bold uppercase font-mono">Ticket thermique d'Optique</h3>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer px-2 py-1 bg-slate-50 border border-slate-200 rounded"
              >
                Fermer
              </button>
            </div>

            {/* Core Thermal Slip Paper representation with monospaced style */}
            <div className="bg-white text-slate-950 p-4 rounded-md border border-slate-300 font-mono text-[10.5px] leading-tight space-y-3.5 select-all max-h-[420px] overflow-y-auto shadow-inner printable-ticket">
              
              {/* Header G-LAB brand */}
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm tracking-widest text-slate-900">Optic Alizé</h4>
                <p className="text-[9.5px] text-slate-700 leading-snug">
                  France • Paris Nation Branch<br/>
                  Tél : 01 43 56 12 94<br/>
                  N° convention RO : 751029481<br/>
                  -- TICKET THERMIQUE DE TRANSACTION --
                </p>
              </div>

              <div className="border-t border-dashed border-slate-400 py-1 space-y-0.5">
                <div>Réf: {lastCompletedOrder.id}</div>
                <div>Date: {new Date(lastCompletedOrder.date).toLocaleString('fr-FR')}</div>
                <div>Caissier: {lastCompletedOrder.cashier}</div>
                <div>Statut: {lastCompletedOrder.isAcompte ? 'ACOMPTE ENCAISSÉ - RESTE À RÉGLER' : 'PAYÉ EN TOTALITÉ'}</div>
              </div>

              {/* Items Table in terminal monospaced */}
              <div className="border-t border-dashed border-slate-400 border-b pb-1 pt-1">
                <div className="grid grid-cols-12 font-bold mb-1">
                  <span className="col-span-6 text-left">ARTICLE</span>
                  <span className="col-span-2 text-center">QTÉ</span>
                  <span className="col-span-4 text-right">TOTAL</span>
                </div>
                
                {lastCompletedOrder.items.map((item: any, idx: number) => {
                  const lineTotal = (item.product.price * item.qty) * (1 - item.discountPercent / 100);
                  return (
                    <div key={idx} className="grid grid-cols-12 py-0.5 border-b border-slate-100">
                      <div className="col-span-6 flex flex-col truncate">
                        <span>{item.product.brand} - {item.product.name}</span>
                        {item.eyeSide !== 'NONE' && <span className="text-[8.5px] italic text-slate-600">Side: {item.eyeSide}</span>}
                        {item.discountPercent > 0 && <span className="text-[8.5px] text-amber-700">Remise ({item.discountPercent}%)</span>}
                      </div>
                      <span className="col-span-2 text-center">{item.qty}</span>
                      <span className="col-span-4 text-right font-bold">{lineTotal.toLocaleString()} FCFA</span>
                    </div>
                  );
                })}
              </div>

              {/* Final Math Sub Totals */}
              <div className="space-y-1 text-right border-b border-dashed border-slate-400 pb-2">
                <div>Total Brut: {lastCompletedOrder.items.reduce((acc: number, item: any) => acc + (item.product.price * item.qty), 0).toLocaleString()} FCFA</div>
                {lastCompletedOrder.discountRate > 0 && (
                  <div className="text-amber-800">Remise Panier ({lastCompletedOrder.discountRate}%): - {(lastCompletedOrder.items.reduce((acc: number, item: any) => acc + (item.product.price * item.qty * (1 - item.discountPercent/100)), 0) * lastCompletedOrder.discountRate/100).toLocaleString()} FCFA</div>
                )}
                <div className="text-xs font-bold text-slate-900 mt-1">TOTAL FINAL TTC: {lastCompletedOrder.totalTtc.toLocaleString()} FCFA</div>
                <div className="text-emerald-800 font-bold">MONTANT PERÇU CAISSE: {lastCompletedOrder.paidAmount.toLocaleString()} FCFA</div>
                {lastCompletedOrder.balanceRemaining > 0 && (
                  <div className="text-red-700 font-bold">RESTE À PAYER (ACOMPTE): {lastCompletedOrder.balanceRemaining.toLocaleString()} FCFA</div>
                )}
              </div>

              {/* Multiple payment methods logs */}
              {lastCompletedOrder.payments.length > 0 && (
                <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                  <div className="font-bold">MODE(S) DE RÈGLEMENTS :</div>
                  {lastCompletedOrder.payments.map((p: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="uppercase">{p.method} :</span>
                      <span>{p.amount.toLocaleString()} FCFA</span>
                    </div>
                  ))}
                  <div className="text-[8px] text-slate-500 italic">Réf Tx: {lastCompletedOrder.payments.map((p: any) => p.reference).join(', ')}</div>
                </div>
              )}

              {/* QR Code and barcode simulated decoration */}
              <div className="flex flex-col items-center gap-2 py-2">
                {/* Barcode representation */}
                <div className="text-center font-mono tracking-widest text-[9.5px] scale-y-125 bg-slate-100 p-1.5 rounded select-none text-black">
                  {lastCompletedOrder.barcodeKey}
                </div>
                
                {/* QR Code display representation */}
                <div className="p-2 bg-slate-100 border border-slate-300 rounded-md">
                  <QrCode className="w-16 h-16 stroke-1 text-black" />
                </div>
                <span className="text-[7.5px] text-slate-500 text-center uppercase tracking-wide">Scanner pour valider le tiers-payant CPAM / ALAN / MGEN</span>
              </div>

              <p className="text-center text-[7.5px] text-slate-600 italic leading-snug">
                Merci de votre confiance !<br/>
                La prise en charge mutuelle et AMO est subordonnée à l'accord de votre caisse.<br/>
                Optic Alizé FRANCE • www.g-lab-optic.fr
              </p>

            </div>

            {/* Print and Export Buttons */}
            <div className="flex gap-3 justify-end text-xs">
              <button 
                onClick={handleExportInvoice}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-800 font-semibold cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Facture PDF / HTML
              </button>
              <button 
                onClick={() => {
                  window.print();
                  triggerToast('Impression lancée.');
                }}
                className="px-4 py-1.5 bg-[#0097a7] hover:bg-[#00a7b7] text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1 border-0"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimer le Ticket
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}
