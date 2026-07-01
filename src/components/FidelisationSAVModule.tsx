import React, { useState, useEffect } from 'react';
import { 
  Award, Shield, Table, Search, PlusCircle, Gift, UserPlus, Star, ChevronRight, CheckCircle2, Ticket,
  ShoppingBag, TrendingUp, Coins, Activity, FileText, Check, RotateCcw, AlertCircle, Sparkles, Plus, Info,
  MessageSquare, Mail, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SAVModule from './SAVModule';
import { Customer, INITIAL_CUSTOMERS } from './CRMModule';
import { CommandeItem } from './CommandeModule';

const LOYALTY_TIER_BENEFITS = {
  STANDARD: { discount: '5%', priorityService: 'Non', repair: 'Inclus (visserie uniquement)', multiplier: 1.0, color: 'text-slate-500 bg-slate-100 border border-slate-200' },
  GOLD: { discount: '10%', priorityService: 'Oui', repair: 'Inclus (ajustage + visserie)', multiplier: 1.2, color: 'text-amber-700 bg-amber-50 border border-amber-200' },
  PLATINUM: { discount: '15%', priorityService: 'Exclusif 24/7', repair: 'Dépannage totale + Prêt de monture', multiplier: 1.5, color: 'text-cyan-700 bg-cyan-50 border border-cyan-200' },
  VIP: { discount: '20%', priorityService: 'Coupe-file + Salon Privé', repair: 'Illimité & Remplacement express gratuit', multiplier: 2.0, color: 'text-rose-700 bg-rose-50 border border-rose-200' }
};

const LOYALTY_BONUSES = [
  { pointsNeeded: 100, rewardValue: 'Chèque Cadeau G-LAB 15 € / 10 000 FCFA', description: 'Valable sur l\'achat de produits d\'entretien ou accessoires optiques.' },
  { pointsNeeded: 250, rewardValue: 'Remise Additionnelle de 35 € / 23 000 FCFA', description: 'Valable sur toutes les paires solaires disponibles en agence.' },
  { pointsNeeded: 500, rewardValue: 'Traitement Anti-Lumière Bleue Offert', description: 'Appliqué gratuitement sur votre prochaine paire de verres complexes Essilor.' },
  { pointsNeeded: 1000, rewardValue: 'Examen de Vue Expert Optométrique Gratuit', description: 'Examen de réfraction clinique complet avec notre matériel de pointe.' }
];

interface FidelisationSAVModuleProps {
  currentLanguage: 'FR' | 'EN';
  currentCompany: {
    id: string;
    name: string;
    currency: string;
    taxRate: number;
    symbol: string;
  };
  isOffline: boolean;
}

export default function FidelisationSAVModule({ currentLanguage, currentCompany, isOffline }: FidelisationSAVModuleProps) {
  const [activeTab, setActiveTab] = useState<'loyalty' | 'sav'>('loyalty');
  
  // Load customers state (Syncs with CRMModule via localStorage)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('optic_crm_customers');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }
    return INITIAL_CUSTOMERS;
  });

  // Load agency sales (from CommandeModule)
  const [commandes, setCommandes] = useState<CommandeItem[]>(() => {
    const saved = localStorage.getItem('optic_my_commandes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }
    return [
      { 
        id: 'CMD-2350', 
        customer: 'Hélène Dubois-Chambery', 
        date: '2026-06-10', 
        lensesType: 'Varilux Physio Eye-protect HMC',
        frameModel: 'Ray-Ban Wayfarer Classic', 
        quantity: 1, 
        totalFCFA: 244000, 
        amountPaid: 244000,
        paymentMode: 'full',
        productionDelay: '5 jours',
        status: 'finalized', 
        optician: 'Abdoulaye Ndiaye',
        prescriptionDetails: 'OD: -1.75 OS: -1.50'
      },
      { 
        id: 'CMD-2349', 
        customer: 'Jean-Pierre Gomez-Viguier', 
        date: '2026-06-10', 
        lensesType: 'Progressifs Varilux Physio F-360',
        frameModel: 'Oakley Holbrook Sport', 
        quantity: 1, 
        totalFCFA: 363000, 
        amountPaid: 200000,
        paymentMode: 'installments',
        productionDelay: '7 jours',
        status: 'in_progress', 
        optician: 'Fatou Soumaré',
        prescriptionDetails: 'OD: +2.50 OS: +2.25'
      },
      { 
        id: 'CMD-2348', 
        customer: 'Sarah El-Amri', 
        date: '2026-06-09', 
        lensesType: 'SmartLife Progressive Platinum',
        frameModel: 'Chanel Cat-Eye Signature', 
        quantity: 1, 
        totalFCFA: 420000, 
        amountPaid: 420000,
        paymentMode: 'full',
        productionDelay: '4 jours',
        status: 'finalized', 
        optician: 'Abdoulaye Ndiaye',
        prescriptionDetails: 'OD: Plan OS: Plan'
      }
    ];
  });

  // Track credited order IDs to prevent fraud and double counting
  const [creditedOrders, setCreditedOrders] = useState<string[]>(() => {
    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }
    const saved = localStorage.getItem('optic_credited_loyalty_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    
    // Seed with completed orders to look natural only if commands are not empty/reset
    const savedCmds = localStorage.getItem('optic_my_commandes');
    if (savedCmds) {
      try {
        const parsedCmds = JSON.parse(savedCmds);
        if (Array.isArray(parsedCmds)) {
          const hasInitialCmd = parsedCmds.some((c: any) => c.id === 'CMD-2350');
          if (hasInitialCmd) {
            return ['CMD-2350'];
          }
        }
      } catch (e) {}
    }
    return [];
  });

  // Filter & Search loyalty states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'rewards' | 'sales'>('rewards');

  // Communication States
  const [communicationModal, setCommunicationModal] = useState<{
    clientName: string;
    type: 'SMS' | 'Email' | 'WhatsApp';
    destination: string;
    isOpen: boolean;
  } | null>(null);

  const openCommunication = (clientName: string, type: 'SMS' | 'Email' | 'WhatsApp', destination: string) => {
    setCommunicationModal({
      clientName,
      type,
      destination,
      isOpen: true
    });
  };

  const handleSendMockMessage = () => {
    setCommunicationModal(null);
    setRewardMessage(
      currentLanguage === 'FR'
        ? `Message de fidélisation envoyé avec succès !`
        : `Fidelity communication message sent successfully!`
    );
    setTimeout(() => setRewardMessage(null), 3000);
  };

  // Synchronise back to localstorage whenever customers list changes
  useEffect(() => {
    const serialized = JSON.stringify(customers);
    const existing = localStorage.getItem('optic_crm_customers');
    if (existing !== serialized) {
      localStorage.setItem('optic_crm_customers', serialized);
      // Dispatch event to keep other modules synced
      window.dispatchEvent(new Event('storage'));
    }
  }, [customers]);

  // Synchronise credited orders list
  useEffect(() => {
    const serialized = JSON.stringify(creditedOrders);
    const existing = localStorage.getItem('optic_credited_loyalty_orders');
    if (existing !== serialized) {
      localStorage.setItem('optic_credited_loyalty_orders', serialized);
    }
  }, [creditedOrders]);

  // Sync state with outside local storage updates (bidirectional live preview)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('optic_crm_customers');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCustomers(prev => {
              if (JSON.stringify(prev) === saved) {
                return prev;
              }
              return parsed;
            });
          }
        } catch (e) {}
      }
      const savedCmds = localStorage.getItem('optic_my_commandes');
      if (savedCmds) {
        try {
          const parsedCmds = JSON.parse(savedCmds);
          if (Array.isArray(parsedCmds)) {
            setCommandes(prev => {
              if (JSON.stringify(prev) === savedCmds) {
                return prev;
              }
              return parsedCmds;
            });
          }
        } catch (e) {}
      }
      const savedCredited = localStorage.getItem('optic_credited_loyalty_orders');
      if (savedCredited) {
        try {
          const parsedCredited = JSON.parse(savedCredited);
          if (Array.isArray(parsedCredited)) {
            setCreditedOrders(prev => {
              if (JSON.stringify(prev) === savedCredited) {
                return prev;
              }
              return parsedCredited;
            });
          }
        } catch (e) {}
      } else if (localStorage.getItem('optic_system_factory_reset') === 'true') {
        setCreditedOrders([]);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle adding points manually
  const handleAddPoints = (customerId: string, amount: number) => {
    const updated = customers.map(c => {
      if (c.id !== customerId) return c;
      const newPoints = c.loyaltyPoints + amount;
      
      let newTier = c.loyaltyTier;
      if (newPoints >= 1000) newTier = 'VIP';
      else if (newPoints >= 450) newTier = 'PLATINUM';
      else if (newPoints >= 200) newTier = 'GOLD';
      else newTier = 'STANDARD';

      return { ...c, loyaltyPoints: newPoints, loyaltyTier: newTier };
    });
    setCustomers(updated);
    
    // update current selected visual
    if (selectedCustomer && selectedCustomer.id === customerId) {
      const match = updated.find(c => c.id === customerId);
      if (match) setSelectedCustomer(match);
    }

    setRewardMessage(currentLanguage === 'FR' ? `+${amount} points crédités avec succès !` : `+${amount} loyalty points successfully credited!`);
    setTimeout(() => setRewardMessage(null), 3000);
  };

  // Associate points with a specific completed order
  const handleCreditOrderPoints = (orderId: string, customerName: string, amountFcfa: number) => {
    if (creditedOrders.includes(orderId)) return;

    // Search for a matching customer in the loyalty database
    const queryParts = customerName.toLowerCase().trim().split(' ');
    const matched = customers.find(c => {
      const fn = (c.firstName || '').toLowerCase();
      const ln = (c.lastName || '').toLowerCase();
      // Match if both names intersect or we have a high resemblance
      return queryParts.some(part => part === fn) || queryParts.some(part => part === ln) ||
             (customerName.toLowerCase().includes(fn) && customerName.toLowerCase().includes(ln));
    });

    if (!matched) {
      alert(currentLanguage === 'FR'
        ? `Impossible d'associer automatiquement : Aucun patient enregistré sous le nom "${customerName}" n'a été trouvé dans le CRM. Veuillez d'abord créer ce client.`
        : `Unable to match automatically: No patient named "${customerName}" is registered in the CRM. Please register them first.`
      );
      return;
    }

    // G-LAB rule: 1 point for each 1,000 FCFA spent
    const pointsToAdd = Math.max(1, Math.floor(amountFcfa / 1000));

    const updated = customers.map(c => {
      if (c.id !== matched.id) return c;
      const newPoints = c.loyaltyPoints + pointsToAdd;
      
      let newTier = c.loyaltyTier;
      if (newPoints >= 1000) newTier = 'VIP';
      else if (newPoints >= 450) newTier = 'PLATINUM';
      else if (newPoints >= 200) newTier = 'GOLD';
      else newTier = 'STANDARD';

      return { ...c, loyaltyPoints: newPoints, loyaltyTier: newTier };
    });

    setCustomers(updated);
    setCreditedOrders(prev => [...prev, orderId]);

    // Force sync the selected customer state if they are currently being viewed
    if (selectedCustomer && selectedCustomer.id === matched.id) {
      const currentMatch = updated.find(c => c.id === matched.id);
      if (currentMatch) setSelectedCustomer(currentMatch);
    }

    setRewardMessage(currentLanguage === 'FR'
      ? `🎉 +${pointsToAdd} points crédités à ${matched.firstName} ${matched.lastName.toUpperCase()} pour la commande ${orderId}`
      : `🎉 +${pointsToAdd} points credited to ${matched.firstName} ${matched.lastName.toUpperCase()} for order ${orderId}`
    );
    setTimeout(() => setRewardMessage(null), 4000);
  };

  // Convert points / unlock reward
  const handleConvertPoints = (customerId: string, bonus: typeof LOYALTY_BONUSES[0]) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    if (cust.loyaltyPoints < bonus.pointsNeeded) {
      alert(currentLanguage === 'FR' 
        ? `Points insuffisants ! Ce patient a ${cust.loyaltyPoints} points, mais ${bonus.pointsNeeded} sont exigés.`
        : `Insufficient points! This customer has ${cust.loyaltyPoints} points, but ${bonus.pointsNeeded} are required.`
      );
      return;
    }

    const updated = customers.map(c => {
      if (c.id !== customerId) return c;
      const newPoints = c.loyaltyPoints - bonus.pointsNeeded;
      
      let newTier = c.loyaltyTier;
      if (newPoints >= 1000) newTier = 'VIP';
      else if (newPoints >= 450) newTier = 'PLATINUM';
      else if (newPoints >= 200) newTier = 'GOLD';
      else newTier = 'STANDARD';

      return { ...c, loyaltyPoints: newPoints, loyaltyTier: newTier };
    });
    setCustomers(updated);

    if (selectedCustomer && selectedCustomer.id === customerId) {
      const match = updated.find(c => c.id === customerId);
      if (match) setSelectedCustomer(match);
    }

    setRewardMessage(currentLanguage === 'FR' 
      ? `🎉 Récompense "${bonus.rewardValue}" débloquée et appliquée !` 
      : `🎉 Reward "${bonus.rewardValue}" unlocked and applied!`
    );
    setTimeout(() => setRewardMessage(null), 4000);
  };

  // Get matching orders for a customer profile
  const getCustomerOrders = (cust: Customer) => {
    return commandes.filter(cmd => {
      const cName = (cmd.customer || '').toLowerCase();
      const fn = (cust.firstName || '').toLowerCase();
      const ln = (cust.lastName || '').toLowerCase();
      return cName.includes(fn) || cName.includes(ln);
    });
  };

  // Calculate statistics
  const getFidelityGlobalStats = () => {
    const totalCustomers = customers.length;
    const totalPointsDistributed = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    const convertedOrdersCount = creditedOrders.length;
    const totalSalesFCFA = commandes.reduce((sum, cmd) => sum + (cmd.totalFCFA || 0), 0);
    
    return {
      totalCustomers,
      totalPointsDistributed,
      convertedOrdersCount,
      totalSalesFCFA
    };
  };

  const stats = getFidelityGlobalStats();

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTierFilter === 'All' || c.loyaltyTier === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6" id="fidelisation-sav-container">
      {/* Top Banner and Navigation Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h2 className="text-xl font-display font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#0097A7]" />
            {currentLanguage === 'FR' ? 'Espace Fidélisation & S.A.V' : 'Loyalty Program & After-Sales (S.A.V)'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {currentLanguage === 'FR'
              ? 'Gérez la relation client de niveau supérieur : fidélité connectée aux ventes de l\'agence et réparation SAV d\'atelier.'
              : 'Manage premium customer relations: connected loyalty rewards matching real sales and optical workshop repairs.'}
          </p>
        </div>

        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'loyalty' 
                ? 'bg-white text-slate-900 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            {currentLanguage === 'FR' ? 'Fidélisation & Loyauté' : 'Loyalty & Rewards'}
          </button>
          
          <button
            onClick={() => setActiveTab('sav')}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sav' 
                ? 'bg-white text-slate-900 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Ticket className="w-4 h-4 text-[#00BCD4]" />
            {currentLanguage === 'FR' ? 'Service Après-Vente (S.A.V)' : 'Service & Warranties (SAV)'}
          </button>
        </div>
      </div>

      {rewardMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200/60 shadow-3xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{rewardMessage}</span>
        </div>
      )}

      {activeTab === 'loyalty' ? (
        <div className="space-y-6">
          {/* Quick Bento Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-3">
              <div className="p-3 bg-cyan-50 rounded-xl text-[#0097A7]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Ventes Évaluées</span>
                <strong className="text-sm font-black text-slate-800">{stats.totalSalesFCFA.toLocaleString()} {currentCompany.symbol || 'FCFA'}</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Points en Circulation</span>
                <strong className="text-sm font-black text-slate-800">{stats.totalPointsDistributed} pts</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-500">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Ventes Converties</span>
                <strong className="text-sm font-black text-slate-800">{stats.convertedOrdersCount} factures</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-3">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Taux d'Engagement</span>
                <strong className="text-sm font-black text-slate-800">
                  {stats.totalCustomers > 0 ? `${Math.round((stats.convertedOrdersCount / Math.max(1, commandes.length)) * 100)}%` : '92%'}
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Main List */}
            <div className="xl:col-span-8 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono flex items-center gap-1.5">
                      <span>👥 Registre Fidélité Patients & Volumes d'Achat</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Vérifiez les points cumulés par rapport à leurs achats réels.</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        placeholder={currentLanguage === 'FR' ? 'Rechercher un patient...' : 'Search customer...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-full sm:w-48 focus:outline-none focus:border-[#00BCD4]"
                      />
                    </div>
                    
                    {/* Tier Filter */}
                    <select
                      value={selectedTierFilter}
                      onChange={(e) => setSelectedTierFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:border-[#00BCD4] text-slate-600"
                    >
                      <option value="All">{currentLanguage === 'FR' ? 'Tous les grades' : 'All tiers'}</option>
                      <option value="STANDARD">STANDARD</option>
                      <option value="GOLD">GOLD</option>
                      <option value="PLATINUM">PLATINUM</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  {filteredCustomers.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Star className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                      <p className="text-xs font-semibold">
                        {currentLanguage === 'FR' ? 'Abonnement : Aucun dossier fidélisé ou trouvé.' : 'No loyalty customer records found.'}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                          <th className="p-3">Patient</th>
                          <th className="p-3">Volume Achat</th>
                          <th className="p-3">Agence Attitrée</th>
                          <th className="p-3 text-center">Grade</th>
                          <th className="p-3 text-right">Points Actuels</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map(c => {
                          const tier = LOYALTY_TIER_BENEFITS[c.loyaltyTier] || LOYALTY_TIER_BENEFITS.STANDARD;
                          const patientCmds = getCustomerOrders(c);
                          const totalSpend = patientCmds.reduce((sum, cmd) => sum + cmd.totalFCFA, 0);

                          return (
                            <tr key={c.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition">
                              <td className="p-3 font-semibold text-slate-800">
                                <div>{c.firstName} {c.lastName.toUpperCase()}</div>
                                <span className="text-[9px] text-[#0097A7] font-mono block">{c.id}</span>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-700 font-mono text-[11px]">
                                  {totalSpend > 0 ? `${totalSpend.toLocaleString()} ${currentCompany.symbol || 'FCFA'}` : '0 FCFA'}
                                </div>
                                <div className="text-[9px] text-slate-400">{patientCmds.length} commande(s)</div>
                              </td>
                              <td className="p-3 text-slate-600 font-semibold text-[11px]">{c.branch || '—'}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded font-black font-mono text-[9px] ${tier.color}`}>
                                  {c.loyaltyTier}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-[#0097A7] text-[13px]">
                                {c.loyaltyPoints}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex gap-1.5 justify-end items-center">
                                  {/* Communication triggers */}
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => openCommunication(`${c.firstName} ${c.lastName}`, 'SMS', c.phone)}
                                      title="Envoyer un rappel SMS de fidélisation"
                                      className="w-6 h-6 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer border border-blue-200/20"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => openCommunication(`${c.firstName} ${c.lastName}`, 'Email', c.email)}
                                      title="Envoyer un e-mail / newsletter"
                                      className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center justify-center cursor-pointer border border-indigo-200/20"
                                    >
                                      <Mail className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => openCommunication(`${c.firstName} ${c.lastName}`, 'WhatsApp', c.phone)}
                                      title="Contacter par WhatsApp Business"
                                      className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center cursor-pointer border border-emerald-200/20"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => handleAddPoints(c.id, 50)}
                                    className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[#0097A7] font-bold text-[10px] hover:bg-[#00BCD4]/10 hover:border-[#00BCD4]/20 transition cursor-pointer"
                                    title="Créditer manuellement 50 points"
                                  >
                                    +50 pts
                                  </button>
                                  <button
                                    onClick={() => setSelectedCustomer(c)}
                                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-900 text-white font-bold text-[10px] hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Remises & Ventes</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Latest Agency Sales List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#0097A7]" />
                    <span>🛍️ Dernières Ventes Enregistrées dans l'Agence</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Associez les factures de l'agence directement aux comptes de fidélité pour attribuer les points sans fraude possible.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  {commandes.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Aucune commande enregistrée pour l'instant.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                          <th className="p-3">Réf / Date</th>
                          <th className="p-3">Acheteur Référencé</th>
                          <th className="p-3">Produits Optiques</th>
                          <th className="p-3 text-right">Montant Vente</th>
                          <th className="p-3 text-center">Sécurité Fidélité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commandes.map((cmd) => {
                          const isCredited = creditedOrders.includes(cmd.id);
                          const equivalentPoints = Math.max(1, Math.floor(cmd.totalFCFA / 1000));
                          
                          return (
                            <tr key={cmd.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition">
                              <td className="p-3 font-mono">
                                <div className="font-bold text-slate-800">{cmd.id}</div>
                                <span className="text-[9px] text-slate-400">{cmd.date}</span>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-700">{cmd.customer}</div>
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono">Opticien: {cmd.optician}</span>
                              </td>
                              <td className="p-3">
                                <div className="text-slate-600 font-semibold truncate max-w-[150px]" title={cmd.frameModel}>{cmd.frameModel}</div>
                                <div className="text-[9px] text-slate-400 truncate max-w-[150px]" title={cmd.lensesType}>{cmd.lensesType}</div>
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-800">
                                {cmd.totalFCFA.toLocaleString()} {currentCompany.symbol || 'FCFA'}
                              </td>
                              <td className="p-3 text-center">
                                {isCredited ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Crédité ({equivalentPoints} pts)</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleCreditOrderPoints(cmd.id, cmd.customer, cmd.totalFCFA)}
                                    className="px-2.5 py-1 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition text-[10px] flex items-center gap-1 mx-auto cursor-pointer shadow-3xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Créditer {equivalentPoints} pts</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: Brackets & Rewards Converter */}
            <div className="xl:col-span-4 space-y-6">
              {/* Loyaltys rules explanations */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097a7] border-b pb-2 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>Guide des Statuts G-LAB</span>
                </h4>
                <div className="space-y-3">
                  {Object.entries(LOYALTY_TIER_BENEFITS).map(([tier, data]) => (
                    <div key={tier} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1.5 shadow-3xs">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded font-bold font-mono text-[9px] ${data.color}`}>{tier}</span>
                        <span className="font-bold text-slate-850 font-mono text-xs">{data.discount} de Remise</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans grid grid-cols-2 gap-2 mt-0.5">
                        <div>⚙️ Multiplicateur : <span className="font-bold text-slate-700 font-mono">x{data.multiplier}</span></div>
                        <div>🛠️ Atelier : <span className="font-bold text-slate-700">{data.repair}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loyalty bonus rewards list */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097a7] border-b pb-2 flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  <span>Programme de Récompenses</span>
                </h4>
                <div className="space-y-3">
                  {LOYALTY_BONUSES.map((bonus, idx) => (
                    <div key={idx} className="bg-slate-50/55 p-3 rounded-xl border border-slate-150 flex items-center justify-between gap-3 text-left">
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs text-slate-800 leading-tight">{bonus.rewardValue}</h5>
                        <p className="text-[10px] text-slate-500 leading-normal">{bonus.description}</p>
                      </div>
                      <span className="shrink-0 float-right px-2 py-1 bg-cyan-50 border border-cyan-100 text-[#0097A7] font-mono text-[9.5px] font-black rounded-lg">
                        {bonus.pointsNeeded} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <SAVModule 
            currentLanguage={currentLanguage}
            currentCompany={currentCompany}
            isOffline={isOffline}
            customers={customers}
          />
        </div>
      )}

      {/* Convert Points Modal & Detailed Sales History */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h3 className="font-display font-black text-slate-900 text-sm">
                    {currentLanguage === 'FR' 
                      ? `Dispositif Client : ${selectedCustomer.firstName} ${selectedCustomer.lastName.toUpperCase()}` 
                      : `Customer Fidelity: ${selectedCustomer.firstName} ${selectedCustomer.lastName.toUpperCase()}`}
                  </h3>
                  <span className="text-[10.5px] font-mono text-slate-400 block">{selectedCustomer.id} • {selectedCustomer.phone}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setModalTab('rewards');
                  }}
                  className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-md cursor-pointer text-xs font-bold"
                >
                  Fermer
                </button>
              </div>

              {/* Patient Current State */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Points Disponibles</span>
                  <p className="text-lg font-bold font-mono text-[#0097A7]">{selectedCustomer.loyaltyPoints} pts</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Statut / Tier</span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded font-black font-mono text-[9px] uppercase ${LOYALTY_TIER_BENEFITS[selectedCustomer.loyaltyTier]?.color}`}>
                      {selectedCustomer.loyaltyTier}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Total Ventes Réseau</span>
                  <p className="text-lg font-bold font-mono text-slate-700">
                    {getCustomerOrders(selectedCustomer).reduce((s, cmd) => s + cmd.totalFCFA, 0).toLocaleString()} {currentCompany.symbol || 'FCFA'}
                  </p>
                </div>
              </div>

              {/* Tabs Inside Modal */}
              <div className="flex border-b border-slate-100 gap-2">
                <button
                  onClick={() => setModalTab('rewards')}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition ${
                    modalTab === 'rewards' 
                      ? 'border-[#00BCD4] text-[#0097A7]' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🎁 Récompenses Éligibles
                </button>
                <button
                  onClick={() => setModalTab('sales')}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                    modalTab === 'sales' 
                      ? 'border-[#00BCD4] text-[#0097A7]' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Historique des Ventes Agence ({getCustomerOrders(selectedCustomer).length})</span>
                </button>
              </div>

              {modalTab === 'rewards' ? (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {LOYALTY_BONUSES.map((bonus, idx) => {
                      const isEligible = selectedCustomer.loyaltyPoints >= bonus.pointsNeeded;
                      return (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition ${
                            isEligible 
                              ? 'bg-[#0097A7]/5 border-[#00BCD4]/15 hover:bg-[#00BCD4]/10' 
                              : 'bg-slate-50/50 border-slate-100 opacity-60'
                          }`}
                        >
                          <div className="space-y-0.5 text-left">
                            <h5 className="font-bold text-xs text-slate-800 leading-tight flex items-center gap-1">
                              {bonus.rewardValue}
                              {isEligible && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            </h5>
                            <p className="text-[10.5px] text-slate-500 leading-normal max-w-md">{bonus.description}</p>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                              Exige {bonus.pointsNeeded} pts
                            </span>
                            {isEligible ? (
                              <button
                                onClick={() => {
                                  handleConvertPoints(selectedCustomer.id, bonus);
                                }}
                                className="px-2.5 py-1 text-[10px] font-black uppercase bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                              >
                                Débloquer
                              </button>
                            ) : (
                              <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded cursor-not-allowed">
                                Verrouillé
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-[40vh] overflow-y-auto border border-slate-100 rounded-xl">
                    {getCustomerOrders(selectedCustomer).length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Aucun achat n'a été enregistré au nom de ce client pour l'instant dans le réseau.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                            <th className="p-3">Numéro / Date</th>
                            <th className="p-3">Description Produit</th>
                            <th className="p-3 text-right">Total Payé</th>
                            <th className="p-3 text-center">Statut Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCustomerOrders(selectedCustomer).map((cmd) => {
                            const isCredited = creditedOrders.includes(cmd.id);
                            const points = Math.max(1, Math.floor(cmd.totalFCFA / 1000));
                            return (
                              <tr key={cmd.id} className="hover:bg-slate-50/50 border-b border-slate-50">
                                <td className="p-3 font-mono">
                                  <div className="font-bold text-slate-850">{cmd.id}</div>
                                  <span className="text-[9px] text-slate-400">{cmd.date}</span>
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-700">{cmd.frameModel}</div>
                                  <div className="text-[9.5px] text-slate-400 font-sans">{cmd.lensesType}</div>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-850">
                                  {cmd.totalFCFA.toLocaleString()} {currentCompany.symbol || 'FCFA'}
                                </td>
                                <td className="p-3 text-center">
                                  {isCredited ? (
                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-100 inline-block">
                                      Crédité (+{points} pts)
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleCreditOrderPoints(cmd.id, cmd.customer, cmd.totalFCFA)}
                                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[9.5px] cursor-pointer"
                                    >
                                      Créditer (+{points} pts)
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMMUNICATION OVERLAY DIALOG */}
      <AnimatePresence>
        {communicationModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col font-sans text-left text-slate-100"
            >
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[#0097A7]/10 text-[#0097a7]">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                    {communicationModal.type} de fidélisation
                  </h4>
                </div>
                <button
                  onClick={() => setCommunicationModal(null)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-300 font-sans">
                  {currentLanguage === 'FR' ? "Envoi d'un message promotionnel ou informatif à :" : "Sending a promo/info message to :"}
                  <strong className="text-white block mt-1">{communicationModal.clientName} ({communicationModal.destination})</strong>
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">
                    {currentLanguage === 'FR' ? 'Modèle de message pré-édité' : 'Pre-edited message template'}
                  </label>
                  <textarea 
                    rows={4}
                    defaultValue={
                      communicationModal.type === 'SMS' 
                        ? `Cher(e) ${communicationModal.clientName}, votre magasin Optic Alizé vous remercie pour votre fidélité ! Vous cumulez actuellement des points pour votre prochain cadeau.`
                        : communicationModal.type === 'WhatsApp'
                        ? `Bonjour ${communicationModal.clientName}! 🌟 C'est Optic Alizé. Nous vous informons que votre ordonnance médicale ou contrôle d'acuité visuelle est arrivé à échéance. Prenez RDV avec nos opticiens !`
                        : `Sujet: Votre statut fidélité chez Optic Alizé\n\nCher(e) ${communicationModal.clientName},\n\nNous sommes ravis de vous compter parmi nos clients VIP. Découvrez nos nouvelles montures solaires de créateurs arrivées cette semaine...\n\nL'équipe Optic Alizé.`
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-250 focus:outline-none focus:ring-1 focus:ring-[#0097A7] font-sans"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setCommunicationModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSendMockMessage}
                    className="px-5 py-2 rounded-lg bg-[#0097A7] hover:bg-[#00838F] text-white text-xs font-semibold transition cursor-pointer"
                  >
                    {currentLanguage === 'FR' ? 'Envoyer Maintenant' : 'Send Now'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
