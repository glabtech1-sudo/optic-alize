import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, Search, Eye, Filter, Calendar, CheckCircle2, 
  Clock, XCircle, FileText, Settings2, PackageCheck, AlertCircle,
  Sparkles, Plus, Landmark, DollarSign, Wallet, ArrowRightLeft, 
  Lock, Check, Send, ShoppingBag, Info, User
} from 'lucide-react';

export interface CommandeItem {
  id: string;
  customer: string;
  date: string;
  lensesType: string;
  frameModel: string;
  quantity: number;
  totalFCFA: number;
  amountPaid: number;
  paymentMode: 'full' | 'installments';
  productionDelay: string;
  status: 'prepared' | 'in_progress' | 'cancelled' | 'finalized';
  optician: string;
  prescriptionDetails: string;
  sentToPos?: boolean;
}

interface PatientClinic {
  name: string;
  prescription: string;
  optician: string;
}

const PRESET_CLINIC_PATIENTS: PatientClinic[] = [
  { name: 'Ibrahima Diallo', prescription: 'OD: -1.75 CYL: -0.50 Axe: 15° | OS: -1.50 CYL: -0.25 Axe: 180°', optician: 'Dr. Clavel' },
  { name: 'Mariama Sylla', prescription: 'OD: +2.50 OS: +2.25 addition: 2.00', optician: 'Dr. Clavel' },
  { name: 'Amadou Bamba', prescription: 'OD: +0.50 Cyl -1.00 Axe 90° | OS: Plan', optician: 'Dr. Lecerf' },
  { name: 'Fatoumata Wade', prescription: 'OD: -4.00 OS: -4.25 (Myopie forte)', optician: 'Dr. Clavel' },
  { name: 'Amina Diop', prescription: 'OD: -0.75 OS: -1.00 Presbytie +1.25', optician: 'Dr. Lecerf' },
  { name: 'Cheikh Tidiane', prescription: 'OD: Plan OS: Plan (Repos écran)', optician: 'Fatou Soumaré' },
  { name: 'Ousmane Cissé', prescription: 'OD: +1.25 OS: +1.25 (Astigmatisme léger)', optician: 'Fatou Soumaré' }
];

const PRESET_LENSES = [
  "Verres Correcteurs Anti-reflet Crizal Sapphire",
  "Progressifs Varilux Physio F-360",
  "Photochromiques Transitions Gen S Gris",
  "Polarisés Xperio Haute Définition Brun",
  "Organiques Standard avec Traitement Durci",
  "Verre Minéral Solaire Protection Totale UV400",
  "Hydrophobes Incassables Polycarbonate Airwear"
];

const PRESET_FRAMES = [
  "Oakley Pitchman R Satin Black",
  "Ray-Ban Round Metal Gold",
  "Persol PO3092V Havana",
  "Chanel Classic Square Acetate",
  "Prada Sport Linea Rossa",
  "Gucci Aviator Double Bridge Metal",
  "Carrera Active Lite"
];

const initialCommandes: CommandeItem[] = [
  { 
    id: 'CMD-2350', 
    customer: 'Ibrahima Diallo', 
    date: '2026-06-10', 
    lensesType: 'Verres Correcteurs Anti-reflet Bleu',
    frameModel: 'Oakley Pitchman R Black', 
    quantity: 1, 
    totalFCFA: 245000, 
    amountPaid: 100000,
    paymentMode: 'installments',
    productionDelay: '5 jours',
    status: 'in_progress', 
    optician: 'Abdoulaye Ndiaye',
    prescriptionDetails: 'OD: -1.75 OS: -1.50 (Sph)'
  },
  { 
    id: 'CMD-2349', 
    customer: 'Mariama Sylla', 
    date: '2026-06-10', 
    lensesType: 'Progressifs Varilux Physio F-360',
    frameModel: 'Ray-Ban Round Metal Gold', 
    quantity: 1, 
    totalFCFA: 495000, 
    amountPaid: 495000,
    paymentMode: 'full',
    productionDelay: '7 jours',
    status: 'prepared', 
    optician: 'Fatou Soumaré',
    prescriptionDetails: 'OD: +2.50 OS: +2.25 Acc: 2.00'
  },
  { 
    id: 'CMD-2348', 
    customer: 'Amadou Bamba', 
    date: '2026-06-09', 
    lensesType: 'Mineraux Extra-Blancs Silice',
    frameModel: 'Persol PO3092V Havana', 
    quantity: 1, 
    totalFCFA: 185000, 
    amountPaid: 185000,
    paymentMode: 'full',
    productionDelay: '3 jours',
    status: 'finalized', 
    optician: 'Abdoulaye Ndiaye',
    prescriptionDetails: 'OD: +0.50 Cyl -1.00 Axe 90°'
  },
  { 
    id: 'CMD-2347', 
    customer: 'Fatoumata Wade', 
    date: '2026-06-09', 
    lensesType: 'Photochromiques Transitions Gen S',
    frameModel: 'Chanel Butterfly Bijoux', 
    quantity: 1, 
    totalFCFA: 550000, 
    amountPaid: 250000,
    paymentMode: 'installments',
    productionDelay: '10 jours',
    status: 'cancelled', 
    optician: 'Emma Fall',
    prescriptionDetails: 'OD: -4.00 OS: -4.25 (Myopie)'
  }
];

