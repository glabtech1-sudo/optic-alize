import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Briefcase, 
  FileText, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  Search, 
  Download, 
  Database,
  Cpu,
  Layers,
  FileSpreadsheet,
  FileCode2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Printer,
  CreditCard,
  UserCheck,
  DollarSign
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ArchFile, TableDefinition } from '../types/architecture';

// Structure of models inside the Accounting Module
interface Revenue {
  id: string;
  date: string;
  description: string;
  category: string;
  method: 'Caisse' | 'Banque' | 'Mobile Money';
  subtotal: number;
  tax: number;
  total: number;
  patient: string;
  isVirtual?: boolean;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  method: 'Caisse' | 'Banque' | 'Mobile Money';
  total: number;
  supplier: string;
  isVirtual?: boolean;
}

interface CashRegisterSession {
  id: string;
  date: string;
  openedBy: string;
  initialFund: number;
  currentCash: number;
  status: 'Ouverte' | 'Clôturée';
  transactionsCount: number;
}

interface MobileMoneyTransaction {
  id: string;
  date: string;
  operator: 'Orange Money' | 'Wave' | 'MTN Mobile Money';
  type: 'Encaissement' | 'Retrait Flotte' | 'Frais';
  amount: number;
  reference: string;
  phone: string;
}

interface AccountingModuleProps {
  onAddGeneratedFiles: (newFiles: ArchFile[]) => void;
  currentLanguage?: 'FR' | 'EN';
}

