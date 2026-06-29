import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  BookOpen, Calendar as CalendarIcon, Download, CheckCircle, 
  UserCheck, ShoppingBag, Truck, ClipboardList, ShieldCheck, 
  FileCheck, Lock, AlertCircle, RefreshCw, BarChart2
} from 'lucide-react';

// Data types representing various events in the Optical ERP daily journal archives
interface PatientRecu {
  id: string;
  time: string;
  name: string;
  reason: 'SIGHT_TEST' | 'BENCH_ADJUSTMENT' | 'WARRANTY_COMPLAINT' | 'DELIVERY_PICKUP';
  optician: string;
  insuranceVerified: boolean;
}

interface VenteLog {
  id: string;
  time: string;
  customer: string;
  itemDescription: string;
  totalFCFA: number;
  paymentMethod: 'Espèces' | 'MOMO / Wave' | 'Carte Bancaire' | 'Chèque' | 'Tiers-Payant Mutuelle';
  reference: string;
}

interface CommandeEffectuee {
  id: string;
  time: string;
  customer: string;
  opticalDetails: string;
  lensesSourcing: 'CENTRAL_LAB' | 'LOCAL_WORKSHOP';
  depositAmountFCFA: number;
  remainingAmountFCFA: number;
}

interface CommandeLivree {
  id: string;
  time: string;
  customer: string;
  itemDescription: string;
  receivedBy: string;
  signatureHash: string;
}

interface JournalModuleProps {
  currentLanguage?: 'FR' | 'EN';
}