interface CommandeModuleProps {
  currentLanguage?: 'FR' | 'EN';
}

export default function CommandeModule({ currentLanguage = 'FR' }: CommandeModuleProps) {
  const [commandes, setCommandes] = useState<CommandeItem[]>(() => {
    const saved = localStorage.getItem('optic_my_commandes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  React.useEffect(() => {
    localStorage.setItem('optic_my_commandes', JSON.stringify(commandes));
  }, [commandes]);
  const [activeTab, setActiveTab] = useState<'all' | 'prepared' | 'in_progress' | 'cancelled' | 'finalized'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommande, setSelectedCommande] = useState<CommandeItem | null>(null);
  
  // Modal State for New Order creation
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'warn' } | null>(null);

  // Form State
  const [orderType, setOrderType] = useState<'clinique' | 'direct'>('clinique');
  const [crmCustomers, setCrmCustomers] = useState<any[]>(() => {
    const local = localStorage.getItem('optic_crm_customers');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore fallback
      }
    }
    return [
      { id: 'c1-2358', firstName: 'Jean-Marc', lastName: 'Koffi', email: 'jm.koffi@gmail.com', phone: '77 124 55 93', ssNo: '1850975123456', birthDate: '1985-09-12', branch: 'Paris Nation', loyaltyPoints: 340, ssnMutuelle: 'MG-PREV-2350', statusMutuelle: 'Approved', location: 'Dépôt Central' },
      { id: 'c2-9011', firstName: 'Amelie', lastName: 'Provost', email: 'amelie.p@orange.fr', phone: '6 45 12 89 23', ssNo: '2901275654321', birthDate: '1990-12-11', branch: 'Paris Nation', loyaltyPoints: 120, ssnMutuelle: 'MGEN-9011A', statusMutuelle: 'Approved', location: 'Dépôt Central' },
      { id: 'c3-1303', firstName: 'Sarah', lastName: 'El-Amri', email: 'sarah.e@yahoo.fr', phone: '6 89 54 12 36', ssNo: '2940213765432', birthDate: '1994-02-14', branch: 'Lyon Bellecour', loyaltyPoints: 850, ssnMutuelle: 'HARMONIE-1303', statusMutuelle: 'Pending', location: 'Dépôt Central' },
      { id: 'c4-8402', firstName: 'Mamadi', lastName: 'Diarra', email: 'mamadi.d@outlook.com', phone: '77 455 12 12', ssNo: '1790456123789', birthDate: '1979-04-18', branch: 'Marseille Vieux-Port', loyaltyPoints: 410, ssnMutuelle: 'APICIL-8402', statusMutuelle: 'Approved', location: 'Dépôt Central' },
      { id: 'c5-9204', firstName: 'Awa', lastName: 'Niang', email: 'awa.niang@univ.sn', phone: '70 123 45 67', ssNo: '2890524789564', birthDate: '1989-05-24', branch: 'Bordeaux Centre', loyaltyPoints: 950, ssnMutuelle: 'IPRES-9204B', statusMutuelle: 'Approved', location: 'Dépôt Central' }
    ];
  });
  
  const [formPatientIndex, setFormPatientIndex] = useState<number>(0);
  const [formDirectCustomerIndex, setFormDirectCustomerIndex] = useState<number>(0);
  const [formPrescriptionDetails, setFormPrescriptionDetails] = useState('OD: -1.75 CYL: -0.50 Axe: 15° | OS: -1.50 CYL: -0.25 Axe: 180°');
  const [formOptician, setFormOptician] = useState('Dr. Clavel');

  const [formLenses, setFormLenses] = useState(PRESET_LENSES[0]);
  const [formFrame, setFormFrame] = useState(PRESET_FRAMES[0]);
  const [formDelay, setFormDelay] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState<'full' | 'installments'>('full');
  const [formTotalPrice, setFormTotalPrice] = useState<number>(250050);
  const [formDeposit, setFormDeposit] = useState<number>(100000);

  const triggerToast = (text: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Helper payment status
  const isFullyPaid = (cmd: CommandeItem) => {
    return cmd.amountPaid >= cmd.totalFCFA;
  };

  // Switch patient index and auto refill prescription fields & custom prices
  const handlePatientIndexChange = (idx: number) => {
    setFormPatientIndex(idx);
    const selectedPatient = PRESET_CLINIC_PATIENTS[idx];
    if (selectedPatient) {
      setFormPrescriptionDetails(selectedPatient.prescription);
      setFormOptician(selectedPatient.optician);
    }
    // Alternate price to feel real
    const basePrice = 180000 + (idx * 55000);
    setFormTotalPrice(basePrice);
    setFormDeposit(Math.floor(basePrice * 0.4));
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let customerName = '';
    let opticianName = formOptician || 'Direct Client';
    let prescription = formPrescriptionDetails || 'Sans prescription clinique rattachée';

    if (orderType === 'clinique') {
      const selectedPatient = PRESET_CLINIC_PATIENTS[formPatientIndex];
      if (selectedPatient) {
        customerName = selectedPatient.name;
        opticianName = selectedPatient.optician;
        prescription = selectedPatient.prescription;
      } else {
        customerName = 'Patient Clinique';
      }
    } else {
      const cust = crmCustomers[formDirectCustomerIndex];
      if (cust) {
        customerName = `${cust.firstName} ${cust.lastName.toUpperCase()}`;
      } else {
        customerName = 'Client Direct';
      }
    }

    const finalPaid = formPaymentMode === 'full' ? formTotalPrice : formDeposit;
    
    if (formPaymentMode === 'installments' && formDeposit <= 0) {
      triggerToast("Veuillez saisir un montant d'acompte supérieur à 0 pour les paiements en plusieurs fois.", "warn");
      return;
    }

    if (formPaymentMode === 'installments' && formDeposit >= formTotalPrice) {
      triggerToast("L'acompte ne peut pas être supérieur ou égal au montant total. Sélectionnez plutôt le paiement intégral.", "warn");
      return;
    }

    const newId = `CMD-${Math.floor(2351 + Math.random() * 500)}`;
    const newCmd: CommandeItem = {
      id: newId,
      customer: customerName,
      date: new Date().toISOString().split('T')[0],
      lensesType: formLenses,
      frameModel: formFrame,
      quantity: 1,
      totalFCFA: formTotalPrice,
      amountPaid: finalPaid,
      paymentMode: formPaymentMode,
      productionDelay: formDelay,
      status: 'prepared',
      optician: opticianName,
      prescriptionDetails: prescription
    };

    setCommandes([newCmd, ...commandes]);
    setIsNewOrderModalOpen(false);
    setSelectedCommande(newCmd);
    triggerToast(`Commande ${newId} créée avec succès pour ${customerName} !`, "success");
  };

  // Manual payment remainder settlement
  const handlePaymentSettle = (id: string) => {
    setCommandes(prev => prev.map(cmd => {
      if (cmd.id === id) {
        const updated = { ...cmd, amountPaid: cmd.totalFCFA };
        if (selectedCommande?.id === id) {
          setSelectedCommande(updated);
        }
        return updated;
      }
      return cmd;
    }));
    triggerToast(`Le paiement de la commande ${id} a été soldé avec succès !`, "success");
  };

  // Status transition handler with payment checks
  const handleUpdateStatus = (id: string, newStatus: CommandeItem['status']) => {
    const target = commandes.find(c => c.id === id);
    if (!target) return;

    if (newStatus === 'finalized' && !isFullyPaid(target)) {
      triggerToast(`La commande ${id} ne peut pas être finalisée car un solde de ${(target.totalFCFA - target.amountPaid).toLocaleString()} FCFA reste à régler.`, "warn");
      return;
    }

    setCommandes(prev => prev.map(cmd => {
      if (cmd.id === id) {
        const updated = { ...cmd, status: newStatus };
        if (selectedCommande?.id === id) {
          setSelectedCommande(updated);
        }
        return updated;
      }
      return cmd;
    }));
    triggerToast(`Statut de la commande ${id} mis à jour : ${newStatus === 'finalized' ? 'Finalisée & Livrée' : newStatus}`, "success");
  };

  // Manually send order to point of sale (incorporate to localStorage pending receipt queue)
  const handleSendToPOS = (cmd: CommandeItem) => {
    try {
      // Structure the item for POS integration
      const posInvoicePayload = {
        orderId: cmd.id,
        customerName: cmd.customer,
        totalTtc: cmd.totalFCFA,
        amountPaid: cmd.amountPaid,
        remainingBalance: cmd.totalFCFA - cmd.amountPaid,
        prescription: cmd.prescriptionDetails,
        lensesType: cmd.lensesType,
        frameModel: cmd.frameModel,
        sentAt: new Date().toLocaleTimeString('fr-FR'),
        timestamp: Date.now()
      };

      localStorage.setItem('pending_optic_pos_order', JSON.stringify(posInvoicePayload));
      
      // Dispatch storage event to alert POS module immediately in the same tab
      window.dispatchEvent(new Event('storage'));
      // Custom system transition trigger
      window.dispatchEvent(new CustomEvent('optic-pos-incoming-order', { detail: posInvoicePayload }));

      setCommandes(prev => prev.map(c => {
        if (c.id === cmd.id) {
          const updated = { ...c, sentToPos: true };
          if (selectedCommande?.id === c.id) {
            setSelectedCommande(updated);
          }
          return updated;
        }
        return c;
      }));

      triggerToast(`Fiche Atelier ${cmd.id} envoyée avec succès à la caisse du Point de Vente ! En attente d'encaissement définitif.`, "success");
    } catch (e) {
      triggerToast("Erreur lors de la liaison de caisse.", "warn");
    }
  };

  const getStatusBadge = (status: CommandeItem['status']) => {
    switch (status) {
      case 'prepared':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5 w-fit">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Préparé</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1.5 w-fit animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>En cours lab</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-red-50 text-red-700 border border-red-100 flex items-center gap-1.5 w-fit">
            <XCircle className="w-3.5 h-3.5" />
            <span>Annulé</span>
          </span>
        );
      case 'finalized':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finalisé</span>
          </span>
        );
    }
  };

  // Filter commands by status tab and search query
  const filteredCommandes = commandes.filter(cmd => {
    const matchesTab = activeTab === 'all' || cmd.status === activeTab;
    const matchesSearch = 
      cmd.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.frameModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.lensesType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6" id="atelier-commandes-module-container">
      
      {/* Dynamic Feedback Toasts/Banners */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-[999] p-4 rounded-xl shadow-lg border text-xs max-w-md font-sans flex items-center gap-3 ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-900 border-amber-250'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 animate-bounce" />
            )}
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Notification Commandes</span>
              <span>{toastMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section with Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-display font-extrabold tracking-tight text-slate-850 flex items-center gap-2.5">
            <ClipboardList className="w-5.5 h-5.5 text-blue-600 bg-blue-50 p-1 rounded-lg" />
            <span>{currentLanguage === 'FR' ? "Commandes de Fabrication d'Atelier" : "Client Workshop Orders Hub"}</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            {currentLanguage === 'FR' 
              ? "Planification, suivi de meulage de verres, contrôle des acomptes, et synchro point de vente caisse." 
              : "Management of the physical lens cutting, edger, frame fitting and laboratory dispatch pipeline."}
          </p>
        </div>
        
        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer border-0 font-mono uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>{currentLanguage === 'FR' ? "Nouvelle Commande d'Atelier" : "New Lab Order Entry"}</span>
        </button>
      </div>

      {/* Segmented control navigation and Search bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Tab Controls */}
        <div className="lg:col-span-8 flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl self-center max-w-fit">
          {[
            { id: 'all', label: currentLanguage === 'FR' ? 'Toutes' : 'All Orders' },
            { id: 'prepared', label: currentLanguage === 'FR' ? 'Préparé' : 'Prepared / Ready' },
            { id: 'in_progress', label: currentLanguage === 'FR' ? 'En cours' : 'In Progress' },
            { id: 'cancelled', label: currentLanguage === 'FR' ? 'Annulé' : 'Cancelled' },
            { id: 'finalized', label: currentLanguage === 'FR' ? 'Finalisé & Livré' : 'Finalized / Closed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-extrabold font-sans transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Search */}
        <div className="lg:col-span-4 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 focus:bg-white transition-all font-sans"
            placeholder="Rechercher patient, monture, verre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Commands List */}
        <div className={`${selectedCommande ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all`}>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-5 py-3.5">Réf</th>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Monture & Verres</th>
                    <th className="px-5 py-3.5">Total & Règlement</th>
                    <th className="px-5 py-3.5">Statut</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {filteredCommandes.length > 0 ? (
                    filteredCommandes.map(cmd => {
                      const paid = isFullyPaid(cmd);
                      const remains = cmd.totalFCFA - cmd.amountPaid;
                      return (
                        <tr 
                          key={cmd.id}
                          onClick={() => setSelectedCommande(cmd)}
                          className={`hover:bg-slate-50/70 transition-all cursor-pointer ${
                            selectedCommande?.id === cmd.id ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <td className="px-5 py-4 font-mono font-black text-slate-700">
                            <div>{cmd.id}</div>
                            <div className="text-[9px] font-semibold text-slate-400 font-sans">{cmd.date}</div>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5 font-sans font-bold">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {cmd.customer}
                            </div>
                            <div className="text-[10px] text-cyan-700 font-mono mt-0.5 truncate max-w-[170px]">{cmd.prescriptionDetails}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-800">{cmd.frameModel}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px] font-sans font-medium">{cmd.lensesType}</div>
                            <div className="text-[9px] font-bold text-blue-600 bg-blue-50 py-0.5 px-1.5 rounded-md mt-1 w-fit font-mono">Délai: {cmd.productionDelay}</div>
                          </td>
                          <td className="px-5 py-4 font-mono">
                            <div className="font-extrabold text-slate-850">
                              {cmd.totalFCFA.toLocaleString()} FCFA
                            </div>
                            <div className="mt-1">
                              {paid ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold font-sans rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <Check className="w-2.5 h-2.5" />
                                  Soldé
                                </span>
                              ) : (
                                <span className="inline-flex flex-col">
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold font-sans rounded bg-amber-50 text-amber-700 border border-amber-200">
                                    Acompte ({Math.round((cmd.amountPaid / cmd.totalFCFA)*100)}%)
                                  </span>
                                  <span className="text-[9px] font-bold font-mono text-amber-600 mt-0.5">Reste: {remains.toLocaleString()} FCFA</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">{getStatusBadge(cmd.status)}</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCommande(cmd);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer border-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Gérer</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium">
                        Aucune commande d'optique correspondante trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Command Sheet details sidebar active (5 Columns) */}
        {selectedCommande && (
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-150/80 rounded-2xl p-5 shadow-md space-y-4 relative sticky top-4 border-t-4 border-t-blue-600"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-mono font-black text-blue-605">{selectedCommande.id}</h3>
                  <span className="text-sm font-black text-slate-850 font-display">{selectedCommande.customer}</span>
                </div>
                <button
                  onClick={() => setSelectedCommande(null)}
                  className="p-1.5 px-3 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg font-bold cursor-pointer border-0 text-xs transition flex items-center gap-1"
                >
                  ✕ Fermer
                </button>
              </div>

              {/* Patient Prescription Detail Block */}
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                <span className="text-[9px] font-mono text-slate-500 font-black uppercase tracking-widest block">Détails Prescription Clinique rattachée</span>
                <p className="text-xs font-mono text-slate-800 font-bold bg-white p-2.5 rounded-lg border border-slate-100 shadow-inner">
                  {selectedCommande.prescriptionDetails}
                </p>
                <div className="text-[10px] text-slate-400 font-medium">Réfraction contrôlée par : <span className="font-bold text-slate-600">{selectedCommande.optician}</span></div>
              </div>

              {/* Order specifications details block */}
              <div className="space-y-3.5 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Modèle monture :</span>
                    <span className="text-xs font-bold text-slate-800">{selectedCommande.frameModel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Type de verres :</span>
                    <span className="text-xs font-bold text-slate-800">{selectedCommande.lensesType}</span>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Date d'émission :</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{selectedCommande.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Délai de fabrication :</span>
                    <span className="text-xs font-extrabold text-blue-600 font-mono bg-blue-50 py-0.5 px-2 rounded w-fit inline-block">{selectedCommande.productionDelay}</span>
                  </div>
                </div>

                {/* Pricing / Payments detailed box */}
                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500">Montant total défini:</span>
                    <span className="font-bold font-mono text-slate-900">{selectedCommande.totalFCFA.toLocaleString()} FCFA</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500">Montant versé:</span>
                    <span className="font-bold font-mono text-emerald-700">{selectedCommande.amountPaid.toLocaleString()} FCFA</span>
                  </div>

                  <div className="h-px bg-slate-200/60" />

                  {isFullyPaid(selectedCommande) ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100/50 p-2 rounded-lg border border-emerald-250 font-sans">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Solde entièrement acquitté (Reste 0 FCFA)</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-amber-800">
                        <span>Solde Reste à Payer :</span>
                        <span className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{(selectedCommande.totalFCFA - selectedCommande.amountPaid).toLocaleString()} FCFA</span>
                      </div>

                      {/* PAYMENT RESTANT GATEWAY BUTTON */}
                      <button
                        onClick={() => handlePaymentSettle(selectedCommande.id)}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 transition text-white rounded-lg text-[11px] font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-0 font-sans"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        Solder le paiement restant ({ (selectedCommande.totalFCFA - selectedCommande.amountPaid).toLocaleString() } FCFA)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* INTEGRATION POINT OF SALE CO-ACTION */}
              <div className="p-3 bg-blue-50/50 border border-blue-150 rounded-xl space-y-2">
                <div className="flex items-center gap-1 text-[10px] font-mono text-blue-700 font-bold uppercase tracking-wider">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pont de communication Caisse</span>
                </div>
                <p className="text-[10px] text-slate-505 leading-relaxed">
                  Exportez directement cette fiche d'atelier vers la Caisse (Point de vente) pour l'impression de ticket et l'intégration comptable.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendToPOS(selectedCommande)}
                    className="flex-1 py-2 bg-blue-650 hover:bg-blue-600 text-white font-bold rounded-lg text-[10px] font-mono transition flex items-center justify-center gap-1.5 cursor-pointer border-0 uppercase tracking-wider shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {selectedCommande.sentToPos ? "Commande déjà envoyée (Réexpédier)" : "Envoyer au Point de Vente"}
                  </button>
                </div>
              </div>

              {/* Status and Finalization control */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Avancement fabrication & Assemblage :</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedCommande.id, 'prepared')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
                      selectedCommande.status === 'prepared' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-black' 
                        : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Préparé (Ready)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedCommande.id, 'in_progress')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
                      selectedCommande.status === 'in_progress' 
                        ? 'bg-amber-50 border-amber-200 text-amber-700 font-black' 
                        : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Mettre En Cours lab
                  </button>
                </div>

                {/* FINALIZE BUTTON WITH INSUFFICIENT SOLDE PROTECTION */}
                {isFullyPaid(selectedCommande) ? (
                  <button
                    onClick={() => handleUpdateStatus(selectedCommande.id, 'finalized')}
                    disabled={selectedCommande.status === 'finalized'}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-0 shadow-sm cursor-pointer ${
                      selectedCommande.status === 'finalized'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.01]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedCommande.status === 'finalized' ? "Commande déjà livrée et close" : "Finaliser la commande & Livrer"}</span>
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      disabled
                      title="Solder le paiement restant pour débloquer"
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed uppercase tracking-wider"
                    >
                      <Lock className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span>Verrouillé - Reste à payer</span>
                    </button>
                    <span className="text-[9.5px] text-rose-600 font-medium block text-center">
                      ⚠️ La commande ne peut être finalisée que si le client a soldé la totalité du montant.
                    </span>
                  </div>
                )}

                <button
                  onClick={() => handleUpdateStatus(selectedCommande.id, 'cancelled')}
                  className="w-full py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-350 rounded-lg text-[10px] font-mono tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Annuler le bon d'atelier
                </button>
              </div>

              {/* Lab print */}
              <div>
                <button
                  onClick={() => alert(`Impression du bon de préparation technique d'atelier (${selectedCommande.id}).`)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-xl text-[10.5px] font-sans font-bold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Imprimer fiche technique meulage</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>

      {/* NEW ORDER ENTRY DIALOG / MODAL FORM */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="new-lab-order-entry-modal-form">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden text-left"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-805 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5.5 h-5.5 text-blue-200" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono">Formulaire de Nouvelle Commande d'Atelier</h3>
                  <p className="text-[10px] text-blue-100 mt-0.5">Saisissez les paramètres de fabrication et de règlement pour l'optique client.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-xs cursor-pointer border-0 font-bold"
              >
                ✕ Fermer
              </button>
            </div>

            {/* Modal Content / Form body */}
            <form onSubmit={handleCreateOrderSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Column 1: Patient CRM and Equipment Selection */}
                <div className="space-y-4">
                  {/* Patient Selection block (with prescription autoload) */}
              {/* Type de Commande Selection */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-500 font-mono tracking-wider flex items-center gap-1.5">
                    ⚙️ Choisir le Type de Commande :
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-0.5 bg-slate-200/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('clinique');
                        const sel = PRESET_CLINIC_PATIENTS[formPatientIndex];
                        if (sel) {
                          setFormPrescriptionDetails(sel.prescription);
                          setFormOptician(sel.optician);
                        }
                      }}
                      className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                        orderType === 'clinique' 
                          ? 'bg-[#0097A7] text-white shadow-2xs font-extrabold' 
                          : 'text-slate-650 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      Patient Clinique
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('direct');
                        setFormPrescriptionDetails('');
                        setFormOptician('Médecin Libre');
                      }}
                      className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                        orderType === 'direct' 
                          ? 'bg-[#0097A7] text-white shadow-2xs font-extrabold' 
                          : 'text-slate-650 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      Client Direct
                    </button>
                  </div>
                </div>

                {orderType === 'clinique' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10.5px] uppercase font-bold text-slate-500 font-mono tracking-wider flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Sélectionner le Client & Charger Ordonnance (Patient Clinique)
                      </label>
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-mono font-bold">Synchronisé CRM</span>
                    </div>
                    
                    <select
                      value={formPatientIndex}
                      onChange={(e) => handlePatientIndexChange(parseInt(e.target.value))}
                      className="w-full text-xs font-semibold bg-white border border-slate-250 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {PRESET_CLINIC_PATIENTS.map((p, idx) => (
                        <option key={idx} value={idx}>
                          {p.name} — Praticien : {p.optician}
                        </option>
                      ))}
                    </select>

                    {/* Prescription autoload feedback block */}
                    <div className="bg-white p-3 rounded-xl border border-slate-150 text-xs text-slate-700 space-y-1">
                      <div className="text-[9px] uppercase font-black text-slate-400 tracking-widest block">Diagnostics rattachés détectés :</div>
                      <div className="font-mono font-black text-rose-800 leading-normal">
                        {PRESET_CLINIC_PATIENTS[formPatientIndex]?.prescription || 'Aucune prescription trouvée.'}
                      </div>
                      <div className="text-[9.5px] text-slate-500 font-medium">
                        Praticien rattaché du dossier clinique : <span className="font-bold text-slate-700">{PRESET_CLINIC_PATIENTS[formPatientIndex]?.optician || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <label className="text-[10.5px] uppercase font-bold text-slate-500 font-mono tracking-wider flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Sélectionner le Client dans le Registre (Client Direct)
                      </label>
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-mono font-bold">Base Clients G-LAB</span>
                    </div>

                    <select
                      value={formDirectCustomerIndex}
                      onChange={(e) => setFormDirectCustomerIndex(parseInt(e.target.value))}
                      className="w-full text-xs font-semibold bg-white border border-slate-250 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {crmCustomers.map((c, idx) => (
                        <option key={idx} value={idx}>
                          {c.firstName} {c.lastName.toUpperCase()} (ID: {c.id} • {c.phone})
                        </option>
                      ))}
                    </select>

                    {/* Refraction data entry fields for Client Direct */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-150 text-xs text-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block font-sans">Données de Réfraction Clinique (à Saisir) :</span>
                        <span className="text-[8px] bg-slate-100 text-slate-600 font-bold font-mono px-1.5 py-0.5 rounded">Saisie Manuelle</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={formPrescriptionDetails}
                          onChange={(e) => setFormPrescriptionDetails(e.target.value)}
                          placeholder="Saisissez les données de réfraction clinique (Ex: OD: -2.00 Cyl -0.50 Axe 90 | OS: -1.75 Cyl -0.75 Axe 95)"
                          className="w-full text-xs bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-800 focus:outline-[#0097A7] font-mono leading-normal"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 items-center">
                        <label className="text-[9px] text-slate-500 font-bold">Ophtalmologiste référent :</label>
                        <input
                          type="text"
                          value={formOptician}
                          onChange={(e) => setFormOptician(e.target.value)}
                          placeholder="Nom du médecin prescripteur"
                          className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 p-1 px-2 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Equipment block : Frame & Lenses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-650 block">Modèle de la monture sélectionné :</label>
                  <select
                    value={formFrame}
                    onChange={(e) => setFormFrame(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 p-2 rounded-xl text-slate-800 cursor-pointer"
                  >
                    {PRESET_FRAMES.map((f, idx) => (
                      <option key={idx} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-650 block">Type de verres & Traitements laboritaux :</label>
                  <select
                    value={formLenses}
                    onChange={(e) => setFormLenses(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 p-2 rounded-xl text-slate-800 cursor-pointer"
                  >
                    {PRESET_LENSES.map((l, idx) => (
                      <option key={idx} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              </div> {/* Close Column 1 wrapper */}

              {/* Column 2: Financials & Modalities */}
              <div className="space-y-4">

              {/* Delay and Tariffs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* DELAI DE PRODUCTION */}
                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-650 block">Délai de production (Atelier meulage) :</label>
                  <input
                    type="text"
                    value={formDelay}
                    onChange={(e) => setFormDelay(e.target.value)}
                    placeholder={currentLanguage === 'FR' ? "Saisir le délai (ex: 3 jours)" : "Enter production delay (e.g., 3 days)"}
                    className="w-full text-xs bg-white border border-slate-200 p-2 rounded-xl text-slate-800 focus:outline-[#0097A7] font-semibold font-sans"
                  />
                </div>

                {/* Total amount defined */}
                <div className="space-y-1.5 text-xs font-sans">
                  <label className="font-bold text-slate-650 block">Montant Tarification Globale (FCFA) :</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-slate-400">
                      FCFA
                    </span>
                    <input
                      type="number"
                      required
                      min={5000}
                      step={50}
                      value={formTotalPrice}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setFormTotalPrice(val);
                        setFormDeposit(Math.floor(val * 0.4));
                      }}
                      className="w-full pl-12 pr-4 py-2 font-mono font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-blue-900"
                    />
                  </div>
                </div>

              </div>

              {/* PAYMENT TERMS & MODALITIES */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3.5">
                <span className="text-[10px] uppercase font-black text-slate-405 font-mono tracking-widest block">Conditions de Règlement Client</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormPaymentMode('full')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold font-sans tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer border-0 ${
                      formPaymentMode === 'full'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-600 shadow-xs border border-slate-150'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Totalité d'avance
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormPaymentMode('installments')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold font-sans tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer border-0 ${
                      formPaymentMode === 'installments'
                        ? 'bg-amber-650 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-650 shadow-xs border border-slate-150'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    Plusieurs modalités
                  </button>
                </div>

                {formPaymentMode === 'full' ? (
                  <div className="flex items-center gap-2 p-2 bg-emerald-100/50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-sans font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Le montant total de {formTotalPrice.toLocaleString()} FCFA est soldé d'avance à la livraison de la fiche d'atelier.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div className="space-y-1 text-xs">
                        <label className="font-semibold text-slate-500">Acompte Versé au Dépôt (FCFA) :</label>
                        <input
                          type="number"
                          min={100}
                          max={formTotalPrice - 1}
                          value={formDeposit}
                          onChange={(e) => setFormDeposit(Math.min(formTotalPrice, parseInt(e.target.value) || 0))}
                          className="w-full py-1.5 px-3 bg-white border border-slate-205 rounded-lg text-amber-700 font-mono font-bold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 text-xs font-sans">
                        <span className="font-semibold text-slate-500 block">Solde Restant à Solder à Livraison :</span>
                        <div className="font-mono font-extrabold text-[#d2691e] bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-100">
                          {(formTotalPrice - formDeposit).toLocaleString()} FCFA
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-700 block leading-relaxed font-sans font-semibold">
                      💡 Note : La commande sera marquée avec un solde restant de {(formTotalPrice - formDeposit).toLocaleString()} FCFA. Sa finalisation sera bloquée jusqu'à l'acquittement.
                    </span>
                  </div>
                )}
              </div>
              
              </div> {/* Close Column 2 wrapper */}
              </div> {/* Close Columns grid container */}

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] text-white font-mono uppercase tracking-wide font-extrabold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer border-0 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Créer et éditer la fiche d'atelier
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
