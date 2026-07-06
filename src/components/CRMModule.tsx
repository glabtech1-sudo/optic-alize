import React, { useState } from 'react';
import { fetchCustomers, saveCustomer } from '../lib/api';
import { defaultLogoBase64 as defaultLogo } from '../assets/logoBase64';
import { 
  User, Search, FileText, Download, Check, Sparkles, Shield, Calendar, Plus, 
  Filter, Ban, Table, CreditCard, HeartPulse, ShieldAlert, Award, ArrowUpRight, 
  CheckCircle2, RefreshCw, Layers, Sliders, FileSpreadsheet, AlertTriangle, 
  Trash2, UserPlus, FileCheck, Landmark, ShieldCheck,
  Mail, MessageSquare, Phone, Printer, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// CRM Types and Interfaces
export interface Prescription {
  id: string;
  ophthalmologist: string;
  odSphere: number;
  odCylinder: number;
  odAxis: number;
  odAddition: number;
  ogSphere: number;
  ogCylinder: number;
  ogAxis: number;
  ogAddition: number;
  prescriptionDate: string;
  isExpired: boolean;
  insuranceValidated: boolean;
}

export interface PurchaseItem {
  id: string;
  category: 'Monture Optique' | 'Monture Solaire' | 'Verre Progressif' | 'Verre Unifocal' | 'Accessoire';
  name: string;
  brand: string;
  qty: number;
  unitPrice: number;
  eyeSide: 'LEFT' | 'RIGHT' | 'BOTH' | 'NONE';
  warrantyPolicy?: string;
  warrantyCoverageYears?: number;
  warrantyExpired?: boolean;
}

export interface Purchase {
  id: string;
  invoiceRef: string;
  date: string;
  branch: string;
  amountTtc: number;
  mutuelleSupport: number;
  stateSupport: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  opticAdvisor: string;
  items: PurchaseItem[];
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'CARTE BANCAIRE' | 'ESPÈCES' | 'CHÈQUE' | 'TIERS_PAYANT_AMO' | 'TIERS_PAYANT_AMC';
  reference: string;
  status: 'SUCCESS' | 'PENDING' | 'REJECTED';
  installmentIndex?: string; // e.g. "1/3", "2/3", "3/3"
}

export interface LoyaltyBonus {
  pointsNeeded: number;
  rewardValue: string;
  description: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  ssn: string; // Social security number (NIR)
  registrationDate: string;
  loyaltyTier: 'STANDARD' | 'GOLD' | 'PLATINUM' | 'VIP';
  loyaltyPoints: number;
  branch: string;
  prescriptions: Prescription[];
  purchases: Purchase[];
  payments: Payment[];
}

// Initial Bootstrapped Data for beautiful demonstration
export const INITIAL_CUSTOMERS: Customer[] = [];

// Available benefits configurations for the loyalty points simulation
const LOYALTY_TIER_BENEFITS = {
  STANDARD: { discount: '5%', priorityService: 'Non', repair: 'Inclus (visserie uniquement)', multiplier: 1.0, color: 'text-slate-400 bg-slate-400/10' },
  GOLD: { discount: '10%', priorityService: 'Oui', repair: 'Inclus (ajustage + visserie)', multiplier: 1.2, color: 'text-amber-400 bg-amber-400/10' },
  PLATINUM: { discount: '15%', priorityService: 'Exclusif 24/7', repair: 'Dépannage totale + Prêt de monture', multiplier: 1.5, color: 'text-cyan-400 bg-cyan-400/10' },
  VIP: { discount: '20%', priorityService: 'Coupe-file + Salon Privé', repair: 'Illimité & Remplacement express gratuit', multiplier: 2.0, color: 'text-pink-400 bg-pink-400/10' }
};

const LOYALTY_BONUSES: LoyaltyBonus[] = [
  { pointsNeeded: 100, rewardValue: 'Chèque Cadeau G-LAB 15 €', description: 'Valable sur l\'achat de produits d\'entretien ou accessoires optiques.' },
  { pointsNeeded: 250, rewardValue: 'Remise Additionnelle de 35 €', description: 'Valable sur toutes les paires solaires disponibles en agence.' },
  { pointsNeeded: 500, rewardValue: 'Traitement Anti-Lumière Bleue Offert', description: 'Appliqué gratuitement sur votre prochaine paire de verres complexes Essilor.' },
  { pointsNeeded: 1000, rewardValue: 'Examen de Vue Expert Optométrique Gratuit', description: 'Examen de réfraction clinique complet avec notre matériel de pointe.' }
];

interface CRMModuleProps {
  currentLanguage?: 'FR' | 'EN';
}

export default function CRMModule({ currentLanguage = 'FR' }: CRMModuleProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = React.useCallback(() => {
    fetchCustomers().then(data => {
      setCustomers(data);
      if (data.length > 0) {
        setSelectedCustomer(prev => {
          if (prev) {
            const found = data.find(c => c.id === prev.id);
            if (found) return found;
          }
          return data[0];
        });
      }
      setIsLoading(false);
    }).catch(err => {
      console.error("Error fetching customers:", err);
      setIsLoading(false);
    });
  }, []);

  React.useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'list' | 'detail'>('list');
  
  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('All');
  const [selectedLoyaltyFilter, setSelectedLoyaltyFilter] = useState('All');
  const [selectedPrescriptionFilter, setSelectedPrescriptionFilter] = useState('All');
  const [selectedWarrantyFilter, setSelectedWarrantyFilter] = useState('All');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
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
    triggerToast(
      currentLanguage === 'FR'
        ? `Message de fidélisation envoyé avec succès !`
        : `Customer loyalty message sent successfully!`
    );
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const rowsHtml = filteredCustomersList.map(c => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px; font-weight: bold;">${c.id}</td>
          <td style="padding: 10px;">${c.lastName.toUpperCase()} ${c.firstName}</td>
          <td style="padding: 10px;">${c.birthDate}</td>
          <td style="padding: 10px;">${c.branch}</td>
          <td style="padding: 10px;">${c.registrationDate || '2026-01-01'}</td>
          <td style="padding: 10px;">${c.loyaltyTier}</td>
          <td style="padding: 10px; font-weight: bold;">${c.loyaltyPoints} pts</td>
          <td style="padding: 10px;">${c.phone}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Registre Patient & Fidélisation - Optic Alizé</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f1f5f9; text-align: left; padding: 12px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
              h1 { font-size: 20px; font-weight: 950; color: #0097a7; margin-bottom: 5px; }
              hr { border: 0; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div>
              <h1>REGISTRE DES PATIENTS & ATELIER - OPTIC ALIZÉ</h1>
              <p style="font-size: 11px; color: #64748b; margin: 0;">Généré le ${new Date().toLocaleDateString()} • Agence : ${selectedBranchFilter === 'All' ? 'Toutes les Agences' : selectedBranchFilter}</p>
            </div>
            <hr style="margin-top: 20px; margin-bottom: 25px;" />
            
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Né(e) le</th>
                  <th>Agence</th>
                  <th>Date Inscription</th>
                  <th>Statut CRM</th>
                  <th>Points Cumulés</th>
                  <th>N° Téléphone</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      triggerToast(currentLanguage === 'FR' ? "Impression du registre patient lancée !" : "Patient registry print launched!");
    } else {
      triggerToast(currentLanguage === 'FR' ? "Autorisez les pop-ups pour l'impression" : "Please allow popups to enable printing");
    }
  };

  // Load active user's allowed boutiques to filter clients accordingly
  const currentUserObj = React.useMemo(() => {
    try {
      const email = localStorage.getItem('optic_user_email') || 'glabtech1@gmail.com';
      const usersSaved = localStorage.getItem('optic_users');
      if (email && usersSaved) {
        const usersList = JSON.parse(usersSaved);
        if (Array.isArray(usersList)) {
          return usersList.find((u: any) => u.email === email);
        }
      }
    } catch (e) {}
    return null;
  }, []);

  const isAdminInDirection = React.useMemo(() => {
    if (!currentUserObj) return false;
    const isSuperAdminEmail = currentUserObj.email === 'glabtech1@gmail.com' || 
                              currentUserObj.email === 'glabtech1@opticalize.com' || 
                              currentUserObj.email === 'anges.gildas@gmail.com' || 
                              currentUserObj.email === 'anges.gildas@opticalizé.com' ||
                              currentUserObj.email === 'anges.gildas@opticalize.com';
    if (isSuperAdminEmail) return true;
    if (currentUserObj.role !== 'Admin') return false;
    const boutique = (currentUserObj.allowedBoutiques && currentUserObj.allowedBoutiques.length > 0)
      ? currentUserObj.allowedBoutiques[0]
      : (currentUserObj.location || '');
    return boutique.toUpperCase().includes('DÉPÔT CENTRAL') || 
           boutique.toUpperCase().includes('DEPOT CENTRAL') || 
           boutique.toUpperCase().includes('DIRECTION');
  }, [currentUserObj]);

  const fixedBoutique = isAdminInDirection ? null : (currentUserObj?.allowedBoutiques?.[0] || currentUserObj?.location || 'Paris Nation');

  React.useEffect(() => {
    if (fixedBoutique) {
      setSelectedBranchFilter(fixedBoutique);
      setNewBranch(fixedBoutique);
    }
  }, [fixedBoutique]);

  // New Client Registration form states
  const [isRegisteringOpen, setIsRegisteringOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newSsn, setNewSsn] = useState('');
  const [newBranch, setNewBranch] = useState(fixedBoutique || 'Paris Nation');
  const [newLoyaltyTier, setNewLoyaltyTier] = useState<'STANDARD' | 'GOLD' | 'PLATINUM' | 'VIP'>('STANDARD');
  
  // Simulated State to show feedback when claiming loyalty items or altering records
  const [crmToast, setCrmToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setCrmToast({ message, type });
    setTimeout(() => setCrmToast(null), 3000);
  };

  // Perform CRM analytics counts
  const getCrmStats = () => {
    const total = customers.length;
    const goldPlat = customers.filter(c => c.loyaltyTier === 'GOLD' || c.loyaltyTier === 'PLATINUM' || c.loyaltyTier === 'VIP').length;
    
    // Accumulate total billing
    let revenueSum = 0;
    customers.forEach(c => {
      c.purchases.forEach(p => {
        if (p.status === 'PAID') revenueSum += p.amountTtc;
      });
    });

    // Check count of expired prescriptions
    let expiredPrescriptionsCount = 0;
    customers.forEach(c => {
      const latest = c.prescriptions[c.prescriptions.length - 1];
      if (latest && latest.isExpired) expiredPrescriptionsCount++;
    });

    // Find warranties close to expiry or claims made
    let activeWarrantiesCount = 0;
    customers.forEach(c => {
      c.purchases.forEach(p => {
        p.items.forEach(item => {
          if (item.warrantyPolicy && !item.warrantyExpired) {
            activeWarrantiesCount++;
          }
        });
      });
    });

    return {
      totalPatients: total,
      premiumLoyalPatients: goldPlat,
      totalTrackedBilling: `${revenueSum.toLocaleString('fr-FR')} €`,
      criticalPrescriptions: expiredPrescriptionsCount,
      activeWarranties: activeWarrantiesCount
    };
  };

  const currentCrmStats = getCrmStats();

  // Handle client search and combinations of filters
  const getFilteredCustomers = () => {
    return customers.filter(c => {
      // 1. Search filter (First name, Last Name, SSN, email, phone)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        q === '' ||
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.ssn.includes(q) ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q);

      // Only show local boutique clients if not an Admin/overall manager
      const isUserAdmin = isAdminInDirection;
      const userBoutiqueToken = currentUserObj?.allowedBoutiques?.[0];
      if (!isUserAdmin && userBoutiqueToken && c.branch !== userBoutiqueToken) {
        return false;
      }

      // 2. Branch filter
      const matchesBranch = selectedBranchFilter === 'All' || c.branch === selectedBranchFilter;

      // 3. Loyalty level filter
      const matchesLoyalty = selectedLoyaltyFilter === 'All' || c.loyaltyTier === selectedLoyaltyFilter;

      // 4. Prescription status filter
      let matchesPrescription = true;
      if (selectedPrescriptionFilter !== 'All') {
        const latestPres = c.prescriptions[c.prescriptions.length - 1];
        if (selectedPrescriptionFilter === 'Active') {
          matchesPrescription = latestPres && !latestPres.isExpired;
        } else if (selectedPrescriptionFilter === 'Expired') {
          matchesPrescription = !latestPres || latestPres.isExpired;
        }
      }

      // 5. Warranty status filter
      let matchesWarranty = true;
      if (selectedWarrantyFilter !== 'All') {
        const hasActiveWarranty = c.purchases.some(p => p.items.some(i => i.warrantyPolicy && !i.warrantyExpired));
        if (selectedWarrantyFilter === 'WithActive') {
          matchesWarranty = hasActiveWarranty;
        } else if (selectedWarrantyFilter === 'NoneOrExpired') {
          matchesWarranty = !hasActiveWarranty;
        }
      }

      // 6. Registration date range filter (by period)
      if (startDate && c.registrationDate && c.registrationDate < startDate) {
        return false;
      }
      if (endDate && c.registrationDate && c.registrationDate > endDate) {
        return false;
      }

      return matchesSearch && matchesBranch && matchesLoyalty && matchesPrescription && matchesWarranty;
    });
  };

  const filteredCustomersList = getFilteredCustomers();

  // Excel (CSV) Download trigger
  const handleExportExcel = () => {
    const headers = [
      'ID', 'Nom', 'Prenom', 'Date Naissance', 'Fidelite Niveau', 'Points Cumules', 'Agence Creee', 'Email', 'Mobile', 'Num Secu'
    ];
    
    const rows = filteredCustomersList.map(c => [
      c.id,
      c.lastName.toUpperCase(),
      c.firstName,
      c.birthDate,
      c.loyaltyTier,
      c.loyaltyPoints,
      c.branch,
      c.email,
      c.phone,
      `'${c.ssn}` // Single quote prevents Excel from stripping starting spaces or numbers
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // UTF-8 byte order mark for Excel compatibility
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GLAB_CRM_Clients_${selectedBranchFilter.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Le fichier Excel (CSV) a été généré et téléchargé.');
  };

  // Modern stylized patient medical and loyalty card PDF download trigger
  const handleExportPDF = (patient: Customer) => {
    const boutiqueName = localStorage.getItem('optic_boutique_name') || 'Optic Alizé - Dépôt Central';
    const logoImage = localStorage.getItem('optic_app_logo_base64') || localStorage.getItem('optic_app_logo') || defaultLogo;
    const docTitle = `${boutiqueName.replace(/ /g, '_')}_Fiche_Patient_${patient.lastName.toUpperCase()}_${patient.firstName}.html`;
    
    const fileHtmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${boutiqueName} • Fiche Patient - ${patient.firstName} ${patient.lastName.toUpperCase()}</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 40px; margin: 0; line-height: 1.6; }
    .card { background: #121826; border: 1px solid #1e293b; border-radius: 16px; max-width: 800px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); width: 350px; height: 350px; opacity: 0.05; background-image: url('${logoImage}'); background-size: contain; background-repeat: no-repeat; background-position: center; pointer-events: none; z-index: 1; }
    .header { background: linear-gradient(135deg, #0097a7, #00bcd4); padding: 30px; color: white; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header-logo-container { display: flex; align-items: center; gap: 15px; }
    .header-logo { width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.4); object-fit: cover; }
    .header-tag { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 6px; font-size: 11px; text-transform: uppercase; font-family: monospace; }
    .content { padding: 40px; position: relative; z-index: 2; }
    .section-title { font-size: 14px; font-weight: 700; color: #00bcd4; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px dashed #1e293b; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-item { background: #182235; padding: 15px; border-radius: 10px; border: 1px solid #233149; }
    .info-item label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-family: monospace; display: block; margin-bottom: 4px; }
    .info-item value { font-size: 15px; font-weight: 600; color: #e2e8f0; }
    .badge-tier { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #0e1629; margin-top: 2px; }
    .badge-PLATINUM { color: #22d3ee; border: 1px solid rgba(34,211,238,0.2); }
    .badge-GOLD { color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
    .badge-VIP { color: #f472b6; border: 1px solid rgba(244,114,182,0.2); }
    .badge-STANDARD { color: #94a3b8; border: 1px solid rgba(148,163,184,0.2); }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th { text-align: left; background: #161e2e; color: #94a3b8; padding: 12px; font-family: monospace; font-size: 11px; text-transform: uppercase; border: 1px solid #233149; }
    td { padding: 12px; border: 1px solid #233149; color: #cbd5e1; }
    .print-btn { display: block; background: #0097a7; color: white; border: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; margin: 30px auto 0 auto; cursor: pointer; text-align: center; max-width: 200px; text-decoration: none; font-size: 14px; position: relative; z-index: 3; }
    .print-btn:hover { background: #00bcd4; }
    @media print {
      body { background: white; color: black; padding: 0; }
      .card { border: none; box-shadow: none; background: white; color: black; max-width: 100%; }
      .info-item { background: #f8fafc; border: 1px solid #e2e8f0; }
      .info-item value { color: #0f172a; }
      th { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
      td { border: 1px solid #cbd5e1; color: #000; }
      .print-btn { display: none; }
      .section-title { color: #0284c7; border-bottom: 1px dashed #cbd5e1; }
      .watermark { opacity: 0.08 !important; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="watermark"></div>
    <div class="header">
      <div class="header-logo-container">
        <img src="${logoImage}" class="header-logo" alt="Logo" referrerPolicy="no-referrer" />
        <div>
          <h1>${boutiqueName}</h1>
          <div style="font-size: 11px; opacity: 0.8; margin-top: 5px;">OPTIC ALIZE PLATFORM • SYNTHÈSE PATIENT CLINIQUE</div>
        </div>
      </div>
      <div>
        <span class="header-tag">Dossier : ${patient.id}</span>
      </div>
    </div>
    
    <div class="content">
      <div class="section-title">Informations Administratives & Fidélité</div>
      <div class="info-grid">
        <div class="info-item">
          <label>Identité du patient</label>
          <value>${patient.firstName} ${patient.lastName.toUpperCase()}</value>
        </div>
        <div class="info-item">
          <label>Date de Naissance / Adresse</label>
          <value>${new Date(patient.birthDate).toLocaleDateString('fr-FR')} &nbsp;•&nbsp; ${patient.ssn || 'Non communiqué'}</value>
        </div>
        <div class="info-item">
          <label>Niveau de Fidélité CRM</label>
          <value>
            <span class="badge-tier badge-${patient.loyaltyTier}">${patient.loyaltyTier}</span>
            <span style="font-size: 12px; margin-left: 8px; color: #94a3b8;">${patient.loyaltyPoints} points cumulés</span>
          </value>
        </div>
        <div class="info-item">
          <label>Coordonnées et Succursale</label>
          <value>${patient.phone} &nbsp;|&nbsp; ${patient.email}<br/><span style="font-size: 11px; color:#94a3b8;">Agence : ${patient.branch}</span></value>
        </div>
      </div>

      <div class="section-title">Dernières Ordonnances Médicales Enregistrées</div>
      <table>
        <thead>
          <tr>
            <th>Date d'examen</th>
            <th>Praticien Ophtalmologiste</th>
            <th>Correction Œil Droit (OD)</th>
            <th>Correction Œil Gauche (OG)</th>
            <th>Statut Durée</th>
          </tr>
        </thead>
        <tbody>
          ${patient.prescriptions.map(p => `
            <tr>
              <td>${new Date(p.prescriptionDate).toLocaleDateString('fr-FR')}</td>
              <td>${p.ophthalmologist}</td>
              <td>Sph: ${p.odSphere.toFixed(2)} | Cyl: ${p.odCylinder > 0 ? '+' : ''}${p.odCylinder.toFixed(2)} Ax: ${p.odAxis}° Add: ${p.odAddition.toFixed(2)}</td>
              <td>Sph: ${p.ogSphere.toFixed(2)} | Cyl: ${p.ogCylinder > 0 ? '+' : ''}${p.ogCylinder.toFixed(2)} Ax: ${p.ogAxis}° Add: ${p.ogAddition.toFixed(2)}</td>
              <td><span style="font-weight: bold; color: ${p.isExpired ? '#f43f5e' : '#10b981'}">${p.isExpired ? 'EXPIRÉE' : 'ACTIVE'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">Historique Clinique des Équipements Livrés</div>
      <table>
        <thead>
          <tr>
            <th>Date de Vente</th>
            <th>Facture</th>
            <th>Articles commandés</th>
            <th>Montant TTC</th>
            <th>Opticien Traitant</th>
          </tr>
        </thead>
        <tbody>
          ${patient.purchases.map(p => `
            <tr>
              <td>${new Date(p.date).toLocaleDateString('fr-FR')}</td>
              <td><code>${p.invoiceRef}</code></td>
              <td>
                ${p.items.map(i => `
                  <div style="margin-bottom: 5px;">
                    <strong>[${i.category}]</strong> ${i.brand} - ${i.name} (x${i.qty}) 
                    <span style="font-size: 11px; color: #94a3b8;">${i.unitPrice}€</span>
                    ${i.warrantyPolicy ? `<br/><span style="font-size: 10px; color: #22d3ee;">Code Garantie: ${i.warrantyPolicy} (${i.warrantyExpired ? 'Expirée' : 'Couverture Actuelle'})</span>` : ''}
                  </div>
                `).join('')}
              </td>
              <td><strong>${p.amountTtc.toFixed(2)} €</strong><br/><span style="font-size: 10px; color: #10b981;">Tiers payant: ${(p.mutuelleSupport + p.stateSupport).toFixed(2)}€</span></td>
              <td>${p.opticAdvisor}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <button class="print-btn" onclick="window.print()">Imprimer la Fiche Clinique</button>
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
    
    triggerToast(`Génération de la synthèse patient en format vectoriel imprimable (PDF/HTML) exporté.`);
  };

  // Claim a warranty replacement simulation
  const handleClaimWarranty = (customerId: string, saleId: string, itemId: string, policyNumber: string) => {
    // Look up and set the item as claimed / redeemed
    const updatedCustomers = customers.map(c => {
      if (c.id !== customerId) return c;
      const updatedPurchases = c.purchases.map(sale => {
        if (sale.id !== saleId) return sale;
        const updatedItems = sale.items.map(i => {
          if (i.id !== itemId) return i;
          return { ...i, warrantyExpired: true, name: `${i.name} (Verre remplacé sous garantie)` };
        });
        return { ...sale, items: updatedItems };
      });
      return { ...c, purchases: updatedPurchases };
    });

    const updatedCustomer = updatedCustomers.find(c => c.id === customerId);
    if (updatedCustomer) {
      saveCustomer(updatedCustomer).then(() => {
        setCustomers(updatedCustomers);
        setSelectedCustomer(updatedCustomer);
        triggerToast(`Garantie activée ! Remplacement de verre ou monture sous contrat ${policyNumber} validé avec succès IP-Lab.`, 'success');
      }).catch(err => {
        console.error("Failed to save warranty claim:", err);
        triggerToast("Erreur lors de l'enregistrement de la garantie", "info");
      });
    }
  };

  // Award loyalty points bonus conversion
  const handleAwardReward = (patient: Customer, bonus: LoyaltyBonus) => {
    if (patient.loyaltyPoints < bonus.pointsNeeded) {
      triggerToast(`Points insuffisants. Ce patient possède ${patient.loyaltyPoints} points, mais cette récompense exige ${bonus.pointsNeeded} points.`, 'info');
      return;
    }

    const updatedCustomer = { ...patient, loyaltyPoints: patient.loyaltyPoints - bonus.pointsNeeded };
    saveCustomer(updatedCustomer).then(() => {
      const updatedCustomers = customers.map(c => c.id === patient.id ? updatedCustomer : c);
      setCustomers(updatedCustomers);
      setSelectedCustomer(updatedCustomer);
      triggerToast(`Récompense "${bonus.rewardValue}" appliquée au dossier patient !`, 'success');
    }).catch(err => {
      console.error("Failed to deduct points reward:", err);
      triggerToast("Erreur lors de la déduction des points", "info");
    });
  };

  // Add Points helper
  const handleAddPoints = (patient: Customer, pointsAmount: number) => {
    const newPoints = patient.loyaltyPoints + pointsAmount;
    // Recalculates loyalty levels based on G-LAB brackets
    let newTier = patient.loyaltyTier;
    if (newPoints >= 1000) newTier = 'VIP';
    else if (newPoints >= 450) newTier = 'PLATINUM';
    else if (newPoints >= 200) newTier = 'GOLD';

    const updatedCustomer = { ...patient, loyaltyPoints: newPoints, loyaltyTier: newTier };
    saveCustomer(updatedCustomer).then(() => {
      const updatedCustomers = customers.map(c => c.id === patient.id ? updatedCustomer : c);
      setCustomers(updatedCustomers);
      setSelectedCustomer(updatedCustomer);
      triggerToast(`${pointsAmount} points de fidélité crédités ! Niveau calculé : ${updatedCustomer.loyaltyTier}`);
    }).catch(err => {
      console.error("Failed to add points:", err);
      triggerToast("Erreur lors de l'attribution des points", "info");
    });
  };

  // Register a new customer
  const handleRegisterClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName || !newPhone) {
      triggerToast('Erreur : Saisir au moins le prénom, nom et numéro de téléphone.', 'info');
      return;
    }

    if (!newBirthDate || newBirthDate.length !== 8) {
      triggerToast('Erreur : Veuillez saisir une date de naissance valide à 8 chiffres (JJMMAAAA).', 'info');
      return;
    }

    const day = newBirthDate.slice(0, 2);
    const month = newBirthDate.slice(2, 4);
    const year = newBirthDate.slice(4, 8);
    const parsedBirthDate = `${year}-${month}-${day}`;

    // Calculate sequential identification matricule
    let nextNum = 1;
    customers.forEach(c => {
      if (c.id.startsWith('OA-CL-')) {
        const parts = c.id.split('-');
        const numPart = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(numPart) && numPart >= nextNum) {
          nextNum = numPart + 1;
        }
      }
    });
    const nextId = `OA-CL-${String(nextNum).padStart(3, '0')}`;

    const brandNewCust: Customer = {
      id: nextId,
      firstName: newFirstName,
      lastName: newLastName,
      birthDate: parsedBirthDate,
      email: newEmail || 'aucun-email@opticalize.com',
      phone: newPhone,
      ssn: newSsn || 'Non spécifiée',
      registrationDate: new Date().toISOString().slice(0, 10),
      loyaltyTier: newLoyaltyTier,
      loyaltyPoints: newLoyaltyTier === 'VIP' ? 1000 : newLoyaltyTier === 'PLATINUM' ? 450 : newLoyaltyTier === 'GOLD' ? 200 : 0,
      branch: newBranch,
      prescriptions: [
        {
          id: `pres-new-${Math.floor(100 + Math.random() * 900)}`,
          ophthalmologist: 'Dr. Interne Réfracteur',
          odSphere: 0.00,
          odCylinder: 0.00,
          odAxis: 0,
          odAddition: 0.00,
          ogSphere: 0.00,
          ogCylinder: 0.00,
          ogAxis: 0,
          ogAddition: 0.00,
          prescriptionDate: new Date().toISOString().slice(0, 10),
          isExpired: false,
          insuranceValidated: false
        }
      ],
      purchases: [],
      payments: []
    };

    saveCustomer(brandNewCust).then(() => {
      const nextCustomers = [...customers, brandNewCust];
      setCustomers(nextCustomers);
      setSelectedCustomer(brandNewCust);
      setIsRegisteringOpen(false);
      setActiveSubTab('detail');
      
      // Reset form fields
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewPhone('');
      setNewBirthDate('');
      setNewSsn('');
      setNewLoyaltyTier('STANDARD');

      triggerToast(`Dossier patient #${brandNewCust.id} initialisé et affecté au magasin ${newBranch}.`, 'success');
    }).catch(err => {
      console.error("Failed to register customer:", err);
      triggerToast("Erreur lors de la création du client", "info");
    });
  };

  return (
    <div className="w-full flex flex-col gap-6" id="g-lab-crm-core">
      
      {/* Dynamic Feedback Banner */}
      <AnimatePresence>
        {crmToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-2.5 ${
              crmToast.type === 'success' 
                ? 'bg-[#101b2a] border-[#0097a7]/40 text-[#00bcd4]' 
                : 'bg-slate-900 border-amber-500/30 text-amber-500'
            }`}
          >
            <Check className="w-4 h-4" />
            <span className="text-xs font-semibold">{crmToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CRM Navigation Menu bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Module title & Navigation pills */}
        <div className="flex items-center gap-5">
          <div className="p-2 bg-[#0097A7]/10 text-[#0097a7] rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-slate-800 uppercase tracking-wider block">
              {currentLanguage === 'FR' ? "Client & Fidélisation" : "Client & Loyalty Management"}
            </h3>
            <p className="text-[10px] font-mono text-slate-500">
              {currentLanguage === 'FR' 
                ? "Dossiers patients cliniques, prescriptions, encaissements mutuelles & fidélité" 
                : "Clinical patient records, prescription tracking, health insurance claims & reward points"}
            </p>
          </div>
        </div>

        {/* View Selection & Action Controls */}
        <div className="flex flex-wrap items-center gap-4 text-xs w-full md:w-auto justify-end">
          {/* Onglets (Tabs) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setActiveSubTab('list')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'list' 
                  ? 'bg-[#0097A7] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Registre
            </button>
          </div>

          {/* Boutons d'Action */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsRegisteringOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition inline-flex items-center gap-1.5 hover:scale-[1.02] shadow-sm cursor-pointer border-0 text-[10px] font-mono uppercase tracking-wide"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Ajouter un client
            </button>
          </div>
        </div>

      </div>

      {/* 4 KPI Cards Grid inside the CRM Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="crm-summary-grids">
        
        {/* KPI 1 : Patients total */}
        <div className="bg-white p-4 rounded-xl border border-slate-105 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">Patients Référencés</span>
            <div className="text-lg font-bold font-display text-slate-805">{currentCrmStats.totalPatients} dossiers</div>
          </div>
        </div>

        {/* KPI 2 : Gold, Platine & VIP loyal */}
        <div className="bg-white p-4 rounded-xl border border-slate-105 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Award className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">Membres Privilégiés (CRM)</span>
            <div className="text-lg font-bold font-display text-amber-600">{currentCrmStats.premiumLoyalPatients} comptes</div>
          </div>
        </div>

        {/* KPI 3 : Ordonnances expirées ou near expiry */}
        <div className="bg-white p-4 rounded-xl border border-slate-105 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">Ordonnances Expirées</span>
            <div className="text-lg font-bold font-display text-rose-600">{currentCrmStats.criticalPrescriptions} alertes</div>
          </div>
        </div>

        {/* KPI 4 : Active warranties */}
        <div className="bg-white p-4 rounded-xl border border-slate-105 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">Garanties Optiques Actives</span>
            <div className="text-lg font-bold font-display text-cyan-600">{currentCrmStats.activeWarranties} polices</div>
          </div>
        </div>

      </div>

      {/* Content panes based on Sub Tab */}

      {/* 1. OVERVIEW GRAPHICS SUB TAB */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="crm-overview-pills">
          
          {/* Left panel: loyalty rules explaining */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097a7] mb-3">Statuts Match & Barèmes G-LAB</h4>
              
              <div className="space-y-3 font-sans text-xs">
                {Object.entries(LOYALTY_TIER_BENEFITS).map(([tier, data]) => (
                  <div key={tier} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`px-2 py-0.5 rounded font-bold font-mono text-[9px] ${data.color}`}>{tier}</span>
                      <span className="font-bold text-slate-800">{data.discount} Remise</span>
                    </div>
                    <p className="text-[11px] text-slate-605 mt-1">Multiplicateur de points : <span className="text-[#0097a7] font-bold">x{data.multiplier}</span></p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Assistance : {data.priorityService} • Réparation de montures : {data.repair}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-500">
              Chaque euro dépensé en monture ou verre engendre 1 point brut (multiplié selon le grade fidélité du patient).
            </div>
          </div>

          {/* Center details list: available convert bonuses */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097a7] mb-4">Programme de Conversion Crédits</h4>
            
            <div className="space-y-3">
              {LOYALTY_BONUSES.map((bonus, idx) => (
                <div key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-xs text-slate-800">{bonus.rewardValue}</h5>
                    <p className="text-[10px] text-slate-600 leading-relaxed">{bonus.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="p-1 px-2.5 bg-cyan-50 text-[#0097a7] font-mono text-[10px] font-bold rounded border border-cyan-100">
                      {bonus.pointsNeeded} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right graphics dashboard detail */}
          <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097a7] mb-3">Répartition par Agence</h5>
              
              <div className="space-y-4 font-sans text-xs text-slate-750">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Paris Nation</span>
                    <span className="text-[#0097a7] font-bold">50%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0097A7] h-full" style={{ width: '50%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Lyon Bellecour</span>
                    <span className="text-cyan-600 font-bold">25%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Marseille Vieux-Port</span>
                    <span className="text-slate-500">25%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-650">
                    <span>Dépôt Moyen Patient :</span>
                    <span className="font-bold text-slate-800">470 €</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-650">
                    <span>Taux de ré-achat 3 ans :</span>
                    <span className="font-bold text-emerald-600">68.2%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono italic mt-4">
              G-LAB CRM sync validée avec la base locale PostgreSQL.
            </div>
          </div>

        </div>
      )}

      {/* 2. CUSTOMER REGISTER TABLE SUB TAB */}
      {activeSubTab === 'list' && (
        <div className="space-y-4" id="registre-patients-view">
          
          {/* Action and Filter controller box */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-8 gap-3 text-left">
            
            {/* Search box (Col span 2) */}
            <div className="xl:col-span-2 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input 
                type="text"
                placeholder="Chercher nom, e-mail, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 pl-9 rounded-lg text-slate-800 focus:outline-[#0097A7] focus:ring-1 focus:ring-[#0097A7]"
              />
            </div>

            {/* Filter 1: Branch */}
            <div>
              <select 
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                disabled={!!fixedBoutique}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-700 focus:outline-[#0097A7] focus:ring-1 focus:ring-[#0097A7] cursor-pointer disabled:opacity-80 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {fixedBoutique ? (
                  <option value={fixedBoutique}>{fixedBoutique}</option>
                ) : (
                  <>
                    <option value="All">Toutes les succursales</option>
                    <option value="Paris Nation">Paris Nation</option>
                    <option value="Lyon Bellecour">Lyon Bellecour</option>
                    <option value="Marseille Vieux-Port">Marseille Vieux-Port</option>
                    <option value="Bordeaux Centre">Bordeaux Centre</option>
                  </>
                )}
              </select>
            </div>

            {/* Filter 2: Loyalty Tier */}
            <div>
              <select 
                value={selectedLoyaltyFilter}
                onChange={(e) => setSelectedLoyaltyFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-700 focus:outline-[#0097A7] focus:ring-1 focus:ring-[#0097A7] cursor-pointer"
              >
                <option value="All">Tous les statuts CRM</option>
                <option value="STANDARD">STANDARD</option>
                <option value="GOLD">GOLD</option>
                <option value="PLATINUM">PLATINUM</option>
                <option value="VIP">VIP</option>
              </select>
            </div>

            {/* Period Filter: Start Date */}
            <div className="relative flex items-center">
              <span className="text-[10px] font-bold text-slate-400 mr-1.5 font-sans whitespace-nowrap">Du</span>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Date de début d'inscription"
                className="w-full bg-slate-50 border border-slate-200 text-xs px-2 py-1.5 rounded-lg text-slate-700 focus:outline-[#0097A7] font-mono"
              />
            </div>

            {/* Period Filter: End Date */}
            <div className="relative flex items-center">
              <span className="text-[10px] font-bold text-slate-400 mr-1.5 font-sans whitespace-nowrap">Au</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Date de fin d'inscription"
                className="w-full bg-slate-50 border border-slate-200 text-xs px-2 py-1.5 rounded-lg text-slate-700 focus:outline-[#0097A7] font-mono"
              />
            </div>

            {/* Filter 3: Prescription Expiry */}
            <div>
              <select 
                value={selectedPrescriptionFilter}
                onChange={(e) => setSelectedPrescriptionFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-700 focus:outline-[#0097A7] focus:ring-1 focus:ring-[#0097A7] cursor-pointer"
              >
                <option value="All">Ordonnances</option>
                <option value="Active">Active uniquement</option>
                <option value="Expired">Expirée</option>
              </select>
            </div>

            {/* Export buttons in CRM header */}
            <div className="flex gap-1">
              <button
                onClick={handleExportExcel}
                title="Exporter au format Excel (.csv)"
                className="p-2 flex-1 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-[11px] font-bold rounded-lg text-emerald-800 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>

              <button
                onClick={handlePrintPdf}
                title="Générer rapport PDF / Imprimer"
                className="p-2 flex-1 bg-[#0097A7]/10 border border-[#0097A7]/25 hover:bg-[#0097A7]/20 text-[11px] font-bold rounded-lg text-[#00838F] transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF/Imp</span>
              </button>
            </div>

          </div>

          {/* Patient list table representation */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="p-4 text-slate-600 font-semibold font-mono text-[10px] uppercase">Patient</th>
                    <th className="p-4 text-slate-600 font-semibold font-mono text-[10px] uppercase">Date de Naissance</th>
                    <th className="p-4 text-slate-600 font-semibold font-mono text-[10px] uppercase">Réseau / Agence</th>
                    <th className="p-4 text-slate-600 font-semibold font-mono text-[10px] uppercase">Fidélité CRM</th>
                    <th className="p-4 text-slate-600 font-semibold font-mono text-[10px] uppercase">Ordonnance active</th>
                    <th className="p-4 text-slate-600 font-semibold font-mono text-[10px] uppercase">Garantie active</th>
                    <th className="p-4 text-right text-slate-600 font-semibold font-mono text-[10px] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomersList.length > 0 ? (
                    filteredCustomersList.map((c) => {
                      const latestPrescription = c.prescriptions[c.prescriptions.length - 1];
                      const hasActivePres = latestPrescription && !latestPrescription.isExpired;
                      const hasActiveWarranty = c.purchases.some(p => p.items.some(i => i.warrantyPolicy && !i.warrantyExpired));

                      return (
                        <tr 
                          key={c.id}
                          className="hover:bg-slate-50 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setActiveSubTab('detail');
                          }}
                        >
                          <td className="p-4 flex items-center gap-2">

                            <div className="w-8 h-8 rounded-full bg-[#0097A7]/10 text-[#0097a7] flex items-center justify-center font-bold font-sans text-xs uppercase shrink-0">
                              {c.firstName[0]}{c.lastName[0]}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 block group-hover:text-[#0097a7] transition-colors">
                                {c.firstName} {c.lastName.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">ID: {c.id} • {c.phone}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-700 font-mono">
                            {new Date(c.birthDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-4 text-slate-700">
                            {c.branch}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded font-bold font-mono text-[9px] ${LOYALTY_TIER_BENEFITS[c.loyaltyTier].color}`}>
                                {c.loyaltyTier}
                              </span>
                              <span className="text-slate-600 font-mono text-[10px]">{c.loyaltyPoints} pts</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded ${
                              hasActivePres ? 'bg-emerald-550/15 text-emerald-700 font-semibold' : 'bg-rose-550/15 text-rose-700 font-semibold'
                            }`}>
                              {hasActivePres ? 'Active' : 'Expirée'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded ${
                              hasActiveWarranty ? 'bg-cyan-50 text-[#0097a7] border border-cyan-150' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {hasActiveWarranty ? 'Couvert' : 'Sans'}
                            </span>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setActiveSubTab('detail');
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg transition border-0 bg-transparent"
                                title="Ouvrir la fiche patient complète"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExportPDF(c)}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#0097a7] rounded-lg transition border-0 bg-transparent"
                                title="Télécharger la fiche clinique ou carte d'adaptation au format PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <AlertTriangle className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                        Aucun patient ne correspond à vos filtres et critères de recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 3. PATIENT DEEPMATCH DETAILED TAB */}
      {activeSubTab === 'detail' && selectedCustomer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="patient-details-sheet">
          
          {/* Left panel: Patient admin details & Loyalty card [4 cols] */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Admin identity & contact information */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0097A7]/10 text-[#0097a7] rounded-2xl flex items-center justify-center font-bold text-lg font-sans">
                    {selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}
                  </div>
                  <div>
                    <h4 className="text-base font-bold font-display text-slate-800">
                      {selectedCustomer.firstName} {selectedCustomer.lastName.toUpperCase()}
                    </h4>
                    <p className="text-[10px] font-mono text-[#0097a7]">{selectedCustomer.id} • Magasin : {selectedCustomer.branch}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleExportPDF(selectedCustomer)}
                  title="Générer et télécharger la fiche patient au format PDF imprimable"
                  className="bg-slate-50 p-2 border border-slate-200 hover:border-slate-300 text-[#0097a7] rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Administrative specific data sheet */}
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs font-sans">
                
                <div className="flex justify-between">
                  <span className="text-slate-500">Date de Naissance</span>
                  <span className="text-slate-800 font-mono font-semibold">{new Date(selectedCustomer.birthDate).toLocaleDateString('fr-FR')}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Adresse</span>
                  <span className="text-slate-800 font-semibold">{selectedCustomer.ssn}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">E-mail</span>
                  <span className="text-slate-800 font-semibold">{selectedCustomer.email}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Numéro Mobile</span>
                  <span className="text-slate-800 font-mono font-semibold">{selectedCustomer.phone}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Date d'Inscription</span>
                  <span className="text-slate-800 font-mono font-semibold">{new Date(selectedCustomer.registrationDate).toLocaleDateString('fr-FR')}</span>
                </div>

              </div>

            </div>

            {/* Interactive Loyalty points points card block */}
            <div className="bg-gradient-to-br from-indigo-50 to-cyan-50/20 p-5 rounded-2xl border border-slate-100 relative overflow-hidden shadow-sm">
              
              {/* Decorative radial blur corner background */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#0097a7]/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-indigo-700 font-mono uppercase tracking-wider block font-semibold">Solde Fidélisation</span>
                  <h4 className="text-2xl font-bold text-slate-850 font-mono mt-0.5">{selectedCustomer.loyaltyPoints} <span className="text-xs text-slate-500 font-sans font-normal">points</span></h4>
                </div>
                
                <span className={`px-2.5 py-1 rounded font-bold font-mono text-xs uppercase ${LOYALTY_TIER_BENEFITS[selectedCustomer.loyaltyTier].color}`}>
                  {selectedCustomer.loyaltyTier}
                </span>
              </div>

              {/* Reward list and simulator claims */}
              <div className="space-y-2.5">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-semibold">Récompenses Disponibles</p>
                <div className="space-y-1.5">
                  {LOYALTY_BONUSES.map((bonus, i) => {
                    const isEligible = selectedCustomer.loyaltyPoints >= bonus.pointsNeeded;
                    return (
                      <button
                        key={i}
                        disabled={!isEligible}
                        onClick={() => handleAwardReward(selectedCustomer, bonus)}
                        className={`w-full text-left p-2.5 rounded-lg border flex justify-between items-center transition border-slate-100 ${
                          isEligible 
                            ? 'bg-emerald-50 border-emerald-250 hover:border-emerald-500 cursor-pointer text-slate-800' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div>
                          <p className={`font-semibold text-[11px] font-sans leading-tight ${isEligible ? 'text-slate-800' : 'text-slate-400'}`}>{bonus.rewardValue}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{bonus.pointsNeeded} points requis</p>
                        </div>
                        <span className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${isEligible ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-205 border border-slate-300'}`}>
                          {isEligible ? 'Réclamer' : 'Bloqué'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick points points simulation adder */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <span className="text-[10px] text-indigo-700 font-mono uppercase font-semibold">Simuler Achat :</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAddPoints(selectedCustomer, 50)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-250 text-[10px] px-2 py-1 rounded font-semibold transition cursor-pointer"
                  >
                    +50 pts
                  </button>
                  <button
                    onClick={() => handleAddPoints(selectedCustomer, 150)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-250 text-[10px] px-2 py-1 rounded font-semibold transition cursor-pointer"
                  >
                    +150 pts (Lunettes)
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Right panel: Medical prescriptions, items history with warranties and payments schedules [8 cols] */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Clinical Prescriptions (Ordonnances) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097a7] flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-[#0097a7]" />
                  Ordonnances Médicales d'Ophtalmologie
                </h5>
                <span className="text-[10px] text-slate-500 font-mono">Dernier examen : {selectedCustomer.prescriptions[selectedCustomer.prescriptions.length-1]?.prescriptionDate}</span>
              </div>

              <div className="space-y-4">
                {selectedCustomer.prescriptions.slice().reverse().map((pres, idx) => (
                  <div key={pres.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 relative">
                    
                    {/* Expiry badge overlay */}
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-xs text-slate-800 block">{pres.ophthalmologist}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Réf Ordonnance: {pres.id} &nbsp;•&nbsp; Date d'examen : {new Date(pres.prescriptionDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        pres.isExpired 
                          ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {pres.isExpired ? 'DURÉE EXPIRÉE (REOUVRIR TEST)' : 'VALIDE POUR TIERS-PAYANT'}
                      </span>
                    </div>

                    {/* Standard French Optical Grid representing sphere, cylinder, axis, addition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      
                      {/* Left: Oeil Droit */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 font-mono text-xs">
                        <span className="text-[#0097a7] font-bold text-[9px] block uppercase tracking-wide mb-1.5 border-b border-slate-100 pb-1">ŒIL DROIT (OD)</span>
                        <div className="grid grid-cols-4 gap-1 text-center font-semibold text-slate-800">
                          <div>
                            <span className="text-[8px] text-slate-405 block uppercase font-sans">Sph</span>
                            <span>{pres.odSphere > 0 ? '+' : ''}{pres.odSphere.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-405 block uppercase font-sans">Cyl</span>
                            <span>{pres.odCylinder > 0 ? '+' : ''}{pres.odCylinder.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-405 block uppercase font-sans">Axe</span>
                            <span>{pres.odAxis}°</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-405 block uppercase font-sans">Add</span>
                            <span>{pres.odAddition > 0 ? pres.odAddition.toFixed(2) : '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Oeil Gauche */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 font-mono text-xs">
                        <span className="text-[#0097a7] font-bold text-[9px] block uppercase tracking-wide mb-1.5 border-b border-slate-100 pb-1">ŒIL GAUCHE (OG)</span>
                        <div className="grid grid-cols-4 gap-1 text-center font-semibold text-slate-800">
                          <div>
                            <span className="text-[8px] text-slate-405 block uppercase font-sans">Sph</span>
                            <span>{pres.ogSphere > 0 ? '+' : ''}{pres.ogSphere.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-405 block uppercase font-sans">Cyl</span>
                            <span>{pres.ogCylinder > 0 ? '+' : ''}{pres.ogCylinder.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-405 block uppercase font-sans">Axe</span>
                            <span>{pres.ogAxis}°</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-405 block uppercase font-sans">Add</span>
                            <span>{pres.ogAddition > 0 ? pres.ogAddition.toFixed(2) : '-'}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                ))}
              </div>

            </div>

            {/* 2. Purchase History & Active Warranties List (Historique d'Achats & Garanties) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              
              <h5 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097a7] mb-4">
                Historique d'Achats & Contrats de Garanties
              </h5>

              <div className="space-y-4">
                {selectedCustomer.purchases.length > 0 ? (
                  selectedCustomer.purchases.slice().reverse().map((purchase) => (
                    <div key={purchase.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                      
                      {/* Purchase details meta */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <code className="bg-white text-[#0097a7] px-2 py-0.5 rounded border border-slate-200 text-[10px] font-mono">{purchase.invoiceRef}</code>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(purchase.date).toLocaleDateString('fr-FR')} &nbsp;•&nbsp; {purchase.branch}</span>
                        </div>
                        <div className="text-right text-xs">
                          <span className="text-slate-500 text-[10px]">Opticien : {purchase.opticAdvisor}</span>
                        </div>
                      </div>

                      {/* Items loop */}
                      <div className="space-y-3 text-xs font-sans">
                        {purchase.items.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-100/60 hover:border-slate-200 transition">
                            
                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-600 font-mono uppercase font-bold tracking-wider px-1.5 py-0.2 select-none bg-slate-100 rounded">
                                {item.category}
                              </span>
                              <h6 className="font-semibold text-slate-800 mt-0.5">{item.brand} — {item.name}</h6>
                              {item.eyeSide !== 'NONE' && (
                                <span className="text-[10px] text-slate-500 font-mono block">Œil concerné : {item.eyeSide}</span>
                              )}
                            </div>

                            <div className="flex sm:flex-col justify-between items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-201">
                              <span className="font-bold text-slate-800 font-mono text-sm">{item.unitPrice.toFixed(2)} €</span>
                              
                              {/* Warranty action claims status */}
                              {item.warrantyPolicy ? (
                                <div className="flex items-center gap-2 text-[10px] font-mono">
                                  <span className={`px-1.5 py-0.5 rounded ${item.warrantyExpired ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-cyan-50 text-[#0097a7] border border-cyan-150'}`}>
                                    {item.warrantyExpired ? 'Garantie Expirée/Rachetée' : `Garantie valide ${item.warrantyCoverageYears} ans`}
                                  </span>
                                  {!item.warrantyExpired && (
                                    <button
                                      onClick={() => handleClaimWarranty(selectedCustomer.id, purchase.id, item.id, item.warrantyPolicy!)}
                                      className="bg-[#0097a7] hover:bg-[#00bcd4] text-white leading-none font-sans font-bold text-[9px] px-2 py-1 rounded transition cursor-pointer border-0"
                                    >
                                      Activer Remplacement
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400">Hors contrat</span>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>

                      {/* Financial support analysis */}
                      <div className="pt-2 border-t border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-500 font-sans">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-[#0097A7] block"></span>
                          <span>Tiers payant d'Assurance Maladie : {purchase.stateSupport.toFixed(2)} €</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded bg-indigo-500 block"></span>
                          <span>Complémentaire Mutuelle : {purchase.mutuelleSupport.toFixed(2)} €</span>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          <span className="text-slate-800">Montant Net TTC : </span>
                          <span className="text-[#0097a7] font-bold text-sm font-mono">{purchase.amountTtc.toFixed(2)} €</span>
                        </div>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    Aucun historique de vente n'est enregistré pour ce dossier patient.
                  </div>
                )}
              </div>

            </div>

            {/* 3. Payment history & Instalments Log (Historique des paiements) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              
              <h5 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097a7] mb-4">
                Registre historique des paiements & encaissements
              </h5>

              <div className="space-y-2 font-mono text-xs">
                {selectedCustomer.payments.length > 0 ? (
                  selectedCustomer.payments.map((pay) => (
                    <div 
                      key={pay.id} 
                      className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between gap-4 font-mono text-[11px]"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-slate-800 font-semibold block">{pay.method} {pay.installmentIndex ? `(Échéance ${pay.installmentIndex})` : ''}</span>
                          <span className="text-[10px] text-slate-500">Réf: {pay.reference} &nbsp;•&nbsp; Date: {new Date(pay.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-emerald-600 font-bold block text-xs">+{pay.amount.toFixed(2)} €</span>
                        <span className={`text-[8px] font-semibold px-1.5 py-0.2 rounded ${
                          pay.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {pay.status === 'SUCCESS' ? 'RÉGLÉ' : 'EN ATTENTE'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    Aucune transaction financière n'est tracée sur ce client.
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* NEW CLIENT REGISTRATION BOTTOM MODAL PORTAL */}
      <AnimatePresence>
        {isRegisteringOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              
              {/* Modal header details */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-850/80 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-display font-semibold text-white uppercase tracking-wider">Créer une fiche client OPTIC ALIZÉ</h4>
                </div>
                <button
                  onClick={() => setIsRegisteringOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              {/* Form panel fields config */}
              <form onSubmit={handleRegisterClient} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">Prénom *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Jean"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">Nom de famille *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Dupont"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">Date de Naissance * (8 chiffres)</label>
                    <input 
                      type="text"
                      maxLength={8}
                      required
                      placeholder="JJMMAAAA (ex: 15061985)"
                      value={newBirthDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          setNewBirthDate(val);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">Numéro de mobile *</label>
                    <input 
                      type="text"
                      required
                      placeholder="+22x xx xx xx xx"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">Adresse (Domicile) *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 12 Rue de la Paix, Dakar"
                      value={newSsn}
                      onChange={(e) => setNewSsn(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">Email</label>
                    <input 
                      type="email"
                      placeholder=" Dupont.jean@domain.fr"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">Agence de Rattachement</label>
                    {fixedBoutique ? (
                      <div className="w-full bg-slate-950 border border-dashed border-slate-800 text-xs px-3 py-2.5 rounded-lg text-emerald-300 font-mono font-black">
                        {fixedBoutique} (Fixée d'Office)
                      </div>
                    ) : (
                      <select 
                        value={newBranch}
                        onChange={(e) => setNewBranch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="Paris Nation">Paris Nation</option>
                        <option value="Lyon Bellecour">Lyon Bellecour</option>
                        <option value="Marseille Vieux-Port">Marseille Vieux-Port</option>
                        <option value="Bordeaux Centre">Bordeaux Centre</option>
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">Niveau CRM Initial</label>
                    <select 
                      value={newLoyaltyTier}
                      onChange={(e) => setNewLoyaltyTier(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="STANDARD">STANDARD (Points: 0)</option>
                      <option value="GOLD">GOLD (Points d'entrée : 200)</option>
                      <option value="PLATINUM">PLATINUM (Points d'entrée: 450)</option>
                      <option value="VIP">VIP (Points d'entrée: 1000)</option>
                    </select>
                  </div>
                </div>

                {/* Submit controls */}
                <div className="pt-4 border-t border-slate-850 flex justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsRegisteringOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-405 hover:text-white transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Confirmer & Enregistrer Clinique
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. COMMUNICATION OVERLAY DIALOG */}
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
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0097A7] font-sans"
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