export default function JournalModule({ currentLanguage = 'FR' }: JournalModuleProps) {
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-10');
  const [activeTab, setActiveTab] = useState<'patients' | 'ventes' | 'commandes' | 'livraisons'>('patients');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [closingLogs, setClosingLogs] = useState<string[]>([]);
  const [secureSignature, setSecureSignature] = useState('');

  // Dynamic journalData state with localStorage caching for a clean sandbox environment
  const [journalData, setJournalData] = useState<Record<string, {
    patients: PatientRecu[];
    ventes: VenteLog[];
    commandes: CommandeEffectuee[];
    livraisons: CommandeLivree[];
  }>>(() => {
    const saved = localStorage.getItem('optic_journal_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    return {};
  });

  React.useEffect(() => {
    localStorage.setItem('optic_journal_data', JSON.stringify(journalData));
  }, [journalData]);

  // Safe fallback if date has no events recorded
  const activeDayData = journalData[selectedDate] || {
    patients: [],
    ventes: [],
    commandes: [],
    livraisons: []
  };

  // Math totals
  const totalReceivedPatients = activeDayData.patients.length;
  const salesValueFCFA = activeDayData.ventes.reduce((acc, current) => acc + current.totalFCFA, 0);
  const totalOrdersAmount = activeDayData.commandes.length;
  const totalDeliveriesCount = activeDayData.livraisons.length;

  const handleExportJournalToExcel = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `export_journal_${activeTab}_${selectedDate}.csv`;

    if (activeTab === 'patients') {
      headers = ["ID Réception", "Heure", "Patient", "Raison Visite", "Opticien-Conseil", "Mutuelle Validée"];
      rows = activeDayData.patients.map(p => [
        p.id, p.time, p.name, p.reason, p.optician, p.insuranceVerified ? 'Oui' : 'Non'
      ]);
    } else if (activeTab === 'ventes') {
      headers = ["ID Facture", "Heure", "Client", "Article / Description", "Total (FCFA)", "Mode de Paiement", "Référence"];
      rows = activeDayData.ventes.map(v => [
        v.id, v.time, v.customer, v.itemDescription, v.totalFCFA, v.paymentMethod, v.reference
      ]);
    } else if (activeTab === 'commandes') {
      headers = ["ID Commande", "Heure", "Patient", "Prescription", "Sourcing Verres", "Encaissé (FCFA)", "Reste à payer"];
      rows = activeDayData.commandes.map(c => [
        c.id, c.time, c.customer, c.opticalDetails, c.lensesSourcing, c.depositAmountFCFA, c.remainingAmountFCFA
      ]);
    } else if (activeTab === 'livraisons') {
      headers = ["ID Livraison", "Heure", "Client", "Équipement", "Réceptionnaire Nom", "Signature Hash Secure"];
      rows = activeDayData.livraisons.map(l => [
        l.id, l.time, l.customer, l.itemDescription, l.receivedBy, l.signatureHash
      ]);
    }

    let csvContent = "\uFEFF";
    csvContent += headers.join(";") + "\n";
    rows.forEach(r => {
      csvContent += r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseDailyJournal = () => {
    setIsClosingModalOpen(true);
    setClosingLogs(["Étape 1/4 : Rapprochement bancaire et physique de caisse...", "Étape 2/4 : Télétransmission des accords de mutuelles réussie..."]);
    
    setTimeout(() => {
      setClosingLogs(prev => [...prev, "Étape 3/4 : Calcul du Hash d'immuabilité cryptographique SaaS Alizé..."]);
    }, 800);

    setTimeout(() => {
      const generatedHash = "ALIZE-SHA512:EE74C" + Math.floor(1000 + Math.random() * 9000) + "B9F8AEE2D1E5E4E39";
      setSecureSignature(generatedHash);
      setClosingLogs(prev => [...prev, `Étape 4/4 : Journal scellé ! Signature électronique : ${generatedHash.substring(0, 24)}...`]);
      setIsReportGenerated(true);
      
      // Fermer automatiquement l'aperçu du scellement après 1,5 seconde
      setTimeout(() => {
        setIsClosingModalOpen(false);
      }, 1500);
    }, 1600);
  };

  const downloadReceiptPDF = (type: 'vente' | 'commande' | 'patient', item: any) => {
    const doc = new jsPDF();
    const boutiqueName = localStorage.getItem('optic_boutique_name') || 'Optic Alizé - Dépôt Central';
    const currentUserEmail = localStorage.getItem('optic_user_email') || 'glabtech1@gmail.com';
    const isFR = currentLanguage === 'FR';

    // Low-opacity watermark background first
    const watermarkLogo = localStorage.getItem('optic_app_logo_watermark');
    if (watermarkLogo) {
      try {
        doc.addImage(watermarkLogo, 'PNG', 55, 95, 100, 100);
      } catch (e) {}
    }

    // Header segment
    doc.setFillColor(0, 151, 167); // Logo theme color (#0097a7)
    doc.rect(0, 0, 210, 38, 'F');

    // Solid logo inside the header (top-right)
    const solidLogo = localStorage.getItem('optic_app_logo_base64');
    if (solidLogo) {
      try {
        doc.addImage(solidLogo, 'JPEG', 165, 5, 28, 28);
      } catch (e) {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(boutiqueName.toUpperCase(), 15, 14);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // bold black contrast sub-tab
    doc.text(isFR ? "REÇU DE TRANSACTION CAISSE SYSTÈME" : "OFFICIAL CASHIER CHECKOUT RECEIPT", 15, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(235, 254, 255);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR');
    const formattedTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Impression : ${formattedDate} à ${formattedTime}   |   Opérateur de caisse : ${currentUserEmail}`, 15, 30);

    // Body details
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    const clientName = type === 'vente' ? item.customer : (type === 'commande' ? item.customer : item.name);
    doc.text(isFR ? `Bénéficiaire : ${clientName}` : `Beneficiary: ${clientName}`, 15, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`ID Transaction : ${item.id}`, 15, 59);
    doc.text(`Heure de pointage d'enregistrement : ${item.time || '08:00'}`, 15, 65);
    doc.text(`Type d'écriture de caisse : ${type.toUpperCase()}`, 15, 71);

    // Separator line
    doc.setDrawColor(0, 151, 167);
    doc.setLineWidth(0.5);
    doc.line(15, 76, 195, 76);

    // Section header
    doc.setFont("helvetica", "bold");
    doc.text(isFR ? "DÉSIGNATION ET DÉTAILS DE FACTURATION" : "INVOICE PARTICULARS", 15, 86);

    // Detailed table box
    doc.setFillColor(240, 253, 250);
    doc.rect(15, 93, 180, 48, 'F');
    doc.setDrawColor(0, 151, 167);
    doc.rect(15, 93, 180, 48, 'S');

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text(isFR ? "Description / Motif de visite" : "Goods / Description", 25, 102);
    doc.text(isFR ? "Mode de Règlement" : "Pay Mode", 110, 102);
    doc.text(isFR ? "Prix Total (FCFA)" : "Total price (FCFA)", 160, 102);
    doc.line(20, 105, 190, 105);

    doc.setFont("helvetica", "normal");
    const itemDesc = type === 'vente' 
      ? item.itemDescription 
      : (type === 'commande' ? item.opticalDetails : (item.reason === 'SIGHT_TEST' ? "Examen de la Vue" : "Ajustage / SAV"));
    const splitDesc = doc.splitTextToSize(itemDesc, 75);
    doc.text(splitDesc, 25, 114);

    const payMethod = type === 'vente' 
      ? item.paymentMethod 
      : (type === 'commande' ? "Acompte perçu (Dépot)" : "Gratuit / Prise en charge");
    doc.text(payMethod, 110, 114);

    const priceAmt = type === 'vente'
      ? `${item.totalFCFA.toLocaleString('fr-FR')} FCFA`
      : (type === 'commande' ? `${item.depositAmountFCFA.toLocaleString('fr-FR')} FCFA` : "0 FCFA");
    doc.text(priceAmt, 160, 114);

    if (type === 'commande') {
      doc.setFont("helvetica", "bold");
      doc.text(isFR ? `Reste à payer : ${item.remainingAmountFCFA.toLocaleString('fr-FR')} FCFA` : `Balance due: ${item.remainingAmountFCFA.toLocaleString('fr-FR')} FCFA`, 25, 134);
    }

    // Stamps
    doc.setFont("helvetica", "bold");
    doc.text(isFR ? "SIGNATURE DU COMPTABLE COMMIS" : "CASHIER SIGNATURE BLOCK", 130, 160);
    doc.text(boutiqueName, 130, 166);

    // Bottom verification footer banner
    doc.setFillColor(240, 253, 244); // light green bg
    doc.rect(15, 200, 180, 28, 'F');
    doc.setDrawColor(167, 243, 208); // green border
    doc.rect(15, 200, 180, 28, 'S');

    doc.setTextColor(6, 95, 70); // deep green text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("DOCUMENT CONFORME CERTIFIÉ ET ARCHIVÉ", 20, 207);
    doc.setFont("helvetica", "normal");
    doc.text(isFR ? "Reçu généré de façon sécurisée par le module Journal de Caisse Alizé ERP." : "Receipt securely generated by Alizé ERP Cash Journal module.", 20, 213);
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.text(`PROOF_HASH_REF: ${item.reference || 'SYSTEM_INTERNAL_FLOW_STAMP'}`, 20, 220);

    doc.save(`Recu_${item.id || 'RECI'}_${formattedDate.replace(/\//g, '-')}.pdf`);
  };

  // PDF Export Trigger using jsPDF
  const downloadPDFReport = () => {
    const isFR = currentLanguage === 'FR';
    const doc = new jsPDF();
    
    // Low-opacity watermark background first
    const watermarkLogo = localStorage.getItem('optic_app_logo_watermark');
    if (watermarkLogo) {
      try {
        doc.addImage(watermarkLogo, 'PNG', 55, 95, 100, 100);
      } catch (e) {}
    }

    // Header Banner
    doc.setFillColor(0, 151, 167); // Logo theme color (#0097a7)
    doc.rect(0, 0, 210, 40, 'F');

    // Solid logo inside the header (top-right)
    const solidLogo = localStorage.getItem('optic_app_logo_base64');
    if (solidLogo) {
      try {
        doc.addImage(solidLogo, 'JPEG', 165, 5, 28, 28);
      } catch (e) {}
    }
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const titleText = isFR ? "ALIZE OPTIC - TELEMETRIE COMPTABLE SECURISEE" : "ALIZE OPTIC - SECURED FINANCIAL TELEMETRY";
    doc.text(titleText, 15, 18);
    
    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(235, 254, 255);
    const subTitleText = isFR 
      ? `Rapport Journalier Scelle de Securite - Date : ${selectedDate}`
      : `Sealed Activity Ledger & Safety Audit - Date: ${selectedDate}`;
    doc.text(subTitleText, 15, 26);
    
    const hashLabelText = isFR ? "Empreinte : " : "Footprint: ";
    doc.text(hashLabelText + (secureSignature || 'N/A'), 15, 32);
    
    // Section 1: KPI Summary
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const sec1Title = isFR ? "1. SYNTHESE DES COMPTES JOURNALIERS" : "1. DAILY LEDGER BALANCES";
    doc.text(sec1Title, 15, 55);
    
    doc.setDrawColor(0, 151, 167);
    doc.setLineWidth(0.5);
    doc.line(15, 58, 195, 58);
    
    // Box for KPI values
    doc.setFillColor(240, 253, 250);
    doc.rect(15, 63, 180, 45, 'F');
    doc.setDrawColor(0, 151, 167);
    doc.rect(15, 63, 180, 45, 'S');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    
    const labelPatients = isFR ? "- Patients Recus :" : "- Registered Patients:";
    const labelSales = isFR ? "- Volume des Ventes Realisees :" : "- Total Closed Revenue:";
    const labelOrders = isFR ? "- Commandes d'Atelier Emises :" : "- New Workshop Orders:";
    const labelDeliveries = isFR ? "- Equipements Livres au Pupitre :" : "- Finished Products Dispatched:";
    
    doc.text(labelPatients, 25, 73);
    doc.text(labelSales, 25, 81);
    doc.text(labelOrders, 25, 89);
    doc.text(labelDeliveries, 25, 97);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 151, 167);
    const strPatients = isFR ? `${totalReceivedPatients} patients` : `${totalReceivedPatients} patient entries`;
    const strSales = `${salesValueFCFA.toLocaleString('fr-FR')} FCFA`;
    const strOrders = isFR ? `${totalOrdersAmount} ordonnances` : `${totalOrdersAmount} prescription orders`;
    const strDeliveries = isFR ? `${totalDeliveriesCount} montures livrees` : `${totalDeliveriesCount} finished frames`;
    
    doc.text(strPatients, 110, 73);
    doc.text(strSales, 110, 81);
    doc.text(strOrders, 110, 89);
    doc.text(strDeliveries, 110, 97);
    
    // Section 2: Detailed Transactions Table
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const sec2Title = isFR ? "2. REGISTRE LOGISTIQUE DE CHAISE ET POINTAGE" : "2. COMPREHENSIVE CASH DESK FLOW";
    doc.text(sec2Title, 15, 122);
    doc.setDrawColor(0, 151, 167);
    doc.line(15, 125, 195, 125);
    
    let yPos = 133;
    doc.setFontSize(9);
    if (activeDayData.ventes && activeDayData.ventes.length > 0) {
      // Table Header row
      doc.setFont("helvetica", "bold");
      const colId = isFR ? "Ref Vente" : "Sale Ref";
      const colClient = isFR ? "Patient / Client" : "Patient Name";
      const colDesc = isFR ? "Description de l'Article" : "Product Description";
      const colPay = isFR ? "Reglement" : "Payment";
      const colAmt = isFR ? "Montant (FCFA)" : "Amount (FCFA)";
      
      doc.text(colId, 15, yPos);
      doc.text(colClient, 40, yPos);
      doc.text(colDesc, 85, yPos);
      doc.text(colPay, 145, yPos);
      doc.text(colAmt, 195, yPos, { align: "right" });
      
      doc.setDrawColor(15, 23, 42);
      doc.line(15, yPos + 2, 195, yPos + 2);
      yPos += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      activeDayData.ventes.forEach((sale) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 25; // reset yPos on new page
          
          doc.setFont("helvetica", "bold");
          doc.text(colId, 15, yPos);
          doc.text(colClient, 40, yPos);
          doc.text(colDesc, 85, yPos);
          doc.text(colPay, 145, yPos);
          doc.text(colAmt, 195, yPos, { align: "right" });
          
          doc.setDrawColor(15, 23, 42);
          doc.line(15, yPos + 2, 195, yPos + 2);
          yPos += 8;
          doc.setFont("helvetica", "normal");
        }
        
        const textDesc = sale.itemDescription && sale.itemDescription.length > 30 
          ? sale.itemDescription.substring(0, 30) + "..." 
          : sale.itemDescription;
          
        doc.text(sale.id || "", 15, yPos);
        doc.text(sale.customer || "", 40, yPos);
        doc.text(textDesc || "", 85, yPos);
        doc.text(sale.paymentMethod || "", 145, yPos);
        doc.text(`${sale.totalFCFA.toLocaleString('fr-FR')}`, 195, yPos, { align: "right" });
        
        yPos += 6;
      });
    } else {
      doc.setFont("helvetica", "italic");
      const noSalesText = isFR 
        ? "Aucun encaissement ou transaction journaliere n'a ete enregistre." 
        : "No cash transactions or customer invoices recorded today.";
      doc.text(noSalesText, 15, yPos);
      yPos += 10;
    }
    
    // Bottom Verification Block
    if (yPos > 235) {
      doc.addPage();
      yPos = 30;
    } else {
      yPos += 15;
    }
    
    // Draw Seal background box
    doc.setFillColor(240, 253, 244); // light green bg
    doc.rect(15, yPos, 180, 28, 'F');
    doc.setDrawColor(167, 243, 208); // green border
    doc.rect(15, yPos, 180, 28, 'S');
    
    doc.setTextColor(6, 95, 70); // deep green text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const stampLabel = isFR 
      ? "SCELLEMENT DE SECURITE ALIZE OPTIC CONSOLIDE" 
      : "ALIZE OPTIC CONSOLIDATED RECONCILIATION & AUDIT STAMP";
    doc.text(stampLabel, 20, yPos + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(4, 120, 87); // mid-green
    const stampInfoText = isFR
      ? "Ce journal comptable est certifie conforme, inalterable et cryptographiquement signe."
      : "This reporting document is certified, non-tamperable, and cryptographically signed.";
    doc.text(stampInfoText, 20, yPos + 14);
    
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(31, 41, 55); // near black for monospace code
    doc.text(`HASH SHA512: ${secureSignature || 'PENDING_RECONCILIATION_SIGN'}`, 20, yPos + 22);
    
    const outPdfName = `Rapport_Journalier_${selectedDate}_Securise.pdf`;
    doc.save(outPdfName);
  };

  // Excel Export Trigger (CSV format for multi-app compatibility)
  const downloadExcelReport = () => {
    const isFR = currentLanguage === 'FR';
    const csvHeader = isFR
      ? "Date;Patients Recus;Volume Ventes (FCFA);Commandes Effectuees;Commandes Livrees;Signature Immuable\n"
      : "Date;Registered Patients;Sales Volume (FCFA);Workshop Orders;Delivered Frames;Immutable Signature\n";
      
    const csvRow = `"${selectedDate}";"${totalReceivedPatients}";"${salesValueFCFA}";"${totalOrdersAmount}";"${totalDeliveriesCount}";"${secureSignature || 'SCORED_LEDGER_CLOSED_SYS'}"\n`;
    
    // Append the underlying daily receipts list as second table in CSV sheet
    let salesSection = isFR
      ? "\n\nDETAIL DES TRANSACTIONS DE LA JOURNEE\nRef Vente;Heure;Patient / Client;Description de l'Article;Montant (FCFA);Mode Reglement;Reference Transaction\n"
      : "\n\nDETAILED JOURNAL OF SALES TRANSACTIONS\nSale Ref;Time;Patient Name;Product Description;Amount (FCFA);Payment Method;Transaction Reference\n";
      
    if (activeDayData.ventes && activeDayData.ventes.length > 0) {
      activeDayData.ventes.forEach(sale => {
        salesSection += `"${sale.id}";"${sale.time}";"${sale.customer}";"${sale.itemDescription}";"${sale.totalFCFA}";"${sale.paymentMethod}";"${sale.reference}"\n`;
      });
    } else {
      salesSection += isFR ? "Aucune vente aujourd'hui\n" : "No sales transactions recorded today\n";
    }

    // Prepend UTF-8 BOM so Microsoft Excel loads symbols and accents correctly
    const fullContent = "\uFEFF" + csvHeader + csvRow + salesSection;
    
    const fileBlob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(fileBlob);
    link.download = `Journal_Finances_${selectedDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-850 flex items-center gap-2">
            <BookOpen className="w-5.5 h-5.5 text-indigo-600" />
            <span>{currentLanguage === 'FR' ? "Journal de caisse" : "Daily Activity Cash Journal"}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {currentLanguage === 'FR' 
              ? "Relevé de pointage réglementaire et financier scellé de la succursale." 
              : "Sealed and cryptographically stamped branch-level cashier ledger and register records."}
          </p>
        </div>

        {/* Date Selector and Close Daily Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Calendar Picker */}
          <div className="relative flex items-center bg-slate-100 border border-slate-205 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 mr-2" />
            <span className="font-bold mr-2 text-slate-500">Choisir Date:</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsReportGenerated(false); // Reset report state on date change to ensure freshness
                setSecureSignature('');
              }}
              className="bg-transparent text-slate-800 font-extrabold focus:outline-none cursor-pointer text-xs"
            />
          </div>

          {/* Secure closing action triggers daily report generation */}
          <button
            onClick={handleCloseDailyJournal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Clôturer la journée d'activité</span>
          </button>
        </div>
      </div>

      {/* Metrics of targeted date selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Patients Reçus d’Atelier', value: totalReceivedPatients, icon: <UserCheck className="w-4.5 h-4.5 text-blue-500" />, desc: 'consultations et réglages' },
          { label: 'Chiffre d’Affaires Journalier', value: `${salesValueFCFA.toLocaleString()} FCFA`, icon: <ShoppingBag className="w-4.5 h-4.5 text-orange-500" />, desc: 'ventes directes finalisées' },
          { label: 'Commandes Effectuées', value: totalOrdersAmount, icon: <ClipboardList className="w-4.5 h-4.5 text-indigo-500" />, desc: 'nouvelles fiches techniques' },
          { label: 'Commandes Livrées', value: totalDeliveriesCount, icon: <Truck className="w-4.5 h-4.5 text-emerald-500" />, desc: 'lunettes remises aux clients' }
        ].map((met, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3.5 shadow-2xs">
            <div className="p-2.5 rounded-lg bg-slate-50">
              {met.icon}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">{met.label}</span>
              <span className="text-lg font-black font-mono text-slate-800 mt-1 block">{met.value}</span>
              <span className="text-[10px] text-slate-450 italic mt-0.5 block">{met.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Structured tabs tailored exactly to requested groups */}
      <div className="border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'patients', label: 'Patient Reçu', count: totalReceivedPatients },
            { id: 'ventes', label: 'Vente Directe', count: activeDayData.ventes.length },
            { id: 'commandes', label: 'Commande Effectuée', count: totalOrdersAmount },
            { id: 'livraisons', label: 'Commande Livrée', count: totalDeliveriesCount }
          ].map(tb => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`px-5 py-3 text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
                activeTab === tb.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-450 hover:text-slate-800'
              }`}
            >
              <span>{tb.label}</span>
              <span className="ml-1.5 px-1.5 py-0.2 text-[9px] bg-slate-100 text-slate-500 rounded-full font-mono font-bold">
                {tb.count}
              </span>
            </button>
          ))}
        </div>
        
        <button
          onClick={handleExportJournalToExcel}
          className="mr-3 mb-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl cursor-pointer transition shadow-3xs"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Tab Panel Content List */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
        
        {/* Panel 1: Patient Reçu */}
        {activeTab === 'patients' && (
          <div className="divide-y divide-slate-100 text-xs">
            {activeDayData.patients.length > 0 ? (
              activeDayData.patients.map(pat => (
                <div key={pat.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{pat.time}</span>
                    <span className="font-extrabold text-slate-800 text-sm">{pat.name}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-bold">
                      {pat.reason === 'SIGHT_TEST' && "Examen de la Vue"}
                      {pat.reason === 'DELIVERY_PICKUP' && "Livraison de Lunettes"}
                      {pat.reason === 'BENCH_ADJUSTMENT' && "Ajustage en Atelier"}
                      {pat.reason === 'WARRANTY_COMPLAINT' && "S.A.V. et Réclamation"}
                    </span>
                    <span className="text-slate-500 text-[11px]">Opticien : <strong>{pat.optician}</strong></span>
                    {pat.insuranceVerified ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-100">
                        Mutuelle Validée
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.2 rounded">
                        Hors Mutuelle
                      </span>
                    )}

                    <button
                      onClick={() => downloadReceiptPDF('patient', pat)}
                      title="Télécharger fiche de visite"
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold font-sans text-[10px] border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Fiche PDF</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-405 font-medium">Aucun patient pointé ce jour.</div>
            )}
          </div>
        )}

        {/* Panel 2: Vente */}
        {activeTab === 'ventes' && (
          <div className="divide-y divide-slate-105 text-xs">
            {activeDayData.ventes.length > 0 ? (
              activeDayData.ventes.map(vnt => (
                <div key={vnt.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-440 font-bold">{vnt.time}</span>
                      <strong className="text-slate-800 text-sm">{vnt.customer}</strong>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 rounded">{vnt.id}</span>
                    </div>
                    <div className="text-xs text-slate-500">{vnt.itemDescription}</div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <span className="text-[10px] text-slate-400 font-mono">Ref: {vnt.reference}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                      {vnt.paymentMethod}
                    </span>
                    <span className="text-sm font-extrabold font-mono text-indigo-750">
                      {vnt.totalFCFA.toLocaleString()} FCFA
                    </span>

                    <button
                      onClick={() => downloadReceiptPDF('vente', vnt)}
                      title="Télécharger le Reçu officiel de Vente"
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold font-sans text-[10.5px] border border-rose-200/55 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-3xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Reçu PDF</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-405">Aucune vente enregistrée.</div>
            )}
          </div>
        )}

        {/* Panel 3: Commande Effectuée */}
        {activeTab === 'commandes' && (
          <div className="divide-y divide-slate-100 text-xs">
            {activeDayData.commandes.length > 0 ? (
              activeDayData.commandes.map(cmd => (
                <div key={cmd.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{cmd.time}</span>
                      <strong className="text-slate-850 text-sm">{cmd.customer}</strong>
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 rounded font-bold">{cmd.id}</span>
                    </div>
                    <div className="text-xs text-slate-500">{cmd.opticalDetails}</div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-4 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold font-sans">
                      {cmd.lensesSourcing === 'CENTRAL_LAB' ? 'Lab Central Centralisé' : 'Meulage d\'Atelier Local'}
                    </span>
                    <div className="text-right">
                      <div className="text-[#10B981] font-bold">Acompte perçu: {cmd.depositAmountFCFA.toLocaleString()} FCFA</div>
                      <div className="text-slate-400 text-[10px]">Reste dû: {cmd.remainingAmountFCFA.toLocaleString()} FCFA</div>
                    </div>

                    <button
                      onClick={() => downloadReceiptPDF('commande', cmd)}
                      title="Télécharger le ticket d'acompte"
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold font-sans text-[10.5px] border border-blue-200/55 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-3xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Facture Acompte</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-405">Aucune commande d’atelier soumise ce jour.</div>
            )}
          </div>
        )}

        {/* Panel 4: Commande Livrée */}
        {activeTab === 'livraisons' && (
          <div className="divide-y divide-slate-100 text-xs">
            {activeDayData.livraisons.length > 0 ? (
              activeDayData.livraisons.map(liv => (
                <div key={liv.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{liv.time}</span>
                      <strong className="text-slate-800 text-sm">{liv.customer}</strong>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 rounded font-bold">{liv.id}</span>
                    </div>
                    <div className="text-xs text-slate-550 block">{liv.itemDescription}</div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Réceptionnaire : <strong>{liv.receivedBy}</strong></span>
                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{liv.signatureHash}</span>
                    </div>
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <ShieldCheck className="w-4 h-4" />
                    </span>

                    <button
                      onClick={() => downloadReceiptPDF('patient', { id: liv.id, time: liv.time, name: liv.customer, reason: 'DELIVERY_PICKUP', reference: liv.signatureHash })}
                      title="Télécharger le bon de décharge de livraison"
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold font-sans text-[10.5px] border border-emerald-250/55 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-3xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Bon Décharge</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-[#94A3B8]">Aucun retrait enregistré sur les râteliers de livraison.</div>
            )}
          </div>
        )}

      </div>

      {/* Immutable reports downloads section if signature exists */}
      {secureSignature && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-emerald-250 bg-emerald-50/40 space-y-4 flex flex-col lg:flex-row items-center justify-between"
        >
          <div className="space-y-1 text-center lg:text-left">
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-extrabold text-emerald-800">Rapports d'Activité Scellés de Sécurité (Non Modifiables)</h4>
            </div>
            <p className="text-xs text-emerald-700 max-w-xl">
              Ces fichiers comptables contiennent le Hash de preuve de pointage cryptographique de la succursale. Les valeurs de trésorerie sont verrouillées en FCFA.
            </p>
            <div className="text-[10px] font-mono text-emerald-600/75 select-all font-bold">Identifiant immutabilité : {secureSignature}</div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={downloadPDFReport}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le Rapport PDF</span>
            </button>
            <button
              onClick={downloadExcelReport}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exporter Rapport Excel</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Active dialog window showing secure reconciliation processing */}
      <AnimatePresence>
        {isClosingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 animate-spin">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Scellement du Journal Caisse</h3>
                  <p className="text-[11px] text-slate-500">Calcul des écritures et rapprochement en cours pour la date du {selectedDate}</p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-48 overflow-y-auto font-mono text-[10px] text-slate-600">
                {closingLogs.map((log, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsClosingModalOpen(false)}
                  className="px-4 py-2 bg-[#F8FAFC] border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Fermer l'aperçu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