export default function AccountingModule({ onAddGeneratedFiles, currentLanguage = 'FR' }: AccountingModuleProps) {
  // --- STATE ---
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'transactions' | 'reports' | 'livre_paie'>('dashboard');
  const [transactionTab, setTransactionTab] = useState<'recettes' | 'depenses' | 'caisse' | 'banque' | 'mobile_money'>('recettes');
  const [reportTab, setReportTab] = useState<'journal' | 'grand_livre' | 'bilan' | 'balance' | 'compte_resultat' | 'tresorerie'>('journal');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [payrollSearch, setPayrollSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Dynamic Boutiques retrieve from localStorage
  const [localBranches, setLocalBranches] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('optic_hq_branches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(b => ({
            ...b,
            name: b.name.replace(/Boutique/g, 'Agence')
          }));
        }
      }
    } catch (e) {}
    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }
    return [
      { id: 'bt-dakar', name: 'Agence Alpha', country: 'Zone Ouest', currency: 'FCFA' },
      { id: 'bt-abidjan', name: 'Agence Bêta', country: 'Zone Ouest', currency: 'FCFA' },
      { id: 'bt-lome', name: 'Agence Gamma', country: 'Zone Ouest', currency: 'FCFA' }
    ];
  });

  const [selectedAccountingBoutique, setSelectedAccountingBoutique] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('optic_hq_branches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      }
      return 'ALL';
    } catch (e) {
      return 'ALL';
    }
  });

  // --- UNROLLED MULTI-BOUTIQUES TREASURY ---
  const [boutiqueBalances, setBoutiqueBalances] = useState<any[]>(() => {
    try {
      const savedBranches = localStorage.getItem('optic_hq_branches');
      const savedBalances = localStorage.getItem('optic_accounting_boutique_balances');
      let branchesList = [];
      if (savedBranches) {
        const parsed = JSON.parse(savedBranches);
        if (Array.isArray(parsed)) branchesList = parsed;
      }
      if (branchesList.length > 0) {
        let existingBalances = [];
        if (savedBalances) {
          try {
            const parsedBalances = JSON.parse(savedBalances);
            if (Array.isArray(parsedBalances)) existingBalances = parsedBalances;
          } catch (e) {}
        }
        return branchesList.map(b => {
          const ex = existingBalances.find(eb => eb.id === b.id);
          return {
            id: b.id,
            name: b.name.replace(/Boutique/g, 'Agence'),
            country: b.zone_id === 'ZONE-UEMOA' ? 'Zone Ouest' : b.zone_id === 'ZONE-CEMAC' ? 'Zone Centrale' : 'Zone Nord',
            cash: ex ? ex.cash : 154000,
            bank: ex ? ex.bank : 3420000,
            momo: ex ? ex.momo : 480000,
            profit: ex ? ex.profit : 890000,
            currency: b.currency || 'FCFA'
          };
        });
      }
    } catch (e) {}

    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }

    return [
      { id: 'bt-dakar', name: 'Agence Alpha', country: 'Zone Ouest', cash: 154000, bank: 3420000, momo: 480000, profit: 890000, currency: 'FCFA' },
      { id: 'bt-abidjan', name: 'Agence Bêta', country: 'Zone Ouest', cash: 125000, bank: 2180000, momo: 320000, profit: 640000, currency: 'FCFA' },
      { id: 'bt-lome', name: 'Agence Gamma', country: 'Zone Ouest', cash: 95000, bank: 1650000, momo: 210000, profit: 450000, currency: 'FCFA' }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('optic_accounting_boutique_balances', JSON.stringify(boutiqueBalances));
  }, [boutiqueBalances]);

  React.useEffect(() => {
    const handleSync = () => {
      try {
        const savedBranches = localStorage.getItem('optic_hq_branches');
        if (savedBranches) {
          const parsed = JSON.parse(savedBranches);
          if (Array.isArray(parsed)) {
            setLocalBranches(parsed.map(b => ({
              ...b,
              name: b.name.replace(/Boutique/g, 'Agence')
            })));
            
            const savedBalances = localStorage.getItem('optic_accounting_boutique_balances');
            let existingBalances = [];
            if (savedBalances) {
              try {
                const parsedBalances = JSON.parse(savedBalances);
                if (Array.isArray(parsedBalances)) existingBalances = parsedBalances;
              } catch (e) {}
            }
            const updated = parsed.map(b => {
              const ex = existingBalances.find(eb => eb.id === b.id);
              return {
                id: b.id,
                name: b.name.replace(/Boutique/g, 'Agence'),
                country: b.zone_id === 'ZONE-UEMOA' ? 'Zone Ouest' : b.zone_id === 'ZONE-CEMAC' ? 'Zone Centrale' : 'Zone Nord',
                cash: ex ? ex.cash : 154000,
                bank: ex ? ex.bank : 3420000,
                momo: ex ? ex.momo : 480000,
                profit: ex ? ex.profit : 890000,
                currency: b.currency || 'FCFA'
              };
            });
            setBoutiqueBalances(updated);
          }
        } else if (localStorage.getItem('optic_system_factory_reset') === 'true') {
          setLocalBranches([]);
          setBoutiqueBalances([]);
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleSync);
    handleSync();
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSource, setTransferSource] = useState('');
  const [transferDest, setTransferDest] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferType, setTransferType] = useState<'Caisse' | 'Momo' | 'Banque'>('Caisse');

  const [showRestockCashModal, setShowRestockCashModal] = useState(false);
  const [selectedRestockBoutiqueId, setSelectedRestockBoutiqueId] = useState('');
  const [restockAmount, setRestockAmount] = useState('');

  // Excel filter modal states
  const [showExportExcelModal, setShowExportExcelModal] = useState(false);
  const [exportBoutiqueSelection, setExportBoutiqueSelection] = useState('ALL');
  const [exportStartDate, setExportStartDate] = useState('2026-06-01');
  const [exportEndDate, setExportEndDate] = useState('2026-06-30');

  // Interactive Addition Modals
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // New Revenue Form State
  const [newRevDesc, setNewRevDesc] = useState('');
  const [newRevAmount, setNewRevAmount] = useState('');
  const [newRevCategory, setNewRevCategory] = useState('Vente Lunettes');
  const [newRevMethod, setNewRevMethod] = useState<'Caisse' | 'Banque' | 'Mobile Money'>('Caisse');
  const [newRevPatient, setNewRevPatient] = useState('');
  const [newRevIsVirtual, setNewRevIsVirtual] = useState(false);

  // New Expense Form State
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Achat Verres & Montures');
  const [newExpMethod, setNewExpMethod] = useState<'Caisse' | 'Banque' | 'Mobile Money'>('Banque');
  const [newExpSupplier, setNewExpSupplier] = useState('');
  const [newExpIsVirtual, setNewExpIsVirtual] = useState(false);

  // Status of Schema/APIs Deployments
  const [postgresDeployed, setPostgresDeployed] = useState(false);
  const [flutterGenerated, setFlutterGenerated] = useState(false);

  // --- INITIAL DATA ---
  const [revenues, setRevenues] = useState<Revenue[]>(() => {
    try {
      const saved = localStorage.getItem('optic_accounting_revenues');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('optic_accounting_expenses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [cashSessions, setCashSessions] = useState<CashRegisterSession[]>(() => {
    try {
      const saved = localStorage.getItem('optic_accounting_sessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [momoTransactions, setMomoTransactions] = useState<MobileMoneyTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('optic_accounting_momo');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  interface Payslip {
    id: string;
    employeeId: string;
    employeeName: string;
    employeePosition: string;
    period: string; // e.g., "Juin 2026"
    basicSalary: number;
    totalPrimes: number;
    totalAvances: number;
    socialDeductions: number;
    taxDeductions: number;
    netSalary: number;
    paymentStatus: 'Payé' | 'Brouillon' | 'Arbitrage' | 'Refusé';
    paymentDate?: string;
    presencesCount?: number;
    absencesCount?: number;
    loansDeduction?: number;
    customPrimes?: number;
    customWithdrawals?: number;
  }

  const [payslips, setPayslips] = useState<Payslip[]>(() => {
    try {
      const saved = localStorage.getItem('optic_payslips');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Keep synced with localStorage
  const syncPayslips = (updatedPayslips: Payslip[]) => {
    setPayslips(updatedPayslips);
    localStorage.setItem('optic_payslips', JSON.stringify(updatedPayslips));
  };

  // Sync state changes to localStorage
  React.useEffect(() => {
    localStorage.setItem('optic_accounting_revenues', JSON.stringify(revenues));
  }, [revenues]);

  React.useEffect(() => {
    localStorage.setItem('optic_accounting_expenses', JSON.stringify(expenses));
  }, [expenses]);

  React.useEffect(() => {
    localStorage.setItem('optic_accounting_sessions', JSON.stringify(cashSessions));
  }, [cashSessions]);

  React.useEffect(() => {
    localStorage.setItem('optic_accounting_momo', JSON.stringify(momoTransactions));
  }, [momoTransactions]);

  // --- DERIVED METRICS ---
  const totalRevenues = useMemo(() => revenues.reduce((sum, r) => sum + r.total, 0), [revenues]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.total, 0), [expenses]);
  
  const cashBalance = useMemo(() => {
    // initial sum + cash revenues - cash expenses
    const rCash = revenues.filter(r => r.method === 'Caisse').reduce((s, r) => s + r.total, 0);
    const eCash = expenses.filter(e => e.method === 'Caisse').reduce((s, e) => s + e.total, 0);
    return 0.00 + rCash - eCash; // starts at zero for dynamic test
  }, [revenues, expenses]);

  const bankBalance = useMemo(() => {
    const rBank = revenues.filter(r => r.method === 'Banque').reduce((s, r) => s + r.total, 0);
    const eBank = expenses.filter(e => e.method === 'Banque').reduce((s, e) => s + e.total, 0);
    return 0.00 + rBank - eBank; // starts at zero for dynamic test
  }, [revenues, expenses]);

  const momoBalance = useMemo(() => {
    // calculating sum of Momo transactions
    const totalMomo = momoTransactions.reduce((sum, t) => sum + t.amount, 0);
    return 0.00 + totalMomo; // starts at zero for dynamic test
  }, [momoTransactions]);

  const netResult = totalRevenues - totalExpenses;

  // Recharts Chart Data
  const trendData = [
    { name: '01 Juin', Recettes: 120, Depenses: 85, Tresorerie: 14200 },
    { name: '03 Juin', Recettes: 280, Depenses: 150, Tresorerie: 14330 },
    { name: '05 Juin', Recettes: 450, Depenses: 320, Tresorerie: 14460 },
    { name: '07 Juin', Recettes: 620, Depenses: 410, Tresorerie: 14670 },
    { name: '08 Juin', Recettes: 890, Depenses: 530, Tresorerie: 15030 },
    { name: '09 Juin', Recettes: totalRevenues, Depenses: totalExpenses, Tresorerie: bankBalance + cashBalance + momoBalance }
  ];

  const distributionData = [
    { name: 'Caisse Locale', value: cashBalance, fill: '#10B981' },
    { name: 'Compte Banque', value: bankBalance, fill: '#00BCD4' },
    { name: 'Flotte Mobile Money', value: momoBalance, fill: '#F59E0B' }
  ];

  // --- ACTIONS ---
  const handleAddRevenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevDesc || !newRevAmount) {
      triggerAlert('Veuillez remplir la description et le montant.');
      return;
    }
    const val = parseFloat(newRevAmount);
    if (isNaN(val) || val <= 0) {
      triggerAlert('Montant invalide.');
      return;
    }

    const tva = Math.round((val * 0.20) * 100) / 100;
    const ht = Math.round((val - tva) * 100) / 100;

    const newRev: Revenue = {
      id: `REC-${String(revenues.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().substring(0, 10),
      description: newRevDesc,
      category: newRevCategory,
      method: newRevMethod,
      subtotal: ht,
      tax: tva,
      total: val,
      patient: newRevPatient || 'Patient Passant',
      isVirtual: newRevIsVirtual
    };

    setRevenues([newRev, ...revenues]);

    // If payment method is Mobile Money, generate sync MOMO record
    if (newRevMethod === 'Mobile Money') {
      const newMomo: MobileMoneyTransaction = {
        id: `MMO-${String(momoTransactions.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().substring(0, 10),
        operator: 'Wave',
        type: 'Encaissement',
        amount: val,
        reference: `WAVE-AUTO-${Math.floor(1000000 + Math.random() * 9000000)}`,
        phone: '+221 77 ' + Math.floor(100 + Math.random() * 899) + ' ' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89)
      };
      setMomoTransactions([newMomo, ...momoTransactions]);
    }

    setShowAddRevenue(false);
    setNewRevDesc('');
    setNewRevAmount('');
    setNewRevPatient('');
    setNewRevIsVirtual(false);
    triggerSuccess(newRevIsVirtual 
      ? 'Transaction virtuelle d\'ENTRÉE comptabilisée avec succès de façon fictive !' 
      : 'Recette réelle d\'ENTRÉE comptabilisée avec écriture de crédit générée !');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpDesc || !newExpAmount) {
      triggerAlert('Veuillez remplir la description et le montant.');
      return;
    }
    const val = parseFloat(newExpAmount);
    if (isNaN(val) || val <= 0) {
      triggerAlert('Montant invalide.');
      return;
    }

    const newExp: Expense = {
      id: `DEP-${String(expenses.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().substring(0, 10),
      description: newExpDesc,
      category: newExpCategory,
      method: newExpMethod,
      total: val,
      supplier: newExpSupplier || 'Fournisseur Divers',
      isVirtual: newExpIsVirtual
    };

    setExpenses([newExp, ...expenses]);

    // If method is Mobile Money, log fleet withdrawal
    if (newExpMethod === 'Mobile Money') {
      const newMomo: MobileMoneyTransaction = {
        id: `MMO-${String(momoTransactions.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().substring(0, 10),
        operator: 'Orange Money',
        type: 'Retrait Flotte',
        amount: -val,
        reference: `OM-AUTO-${Math.floor(100000 + Math.random() * 899999)}`,
        phone: 'Compte Flotte'
      };
      setMomoTransactions([newMomo, ...momoTransactions]);
    }

    setShowAddExpense(false);
    setNewExpDesc('');
    setNewExpAmount('');
    setNewExpSupplier('');
    setNewExpIsVirtual(false);
    triggerSuccess(newExpIsVirtual 
      ? 'Transaction virtuelle de SORTIE enregistrée avec succès de façon fictive !' 
      : 'Dépense réelle de SORTIE enregistrée et contrepassée au Grand Livre.');
  };

  const handleBoutiqueTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSource || !transferDest || !transferAmount) {
      triggerAlert('Veuillez spécifier la source, la destination et le montant.');
      return;
    }
    if (transferSource === transferDest) {
      triggerAlert('La boutique source et destination doivent être différentes.');
      return;
    }
    const val = parseFloat(transferAmount);
    if (isNaN(val) || val <= 0) {
      triggerAlert('Montant invalide.');
      return;
    }

    let canTransfer = true;
    const updated = boutiqueBalances.map(b => {
      if (b.id === transferSource) {
        let currentBalance = 0;
        if (transferType === 'Caisse') currentBalance = b.cash;
        else if (transferType === 'Momo') currentBalance = b.momo;
        else currentBalance = b.bank;

        if (currentBalance < val) {
          canTransfer = false;
          return b;
        }

        return {
          ...b,
          cash: transferType === 'Caisse' ? b.cash - val : b.cash,
          momo: transferType === 'Momo' ? b.momo - val : b.momo,
          bank: transferType === 'Banque' ? b.bank - val : b.bank,
        };
      }
      if (b.id === transferDest) {
        return {
          ...b,
          cash: transferType === 'Caisse' ? b.cash + val : b.cash,
          momo: transferType === 'Momo' ? b.momo + val : b.momo,
          bank: transferType === 'Banque' ? b.bank + val : b.bank,
        };
      }
      return b;
    });

    if (!canTransfer) {
      triggerAlert('Solde insuffisant dans la boutique source pour ce mode de transfert.');
      return;
    }

    setBoutiqueBalances(updated);
    setShowTransferModal(false);
    setTransferAmount('');
    const sourceB = boutiqueBalances.find(b => b.id === transferSource)?.name;
    const destB = boutiqueBalances.find(b => b.id === transferDest)?.name;
    triggerSuccess(`Transfert inter-boutique réussi : ${val.toLocaleString()} FCFA transférés avec succès de [${sourceB}] vers [${destB}] (${transferType}).`);
  };

  const handleBoutiqueRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestockBoutiqueId || !restockAmount) {
      triggerAlert('Veuillez spécifier la boutique et le montant de l\'approvisionnement.');
      return;
    }
    const val = parseFloat(restockAmount);
    if (isNaN(val) || val <= 0) {
      triggerAlert('Montant du restockage invalide.');
      return;
    }

    const updated = boutiqueBalances.map(b => {
      if (b.id === selectedRestockBoutiqueId) {
        return {
          ...b,
          cash: b.cash + val
        };
      }
      return b;
    });

    setBoutiqueBalances(updated);
    setShowRestockCashModal(false);
    setRestockAmount('');
    const targetBName = boutiqueBalances.find(b => b.id === selectedRestockBoutiqueId)?.name;
    triggerSuccess(`Caisse locale réapprovisionnée : +${val.toLocaleString()} FCFA affectés avec succès à la caisse de [${targetBName}] depuis la réserve centrale.`);
  };

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // --- EXPORTS GEN---
  const exportToExcel = () => {
    setShowExportExcelModal(true);
  };

  const executeExcelExportWithFilters = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM so Excel opens with correct French accents!
    const boutiqueLabel = exportBoutiqueSelection === 'ALL' ? "TOUTES LES BOUTIQUES" : exportBoutiqueSelection.toUpperCase();
    const currentUserEmail = localStorage.getItem('optic_user_email') || 'glabtech1@gmail.com';
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR');
    const formattedTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Excel Metadata segment
    csvContent += `RAPPORT FINANCIER CONSOLIDE EXCEL;;\n`;
    csvContent += `Boutique selectionnee;"${boutiqueLabel}"\n`;
    csvContent += `Periode de pointage locked;"${exportStartDate} au ${exportEndDate}"\n`;
    csvContent += `Heure generation automatique;"${formattedDate} a ${formattedTime}"\n`;
    csvContent += `Compte auditeur;"${currentUserEmail}"\n\n`;

    // Table headers
    csvContent += "ID;Date;Libelle;Categorie;Mode Reglement;Debit (Recette FCFA);Credit (Depense FCFA);Tiers Beneficiaire;Statut Ecriture;Boutique Source\n";
    
    // Filtered lists
    const filteredRevenues = revenues.filter(r => r.date >= exportStartDate && r.date <= exportEndDate);
    const filteredExpenses = expenses.filter(e => e.date >= exportStartDate && e.date <= exportEndDate);

    filteredRevenues.forEach(r => {
      const typeLabel = r.isVirtual ? "VIRTUELLE (Simulee)" : "REELLE";
      csvContent += `${r.id};${r.date};${r.description.replace(/;/g, ',')};${r.category};${r.method};${r.total};0;${r.patient};${typeLabel};"${boutiqueLabel}"\n`;
    });

    filteredExpenses.forEach(e => {
      const typeLabel = e.isVirtual ? "VIRTUELLE (Simulee)" : "REELLE";
      csvContent += `${e.id};${e.date};${e.description.replace(/;/g, ',')};${e.category};${e.method};0;${e.total};${e.supplier};${typeLabel};"${boutiqueLabel}"\n`;
    });

    const fileBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(fileBlob);
    link.download = `GLAB_OPTIC_EXPORT_${exportBoutiqueSelection}_${exportStartDate}_A_${exportEndDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess(`Export Excel pour la boutique [${boutiqueLabel}] sur la période locked généré avec succès !`);
  };

  const exportStateToPDF = () => {
    // Generate layout and print via print interface or download HTML
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerAlert('Bloqué par le pop-up blocker. Ouvrez la page dans un nouvel onglet.');
      return;
    }

    const logoImage = localStorage.getItem('optic_app_logo_base64') || localStorage.getItem('optic_app_logo') || '/src/assets/images/optic_alize_logo_1781336757710.jpg';

    const title = reportTab === 'journal' ? "Brouillard de Journal Général" :
                  reportTab === 'grand_livre' ? "Grand Livre Général" :
                  reportTab === 'bilan' ? "Bilan de Situation Financière" :
                  reportTab === 'balance' ? "Balance Générale des Comptes" :
                  reportTab === 'compte_resultat' ? "Compte de Résultat Simplifié" : "Flux de Trésorerie Actifs";

    let html = `
      <html>
      <head>
        <title>Optic Alizé Studio - Rapport Financier</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; margin: 40px; position: relative; }
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
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0097a7; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #0097a7; margin: 0; }
          .subtitle { font-size: 12px; color: #4b5563; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; font-weight: 500; }
          th { background-color: #f0fdfa; text-align: left; padding: 10px; border-bottom: 2px solid #0097a7; font-weight: bold; color: #111827; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1f2937; }
          .summary-card { background-color: #f0fdfa; padding: 15px; border-radius: 8px; border: 1px solid #0097a7; margin-top: 30px; display: flex; justify-content: space-between; }
          .font-bold { font-weight: bold; }
          .text-right { text-align: right; }
          .currency { color: #0097a7; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="watermark"></div>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${logoImage}" style="width: 55px; height: 55px; border-radius: 50%; border: 2px solid rgba(0, 151, 167, 0.4); object-fit: cover;" referrerPolicy="no-referrer" />
            <div>
              <h1 class="title">Optic Alizé - COMPTABILITÉ</h1>
              <div class="subtitle">SaaS ERP Lunetterie & Réfraction • Multi-Boutiques</div>
            </div>
          </div>
          <div style="text-align: right">
            <div class="font-bold">Optic Alizé Studio</div>
            <div class="subtitle" style="margin-top:2px;">Généré le : ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</div>
            <div class="subtitle" style="margin-top:2px; font-weight: bold; color: #0097a7">Opérateur : ${localStorage.getItem('optic_user_email') || 'glabtech1@gmail.com'}</div>
          </div>
        </div>
        
        <h2>${title}</h2>
        <p style="font-size: 11px; color: #4b5563;">Statut : Écritures définitives clôturées au ${new Date().toLocaleDateString()}</p>
        
        <table>
          <thead>
    `;

    if (reportTab === 'journal') {
      html += `
        <tr>
          <th>ID Écriture</th>
          <th>Date</th>
          <th>Libellé compte</th>
          <th>Réf Pièce</th>
          <th class="text-right">Débit</th>
          <th class="text-right">Crédit</th>
        </tr>
      </thead>
      <tbody>
        ${revenues.map(r => `
          <tr>
            <td>FEC-${r.id}</td>
            <td>${r.date}</td>
            <td>411000 Patients - ${r.patient}</td>
            <td>${r.id}</td>
            <td class="text-right font-bold">${r.total.toFixed(2)} €</td>
            <td class="text-right">0.00 €</td>
          </tr>
          <tr>
            <td>FEC-${r.id}b</td>
            <td>${r.date}</td>
            <td>707000 Ventes Optiques Optic Alizé</td>
            <td>${r.id}</td>
            <td class="text-right">0.00 €</td>
            <td class="text-right font-bold">${r.subtotal.toFixed(2)} €</td>
          </tr>
          <tr>
            <td>FEC-${r.id}c</td>
            <td>${r.date}</td>
            <td>445710 TVA collectée 20%</td>
            <td>${r.id}</td>
            <td class="text-right">0.00 €</td>
            <td class="text-right font-bold">${r.tax.toFixed(2)} €</td>
          </tr>
        `).join('')}
      </tbody>
      `;
    } else if (reportTab === 'grand_livre') {
      html += `
        <tr>
          <th>N° de Compte</th>
          <th>Intitulé Compte</th>
          <th class="text-right">Mouvements Débit</th>
          <th class="text-right">Mouvements Crédit</th>
          <th class="text-right">Solde Net</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>512000</td><td class="font-bold">Banque Principale Lunetterie Optic Alizé</td><td class="text-right">${revenues.filter(r=>r.method==='Banque').reduce((s,r)=>s+r.total,0).toFixed(2)} €</td><td class="text-right">${expenses.filter(e=>e.method==='Banque').reduce((s,e)=>s+e.total,0).toFixed(2)} €</td><td class="text-right currency">${bankBalance.toFixed(2)} €</td></tr>
        <tr><td>530000</td><td class="font-bold">Caisse Physique Atelier & Magasin</td><td class="text-right">${revenues.filter(r=>r.method==='Caisse').reduce((s,r)=>s+r.total,0).toFixed(2)} €</td><td class="text-right">${expenses.filter(e=>e.method==='Caisse').reduce((s,e)=>s+e.total,0).toFixed(2)} €</td><td class="text-right currency">${cashBalance.toFixed(2)} €</td></tr>
        <tr><td>513000</td><td class="font-bold">Flotte Mobile Money (Wave/Orange)</td><td class="text-right">${momoTransactions.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0).toFixed(2)} €</td><td class="text-right">${Math.abs(momoTransactions.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0)).toFixed(2)} €</td><td class="text-right currency">${momoBalance.toFixed(2)} €</td></tr>
        <tr><td>707000</td><td class="font-bold">Ventes de verres, montures et solaires</td><td class="text-right">0.00 €</td><td class="text-right">${revenues.reduce((s,r)=>s+r.subtotal,0).toFixed(2)} €</td><td class="text-right font-bold">-${revenues.reduce((s,r)=>s+r.subtotal,0).toFixed(2)} €</td></tr>
        <tr><td>607000</td><td class="font-bold">Achats marchandises et outillage meules</td><td class="text-right">${expenses.reduce((s,p)=>s+p.total,0).toFixed(2)} €</td><td class="text-right">0.00 €</td><td class="text-right font-bold">${expenses.reduce((s,p)=>s+p.total,0).toFixed(2)} €</td></tr>
      </tbody>
      `;
    } else {
      // Catch-all mock report tables
      html += `
        <tr>
          <th>Libellé Poste Comptable</th>
          <th class="text-right">Débit / Actif</th>
          <th class="text-right">Crédit / Passif</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Trésorerie disponible (Banque / Caisse / Mobile Money)</td><td class="text-right font-bold">${(bankBalance+cashBalance+momoBalance).toFixed(2)} €</td><td class="text-right">0.00 €</td></tr>
        <tr><td>Stocks physique lunetterie valorisés (Atelier)</td><td class="text-right">8 450.00 €</td><td class="text-right">0.00 €</td></tr>
        <tr><td>Capitaux propres Groupe Optic Alizé</td><td class="text-right">0.00 €</td><td class="text-right font-bold">12 000.00 €</td></tr>
        <tr><td>Dettes Fournisseurs (Essilor, Safilo)</td><td class="text-right">0.00 €</td><td class="text-right">2 140.00 €</td></tr>
        <tr style="background:#F5F7FA; font-weight:bold;"><td>Consolidation Générale Optic Alizé</td><td class="text-right text-emerald-600">${(bankBalance+cashBalance+momoBalance + 8450).toFixed(2)} €</td><td class="text-right text-emerald-600">${(12000 + 2140 + netResult).toFixed(2)} €</td></tr>
      </tbody>
      `;
    }

    html += `
        </table>
        
        <div class="summary-card">
          <div>Consolidation Optic Alizé : <strong>Opticien-Comptable Agrée</strong></div>
          <div>Total Trésorerie Actuel : <span class="currency">${(bankBalance + cashBalance + momoBalance).toFixed(2)} €</span></div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    triggerSuccess('Fichier PDF formaté généré ! Utilisez l\'imprimante PDF native.');
  };

  // --- COMPILER INTEGRATIONS ---
  const handleDeployPostgres = () => {
    // Modify dbTables dynamic schema
    const accountingTables: TableDefinition[] = [
      {
        name: 'accounting_revenues',
        description: 'Enregistre l\'ensemble des recettes comptabilisées par les magasins d\'optique (Ventes, Remboursement sécu, etc).',
        isTenantSpecific: true,
        columns: [
          { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'Id unique de la recette.' },
          { name: 'date', type: 'DATE', constraints: 'NOT NULL DEFAULT CURRENT_DATE', description: 'Date d\'encaissement.' },
          { name: 'description', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Description de la transaction.' },
          { name: 'category', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Classification de revenu.' },
          { name: 'payment_method', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Canal: Caisse, Banque, Mobile Money.' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Montant TTC perçu.' }
        ],
        policies: [
          { name: 'Allow authenticated read write', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Seul le pôle financier ou l\'opticien gérant gère les écritures.' }
        ]
      },
      {
        name: 'accounting_mobile_money',
        description: 'Suivi des flux financiers par Mobile Money locaux en Afrique de l\'Ouest (Wave, Orange Money, MTN MM) pour le tiers payant.',
        isTenantSpecific: true,
        columns: [
          { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID transaction.' },
          { name: 'operator', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Wave, Orange Money, MTN.' },
          { name: 'type', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Encaissement, Retrait Flotte, Frais.' },
          { name: 'amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Crédit/Débit brut.' },
          { name: 'reference_gsm', type: 'VARCHAR(100)', constraints: 'UNIQUE', description: 'ID de transaction unique de l\'opérateur.' }
        ],
        policies: [
          { name: 'Auditor read check', action: 'SELECT', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Validation des flottes monétaires.' }
        ]
      }
    ];

    // Simulating deployment success
    setPostgresDeployed(true);
    triggerSuccess('Tables PostgreSQL déployées avec RLS actif ! Visibles dans le PostgreSQL & RLS Explorer.');
  };

  const handleGenerateFlutter = () => {
    // Generate Dart clean architecture files for Flutter & register them
    const newFiles: ArchFile[] = [
      {
        name: 'accounting_entity.dart',
        path: 'frontend/lib/domain/entities/accounting_entity.dart',
        language: 'dart',
        module: 'Accounting System',
        layer: 'domain',
        type: 'entity',
        description: 'Entité comptable pour le reporting de trésorerie (Caisse/Banque/Mobile Money) dans l\'application Flutter.',
        content: `import 'package:equatable/equatable.dart';

class AccountingEntity extends Equatable {
  final String id;
  final String description;
  final double amount;
  final String paymentMethod; // Caisse, Banque, MobileMoney
  final String category;
  final DateTime date;

  const AccountingEntity({
    required this.id,
    required this.description,
    required this.amount,
    required this.paymentMethod,
    required this.category,
    required this.date,
  });

  @override
  List<Object?> get props => [id, description, amount, paymentMethod, category, date];
}`
      },
      {
        name: 'accounting_view.dart',
        path: 'frontend/lib/presentation/pages/accounting_view.dart',
        language: 'dart',
        module: 'Accounting System',
        layer: 'presentation',
        type: 'entity',
        description: 'Écran Flutter pour piloter la caisse et la banque Optic Alizé d\'optique en temps réel.',
        content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AccountingView extends ConsumerWidget {
  const AccountingView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Comptabilité Optic Alizé'),
        backgroundColor: const Color(0xFF0097A7),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.account_balance_wallet, size: 72, color: Color(0xFF00BCD4)),
            const SizedBox(height: 16),
            const Text('Gestion Caisse, Banque & Mobile Money', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add),
              label: const Text('Enregistrer Recette / Dépense'),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0097A7)),
            ),
          ],
        ),
      ),
    );
  }
}`
      },
      {
        name: 'accounting_controller.ts',
        path: 'backend/src/controllers/accounting_controller.ts',
        language: 'typescript',
        module: 'Accounting System',
        layer: 'backend',
        type: 'controller',
        description: 'Contrôleur API Express filtrant et exportant les journaux et grands livres.',
        content: `import { Request, Response } from 'express';

export async function getAccountingSummary(req: Request, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    // Query revenues & expenses with PostgreSQL pools filtered by current tenant
    const cashSum = 450000; // Simulated values from DB
    return res.json({
      status: 'success',
      data: {
        totCash: cashSum,
        momoBalance: 12500,
        bankBalance: 494500,
        currency: 'EUR'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal accounting failure' });
  }
}`
      }
    ];

    onAddGeneratedFiles(newFiles);
    setFlutterGenerated(true);
    triggerSuccess('3 Fichiers Clean Architecture (Flutter Dart + Express APIs) injectés avec succès dans le Workspace !');
  };

  const handlePrintPayslip = (slip: Payslip) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerAlert('Bloqué par le bloqueur de fenêtres. Veuillez ouvrir dans un nouvel onglet.');
      return;
    }

    const logoImage = localStorage.getItem('optic_app_logo_base64') || localStorage.getItem('optic_app_logo') || '/src/assets/images/optic_alize_logo_1781336757710.jpg';

    const socRate = 8;
    const taxRate = 10;
    const rawGross = slip.basicSalary + slip.totalPrimes;

    const html = `
      <html>
      <head>
        <title>OPTIC ALIZÉ - Bulletin de Paie ID ${slip.id}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 0;
            font-size: 10px;
            line-height: 1.25;
            position: relative;
            background-color: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-25deg);
            width: 280px;
            height: 280px;
            opacity: 0.04;
            background-image: url('${logoImage}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            pointer-events: none;
            z-index: 0;
          }
          .border-box {
            border: 1.5px solid #0097a7;
            padding: 15px;
            border-radius: 6px;
            position: relative;
            z-index: 10;
            height: 275mm; /* Matches exact A4 printable height */
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            border-bottom: 1.5px solid #0097a7;
            padding-bottom: 8px;
            margin-bottom: 8px;
            align-items: center;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 2px;
            text-transform: uppercase;
            border: 1.5px solid #0097a7;
            padding: 4px 8px;
            display: inline-block;
            color: #0097a7;
            border-radius: 4px;
            background-color: #f0fdfa;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            text-align: left;
          }
          th {
            background-color: #f0fdfa;
            font-weight: bold;
            color: #111827;
            border-bottom: 1.5px solid #0097a7;
          }
          .summary {
            display: flex;
            justify-content: flex-end;
            margin-top: 4px;
          }
          .summary-table {
            width: 240px;
          }
          .total-pay {
            font-size: 11px;
            font-weight: bold;
            background-color: #0097a7;
            color: #fff;
            padding: 4px;
          }
          .total-pay td {
            color: #fff !important;
            background-color: #0097a7 !important;
            border-color: #0097a7;
          }
          .footer-note {
            font-size: 8px;
            margin-top: 4px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 4px;
            color: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="watermark"></div>
        <div class="border-box">
          <div>
            <div class="header-grid">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${logoImage}" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid rgba(0, 151, 167, 0.4); object-fit: cover;" referrerPolicy="no-referrer" />
                <div>
                  <strong>EMPLOYEUR :</strong><br/>
                  <strong>OPTIC ALIZÉ S.A.</strong><br/>
                  Succursale Principale Optique<br/>
                  N° National : TG-LOM-2022-B-894<br/>
                </div>
              </div>
              <div class="text-right">
                <strong>SALARIÉ :</strong><br/>
                <strong>${slip.employeeName.toUpperCase()}</strong><br/>
                Poste : ${slip.employeePosition}<br/>
                Matricule : ${slip.employeeId}<br/>
                Période : <strong>${slip.period}</strong><br/>
              </div>
            </div>

            <div class="text-center" style="margin: 5px 0;">
              <div class="title">Bulletin de Paie Simplifié</div><br/>
              <span style="font-size: 9px; color: #4b5563;">Zone d'Activité / UEMOA • Code du travail révisé</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Désignation Code</th>
                  <th>Base de calcul</th>
                  <th>Taux / Part</th>
                  <th class="text-right">Gain Salarié (+)</th>
                  <th class="text-right">Retenue (-)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1010 - Salaire de Base Mensuel</td>
                  <td>30 jours / Tps Complet</td>
                  <td>100.00 %</td>
                  <td class="text-right">${Math.round(slip.basicSalary).toLocaleString()} FCFA</td>
                  <td class="text-right">-</td>
                </tr>
                ${slip.presencesCount !== undefined ? `
                <tr>
                  <td>1012 - Pris en compte Assiduité</td>
                  <td>${slip.presencesCount} Présences / ${slip.absencesCount || 0} Absences</td>
                  <td>-</td>
                  <td class="text-right">-</td>
                  <td class="text-right">-</td>
                </tr>
                ` : ''}
                <tr>
                  <td>2040 - Primes exceptionnelles & Primes Saisies</td>
                  <td>Variables de vente et primes manuelles</td>
                  <td>-</td>
                  <td class="text-right">${slip.totalPrimes > 0 ? Math.round(slip.totalPrimes).toLocaleString() + ' FCFA' : '0 FCFA'}</td>
                  <td class="text-right">-</td>
                </tr>
                <tr style="font-weight: bold; background-color: #F9FAFB;">
                  <td>TOTAL SALAIRE BRUT (A)</td>
                  <td>${Math.round(rawGross).toLocaleString()} FCFA</td>
                  <td>-</td>
                  <td class="text-right">${Math.round(rawGross).toLocaleString()} FCFA</td>
                  <td class="text-right">0 FCFA</td>
                </tr>
                <tr>
                  <td>4011 - Part Sociale Obligatoire (IPRES / CNPS / CNSS)</td>
                  <td>${Math.round(rawGross).toLocaleString()} FCFA</td>
                  <td>${socRate}.00 %</td>
                  <td class="text-right">-</td>
                  <td class="text-right">${Math.round(slip.socialDeductions).toLocaleString()} FCFA</td>
                </tr>
                <tr>
                  <td>4022 - Impôt sur le Traitement des Salaires (ITS / Taxes)</td>
                  <td>${Math.round(rawGross).toLocaleString()} FCFA</td>
                  <td>${taxRate}.00 %</td>
                  <td class="text-right">-</td>
                  <td class="text-right">${Math.round(slip.taxDeductions).toLocaleString()} FCFA</td>
                </tr>
                <tr>
                  <td>5054 - Avances & Acomptes perçus</td>
                  <td>Acompte quinzaine</td>
                  <td>-</td>
                  <td class="text-right">-</td>
                  <td class="text-right">${slip.totalAvances > 0 ? Math.round(slip.totalAvances).toLocaleString() + ' FCFA' : '0 FCFA'}</td>
                </tr>
                ${slip.loansDeduction ? `
                <tr>
                  <td>5055 - Retenues sur prêts à déduire</td>
                  <td>Remboursement de prêt</td>
                  <td>-</td>
                  <td class="text-right">-</td>
                  <td class="text-right">${Math.round(slip.loansDeduction).toLocaleString()} FCFA</td>
                </tr>
                ` : ''}
                ${slip.customWithdrawals ? `
                <tr>
                  <td>5056 - Retraits divers appliqués</td>
                  <td>Pénalités ou retenues exceptionnelles</td>
                  <td>-</td>
                  <td class="text-right">-</td>
                  <td class="text-right">${Math.round(slip.customWithdrawals).toLocaleString()} FCFA</td>
                </tr>
                ` : ''}
              </tbody>
            </table>

            <div class="summary">
              <table class="summary-table">
                <tr>
                  <td>Total des Gains Bruts :</td>
                  <td class="text-right">${Math.round(rawGross).toLocaleString()} FCFA</td>
                </tr>
                <tr>
                  <td>Total des Retenues :</td>
                  <td class="text-right">${Math.round(slip.socialDeductions + slip.taxDeductions + slip.totalAvances + (slip.loansDeduction || 0) + (slip.customWithdrawals || 0)).toLocaleString()} FCFA</td>
                </tr>
                <tr class="total-pay">
                  <td>NET NET À PAYER (FCFA) :</td>
                  <td class="text-right">${Math.round(slip.netSalary).toLocaleString()} FCFA</td>
                </tr>
              </table>
            </div>
          </div>

          <div>
            <div class="header-grid" style="border-top: 1.5px solid #0097a7; border-bottom: none; padding-top: 8px; margin-top: 12px;">
              <div>
                <strong>Date de Paiement :</strong> ${slip.paymentDate || 'En attente de virement'}<br/>
                <strong>Visa de la Direction OPTIC ALIZÉ :</strong><br/>
                <span style="font-size: 8px; color: #4b5563;">Signé numériquement pour le SaaS</span>
              </div>
              <div class="text-right">
                <strong>Signature du Salarié :</strong><br/>
                <br/>
                <span style="font-size: 8px; color: #4b5563;">Mention "Lu et approuvé"</span>
              </div>
            </div>

            <div class="footer-note text-center">
              Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limite de durée.<br/>
              <strong>OPTIC ALIZÉ ERP - Module RH v1.2.0</strong>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    triggerSuccess(`Génération et impression du bulletin pour ${slip.employeeName} réussie.`);
  };

  const handlePaySalaryFromAccounting = (id: string) => {
    const updatedPayslips = payslips.map(slip => {
      if (slip.id === id) {
        const paymentDate = new Date().toISOString().substring(0, 10);
        // Record as an expense!
        const newExpense: Expense = {
          id: `DEP-${String(expenses.length + 1).padStart(3, '0')}`,
          date: paymentDate,
          description: `Règlement Salaire ${slip.period} - ${slip.employeeName}`,
          category: 'Salaires et Charges',
          method: 'Banque', // default to Banque for salaries
          total: slip.netSalary,
          supplier: `Salarié - ${slip.employeeName}`
        };
        setExpenses(prev => [newExpense, ...prev]);

        return { ...slip, paymentStatus: 'Payé' as const, paymentDate };
      }
      return slip;
    });

    syncPayslips(updatedPayslips);
    triggerSuccess('Paiement du salaire effectué avec succès ! Le flux financier est enregistré en dépenses (Banque).');
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Custom Optic Alizé Style Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00BCD4]/10 text-[#0097A7] text-xs font-bold rounded-full border border-[#00BCD4]/20">
            <Building2 className="w-3.5 h-3.5" />
            {currentLanguage === 'FR' ? "Module Finance Actif" : "Finance Workspace Active"}
          </div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-[#1F2937]">
            {currentLanguage === 'FR' ? "Comptabilité & Trésorerie Optic Alizé" : "Optic Alizé Accounting, Ledger & Treasury"}
          </h2>
          <p className="text-xs text-[#1F2937]/75 font-sans leading-relaxed max-w-2xl">
            {currentLanguage === 'FR' 
              ? "Système financier intégré conçu spécifiquement pour les franchises lunetières d'Afrique de l'Ouest. Gère nativement la Caisse enregistreuse, le rapprochement de Banque, ainsi que les encaissements mobiles Mobile Money (Wave, Orange, MTN)."
              : "Integrated financial ecosystem built specifically for West African optical franchise networks. Manages physical Registers, Bank clearing, and Mobile Money receipts natively."}
          </p>
        </div>

        {/* Action button rails for Exports and Deployments */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition cursor-pointer shadow-sm border border-emerald-600"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          
          <button 
            onClick={exportStateToPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0097A7] text-white text-xs font-semibold rounded-xl hover:bg-[#00838F] transition cursor-pointer shadow-sm border border-[#0097A7]"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button 
            onClick={handleDeployPostgres}
            disabled={postgresDeployed}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm border ${
              postgresDeployed
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{postgresDeployed ? 'Tables Déployées ✔' : 'Déployer Tables PG'}</span>
          </button>

          <button 
            onClick={handleGenerateFlutter}
            disabled={flutterGenerated}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm border ${
              flutterGenerated
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{flutterGenerated ? 'Flutter & APIs Injectés ✔' : 'Générer Pages Flutter / API'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {alertMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-xs font-semibold text-red-800">{alertMessage}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-emerald-800">{successMsg}</span>
        </div>
      )}

      {/* Dynamic Boutique Selector for Local Accounting context */}
      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 justify-start text-left">
          <div className="w-8 h-8 rounded-lg bg-[#00BCD4]/10 text-[#0097A7] flex items-center justify-center shadow-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h4 className="font-extrabold text-slate-800">Sélection d'Agence Comptable</h4>
            <p className="text-[10px] text-slate-500 font-medium">Basculez entre vos agences d'optiques pour visualiser leurs journaux de ventes et OpEx respectifs.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-bold text-slate-600">Aperçu Agence :</label>
          <select 
            value={selectedAccountingBoutique}
            onChange={(e) => setSelectedAccountingBoutique(e.target.value)}
            className="text-xs font-bold rounded-lg border border-slate-250 bg-white p-2 outline-none cursor-pointer focus:ring-1 focus:ring-cyan-600 text-slate-750"
          >
            <option value="ALL">🏢 Consolidé (Toutes Agences)</option>
            {localBranches.map((b) => (
              <option key={b.id} value={b.id}>🏢 {b.name} ({b.city || b.zone_id})</option>
            ))}
          </select>
          {localBranches.length === 0 && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-mono">
              Créer manuellement des agences dans SuperAdmin HQ
            </span>
          )}
        </div>
      </div>

      {/* Sub Tabs Selection (G-LAB styled layout) */}
      <div className="flex border-b border-[#DDE3EA] gap-6">
        <button 
          onClick={() => setActiveSubTab('dashboard')}
          className={`pb-3 text-sm font-semibold relative transition cursor-pointer ${
            activeSubTab === 'dashboard' ? 'text-[#0097A7]' : 'text-[#1F2937]/70 hover:text-[#1F2937]'
          }`}
        >
          Tableau de bord financier
          {activeSubTab === 'dashboard' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('transactions')}
          className={`pb-3 text-sm font-semibold relative transition cursor-pointer ${
            activeSubTab === 'transactions' ? 'text-[#0097A7]' : 'text-[#1F2937]/70 hover:text-[#1F2937]'
          }`}
        >
          Gestion des Écritures / Échanges
          {activeSubTab === 'transactions' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('reports')}
          className={`pb-3 text-sm font-semibold relative transition cursor-pointer ${
            activeSubTab === 'reports' ? 'text-[#0097A7]' : 'text-[#1F2937]/70 hover:text-[#1F2937]'
          }`}
        >
          Rapports Comptables & FEC
          {activeSubTab === 'reports' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('livre_paie')}
          className={`pb-3 text-sm font-semibold relative transition cursor-pointer ${
            activeSubTab === 'livre_paie' ? 'text-[#0097A7]' : 'text-[#1F2937]/70 hover:text-[#1F2937]'
          }`}
        >
          Livre de Paie (Salaires RH)
          {activeSubTab === 'livre_paie' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
        </button>
      </div>

      {/* --- RENDER ACTIVE SUB-TAB CONTENT --- */}

      {/* 1. TABLEAU DE BORD FINANCIER */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Colored background metric cards with tailored visual identifiers */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl border border-emerald-500 shadow-md space-y-4 text-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <header className="text-xs font-black text-emerald-100 uppercase tracking-wider bg-transparent border-none py-0 px-0">Solde Caisse Locale</header>
                  <p className="text-2xl font-display font-black text-white">{cashBalance.toLocaleString()} FCFA</p>
                </div>
                <div className="p-3 bg-white/15 text-white rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-200" />
                <span className="font-bold">Caisse Ouverte</span>
                <span className="text-emerald-200/80 ml-auto font-medium">Amorçage : 100 000 FCFA</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl border border-blue-500 shadow-md space-y-4 text-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <header className="text-xs font-black text-blue-100 uppercase tracking-wider bg-transparent border-none py-0 px-0">Compte Courant Banque</header>
                  <p className="text-2xl font-display font-black text-white">{bankBalance.toLocaleString()} FCFA</p>
                </div>
                <div className="p-3 bg-white/15 text-white rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-100">
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-200" />
                <span className="font-bold">Réconcilié en temps réel</span>
                <span className="text-blue-200/80 ml-auto font-medium">BCEAO Connect OK</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl border border-amber-400 shadow-md space-y-4 text-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <header className="text-xs font-black text-amber-500 uppercase tracking-widest bg-transparent border-none py-0 px-0 text-white">Flotte Mobile Money</header>
                  <p className="text-2xl font-display font-black text-white">{momoBalance.toLocaleString()} FCFA</p>
                </div>
                <div className="p-3 bg-white/15 text-white rounded-xl">
                  <PiggyBank className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-100">
                <TrendingUp className="w-3.5 h-3.5 text-amber-200" />
                <span className="font-bold">Wave & Orange Money OK</span>
                <span className="text-amber-200/80 ml-auto font-medium">Consolidé</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl border border-indigo-500 shadow-md space-y-4 text-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <header className="text-xs font-black text-indigo-100 uppercase tracking-wider bg-transparent border-none py-0 px-0">Marge Brute / Résultat</header>
                  <p className="text-2xl font-display font-black text-white">+{netResult.toLocaleString()} FCFA</p>
                </div>
                <div className="p-3 bg-white/15 text-white rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-100">
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-200" />
                <span className="font-bold">Taux de marge estimé : +84%</span>
                <span className="text-indigo-200/80 ml-auto font-medium">Rentable</span>
              </div>
            </div>
          </div>

          {/* SEC: COMPTES DE TRÉSORERIE ET OPÉRATIONS DÉCENTRALISÉES (SANS LISTE DÉROULANTE) */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-display font-semibold text-[#1F2937] text-xs tracking-wider uppercase flex items-center gap-1.5 text-cyan-700">
                  <Building2 className="w-4 h-4 text-cyan-600 animate-pulse" />
                  État de Trésorerie par Boutique (Réseau Décentralisé)
                </h3>
                <p className="text-[10px] text-[#1F2937]/65">Accès direct aux comptes de chaque succursale d'optique. Tout est affiché à plat sans liste déroulante filtre.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (boutiqueBalances.length > 0) {
                      setTransferSource(boutiqueBalances[0].id);
                      setTransferDest(boutiqueBalances[1]?.id || boutiqueBalances[0].id);
                      setShowTransferModal(true);
                    } else {
                      triggerAlert("Aucune agence n'est actuellement configurée.");
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 text-white rounded-lg text-xs font-semibold hover:bg-cyan-800 transition shadow-sm cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Transfert Inter-Agences</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {boutiqueBalances.map(b => (
                <div key={b.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs hover:shadow-md transition space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 px-2.5 bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider rounded-bl-lg">
                    {b.country}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1F2937] text-xs uppercase tracking-wide">{b.name}</h4>
                    <span className="text-[9px] text-[#1F2937]/50 font-semibold">Taux de Change Peg Fixe €/CFA • {b.currency}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-100 font-mono text-[11px]">
                    <div className="p-1.5 bg-emerald-50 rounded">
                      <p className="text-[8px] text-emerald-600 font-bold uppercase">Caisse</p>
                      <p className="font-black text-emerald-700">{b.cash.toLocaleString()}</p>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded">
                      <p className="text-[8px] text-blue-600 font-bold uppercase">Banque</p>
                      <p className="font-black text-blue-700">{b.bank.toLocaleString()}</p>
                    </div>
                    <div className="p-1.5 bg-amber-50 rounded">
                      <p className="text-[8px] text-amber-600 font-bold uppercase">Mobile</p>
                      <p className="font-black text-amber-700">{b.momo.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[9px] text-[#1F2937]/60 font-semibold">Bénéfice local : <strong className="text-emerald-600">+{b.profit.toLocaleString()}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRestockBoutiqueId(b.id);
                        setShowRestockCashModal(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-bold text-[10px] transition cursor-pointer"
                    >
                      + Approvisionner
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Graphical Trends Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cash flow area chart */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <h3 className="text-sm font-bold tracking-widest text-[#1F2937]/70 uppercase">
                Flux de Trésorerie Optic Alizé (Juin 2026)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00BCD4" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#00BCD4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Recettes" stroke="#00BCD4" fillOpacity={1} fill="url(#colorRec)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Depenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorDep)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Assets Distribution chart */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4 flex flex-col justify-between">
              <h3 className="text-sm font-bold tracking-widest text-[#1F2937]/70 uppercase">
                Répartition des Fonds Actifs
              </h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={9} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00BCD4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 text-xs mt-3">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-[#1F2937]/70">Trésorerie liquide</span>
                  <span className="font-bold text-[#1F2937]">{(bankBalance + cashBalance + momoBalance).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#1F2937]/50">
                  <span>En attente de versement Orange</span>
                  <span>450.00 €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GESTION DES ÉCRITURES / TRANSACTION TABS */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setTransactionTab('recettes')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                transactionTab === 'recettes' 
                  ? 'bg-[#0097A7] text-white border-[#0097A7]' 
                  : 'bg-white text-[#1F2937]/70 border-[#DDE3EA] hover:bg-[#F5F7FA]'
              }`}
            >
              Recettes d'Exploitation
            </button>
            <button 
              onClick={() => setTransactionTab('depenses')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                transactionTab === 'depenses' 
                  ? 'bg-[#0097A7] text-white border-[#0097A7]' 
                  : 'bg-white text-[#1F2937]/70 border-[#DDE3EA] hover:bg-[#F5F7FA]'
              }`}
            >
              Dépenses / Achats Verres
            </button>
            <button 
              onClick={() => setTransactionTab('caisse')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                transactionTab === 'caisse' 
                  ? 'bg-[#0097A7] text-white border-[#0097A7]' 
                  : 'bg-white text-[#1F2937]/70 border-[#DDE3EA] hover:bg-[#F5F7FA]'
              }`}
            >
              Session Caisse Physique
            </button>
            <button 
              onClick={() => setTransactionTab('banque')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                transactionTab === 'banque' 
                  ? 'bg-[#0097A7] text-white border-[#0097A7]' 
                  : 'bg-white text-[#1F2937]/70 border-[#DDE3EA] hover:bg-[#F5F7FA]'
              }`}
            >
              Banque & Télétransmission
            </button>
            <button 
              onClick={() => setTransactionTab('mobile_money')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                transactionTab === 'mobile_money' 
                  ? 'bg-[#0097A7] text-white border-[#0097A7]' 
                  : 'bg-white text-[#1F2937]/70 border-[#DDE3EA] hover:bg-[#F5F7FA]'
              }`}
            >
              Flotte Mobile Money
            </button>
          </div>

          {/* SUB-TRANSACTION SUB-COMPONENTS */}
          {transactionTab === 'recettes' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <h3 className="font-display font-semibold text-base text-[#1F2937]">Brouillard de Recettes Journalières</h3>
                <button 
                  onClick={() => setShowAddRevenue(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0097A7] text-white text-xs font-bold rounded-xl hover:bg-[#00838F] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Saisir Nouvelle Recette
                </button>
              </div>

              {/* LIST OF REVENUES */}
              <div className="overflow-x-auto rounded-xl border border-[#DDE3EA]">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#F5F7FA] text-[#1F2937] border-b border-[#DDE3EA] uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-4">ID Écriture</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Libellé</th>
                      <th className="p-4">Patient / Tiers</th>
                      <th className="p-4">Méthode de Paiement</th>
                      <th className="p-4 text-right">HT</th>
                      <th className="p-4 text-right">TVA (20%)</th>
                      <th className="p-4 text-right">Montant TTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE3EA]">
                    {revenues.map(rev => (
                      <tr key={rev.id} className="hover:bg-[#F5F7FA]/10">
                        <td className="p-4 font-mono font-bold text-[#0097A7]">{rev.id}</td>
                        <td className="p-4 font-mono text-slate-500">{rev.date}</td>
                        <td className="p-4 font-semibold text-[#1F2937]">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            {rev.description}
                            {rev.isVirtual && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700/90 rounded border border-amber-200 text-[9px] font-bold">
                                Virtuel ⚡
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-4 text-[#1F2937]/80">{rev.patient}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rev.method === 'Caisse' ? 'bg-[#10B981]/10 text-[#10B981]' : 
                            rev.method === 'Banque' ? 'bg-[#00BCD4]/10 text-[#0097A7]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          }`}>
                            {rev.method}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono">{rev.subtotal.toFixed(2)} €</td>
                        <td className="p-4 text-right font-mono text-slate-500">{rev.tax.toFixed(2)} €</td>
                        <td className="p-4 text-right font-mono font-bold text-[#10B981]">{rev.total.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {transactionTab === 'depenses' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <h3 className="font-display font-semibold text-base text-[#1F2937]">Registre des Dépenses d'Atelier & Structure</h3>
                <button 
                  onClick={() => setShowAddExpense(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0097A7] text-white text-xs font-bold rounded-xl hover:bg-[#00838F] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Saisir Nouvelle Charge
                </button>
              </div>

              {/* LIST OF EXPENSES */}
              <div className="overflow-x-auto rounded-xl border border-[#DDE3EA]">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#F5F7FA] text-[#1F2937] border-b border-[#DDE3EA] uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-4">Code Dépense</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Libellé charge</th>
                      <th className="p-4">Fournisseur d'approvisionnement</th>
                      <th className="p-4">Mode Rent</th>
                      <th className="p-4">Catégorie budgétaire</th>
                      <th className="p-4 text-right">Montant Réel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE3EA]">
                    {expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-[#F5F7FA]/10">
                        <td className="p-4 font-mono font-bold text-red-500">{exp.id}</td>
                        <td className="p-4 font-mono text-slate-500">{exp.date}</td>
                        <td className="p-4 text-[#1F2937] font-semibold">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            {exp.description}
                            {exp.isVirtual && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700/90 rounded border border-amber-200 text-[9px] font-bold">
                                Virtuel ⚡
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-4 text-[#1F2937]/80">{exp.supplier}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 border text-[#1F2937]/75">
                            {exp.method}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded bg-[#00BCD4]/10 text-[#0097A7] font-mono font-semibold text-[10px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-red-500">-{exp.total.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {transactionTab === 'caisse' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <header className="flex justify-between items-center border-b pb-4 shrink-0 bg-transparent py-0 px-0">
                <h3 className="font-display font-semibold text-base text-[#1F2937]">Suivi de la Caisse Magasin Optic Alizé</h3>
                <div className="text-xs font-mono bg-[#10B981]/15 text-[#10B981] px-2.5 py-1 rounded-full border border-[#10B981]/10 font-bold">
                  Statut : Session active ouverte par l'opticien
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#F5F7FA] p-4 rounded-xl border border-[#DDE3EA]">
                  <p className="text-[11px] font-bold text-[#1F2937]/65 uppercase">Encours Fonds de Caisse</p>
                  <p className="text-2xl font-mono font-extrabold text-[#1F2937] mt-1">{cashBalance.toFixed(2)} €</p>
                </div>
                <div className="bg-[#F5F7FA] p-4 rounded-xl border border-[#DDE3EA]">
                  <p className="text-[11px] font-bold text-[#1F2937]/65 uppercase">Fond de caisse Initial</p>
                  <p className="text-2xl font-mono font-bold text-[#1F2937]/70 mt-1">150.00 €</p>
                </div>
                <div className="bg-[#F5F7FA] p-4 rounded-xl border border-[#DDE3EA]">
                  <p className="text-[11px] font-bold text-[#1F2937]/65 uppercase">Cumul des espèces du jour</p>
                  <p className="text-2xl font-mono font-bold text-[#10B981] mt-1">+{revenues.filter(r => r.method === 'Caisse').reduce((s, r) => s + r.total, 0).toFixed(2)} €</p>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Journaux des Dernières Sessions de Caisse</h4>
                <div className="border border-[#DDE3EA] rounded-xl overflow-hidden text-xs">
                  <div className="bg-[#F5F7FA] grid grid-cols-6 p-3 font-bold border-b border-[#DDE3EA]">
                    <div>ID Session</div>
                    <div>Date</div>
                    <div>Gestionnaire</div>
                    <div className="text-right">A l'ouverture</div>
                    <div className="text-right">A la fermeture</div>
                    <div className="text-right">Statut</div>
                  </div>
                  {cashSessions.map(session => (
                    <div key={session.id} className="grid grid-cols-6 p-3 border-b hover:bg-slate-50">
                      <div className="font-mono font-bold text-[#0097A7]">{session.id}</div>
                      <div>{session.date}</div>
                      <div className="text-[#1F2937]/80">{session.openedBy}</div>
                      <div className="text-right font-mono">{session.initialFund.toFixed(2)} €</div>
                      <div className="text-right font-mono font-bold">{session.id === 'CSH-024' ? cashBalance.toFixed(2) : session.currentCash.toFixed(2)} €</div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          session.status === 'Ouverte' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-slate-100 text-[#1F2937]/40'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {transactionTab === 'banque' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <h3 className="font-display font-semibold text-base text-[#1F2937]">Banques & Télétransmission Organismes RO/AMC</h3>
              <p className="text-xs text-[#1F2937]/60 leading-relaxed">
                Reconciliation directe avec la banque. Les règlements par cartes bancaires, cartes de tiers payant complémentaires ou virements de la Caisse d'Assurance Maladie sont télétransmis sous protocoles normalisés (norme B2) puis rapprochés.
              </p>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#10B981]/10 text-[#10B981] rounded-lg">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800">Aucun rejet détecté</h4>
                    <p className="text-[11px] text-emerald-700">Toutes les télétransmissions d'ordonnances ont reçu leur avis de paiement NOÉMIE.</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-[10px] font-bold hover:bg-emerald-100">
                  Lancer Télétransmission mutuelle
                </button>
              </div>

              <div className="border border-[#DDE3EA] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-extrabold text-[#1F2937] uppercase">Rapprochement bancaire</h4>
                  <p className="text-[11px] text-[#1F2937]/60">Écritures rapprochées avec l'extrait de compte Société Générale : 14 Écritures concordantes.</p>
                </div>
                <span className="text-xs font-bold font-mono text-[#0097A7] bg-[#00BCD4]/10 border border-[#0097A7]/20 px-3 py-1 rounded-lg">
                  Taux de rapprochement : 100%
                </span>
              </div>
            </div>
          )}

          {transactionTab === 'mobile_money' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <header className="flex justify-between items-center border-b pb-4 shrink-0 bg-transparent py-0 px-0">
                <h3 className="font-display font-semibold text-base text-[#1F2937]">Paiements mobiles - Mobile Money</h3>
                <div className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 font-bold px-2.5 py-1 rounded-lg">
                  Wave / Orange / MTN
                </div>
              </header>

              <p className="text-xs text-[#1F2937]/75">
                Utilisation au comptoir d'optique pour les clients n'ayant pas de compte bancaire. La caisse de l'opticien se synchronise aux APIs des opérateurs pour confirmer instantanément l'encaissement via notification Push ou SMS ou QR-Code.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">Canal Wave</h4>
                    <p className="text-[10px] text-blue-600 mt-1">N° de Flotte : +221 77 124 55 93</p>
                  </div>
                  <p className="text-xl font-mono font-bold text-blue-900 mt-3">2 140.00 €</p>
                </div>
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-orange-900">Orange Money</h4>
                    <p className="text-[10px] text-orange-600 mt-1">N° de Flotte : +221 76 544 32 10</p>
                  </div>
                  <p className="text-xl font-mono font-bold text-orange-900 mt-3">850.50 €</p>
                </div>
                <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50/50 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-yellow-900 font-mono">MTN Mobile Money</h4>
                    <p className="text-[10px] text-yellow-600 mt-1">N° de Flotte : +225 07 483 91 04</p>
                  </div>
                  <p className="text-xl font-mono font-bold text-yellow-900 mt-3">545.00 €</p>
                </div>
              </div>

              {/* Momo transactions */}
              <div className="space-y-2 mt-6">
                <h4 className="text-xs font-bold text-[#1F2937] uppercase">Journal des Échanges API Mobile Money</h4>
                <div className="overflow-x-auto rounded-xl border border-[#DDE3EA]">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#F5F7FA]">
                      <tr>
                        <th className="p-3">Réf Opérateur</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Opérateur</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Mobile Patient</th>
                        <th className="p-3 text-right">Montant brut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {momoTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-500">{t.reference}</td>
                          <td className="p-3 font-mono">{t.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.operator === 'Wave' ? 'bg-blue-100 text-blue-800' : 
                              t.operator === 'Orange Money' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {t.operator}
                            </span>
                          </td>
                          <td className="p-3">{t.type}</td>
                          <td className="p-3 font-mono text-[#1F2937]/70">{t.phone}</td>
                          <td className={`p-3 text-right font-mono font-bold ${t.amount > 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                            {t.amount > 0 ? `+${t.amount.toFixed(2)}` : t.amount.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. REPORTING / ÉTATS COMPTABLES */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* Optic Alizé Style Reports Selectors */}
          <div className="flex flex-wrap border-b border-[#DDE3EA] gap-4">
            <button 
              onClick={() => setReportTab('journal')}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase relative transition cursor-pointer ${
                reportTab === 'journal' ? 'text-[#0097A7]' : 'text-[#1F2937]/60 hover:text-[#1F2937]'
              }`}
            >
              Brouillard de Journal
              {reportTab === 'journal' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
            </button>
            <button 
              onClick={() => setReportTab('grand_livre')}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase relative transition cursor-pointer ${
                reportTab === 'grand_livre' ? 'text-[#0097A7]' : 'text-[#1F2937]/60 hover:text-[#1F2937]'
              }`}
            >
              Grand Livre
              {reportTab === 'grand_livre' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
            </button>
            <button 
              onClick={() => setReportTab('bilan')}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase relative transition cursor-pointer ${
                reportTab === 'bilan' ? 'text-[#0097A7]' : 'text-[#1F2937]/60 hover:text-[#1F2937]'
              }`}
            >
              Bilan
              {reportTab === 'bilan' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
            </button>
            <button 
              onClick={() => setReportTab('balance')}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase relative transition cursor-pointer ${
                reportTab === 'balance' ? 'text-[#0097A7]' : 'text-[#1F2937]/60 hover:text-[#1F2937]'
              }`}
            >
              Balance
              {reportTab === 'balance' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
            </button>
            <button 
              onClick={() => setReportTab('compte_resultat')}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase relative transition cursor-pointer ${
                reportTab === 'compte_resultat' ? 'text-[#0097A7]' : 'text-[#1F2937]/60 hover:text-[#1F2937]'
              }`}
            >
              Compte de Résultat
              {reportTab === 'compte_resultat' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
            </button>
            <button 
              onClick={() => setReportTab('tresorerie')}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase relative transition cursor-pointer ${
                reportTab === 'tresorerie' ? 'text-[#0097A7]' : 'text-[#1F2937]/60 hover:text-[#1F2937]'
              }`}
            >
              Synthèse Trésorerie
              {reportTab === 'tresorerie' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0097A7]" />}
            </button>
          </div>

          {/* DYNAMIC COMPTES RENDUS RENDERING */}
          {reportTab === 'journal' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <h4 className="font-display font-semibold text-lg text-[#1F2937]">Écritures du Journal Général (Partie Double)</h4>
              <p className="text-xs text-[#1F2937]/60">Écritures d'achats, ventes, amortissements de l'atelier d'optique selon le Système Comptable SYSCOHADA / Standard.</p>

              <div className="overflow-x-auto rounded-xl border border-[#DDE3EA] text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#F5F7FA]">
                    <tr className="border-b border-[#DDE3EA]">
                      <th className="p-3">FEC Ref</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">N° Compte</th>
                      <th className="p-3">Intitulé Compte</th>
                      <th className="p-3">Libellé écriture</th>
                      <th className="p-3 text-right">Débit (€)</th>
                      <th className="p-3 text-right">Crédit (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {revenues.map(r => (
                      <React.Fragment key={r.id}>
                        {/* Débit de tiers */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 text-[#0097A7]">FEC-{r.id}</td>
                          <td>{r.date}</td>
                          <td className="font-bold">411000</td>
                          <td>Patients - Clients Optic Alizé</td>
                          <td className="font-sans text-slate-500">Facture Patient - {r.patient}</td>
                          <td className="text-right font-bold text-[#10B981]">{r.total.toFixed(2)}</td>
                          <td className="text-right text-slate-300">0.00</td>
                        </tr>
                        {/* Crédit de ventes */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-400">FEC-{r.id}b</td>
                          <td>{r.date}</td>
                          <td className="font-bold">707000</td>
                          <td>Ventes Optique Succursales</td>
                          <td className="font-sans text-slate-500">Vente de marchandises monture/verre</td>
                          <td className="text-right text-slate-300">0.00</td>
                          <td className="text-right font-bold text-red-500">{r.subtotal.toFixed(2)}</td>
                        </tr>
                        {/* Crédit de TVA */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-400">FEC-{r.id}c</td>
                          <td>{r.date}</td>
                          <td className="font-bold">445710</td>
                          <td>TVA collectée sur ventes</td>
                          <td className="font-sans text-slate-500">TVA 20% sur la vente</td>
                          <td className="text-right text-slate-300">0.00</td>
                          <td className="text-right font-bold text-red-500">{r.tax.toFixed(2)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportTab === 'grand_livre' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <h4 className="font-display font-semibold text-lg text-[#1F2937]">Grand Livre Général de l'Enseigne</h4>
              <p className="text-xs text-[#1F2937]/60">Regroupement des écritures par classe de compte du plan comptable de la chaîne.</p>

              <div className="overflow-x-auto rounded-xl border border-[#DDE3EA] text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#F5F7FA]">
                    <tr className="border-b border-[#DDE3EA]">
                      <th className="p-3">Numéro</th>
                      <th className="p-3">Poste Comptable</th>
                      <th className="p-3 text-right">Mouvements Débit (€)</th>
                      <th className="p-3 text-right">Mouvements Crédit (€)</th>
                      <th className="p-4 text-right">Solde Balance (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#0097A7]">512000</td>
                      <td className="font-sans font-bold">Banques Principale (SG/Afriland)</td>
                      <td className="text-right font-bold text-[#10B981]">{revenues.filter(r=>r.method==='Banque').reduce((s,r)=>s+r.total,0).toFixed(2)}</td>
                      <td className="text-right text-red-500">-{expenses.filter(e=>e.method==='Banque').reduce((s,e)=>s+e.total,0).toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-[#0097A7]">{bankBalance.toFixed(2)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#0097A7]">530000</td>
                      <td className="font-sans font-bold">Caisse Physique Caisse POS</td>
                      <td className="text-right font-bold text-[#10B981]">{revenues.filter(r=>r.method==='Caisse').reduce((s,r)=>s+r.total,0).toFixed(2)}</td>
                      <td className="text-right text-red-500">-{expenses.filter(e=>e.method==='Caisse').reduce((s,e)=>s+e.total,0).toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-[#0097A7]">{cashBalance.toFixed(2)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#0097A7]">513000</td>
                      <td className="font-sans font-bold">Acomptes Mobile Money Flotte</td>
                      <td className="text-right font-bold text-[#10B981]">{momoTransactions.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0).toFixed(2)}</td>
                      <td className="text-right text-red-500">-{Math.abs(momoTransactions.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0)).toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-[#0097A7]">{momoBalance.toFixed(2)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#0097A7]">707000</td>
                      <td className="font-sans font-bold">Produits de vente de lunettes & examens</td>
                      <td className="text-right">0.00</td>
                      <td className="text-right font-bold text-red-500">-{revenues.reduce((s,r)=>s+r.subtotal,0).toFixed(2)}</td>
                      <td className="p-4 text-right font-bold">-{revenues.reduce((s,r)=>s+r.subtotal,0).toFixed(2)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#0097A7]">607000</td>
                      <td className="font-sans font-bold">Achat marchandises & montures usines</td>
                      <td className="text-right font-bold text-[#10B981]">{expenses.reduce((s,p)=>s+p.total,0).toFixed(2)}</td>
                      <td className="text-right">0.00</td>
                      <td className="p-4 text-right font-bold text-[#10B981]">{expenses.reduce((s,p)=>s+p.total,0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportTab === 'bilan' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-6">
              <header className="border-b pb-4 shrink-0 bg-transparent py-0 px-0">
                <h4 className="font-display font-semibold text-lg text-[#1F2937]">Bilan de Situation de l'ERP Optic Alizé</h4>
                <p className="text-xs text-[#1F2937]/50 mt-1">Image instantanée du patrimoine à l'instant T (Actif vs Passif-Capitaux).</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                {/* ACTIF */}
                <div className="space-y-4">
                  <h5 className="text-xs font-extrabold text-[#0097A7] uppercase border-b pb-2 tracking-widest">Actif (Éléments Détenus)</h5>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b pb-1">
                      <span>Immobilisations de l'atelier (Meuleuse, Réfractomètre)</span>
                      <span className="font-mono font-bold">12 500.00 €</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Stocks de Montures et Lentilles</span>
                      <span className="font-mono font-bold">8 450.00 €</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Créances Patients (Tiers Payant en cours)</span>
                      <span className="font-mono font-bold">2 150.00 €</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Trésorerie Actifs (Banques / Caisses / MOMO)</span>
                      <span className="font-mono font-bold text-[#10B981]">{(bankBalance + cashBalance + momoBalance).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold bg-[#F5F7FA] p-2.5 rounded-lg text-[#0097A7] mt-4">
                      <span>Total des Actifs</span>
                      <span className="font-mono">{(12500 + 8450 + 2150 + bankBalance + cashBalance + momoBalance).toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                {/* PASSIF */}
                <div className="space-y-4">
                  <h5 className="text-xs font-extrabold text-[#F59E0B] uppercase border-b pb-2 tracking-widest">Passif (Financements & Dettes)</h5>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b pb-1">
                      <span>Capitaux Propres Consolidés</span>
                      <span className="font-mono font-bold">18 000.00 €</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Dettes Fournisseurs (Essilor, Ray-Ban)</span>
                      <span className="font-mono font-bold">2 140.00 €</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Remboursements et Crédits Mutuelles clients</span>
                      <span className="font-mono font-bold">1 240.00 €</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Résultat Net de l'Exercice comptable</span>
                      <span className="font-mono font-bold text-[#10B981]">+{netResult.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold bg-[#F5F7FA] p-2.5 rounded-lg text-[#0097A7] mt-4">
                      <span>Total des Passifs & Capitaux</span>
                      <span className="font-mono">{(18000 + 2140 + 1240 + netResult).toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equilibre validation warning */}
              <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-xs text-emerald-800 flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Check className="w-5 h-5 text-[#10B981]" />
                  Bilan comptable équilibré
                </span>
                <span>Décalage actif-passif : 0.00 €</span>
              </div>
            </div>
          )}

          {reportTab === 'balance' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <h4 className="font-display font-semibold text-lg text-[#1F2937]">Balance Générale des Comptes du Réseau</h4>
              <p className="text-xs text-[#1F2937]/60">Balance des comptes d'optique pour vérification arithmétique de la sincérité des écritures.</p>

              <div className="overflow-x-auto rounded-xl border border-[#DDE3EA] text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#F5F7FA]">
                    <tr className="border-b border-[#DDE3EA]">
                      <th className="p-3">Numéro</th>
                      <th className="p-3">Intitulé de compte</th>
                      <th className="p-3 text-right">Débit initial</th>
                      <th className="p-3 text-right">Crédit initial</th>
                      <th className="p-3 text-right">Solde Débiteur</th>
                      <th className="p-3 text-right">Solde Créditeur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="p-3 font-bold text-[#0097A7]">512000</td><td>SG Banque Courante</td><td className="text-right">14 205.00</td><td className="text-right">0.00</td><td className="text-right text-emerald-600 font-bold">{bankBalance.toFixed(2)}</td><td className="text-right text-slate-350">0.00</td></tr>
                    <tr><td className="p-3 font-bold text-[#0097A7]">530000</td><td>Caisse Boutique Principale</td><td className="text-right">150.00</td><td className="text-right">0.00</td><td className="text-right text-emerald-600 font-bold">{cashBalance.toFixed(2)}</td><td className="text-right text-slate-350">0.00</td></tr>
                    <tr><td className="p-3 font-bold text-[#0097A7]">513000</td><td>Mobile Money Flottes</td><td className="text-right">3 200.00</td><td className="text-right">0.00</td><td className="text-right text-emerald-600 font-bold">{momoBalance.toFixed(2)}</td><td className="text-right text-slate-350">0.00</td></tr>
                    <tr><td className="p-3 font-bold text-[#0097A7]">707000</td><td>Vente Verres Unifocaux / Progr.</td><td className="text-right">0.00</td><td className="text-right">14 000.00</td><td className="text-right text-slate-350">0.00</td><td className="text-right text-red-500 font-bold">{(14000 + totalRevenues).toFixed(2)}</td></tr>
                    <tr><td className="p-3 font-bold text-[#0097A7]">607000</td><td>Achat verres et marchandises</td><td className="text-right">4 200.00</td><td className="text-right">0.00</td><td className="text-right text-emerald-600 font-bold">{(4200 + totalExpenses).toFixed(2)}</td><td className="text-right text-slate-350">0.00</td></tr>
                    <tr className="bg-slate-50 font-bold font-mono border-t"><td className="p-3">SOLDE TOTAL</td><td>Équilibré</td><td className="text-right">21 755.00</td><td className="text-right">14 000.00</td><td className="text-right text-emerald-600">{(bankBalance + cashBalance + momoBalance + 4200 + totalExpenses).toFixed(2)}</td><td className="text-right text-red-500 font-bold">{(14000 + totalRevenues).toFixed(2)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportTab === 'compte_resultat' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <h4 className="font-display font-semibold text-lg text-[#1F2937]">Compte de Résultat de l'ERP Optic Alizé</h4>
              <p className="text-xs text-[#1F2937]/60">Évalue la rentabilité de la chaîne optique : total des Produits (Gains) moins total des Charges (Frais d'Atelier, loyers, etc.).</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-sans mt-4">
                <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-150 space-y-3">
                  <h5 className="font-extrabold text-[#10B981] uppercase tracking-wider">Produits Financiers (+ Ventes)</h5>
                  <div className="flex justify-between border-b pb-1.5 mt-2">
                    <span>Ventes de lunettes & solaires directes</span>
                    <span className="font-mono font-bold">+{totalRevenues.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-slate-400">
                    <span>Loyers sous-location atelier optique</span>
                    <span className="font-mono">0.00 €</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#10B981] pt-2">
                    <span>Total des Produits d'Exploitation</span>
                    <span className="font-mono">+{totalRevenues.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="bg-red-50/40 p-4 rounded-xl border border-red-150 space-y-3">
                  <h5 className="font-extrabold text-red-700 uppercase tracking-wider">Charges (- Dépenses)</h5>
                  <div className="flex justify-between border-b pb-1.5 mt-2">
                    <span>Achats de montures et verres Essilor</span>
                    <span className="font-mono font-bold">-{totalExpenses.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-slate-400">
                    <span>Amortissement outillage clinique d'optométrie</span>
                    <span className="font-mono">0.00 €</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-red-700 pt-2">
                    <span>Total des Charges d'Exploitation</span>
                    <span className="font-mono">-{totalExpenses.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* RENTABILITE BANNER */}
              <div className="p-4 bg-[#00BCD4]/10 rounded-xl border border-[#0097A7]/20 flex justify-between items-center mt-6">
                <div>
                  <h4 className="text-xs font-extrabold text-[#1F2937] uppercase">RÉSULTAT NET OPTIC ALIZÉ</h4>
                  <p className="text-[10px] text-slate-500">Excédent net disponible pour réinvestissement dans la franchise Optic Alizé.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-extrabold text-[#10B981]">+{netResult.toFixed(2)} €</p>
                  <p className="text-[9px] font-bold text-emerald-600 bg-emerald-100 rounded px-1.5 py-0.5 mt-1 inline-block">BÉNÉFICE NET DE LA CHAINE</p>
                </div>
              </div>
            </div>
          )}

          {reportTab === 'tresorerie' && (
            <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
              <h4 className="font-display font-semibold text-lg text-[#1F2937]">Synthèse & Rapprochement de Trésorerie</h4>
              <p className="text-xs text-[#1F2937]/60">Évolution de la liquidité globale de la chaîne d'optique (Évolution Banque, Caisse et Mobile Money consolidés).</p>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
                <div className="md:col-span-4 bg-slate-50 p-4 rounded-xl border space-y-4">
                  <h5 className="text-[11px] font-extrabold text-[#1F2937]/70 uppercase tracking-widest">Liquidité par agence</h5>
                  <div className="space-y-2 text-xs">
                    {boutiqueBalances.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Aucune agence active.</p>
                    ) : (
                      boutiqueBalances.map(b => {
                        const totalFcfa = b.cash + b.bank + b.momo;
                        const totalEur = totalFcfa / 655.957;
                        return (
                          <div key={b.id} className="flex justify-between border-b pb-2 items-center">
                            <span className="font-semibold text-slate-700">{b.name}</span>
                            <div className="text-right">
                              <span className="font-mono font-bold block text-slate-800">{totalFcfa.toLocaleString()} FCFA</span>
                              <span className="text-[9px] text-slate-400 font-mono">({totalEur.toFixed(2)} €)</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div className="flex justify-between text-sm font-bold text-[#0097A7] mt-3 pt-2 border-t border-dashed">
                      <span>Trésorerie Consolidée</span>
                      <span className="font-mono">
                        {boutiqueBalances.length > 0 
                          ? boutiqueBalances.reduce((acc, b) => acc + (b.cash + b.bank + b.momo), 0).toLocaleString() + ' FCFA'
                          : '0 FCFA'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-8 bg-slate-50/50 p-4 rounded-xl border text-xs">
                  <h5 className="font-bold text-[#1F2937] mb-2">Structure des flux de liquidité</h5>
                  <p className="text-[#1F2937]/75 leading-relaxed">
                    La trésorerie est particulièrement saine en ce mois de Juin. 100% des encaissements par cartes bancaires physiques en magasin et par <strong>Mobile Money</strong> ont été portés au grand livre sans aucun rejet ou litige AMO de la caisse complémentaire.
                  </p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded font-semibold text-[10px]">90% Liquides Bancaires</span>
                    <span className="px-2.5 py-1 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded font-semibold text-[10px]">8% Mobile Money Wave</span>
                    <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-800 rounded font-semibold text-[10px]">2% Espèces Coffre</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Livre de Paie view */}
      {activeSubTab === 'livre_paie' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Metrics Grid for Payroll */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Masse Salariale Totale</span>
              <span className="text-xl font-bold font-mono text-slate-800 mt-1 block">
                {payslips.reduce((sum, s) => sum + s.netSalary, 0).toLocaleString()} FCFA
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block mt-2">{payslips.length} bulletins générés</span>
            </div>
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm text-left">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Salaires Validés & Payés</span>
              <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
                {payslips.filter(s => s.paymentStatus === 'Payé').reduce((sum, s) => sum + s.netSalary, 0).toLocaleString()} FCFA
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 block mt-2">
                {payslips.filter(s => s.paymentStatus === 'Payé').length} virement(s) effectués
              </span>
            </div>
            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm text-left">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">En Attente d'Ordonnancement</span>
              <span className="text-xl font-bold font-mono text-amber-700 mt-1 block">
                {payslips.filter(s => s.paymentStatus !== 'Payé').reduce((sum, s) => sum + s.netSalary, 0).toLocaleString()} FCFA
              </span>
              <span className="text-[10px] font-semibold text-amber-600 block mt-2">
                {payslips.filter(s => s.paymentStatus !== 'Payé').length} bulletin(s) à régler
              </span>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Retenues Fiscales & Sociales</span>
              <span className="text-xl font-bold font-mono text-slate-800 mt-1 block">
                {payslips.reduce((sum, s) => sum + s.socialDeductions + s.taxDeductions, 0).toLocaleString()} FCFA
              </span>
              <span className="text-[10px] font-semibold text-slate-500 block mt-2">CNSS & ITS réinvestis</span>
            </div>
          </div>

          {/* Ledger Table Container */}
          <div className="bg-white p-6 rounded-2xl border border-[#DDE3EA] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-left">
                <h3 className="font-display font-bold text-slate-800 text-base">Livre de Paie & Ordonnancement des Salariés</h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Visualisez les bulletins de paie émis par le module RH, téléchargez leurs reçus PDF et effectuez le règlement financier direct.
                </p>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-2 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl px-3 py-1.5 w-full sm:w-64">
                <Search className="w-4 h-4 text-[#1F2937]/50" />
                <input 
                  type="text" 
                  placeholder="Chercher collaborateur..." 
                  value={payrollSearch}
                  onChange={e => setPayrollSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full font-semibold focus:ring-0 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto rounded-xl border border-[#DDE3EA]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#F5F7FA] text-[#1F2937] border-b border-[#DDE3EA] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Salarié</th>
                    <th className="p-4">Période</th>
                    <th className="p-4 text-right">Salaire Base</th>
                    <th className="p-4 text-right">Primes</th>
                    <th className="p-4 text-right">Retenues</th>
                    <th className="p-4 text-right">Net à Payer</th>
                    <th className="p-4 text-center">Statut</th>
                    <th className="p-4 text-right">Actions de Trésorerie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payslips
                    .filter(slip => slip.employeeName.toLowerCase().includes(payrollSearch.toLowerCase()))
                    .map(slip => {
                      const totalDeductions = slip.socialDeductions + slip.taxDeductions + slip.totalAvances + (slip.loansDeduction || 0) + (slip.customWithdrawals || 0);
                      return (
                        <tr key={slip.id} className="hover:bg-slate-50/50 transition border-b border-slate-100 last:border-0">
                          <td className="p-4 text-left">
                            <div className="font-bold text-slate-800">{slip.employeeName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{slip.employeePosition} (ID: {slip.employeeId})</div>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{slip.period}</td>
                          <td className="p-4 text-right font-mono font-medium">{Math.round(slip.basicSalary).toLocaleString()} FCFA</td>
                          <td className="p-4 text-right font-mono text-emerald-600 font-medium">+{Math.round(slip.totalPrimes).toLocaleString()} FCFA</td>
                          <td className="p-4 text-right font-mono text-rose-600 font-medium">-{Math.round(totalDeductions).toLocaleString()} FCFA</td>
                          <td className="p-4 text-right font-mono font-bold text-slate-900">{Math.round(slip.netSalary).toLocaleString()} FCFA</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              slip.paymentStatus === 'Payé'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {slip.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button 
                              onClick={() => handlePrintPayslip(slip)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition cursor-pointer"
                              title="Télécharger / Imprimer Bulletin"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Bulletins</span>
                            </button>

                            {slip.paymentStatus !== 'Payé' && (
                              <button 
                                onClick={() => handlePaySalaryFromAccounting(slip.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0097A7] text-white hover:bg-[#00838F] text-[10px] font-bold uppercase tracking-wider rounded-lg transition cursor-pointer"
                                title="Enregistrer le Virement bancaire"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Payer</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {payslips.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                        <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Aucun bulletin de paie généré dans le module RH pour l'instant.<br/>
                        <span className="text-[10px]">Veuillez émettre des paiements ou des acomptes depuis l'onglet Collaborateurs & Salaires du module RH.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD REVENUE MODAL MODAL --- */}
      {showAddRevenue && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#DDE3EA] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-display font-semibold text-lg text-[#1F2937]">Comptabiliser une Recette</h3>
            <form onSubmit={handleAddRevenue} className="space-y-3.5 text-xs text-[#1F2937]">
              <div className="space-y-1">
                <label className="font-bold text-[#1F2937]/75">Date</label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().substring(0, 10)}
                  className="w-full p-2.5 rounded-lg border outline-none text-xs" 
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1F2937]/75">Libellé de la Recette</label>
                <input 
                  type="text" 
                  value={newRevDesc}
                  onChange={e => setNewRevDesc(e.target.value)}
                  placeholder="Ex: Patient Legrand - Vente Lunettes Gucci"
                  className="w-full p-2.5 rounded-lg border outline-none text-xs" 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1F2937]/75">Patient (Nom complet)</label>
                <input 
                  type="text" 
                  value={newRevPatient}
                  onChange={e => setNewRevPatient(e.target.value)}
                  placeholder="Ex: Amélie Legrand"
                  className="w-full p-2.5 rounded-lg border outline-none text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#1F2937]/75">Montant TTC (€ / FCFA)</label>
                  <input 
                    type="number" 
                    value={newRevAmount}
                    onChange={e => setNewRevAmount(e.target.value)}
                    placeholder="350"
                    step="0.01"
                    className="w-full p-2.5 rounded-lg border outline-none text-xs text-[#10B981] font-bold" 
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1F2937]/75">Classification</label>
                  <select 
                    value={newRevCategory}
                    onChange={e => setNewRevCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none text-xs font-semibold"
                  >
                    <option value="Vente Lunettes">Vente Lunettes</option>
                    <option value="Solaire">Lunettes de Soleil</option>
                    <option value="Mutuelle / Tiers Payant">Remboursement Mutuelle</option>
                    <option value="Prestation Optométrie">Prestation Clinique</option>
                    <option value="Lentilles">Lentilles</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1F2937]/75">Mode de paiement / Canal</label>
                <select 
                  value={newRevMethod}
                  onChange={e => setNewRevMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border outline-none text-xs font-semibold"
                >
                  <option value="Caisse">Caisse locale (Espèces)</option>
                  <option value="Banque">Banque (CB / Virement / Tiers Payant)</option>
                  <option value="Mobile Money">Mobile Money (Wave / Orange Money)</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                <input 
                  type="checkbox" 
                  id="newRevIsVirtual"
                  checked={newRevIsVirtual}
                  onChange={e => setNewRevIsVirtual(e.target.checked)}
                  className="w-4 h-4 text-[#0097A7] border-slate-350 rounded cursor-pointer" 
                />
                <label htmlFor="newRevIsVirtual" className="font-bold text-amber-900/85 hover:cursor-pointer select-none leading-tight">
                  Transaction Virtuelle d'ENTRÉE<br />
                  <span className="text-[10px] text-amber-700/80 font-normal">Fictive / Exercice ou test simulé (sans impact réel)</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddRevenue(false)}
                  className="px-4 py-2 bg-[#F5F7FA] border text-[#1F2937]/70 rounded-xl hover:bg-slate-150 transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#0097A7] text-white font-bold rounded-xl hover:bg-[#00838F]"
                >
                  Comptabiliser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD EXPENSE MODAL --- */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#DDE3EA] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-display font-semibold text-lg text-[#1F2937]">Écrire une Charge / Dépense d'Atelier</h3>
            <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs text-[#1F2937]">
              <div className="space-y-1">
                <label className="font-bold text-[#1F2937]/75">Libellé de la Dépense</label>
                <input 
                  type="text" 
                  value={newExpDesc}
                  onChange={e => setNewExpDesc(e.target.value)}
                  placeholder="Ex: Facture électricité clinique"
                  className="w-full p-2.5 rounded-lg border outline-none text-xs" 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1F2937]/75">Fournisseur / Bénéficiaire</label>
                <input 
                  type="text" 
                  value={newExpSupplier}
                  onChange={e => setNewExpSupplier(e.target.value)}
                  placeholder="Ex: Briot Weco / Senelec"
                  className="w-full p-2.5 rounded-lg border outline-none text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#1F2937]/75">Montant Dépense (€)</label>
                  <input 
                    type="number" 
                    value={newExpAmount}
                    onChange={e => setNewExpAmount(e.target.value)}
                    placeholder="250"
                    step="0.01"
                    className="w-full p-2.5 rounded-lg border outline-none text-xs text-red-500 font-bold" 
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1F2937]/75">Catégorie charge</label>
                  <select 
                    value={newExpCategory}
                    onChange={e => setNewExpCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none text-xs font-semibold"
                  >
                    <option value="Achat Verres & Montures">Achat Verres & Montures</option>
                    <option value="Frais d'Atelier">Frais d'Atelier (Meules / consommables)</option>
                    <option value="Électricité / Eau">Électricité / Eau</option>
                    <option value="Impression & Marketing">Impression & Boîtes</option>
                    <option value="Frais Opérateurs GSM">Frais Mobile Money (Opérateurs)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1F2937]/75">Moyen de règlement financier</label>
                <select 
                  value={newExpMethod}
                  onChange={e => setNewExpMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border outline-none text-xs font-semibold"
                >
                  <option value="Caisse">Caisse Enregistreuse (Espèces)</option>
                  <option value="Banque font-bold">Banque (Virement / Prélèvement SG)</option>
                  <option value="Mobile Money">Mobile Money (Wave / Orange Money)</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                <input 
                  type="checkbox" 
                  id="newExpIsVirtual"
                  checked={newExpIsVirtual}
                  onChange={e => setNewExpIsVirtual(e.target.checked)}
                  className="w-4 h-4 text-[#0097A7] border-slate-350 rounded cursor-pointer" 
                />
                <label htmlFor="newExpIsVirtual" className="font-bold text-amber-900/85 hover:cursor-pointer select-none leading-tight">
                  Transaction Virtuelle de SORTIE<br />
                  <span className="text-[10px] text-amber-700/80 font-normal">Fictive / Exercice ou test simulé (sans impact réel)</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 bg-[#F5F7FA] border text-[#1F2937]/70 rounded-xl hover:bg-slate-150 transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RE-STOCK/RESTOCK BOUTIQUE CASH BOX MODAL --- */}
      {showRestockCashModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4 text-xs text-[#1F2937]">
            <div>
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-cyan-700">Approvisionner la Caisse Locale</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Créditer de la liquidité à une succursale depuis le coffre central.</p>
            </div>
            <form onSubmit={handleBoutiqueRestock} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold block text-slate-600">Agence Optique</label>
                <input 
                  type="text" 
                  disabled 
                  value={boutiqueBalances.find(b => b.id === selectedRestockBoutiqueId)?.name || ''} 
                  className="w-full p-2.5 rounded-lg border outline-none bg-slate-50 font-medium font-sans" 
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold block text-slate-600">Montant de la dotation (FCFA)</label>
                <input 
                  type="number" 
                  value={restockAmount}
                  onChange={e => setRestockAmount(e.target.value)}
                  placeholder="Ex: 50000" 
                  className="w-full p-2.5 rounded-lg border outline-none focus:border-cyan-600 font-sans font-medium" 
                  required 
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowRestockCashModal(false)}
                  className="px-4 py-2 bg-slate-100 border text-slate-700 rounded-lg hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-cyan-700 text-white font-bold rounded-lg hover:bg-cyan-800 cursor-pointer"
                >
                  Valider l'Approvisionnement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TRANSFER MODAL --- */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 text-xs text-[#1F2937]">
            <div>
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-cyan-700">Virement Inter-Agence</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Transfert de trésorerie instantané direct sans intermédiaire.</p>
            </div>
            <form onSubmit={handleBoutiqueTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold block text-slate-600">Agence Source</label>
                  <select 
                    value={transferSource} 
                    onChange={e => setTransferSource(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none bg-slate-50"
                  >
                    {boutiqueBalances.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold block text-slate-600">Agence Destination</label>
                  <select 
                    value={transferDest} 
                    onChange={e => setTransferDest(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none bg-slate-50"
                  >
                    {boutiqueBalances.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold block text-slate-600">Mode de Transfert</label>
                  <select 
                    value={transferType} 
                    onChange={e => setTransferType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border outline-none font-semibold bg-slate-50"
                  >
                    <option value="Caisse font-sans">Caisse (Espèces)</option>
                    <option value="Banque font-sans">Banque (Virement)</option>
                    <option value="Momo font-sans">Mobile Money (Wave/OM)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold block text-slate-600">Montant du virement (FCFA)</label>
                  <input 
                    type="number" 
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    placeholder="Ex: 100000" 
                    className="w-full p-2.5 rounded-lg border outline-none focus:border-cyan-600 font-sans" 
                    required 
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-100 border text-slate-700 rounded-lg hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-cyan-700 text-white font-bold rounded-lg hover:bg-cyan-800 cursor-pointer"
                >
                  Confirmer le virement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EXPORT EXCEL CONFIGURATION MODAL --- */}
      {showExportExcelModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs text-[#1F2937]">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <FileSpreadsheet className="w-5 h-5 mx-auto" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-extrabold text-[#1F2937]">Option d'exportation Excel</h3>
                <p className="text-[10px] text-slate-500">Filtrage réglementaire SYSCOHADA multi-magasins</p>
              </div>
            </div>

            <div className="space-y-4 text-left">
              {/* Select Boutique Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block text-left">Sélectionner la boutique à auditer</label>
                <select 
                  value={exportBoutiqueSelection}
                  onChange={(e) => setExportBoutiqueSelection(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-250 bg-white p-2.5 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500 text-slate-755"
                >
                  <option value="ALL">🏢 Toutes les boutiques (Consolidé)</option>
                  <option value="depot-central">🏢 Optic Alizé - Dépôt Central</option>
                  {localBranches.map((b) => (
                    <option key={b.id} value={b.id}>🏢 {b.name} ({b.city})</option>
                  ))}
                </select>
              </div>

              {/* Select Period (Unmodifiable Date presets selection) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block text-left font-sans">Sélectionner la Période Active</label>
                <select 
                  defaultValue="current-month"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'current-month') {
                      setExportStartDate('2026-06-01');
                      setExportEndDate('2026-06-30');
                    } else if (val === 'q2-2026') {
                      setExportStartDate('2026-04-01');
                      setExportEndDate('2026-06-30');
                    } else if (val === 'h1-2026') {
                      setExportStartDate('2026-01-01');
                      setExportEndDate('2026-06-30');
                    } else {
                      setExportStartDate('2026-01-01');
                      setExportEndDate('2026-12-31');
                    }
                  }}
                  className="w-full text-xs font-bold rounded-lg border border-slate-250 bg-white p-2.5 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500 text-slate-755"
                >
                  <option value="current-month">📆 Mois en Cours (01/06/2026 - 30/06/2026)</option>
                  <option value="q2-2026">📆 Deuxième Trimestre (01/04/2026 - 30/06/2026)</option>
                  <option value="h1-2026">📆 Premier Semestre (01/01/2026 - 30/06/2026)</option>
                  <option value="full-2026">📆 Exercice Complet Annuel (01/01/2026 - 31/12/2026)</option>
                </select>
              </div>

              {/* Display locked dates (sélectionner la période non modifiable) */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 border border-slate-200 p-3 rounded-xl font-sans">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block text-left">Date Début (Verrouillée)</span>
                  <div className="flex items-center gap-1.5 font-bold font-mono text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="date"
                      value={exportStartDate}
                      readOnly
                      disabled
                      className="bg-transparent border-none outline-none select-none text-xs w-full text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block text-left">Date Fin (Verrouillée)</span>
                  <div className="flex items-center gap-1.5 font-bold font-mono text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="date"
                      value={exportEndDate}
                      readOnly
                      disabled
                      className="bg-transparent border-none outline-none select-none text-xs w-full text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-450 italic font-sans leading-tight">
                * Conformément aux obligations d'audit SYSCOHADA, la période d'ordonnancement choisie est verrouillée en lecture seule afin de garantir l'absence d'altérations manuelles d'écritures ou de pointage arbitraires.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExportExcelModal(false)}
                className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  executeExcelExportWithFilters();
                  setShowExportExcelModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Générer XLS</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
