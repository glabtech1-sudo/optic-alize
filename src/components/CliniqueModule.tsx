import React, { useState } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Calendar, Eye, Plus, CheckCircle, Clock, Heart, 
  Sparkles, HelpCircle, UserCheck, ShieldCheck,
  Pencil, Download, Trash2, Printer, Search, X
} from 'lucide-react';
import { 
  fetchAppointments, saveAppointment, deleteAppointment,
  fetchSightExams, saveSightExam, deleteSightExam,
  fetchClinicPrescriptions, saveClinicPrescription, deleteClinicPrescription,
  fetchCustomers, saveCustomer
} from '../lib/api';

interface CliniqueModuleProps {
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

const RECENT_CLIENTS = [
  { id: 'c1-7501', name: 'Hélène Dubois-Chambery' },
  { id: 'c2-6902', name: 'Jean-Pierre Gomez-Viguier' },
  { id: 'c3-1303', name: 'Sarah El-Amri' },
  { id: 'c4-8402', name: 'Mamadi Diarra' },
  { id: 'c5-9204', name: 'Awa Niang' }
];

export default function CliniqueModule({ currentLanguage, currentCompany, isOffline }: CliniqueModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'appointments' | 'sightExams' | 'mesPrescriptions' | 'patients'>('sightExams');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [selectedPrescriptionForView, setSelectedPrescriptionForView] = useState<any | null>(null);
  const [selectedPrescriptionForEdit, setSelectedPrescriptionForEdit] = useState<any | null>(null);
  const [selectedPrescriptionForAdaptation, setSelectedPrescriptionForAdaptation] = useState<any | null>(null);

  // Edit fields state
  const [editPtName, setEditPtName] = useState('');
  const [editOdSph, setEditOdSph] = useState('0.00');
  const [editOdCyl, setEditOdCyl] = useState('0.00');
  const [editOdAxe, setEditOdAxe] = useState('90');
  const [editOdAdd, setEditOdAdd] = useState('2.00');
  const [editOgSph, setEditOgSph] = useState('0.00');
  const [editOgCyl, setEditOgCyl] = useState('0.00');
  const [editOgAxe, setEditOgAxe] = useState('90');
  const [editOgAdd, setEditOgAdd] = useState('2.00');
  const [editPd, setEditPd] = useState('62');
  const [editNotes, setEditNotes] = useState('');

  const handleOpenEdit = (pres: any) => {
    setSelectedPrescriptionForEdit(pres);
    setEditPtName(pres.patientName);
    setEditOdSph(String(pres.od?.sphere ?? '0.00'));
    setEditOdCyl(String(pres.od?.cylinder ?? '0.00'));
    setEditOdAxe(String(pres.od?.axis ?? '90'));
    setEditOdAdd(String(pres.od?.addition ?? '2.00'));
    setEditOgSph(String(pres.og?.sphere ?? '0.00'));
    setEditOgCyl(String(pres.og?.cylinder ?? '0.00'));
    setEditOgAxe(String(pres.og?.axis ?? '90'));
    setEditOgAdd(String(pres.og?.addition ?? '2.00'));
    setEditPd(String(pres.pd ?? '62'));
    setEditNotes(pres.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescriptionForEdit) return;

    const target = {
      id: selectedPrescriptionForEdit.id,
      patientName: editPtName,
      date: selectedPrescriptionForEdit.date,
      odSphere: parseFloat(editOdSph) || 0,
      odCylinder: parseFloat(editOdCyl) || 0,
      odAxis: parseInt(editOdAxe) || 0,
      odAddition: parseFloat(editOdAdd) || 0,
      ogSphere: parseFloat(editOgSph) || 0,
      ogCylinder: parseFloat(editOgCyl) || 0,
      ogAxis: parseInt(editOgAxe) || 0,
      ogAddition: parseFloat(editOgAdd) || 0,
      pd: editPd,
      prescribedLenses: selectedPrescriptionForEdit.prescribedLenses || '',
      notes: editNotes
    };

    saveClinicPrescription(target).then(() => {
      loadData();
      setSelectedPrescriptionForEdit(null);
    }).catch(err => {
      console.error(err);
      alert("Erreur lors de la mise à jour de la prescription.");
    });
  };

  const handleDeletePrescription = (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la prescription de ${name} (${id}) ?`)) {
      deleteClinicPrescription(id).then(() => {
        loadData();
      }).catch(err => {
        console.error(err);
        alert("Erreur lors de la suppression de la prescription.");
      });
    }
  };

  // Helper values for dynamic context
  const boutiqueName = localStorage.getItem('optic_boutique_name') || 'Optic Alizé - DIRECTION';
  const currentUserEmail = localStorage.getItem('optic_user_email') || 'glabtech1@gmail.com';

  // Helper PDFs
  const downloadPrescriptionPDF = (pres: any) => {
    const doc = new jsPDF();
    const isFR = currentLanguage === 'FR';
    
    // Low-opacity watermark background first (rendered behind all components)
    const watermarkLogo = localStorage.getItem('optic_app_logo_watermark');
    if (watermarkLogo) {
      try {
        doc.addImage(watermarkLogo, 'PNG', 55, 95, 100, 100);
      } catch (e) {}
    }

    // Header banner using brand teal
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
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // bold black contrast sub-tab
    doc.text(isFR ? "ORDONNANCE OPHTALMIQUE & FICHE REFRACTIVE" : "OPHTHALMIC PRESCRIPTION & SIGHT EXAM RECORD", 15, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(235, 254, 255); // low opacity cyan
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR');
    const formattedTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Généré le : ${formattedDate} à ${formattedTime}   |   Opérateur : ${currentUserEmail}`, 15, 30);
    
    // Core details in black
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(isFR ? `Patient : ${pres.patientName}` : `Patient: ${pres.patientName}`, 15, 52);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Identifiant Patient : ${pres.id || 'N/A'}`, 15, 59);
    doc.text(`Date de Consultation : ${pres.date || formattedDate}`, 15, 65);
    doc.text(`Boutique Émettrice : ${boutiqueName}`, 15, 71);
    
    doc.setDrawColor(0, 151, 167); // Teal lines
    doc.setLineWidth(0.5);
    doc.line(15, 76, 195, 76);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 151, 167); // Logo theme color
    doc.text("PARAMÈTRES RÉFRACTIFS", 15, 86);
    
    doc.setFillColor(240, 253, 250); // Light pastel cyan
    doc.rect(15, 93, 180, 48, 'F');
    doc.setDrawColor(0, 151, 167);
    doc.rect(15, 93, 180, 48, 'S');
    
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // Black
    doc.text("Oeil", 25, 102);
    doc.text("Sphère", 60, 102);
    doc.text("Cylindre", 95, 102);
    doc.text("Axe", 130, 102);
    doc.text("Addition", 165, 102);
    doc.line(20, 105, 190, 105);
    
    doc.setFont("helvetica", "normal");
    doc.text("Oeil Droit (OD)", 25, 114);
    const odSphVal = pres.od?.sphere ?? 0;
    const odSphStr = odSphVal > 0 ? `+${odSphVal.toFixed(2)}` : odSphVal.toFixed(2);
    const odCylVal = pres.od?.cylinder ?? 0;
    const odCylStr = odCylVal > 0 ? `+${odCylVal.toFixed(2)}` : odCylVal.toFixed(2);
    doc.text(odSphStr, 60, 114);
    doc.text(odCylStr, 95, 114);
    doc.text(`${pres.od?.axis ?? 90}°`, 130, 114);
    doc.text(`+${(pres.od?.addition ?? 2.00).toFixed(2)}`, 165, 114);
    
    doc.text("Oeil Gauche (OG)", 25, 126);
    const ogSphVal = pres.og?.sphere ?? 0;
    const ogSphStr = ogSphVal > 0 ? `+${ogSphVal.toFixed(2)}` : ogSphVal.toFixed(2);
    const ogCylVal = pres.og?.cylinder ?? 0;
    const ogCylStr = ogCylVal > 0 ? `+${ogCylVal.toFixed(2)}` : ogCylVal.toFixed(2);
    doc.text(ogSphStr, 60, 126);
    doc.text(ogCylStr, 95, 126);
    doc.text(`${pres.og?.axis ?? 90}°`, 130, 126);
    doc.text(`+${(pres.og?.addition ?? 2.00).toFixed(2)}`, 165, 126);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 151, 167); // Logo theme color
    doc.text(`Écart Pupillaire (EP) :   ${pres.pd ?? '62.0'} mm`, 25, 136);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // Black
    doc.text("OBSERVATIONS COMPLÉMENTAIRES", 15, 155);
    doc.setDrawColor(0, 151, 167);
    doc.line(15, 158, 195, 158);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(pres.notes || "Aucune observation particulière.", 175);
    doc.text(splitNotes, 15, 166);
    
    doc.setDrawColor(0, 151, 167);
    doc.line(15, 220, 195, 220);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("SIGNATURE & CACHET CLINIQUE", 140, 230);
    doc.setTextColor(0, 151, 167);
    doc.text(boutiqueName, 140, 236);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Document certifié conforme issu du système de télémétrie Alizé Optic ERP.", 15, 280);
    
    doc.save(`Ordonnance_${pres.id || 'PRES'}_${pres.patientName.replace(/\s+/g, '_')}.pdf`);
  };

  const downloadAdaptationPDF = (pres: any) => {
    const doc = new jsPDF();
    const isFR = currentLanguage === 'FR';
    
    // Low-opacity watermark background first
    const watermarkLogo = localStorage.getItem('optic_app_logo_watermark');
    if (watermarkLogo) {
      try {
        doc.addImage(watermarkLogo, 'PNG', 55, 95, 100, 100);
      } catch (e) {}
    }

    doc.setFillColor(0, 151, 167); // Logo theme color (#0097a7)
    doc.rect(0, 0, 210, 38, 'F');

    // Solid logo inside the header
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
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(isFR ? "FICHE D'ADAPTATION LUNETTIÈRE ET DE MEULAGE" : "FRAME FITMENT & PROGRESSIVE ADAPTATION WORK CARD", 15, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(235, 254, 255);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR');
    const formattedTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Pointage de sécurité : ${formattedDate} à ${formattedTime}   |   Compte d'émetteur : ${currentUserEmail}`, 15, 30);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(isFR ? `Fiche d'Adaptation - Client : ${pres.patientName}` : `Fit Record - Client: ${pres.patientName}`, 15, 52);
    
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Identifiant unique : ${pres.id || 'N/A'}`, 15, 59);
    doc.text(`Boutique technique d'affectation : ${boutiqueName}`, 15, 65);
    
    doc.setDrawColor(0, 151, 167);
    doc.setLineWidth(0.5);
    doc.line(15, 70, 195, 70);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 151, 167);
    doc.text("1. CARTOGRAPHIE RÉFRACTIVE ET ÉCARTEMENTS", 15, 80);
    
    doc.setFillColor(240, 253, 250);
    doc.rect(15, 85, 180, 48, 'F');
    doc.setDrawColor(0, 151, 167);
    doc.rect(15, 85, 180, 48, 'S');
    
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Oeil", 25, 94);
    doc.text("Sphère", 60, 94);
    doc.text("Cylindre", 95, 94);
    doc.text("Axe", 130, 94);
    doc.text("Addition", 165, 94);
    doc.line(20, 97, 190, 97);
    
    doc.setFont("helvetica", "normal");
    doc.text("Oeil Droit (OD)", 25, 106);
    const odSphVal = pres.od?.sphere ?? 0;
    const odSphStr = odSphVal > 0 ? `+${odSphVal.toFixed(2)}` : odSphVal.toFixed(2);
    const odCylVal = pres.od?.cylinder ?? 0;
    const odCylStr = odCylVal > 0 ? `+${odCylVal.toFixed(2)}` : odCylVal.toFixed(2);
    doc.text(odSphStr, 60, 106);
    doc.text(odCylStr, 95, 106);
    doc.text(`${pres.od?.axis ?? 90}°`, 130, 106);
    doc.text(`+${(pres.od?.addition ?? 2.00).toFixed(2)}`, 165, 106);
    
    doc.text("Oeil Gauche (OG)", 25, 118);
    const ogSphVal = pres.og?.sphere ?? 0;
    const ogSphStr = ogSphVal > 0 ? `+${ogSphVal.toFixed(2)}` : ogSphVal.toFixed(2);
    const ogCylVal = pres.og?.cylinder ?? 0;
    const ogCylStr = ogCylVal > 0 ? `+${ogCylVal.toFixed(2)}` : ogCylVal.toFixed(2);
    doc.text(ogSphStr, 60, 118);
    doc.text(ogCylStr, 95, 118);
    doc.text(`${pres.og?.axis ?? 90}°`, 130, 118);
    doc.text(`+${(pres.og?.addition ?? 2.00).toFixed(2)}`, 165, 118);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 151, 167);
    doc.text(`Écart Pupillaire (EP) : ${pres.pd ?? '62.0'} mm  |  Hauteur de Montage recommandée : 18.5 mm`, 25, 128);
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("2. CONTROLE TECHNIQUE ET PARAMÈTRES ET ATELIER", 15, 146);
    doc.setDrawColor(0, 151, 167);
    doc.line(15, 149, 195, 149);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("- Type de verre : Progressif haut-de-gamme durci antireflet hydrophobe", 20, 158);
    doc.text("- Centrage & alignement pupillaire : Validé sur pupillomètre laser", 20, 164);
    doc.text("- Angle pantoscopique de la monture : Ajusté à 8°", 20, 170);
    doc.text("- Distance verre-oeil : Configurée à 12 mm standard d'atelier", 20, 176);
    doc.text("- Galbe de la monture : Plat (0-2°)", 20, 182);
    
    doc.setFont("helvetica", "bold");
    doc.text("Observations d'Ajustage :", 20, 194);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    const notesSplit = doc.splitTextToSize(pres.notes || "L'adaptation se déroule de façon nominale.", 170);
    doc.text(notesSplit, 20, 200);
    
    doc.setDrawColor(0, 151, 167);
    doc.line(15, 230, 195, 230);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("L'OPTICIEN ADAPTATEUR", 20, 242);
    doc.setTextColor(0, 151, 167);
    doc.text(`Visa ${currentUserEmail.split('@')[0]}`, 20, 248);
    
    doc.setTextColor(15, 23, 42);
    doc.text("CONTRÔLEUR QUALITÉ HQ", 130, 242);
    doc.setTextColor(0, 151, 167);
    doc.text(boutiqueName, 130, 248);
    
    doc.save(`Fiche_Adaptation_${pres.id || 'PRES'}_${pres.patientName.replace(/\s+/g, '_')}.pdf`);
  };

  // Load dynamically synchronized CRM patients list
  const [dynamicCrmPatients, setDynamicCrmPatients] = useState<any[]>([]);
  const [myPrescriptions, setMyPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  const loadData = React.useCallback(() => {
    fetchCustomers().then(data => {
      setDynamicCrmPatients(data);
    }).catch(err => console.error(err));

    fetchClinicPrescriptions().then(data => {
      setMyPrescriptions(data.map((p: any) => ({
        id: p.id,
        patientName: p.patientName,
        date: p.date,
        od: {
          sphere: p.odSphere,
          cylinder: p.odCylinder,
          axis: p.odAxis,
          addition: p.odAddition
        },
        og: {
          sphere: p.ogSphere,
          cylinder: p.ogCylinder,
          axis: p.ogAxis,
          addition: p.ogAddition
        },
        pd: p.pd,
        prescribedLenses: p.prescribedLenses,
        notes: p.notes
      })));
    }).catch(err => console.error(err));

    fetchAppointments().then(data => {
      setAppointments(data);
    }).catch(err => console.error(err));

    fetchSightExams().then(data => {
      setExams(data.map((ex: any) => ({
        id: ex.id,
        patientName: ex.patientName,
        date: ex.date,
        od: {
          sphere: parseFloat(ex.odSphere) || 0,
          cylinder: parseFloat(ex.odCylinder) || 0,
          axis: parseInt(ex.odAxis) || 90,
          addition: parseFloat(ex.odAddition) || 2.0
        },
        og: {
          sphere: parseFloat(ex.ogSphere) || 0,
          cylinder: parseFloat(ex.ogCylinder) || 0,
          axis: parseInt(ex.ogAxis) || 90,
          addition: parseFloat(ex.ogAddition) || 2.0
        },
        pd: ex.pupilDist,
        notes: ex.notes
      })));
    }).catch(err => console.error(err));
  }, []);

  React.useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleExportPrescriptionsToExcel = () => {
    const headers = [
      "ID Prescription", "Patient", "Date", "OD Sphere", "OD Cylindre", "OD Axe", "OD Addition",
      "OG Sphere", "OG Cylindre", "OG Axe", "OG Addition", "Ecart Pupillaire (PD)", "Verres Prescrits", "Notes"
    ];
    const rows = myPrescriptions.map(p => [
      p.id,
      p.patientName,
      p.date,
      p.od?.sphere ?? '0.00',
      p.od?.cylinder ?? '0.00',
      p.od?.axis ?? '0',
      p.od?.addition ?? '0.00',
      p.og?.sphere ?? '0.00',
      p.og?.cylinder ?? '0.00',
      p.og?.axis ?? '0',
      p.og?.addition ?? '0.00',
      p.pd || 'N/A',
      p.prescribedLenses || 'N/A',
      p.notes || ''
    ]);

    let csvContent = "\uFEFF";
    csvContent += headers.join(";") + "\n";
    rows.forEach(r => {
      csvContent += r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `prescriptions_cliniques_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [presSearchQuery, setPresSearchQuery] = useState('');

  // Appointment Form States
  const [newPtName, setNewPtName] = useState('');
  const [newDate, setNewDate] = useState('2026-06-11');
  const [newTime, setNewTime] = useState('11:00');
  const [newReason, setNewReason] = useState('Examen de la vue');
  const [newOptician, setNewOptician] = useState('Antoine G.');

  // Compute distinct custom patients list received in clinic and prescriptions
  const receivedPatients = React.useMemo(() => {
    const patientMap: { [name: string]: { name: string; examCount: number; presCount: number; lastDate: string; id: string } } = {};
    
    if (Array.isArray(exams)) {
      exams.forEach(ex => {
        const name = ex.patientName || '';
        if (!name) return;
        if (!patientMap[name]) {
          patientMap[name] = { 
            name, 
            examCount: 0, 
            presCount: 0, 
            lastDate: ex.date || '2026-06-11', 
            id: ex.id || `CLP-${Math.floor(Math.random() * 9000) + 1000}` 
          };
        }
        patientMap[name].examCount += 1;
        if (ex.date && new Date(ex.date) > new Date(patientMap[name].lastDate)) {
          patientMap[name].lastDate = ex.date;
        }
      });
    }

    if (Array.isArray(myPrescriptions)) {
      myPrescriptions.forEach(p => {
        const name = p.patientName || '';
        if (!name) return;
        if (!patientMap[name]) {
          patientMap[name] = { 
            name, 
            examCount: 0, 
            presCount: 0, 
            lastDate: p.date || '2026-06-11', 
            id: p.id || `CLP-${Math.floor(Math.random() * 9000) + 1000}` 
          };
        }
        patientMap[name].presCount += 1;
        if (p.date && new Date(p.date) > new Date(patientMap[name].lastDate)) {
          patientMap[name].lastDate = p.date;
        }
      });
    }

    return Object.values(patientMap);
  }, [exams, myPrescriptions]);

  const [redigePar, setRedigePar] = useState('');
  const [patientTabMode, setPatientTabMode] = useState<'prescrits' | 'registre'>('prescrits');

  // Exam Form States
  const [examPatient, setExamPatient] = useState('');
  const [odSphere, setOdSphere] = useState('-2.00');
  const [odCylinder, setOdCylinder] = useState('-0.50');
  const [odAxis, setOdAxis] = useState('90');
  const [odAddition, setOdAddition] = useState('1.75');
  const [ogSphere, setOgSphere] = useState('-1.50');
  const [ogCylinder, setOgCylinder] = useState('-0.75');
  const [ogAxis, setOgAxis] = useState('95');
  const [ogAddition, setOgAddition] = useState('1.75');
  const [pupilDist, setPupilDist] = useState('62.5');
  const [examNotes, setExamNotes] = useState('Verres ophtalmiques unifocaux durcis et antireflet.');

  // Appointment creation handler
  const handleScheduleAppt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPtName) return;
    const newAppt = {
      id: `RDV-${Math.floor(100 + Math.random() * 900)}`,
      patientName: newPtName,
      date: newDate,
      time: newTime,
      reason: newReason,
      optician: newOptician,
      status: 'Planifié'
    };
    saveAppointment(newAppt).then(() => {
      loadData();
      setNewPtName('');
    }).catch(err => {
      console.error(err);
      alert("Erreur lors de l'enregistrement du rendez-vous.");
    });
  };

  const updateApptStatus = (id: string, newStatus: string) => {
    const found = appointments.find(a => a.id === id);
    if (!found) return;
    const updated = { ...found, status: newStatus };
    saveAppointment(updated).then(() => {
      loadData();
    }).catch(err => console.error(err));
  };

  // Exam and diagnostic prescription creation handler
  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examPatient) return;
    if (!redigePar.trim()) {
      alert("Erreur: Veuillez saisir le nom du médecin ou du docteur dans le champ 'Rédigé par' avant d'enregistrer.");
      return;
    }
    const examId = `EXAM-${Math.floor(300 + Math.random() * 700)}`;
    const presId = `PRES-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const newExam = {
      id: examId,
      patientName: examPatient,
      date: dateStr,
      odSphere: odSphere,
      odCylinder: odCylinder,
      odAxis: odAxis,
      odAddition: odAddition,
      ogSphere: ogSphere,
      ogCylinder: ogCylinder,
      ogAxis: ogAxis,
      ogAddition: ogAddition,
      pupilDist: pupilDist,
      notes: examNotes
    };

    const newPres = {
      id: presId,
      patientName: examPatient,
      date: dateStr,
      odSphere: parseFloat(odSphere),
      odCylinder: parseFloat(odCylinder),
      odAxis: parseInt(odAxis),
      odAddition: parseFloat(odAddition),
      ogSphere: parseFloat(ogSphere),
      ogCylinder: parseFloat(ogCylinder),
      ogAxis: parseInt(ogAxis),
      ogAddition: parseFloat(ogAddition),
      pd: pupilDist,
      prescribedLenses: 'Verres ophtalmiques unifocaux durcis et antireflet.',
      notes: examNotes
    };

    const p1 = saveSightExam(newExam);
    const p2 = saveClinicPrescription(newPres);

    let p3 = Promise.resolve();
    const match = dynamicCrmPatients.find(c => {
      const customerFullName = `${c.firstName} ${c.lastName}`.trim().toLowerCase();
      const targetName = examPatient.trim().toLowerCase();
      return customerFullName === targetName || customerFullName.includes(targetName) || targetName.includes(customerFullName);
    });

    if (match) {
      let prescriptions: any[] = [];
      try {
        prescriptions = JSON.parse(match.prescriptionsJson || '[]');
      } catch (e) {
        prescriptions = [];
      }
      const newCrmPres = {
        id: `PRES-${Math.floor(1000 + Math.random() * 9000)}`,
        ophthalmologist: redigePar,
        odSphere: parseFloat(odSphere),
        odCylinder: parseFloat(odCylinder),
        odAxis: parseInt(odAxis),
        odAddition: parseFloat(odAddition),
        ogSphere: parseFloat(ogSphere),
        ogCylinder: parseFloat(ogCylinder),
        ogAxis: parseInt(ogAxis),
        ogAddition: parseFloat(ogAddition),
        prescriptionDate: dateStr,
        isExpired: false,
        insuranceValidated: true
      };
      const updatedCustomer = {
        ...match,
        prescriptionsJson: JSON.stringify([newCrmPres, ...prescriptions])
      };
      p3 = saveCustomer(updatedCustomer);
    }

    Promise.all([p1, p2, p3]).then(() => {
      loadData();
      setExamPatient('');
      setRedigePar('');
      setSuccessBanner(`Ordonnance de ${examPatient} enregistrée et délivrée avec succès !`);
      setTimeout(() => {
        setSuccessBanner(null);
      }, 6000);
    }).catch(err => {
      console.error(err);
      alert("Erreur lors de la sauvegarde de l'examen clinique.");
    });
  };

  return (
    <div className="space-y-6">
      {successBanner && (
        <div className="fixed top-5 right-5 z-50 bg-[#0097A7] text-white font-sans text-xs px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-200/40 animate-pulse">
          <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0 animate-bounce" />
          <div className="text-left">
            <span className="font-extrabold block text-sm">Confirmation Optic Alizé</span>
            <span className="text-[11px] opacity-90">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="ml-2 font-bold cursor-pointer text-white/70 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}
      
      {/* Upper header block */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span>{currentLanguage === 'FR' ? 'Clinique d\'Optométrie & Prescriptions' : 'Clinical Optometry & Prescriptions'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {currentLanguage === 'FR' 
              ? 'Examens de la vue, réfraction médicale, ordonnances d\'optique active et raccordement aux fiches clients.' 
              : 'Detailed visual acuity sight checks, lens prescriptions and ophthalmic clinical tracking.'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('sightExams')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'sightExams' 
                ? 'bg-white text-rose-600 shadow-2xs font-extrabold' 
                : 'text-slate-550 hover:text-slate-950'
            }`}
          >
            {currentLanguage === 'FR' ? 'Examens de la Vue' : 'Vision Exams'}
          </button>

          <button
            onClick={() => setActiveSubTab('mesPrescriptions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'mesPrescriptions' 
                ? 'bg-white text-rose-600 shadow-2xs font-extrabold' 
                : 'text-slate-550 hover:text-slate-950'
            }`}
          >
            {currentLanguage === 'FR' ? 'Mes Prescriptions' : 'My Prescriptions'}
          </button>

          <button
            onClick={() => setActiveSubTab('appointments')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'appointments' 
                ? 'bg-white text-rose-600 shadow-2xs font-extrabold' 
                : 'text-slate-550 hover:text-slate-950'
            }`}
          >
            {currentLanguage === 'FR' ? 'Rendez-vous' : 'Appointments'}
          </button>

          <button
            onClick={() => setActiveSubTab('patients')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'patients' 
                ? 'bg-white text-rose-600 shadow-2xs font-extrabold' 
                : 'text-slate-550 hover:text-slate-950'
            }`}
          >
            {currentLanguage === 'FR' ? 'Patient Clinique' : 'Clinic Patients'}
          </button>
        </div>
      </div>

      {activeSubTab === 'sightExams' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* New Exam Form */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Eye className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  {currentLanguage === 'FR' ? 'Formulaire de Réfraction Clinique' : 'Clinical Visual Exam Form'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">ENREGISTREMENT OFFICIEL • G-LAB OPTIC TOGO</p>
              </div>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{currentLanguage === 'FR' ? 'Client de la Base CRM' : 'Patient Name (CRM Module)'}</label>
                  <select 
                    value={examPatient}
                    onChange={(e) => setExamPatient(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold text-slate-800 shadow-3xs cursor-pointer"
                    required
                  >
                    <option value="">{currentLanguage === 'FR' ? '-- Choisir un patient CRM --' : '-- Choose a CRM Patient --'}</option>
                    {dynamicCrmPatients.map(cl => {
                      const fullName = `${cl.firstName} ${cl.lastName}`;
                      return (
                        <option key={cl.id} value={fullName}>
                          {fullName} ({cl.id})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{currentLanguage === 'FR' ? 'Écart Pupillaire (mm)' : 'Pupillary Distance (mm)'}</label>
                  <input 
                    type="text" 
                    value={pupilDist}
                    onChange={(e) => setPupilDist(e.target.value)}
                    placeholder="Ex: 63.5"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{currentLanguage === 'FR' ? 'Ordonnance rédigée par *' : 'Prescription written by *'}</label>
                  <input 
                    type="text" 
                    required
                    value={redigePar}
                    onChange={(e) => setRedigePar(e.target.value)}
                    placeholder="Dr. Nom du médecin prescripteur"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                  />
                </div>
              </div>

              {/* Right eye */}
              <div className="p-4 bg-amber-50/25 border border-amber-100 rounded-xl space-y-2">
                <span className="text-xs font-black text-[#C2410C] uppercase tracking-wide block">
                  👁 {currentLanguage === 'FR' ? 'Œil Gauche (OD) / Œil Droit' : 'Right Eye (OD)'}
                </span>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  <div>
                    <label className="text-[9px] text-slate-400 block">{currentLanguage === 'FR' ? 'Sphère' : 'Sphere'}</label>
                    <input type="text" value={odSphere} onChange={(e) => setOdSphere(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 text-center font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">{currentLanguage === 'FR' ? 'Cylindre' : 'Cylinder'}</label>
                    <input type="text" value={odCylinder} onChange={(e) => setOdCylinder(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 text-center font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">Axe°</label>
                    <input type="text" value={odAxis} onChange={(e) => setOdAxis(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 text-center font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">Addition</label>
                    <input type="text" value={odAddition} onChange={(e) => setOdAddition(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 text-center font-bold" />
                  </div>
                </div>
              </div>

              {/* Left eye */}
              <div className="p-4 bg-emerald-50/25 border border-emerald-100 rounded-xl space-y-2">
                <span className="text-xs font-black text-[#15803D] uppercase tracking-wide block">
                  👁 {currentLanguage === 'FR' ? 'Œil Gauche (OG)' : 'Left Eye (OG)'}
                </span>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  <div>
                    <label className="text-[9px] text-slate-400 block">{currentLanguage === 'FR' ? 'Sphère' : 'Sphere'}</label>
                    <input type="text" value={ogSphere} onChange={(e) => setOgSphere(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 text-center font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">{currentLanguage === 'FR' ? 'Cylindre' : 'Cylinder'}</label>
                    <input type="text" value={ogCylinder} onChange={(e) => setOgCylinder(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 text-center font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">Axe°</label>
                    <input type="text" value={ogAxis} onChange={(e) => setOgAxis(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 text-center font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">Addition</label>
                    <input type="text" value={ogAddition} onChange={(e) => setOgAddition(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 text-center font-bold" />
                  </div>
                </div>
              </div>

              {/* Medical Observations */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{currentLanguage === 'FR' ? 'Observations & Conseils de Verre' : 'Medical Observations & Remarks'}</label>
                <textarea 
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white hover:shadow transition font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{currentLanguage === 'FR' ? 'Enregistrer et Délivrer l\'Ordonnance' : 'Register and Issue Prescription'}</span>
              </button>
            </form>
          </div>

          {/* History Profiles list */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              {currentLanguage === 'FR' ? 'Registre des prescriptions optiques' : 'Active Prescription Register'}
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {exams.map((ex) => (
                <div 
                  key={ex.id}
                  className="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{ex.patientName}</span>
                      <span className="text-[9px] text-slate-400 block font-semibold">{ex.date}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100/40">
                      {ex.id}
                    </span>
                  </div>

                  {/* Refract coordinates */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[9px] font-black text-[#C2410C] block mb-0.5">Oeil Droit (OD)</span>
                      <span>Sph: <strong className="text-slate-800">{ex.od.sphere}</strong></span><br/>
                      <span>Cyl: <strong className="text-slate-800">{ex.od.cylinder}</strong></span><br/>
                      <span>Axe: <strong className="text-slate-800">{ex.od.axis}°</strong></span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[9px] font-black text-[#15803D] block mb-0.5">Oeil Gauche (OG)</span>
                      <span>Sph: <strong className="text-slate-800">{ex.og.sphere}</strong></span><br/>
                      <span>Cyl: <strong className="text-slate-800">{ex.og.cylinder}</strong></span><br/>
                      <span>Axe: <strong className="text-slate-800">{ex.og.axis}°</strong></span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-50">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Observations d'Atelier</span>
                    "{ex.notes}"
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'appointments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* New consultation booking form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
            <h3 className="text-xs font-black text-slate-850 uppercase border-b border-slate-100 pb-2">
              {currentLanguage === 'FR' ? 'Planifier une consultation' : 'Schedule Custom Consultation'}
            </h3>

            <form onSubmit={handleScheduleAppt} className="space-y-3.5 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{currentLanguage === 'FR' ? 'Client de la Base CRM' : 'Patient Name (CRM Module)'}</label>
                <select 
                  value={newPtName}
                  onChange={(e) => setNewPtName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-[#2563EB] font-bold text-slate-800"
                  required
                >
                  <option value="">{currentLanguage === 'FR' ? '-- Choisir un patient CRM --' : '-- Choose a CRM Patient --'}</option>
                  {RECENT_CLIENTS.map(cl => (
                    <option key={cl.id} value={cl.name}>
                      {cl.name} ({cl.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Heure</label>
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Motif de consultation</label>
                <select 
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="Examen de la vue">Examen de la vue / Sight assessment</option>
                  <option value="Ajustement de monture">Ajustement de branches / Monture</option>
                  <option value="Suivi presbytie">Suivi presbytie progressive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Optométriste assigné</label>
                <select 
                  value={newOptician}
                  onChange={(e) => setNewOptician(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="Antoine G.">Antoine G. (Optométriste)</option>
                  <option value="Alioune Diop">Alioune Diop (Consultant)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Planifier le Rendez-vous
              </button>
            </form>
          </div>

          {/* Agenda view */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-800">Planning Clinique</span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {appointments.length} Consultations
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {appointments.map((appt) => (
                <div 
                  key={appt.id} 
                  className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-800 text-xs">{appt.patientName}</strong>
                      <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 rounded">{appt.id}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex gap-3 font-medium">
                      <span>📅 {appt.date}</span>
                      <span>⏰ {appt.time}</span>
                      <span>👤 {appt.opticianId}</span>
                    </div>
                    <p className="text-rose-600 font-bold text-[11px]">{appt.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {appt.status === 'Planifié' ? (
                      <>
                        <button
                          onClick={() => updateApptStatus(appt.id, 'Terminé')}
                          className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
                        >
                          Achever
                        </button>
                        <button
                          onClick={() => updateApptStatus(appt.id, 'Annulé')}
                          className="px-2.5 py-1 text-[10px] font-extrabold bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                        appt.status === 'Terminé' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {appt.status === 'Terminé' ? '✓ Terminé' : '✗ Annulé'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'mesPrescriptions' && (
        <div className="space-y-6">
          {/* Top filtering bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={presSearchQuery}
                onChange={(e) => setPresSearchQuery(e.target.value)}
                placeholder={currentLanguage === 'FR' ? 'Rechercher par patient ou ID...' : 'Search by patient or ID...'}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold font-sans"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportPrescriptionsToExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition shadow-3xs"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>{currentLanguage === 'FR' ? `Boutique Active : ${boutiqueName}` : `Active Store: ${boutiqueName}`}</span>
              </div>
            </div>
          </div>

          {/* List Layout of prescriptions (Table) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[10px] font-black">
                    <th className="p-4">{currentLanguage === 'FR' ? 'ID & Date' : 'ID & Date'}</th>
                    <th className="p-4">{currentLanguage === 'FR' ? 'Patient / Client' : 'Patient Name'}</th>
                    <th className="p-4">👁️ OD (Sph/Cyl/Axe/Add)</th>
                    <th className="p-4">👁️ OG (Sph/Cyl/Axe/Add)</th>
                    <th className="p-4">Écart (EP)</th>
                    <th className="p-4">{currentLanguage === 'FR' ? 'Boutique (Émission)' : 'Store'}</th>
                    <th className="p-4 text-right pr-6">{currentLanguage === 'FR' ? "Volet d'Action" : "Action Desk"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myPrescriptions.filter(p => 
                    p.patientName.toLowerCase().includes(presSearchQuery.toLowerCase()) ||
                    p.id.toLowerCase().includes(presSearchQuery.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 font-bold">
                        <span className="text-2xl block mb-2">📭</span>
                        {currentLanguage === 'FR' ? "Aucun historique de prescription ne correspond." : "No matching prescription records found."}
                      </td>
                    </tr>
                  ) : (
                    myPrescriptions.filter(p => 
                      p.patientName.toLowerCase().includes(presSearchQuery.toLowerCase()) ||
                      p.id.toLowerCase().includes(presSearchQuery.toLowerCase())
                    ).map((pres) => (
                      <tr key={pres.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="p-4 font-mono">
                          <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100/30 text-[10px]">
                            {pres.id}
                          </span>
                          <span className="block text-[9.5px] text-slate-400 mt-1 font-bold">📅 {pres.date}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 text-sm">{pres.patientName}</div>
                          {pres.notes && (
                            <div className="text-[10px] text-slate-450 italic max-w-xs truncate mt-0.5" title={pres.notes}>
                              "{pres.notes}"
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-mono text-[11px]">
                          <span className="text-orange-700 font-bold">
                            {(pres.od?.sphere ?? 0) > 0 ? `+${pres.od?.sphere}` : pres.od?.sphere} / {(pres.od?.cylinder ?? 0) > 0 ? `+${pres.od?.cylinder}` : pres.od?.cylinder}
                          </span>
                          <span className="text-slate-400 block text-[9px]">Axe: {pres.od?.axis ?? 90}° • Add: +{pres.od?.addition ?? 2.00}</span>
                        </td>
                        <td className="p-4 font-mono text-[11px]">
                          <span className="text-emerald-700 font-bold">
                            {(pres.og?.sphere ?? 0) > 0 ? `+${pres.og?.sphere}` : pres.og?.sphere} / {(pres.og?.cylinder ?? 0) > 0 ? `+${pres.og?.cylinder}` : pres.og?.cylinder}
                          </span>
                          <span className="text-slate-400 block text-[9px]">Axe: {pres.og?.axis ?? 90}° • Add: +{pres.og?.addition ?? 2.00}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">{pres.pd} mm</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 text-slate-700 font-semibold font-mono">
                            {boutiqueName}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1.2 rounded-xl border border-slate-200 text-xs">
                            <button
                              onClick={() => setSelectedPrescriptionForView(pres)}
                              title={currentLanguage === 'FR' ? "Visualiser l'Ordonnance" : "View Prescription Details"}
                              className="p-1 px-1.5 bg-white text-slate-600 rounded-lg shadow-3xs border border-slate-100 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(pres)}
                              title={currentLanguage === 'FR' ? "Modifier les paramètres" : "Edit Parameters"}
                              className="p-1 px-1.5 bg-white text-slate-600 rounded-lg shadow-3xs border border-slate-100 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => downloadPrescriptionPDF(pres)}
                              title={currentLanguage === 'FR' ? "Télécharger" : "Download PDF Rx"}
                              className="p-1 px-1.5 bg-white text-slate-600 rounded-lg shadow-3xs border border-slate-100 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedPrescriptionForAdaptation(pres)}
                              title={currentLanguage === 'FR' ? "Imprimer la Fiche d'adaptation" : "Print Fit Card"}
                              className="p-1 px-1.5 bg-white text-slate-600 rounded-lg shadow-3xs border border-slate-100 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePrescription(pres.id, pres.patientName)}
                              title={currentLanguage === 'FR' ? "Supprimer" : "Delete Prescription"}
                              className="p-1 px-1.5 bg-white text-slate-600 rounded-lg shadow-3xs border border-slate-100 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- CLINICAL VIEWER MODAL --- */}
      {selectedPrescriptionForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col font-sans text-xs">
            {/* Header banner */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
              <div>
                <span className="px-2.5 py-0.8 bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase rounded-lg border border-rose-500/30 font-mono">
                  {selectedPrescriptionForView.id}
                </span>
                <h3 className="text-base font-extrabold mt-1.5">{selectedPrescriptionForView.patientName}</h3>
                <p className="text-[11px] text-slate-400 font-medium font-mono mt-0.5">📅 {selectedPrescriptionForView.date} • {currentLanguage === 'FR' ? 'Authentifié CRM' : 'CRM Secured'}</p>
              </div>
              <button 
                onClick={() => setSelectedPrescriptionForView(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal fields details */}
            <div className="p-6 space-y-5 text-slate-700 text-xs overflow-y-auto max-h-[70vh]">
              {/* Store metadata branding */}
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Boutique d'Émission</span>
                  <span className="text-slate-800 font-extrabold font-mono text-xs">{boutiqueName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase font-black block">Opérateur de Pointage</span>
                  <span className="text-slate-650 font-bold">{currentUserEmail}</span>
                </div>
              </div>

              {/* Réfractions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50/30 border border-orange-100 rounded-2xl space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-orange-700 block">👁️ OD (Oeil Droit)</span>
                  <div className="grid grid-cols-2 gap-y-1 font-mono text-slate-700">
                    <span>Sphère:</span> <strong className="text-slate-900">{(selectedPrescriptionForView.od?.sphere ?? 0) > 0 ? `+${selectedPrescriptionForView.od?.sphere}` : selectedPrescriptionForView.od?.sphere}</strong>
                    <span>Cylindre:</span> <strong className="text-slate-900">{(selectedPrescriptionForView.od?.cylinder ?? 0) > 0 ? `+${selectedPrescriptionForView.od?.cylinder}` : selectedPrescriptionForView.od?.cylinder}</strong>
                    <span>Axe:</span> <strong className="text-slate-900">{selectedPrescriptionForView.od?.axis ?? 90}°</strong>
                    <span>Addition:</span> <strong className="text-slate-900">+{selectedPrescriptionForView.od?.addition ?? 2.00}</strong>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-emerald-700 block">👁️ OG (Oeil Gauche)</span>
                  <div className="grid grid-cols-2 gap-y-1 font-mono text-slate-700">
                    <span>Sphère:</span> <strong className="text-slate-900">{(selectedPrescriptionForView.og?.sphere ?? 0) > 0 ? `+${selectedPrescriptionForView.og?.sphere}` : selectedPrescriptionForView.og?.sphere}</strong>
                    <span>Cylindre:</span> <strong className="text-slate-900">{(selectedPrescriptionForView.og?.cylinder ?? 0) > 0 ? `+${selectedPrescriptionForView.og?.cylinder}` : selectedPrescriptionForView.og?.cylinder}</strong>
                    <span>Axe:</span> <strong className="text-slate-900">{selectedPrescriptionForView.og?.axis ?? 90}°</strong>
                    <span>Addition:</span> <strong className="text-slate-900">+{selectedPrescriptionForView.og?.addition ?? 2.00}</strong>
                  </div>
                </div>
              </div>

              {/* Pupil distance */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center font-mono">
                <span className="font-bold text-slate-500">Écart Pupillaire (EP) :</span>
                <strong className="text-slate-800 text-sm">{selectedPrescriptionForView.pd} mm</strong>
              </div>

              {/* Clinical Notes */}
              <div className="p-4 bg-blue-50/20 border border-blue-100 rounded-2xl space-y-1">
                <span className="text-[9px] font-black text-blue-800 uppercase block tracking-wider">Observations cliniques & Verres d'adaptation</span>
                <p className="text-slate-650 italic font-medium leading-relaxed font-sans">"{selectedPrescriptionForView.notes || 'Aucun détail'}"</p>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium italic">Audit Alizé : Heure et date intégrées automatiquement</span>
                <button
                  onClick={() => {
                    downloadPrescriptionPDF(selectedPrescriptionForView);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{currentLanguage === 'FR' ? 'Télécharger PDF' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CLINICAL EDIT FORM MODAL --- */}
      {selectedPrescriptionForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col font-sans text-xs">
            <div className="p-5 bg-amber-600 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Pencil className="w-4.5 h-4.5" />
                  <span>{currentLanguage === 'FR' ? 'Modifier la Prescription active' : 'Edit Active Rx'}</span>
                </h3>
                <p className="text-[10.5px] text-amber-100 font-medium">Modification de l'ID technique {selectedPrescriptionForEdit.id}</p>
              </div>
              <button 
                onClick={() => setSelectedPrescriptionForEdit(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition text-amber-200 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Nom du Patient</label>
                <input
                  type="text"
                  required
                  value={editPtName}
                  onChange={(e) => setEditPtName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl text-xs font-bold text-slate-800 font-sans"
                />
              </div>

              {/* Réfractions grid inputs */}
              <div className="grid grid-cols-2 gap-4">
                {/* OD */}
                <div className="p-4 bg-orange-50/30 border border-orange-100 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black uppercase text-orange-700 block">👁️ OD (Oeil Droit)</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <label className="text-[10px] block mb-0.5 text-slate-450">Sphère:</label>
                      <input type="text" value={editOdSph} onChange={(e) => setEditOdSph(e.target.value)} className="w-full p-1 bg-white border border-slate-200 font-mono text-center rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] block mb-0.5 text-slate-450">Cylindre:</label>
                      <input type="text" value={editOdCyl} onChange={(e) => setEditOdCyl(e.target.value)} className="w-full p-1 bg-white border border-slate-200 font-mono text-center rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] block mb-0.5 text-slate-450">Axe (°):</label>
                      <input type="text" value={editOdAxe} onChange={(e) => setEditOdAxe(e.target.value)} className="w-full p-1 bg-white border border-slate-200 font-mono text-center rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] block mb-0.5 text-slate-450">Addition:</label>
                      <input type="text" value={editOdAdd} onChange={(e) => setEditOdAdd(e.target.value)} className="w-full p-1 bg-white border border-slate-200 font-mono text-center rounded focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* OG */}
                <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block">👁️ OG (Oeil Gauche)</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <label className="text-[10px] block mb-0.5 text-slate-450">Sphère:</label>
                      <input type="text" value={editOgSph} onChange={(e) => setEditOgSph(e.target.value)} className="w-full p-1 bg-white border border-slate-200 font-mono text-center rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] block mb-0.5 text-slate-450">Cylindre:</label>
                      <input type="text" value={editOgCyl} onChange={(e) => setEditOgCyl(e.target.value)} className="w-full p-1 bg-white border border-slate-200 font-mono text-center rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] block mb-0.5 text-slate-450">Axe (°):</label>
                      <input type="text" value={editOgAxe} onChange={(e) => setEditOgAxe(e.target.value)} className="w-full p-1 bg-white border border-slate-200 font-mono text-center rounded focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] block mb-0.5 text-slate-450">Addition:</label>
                      <input type="text" value={editOgAdd} onChange={(e) => setEditOgAdd(e.target.value)} className="w-full p-1 bg-white border border-slate-200 font-mono text-center rounded focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* EP & Notes */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider font-sans">Écart (EP) mm</label>
                  <input
                    type="text"
                    required
                    value={editPd}
                    onChange={(e) => setEditPd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none font-mono text-center font-bold text-slate-800 rounded-xl"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider font-sans">Ajustements techniques d'Atelier</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none font-sans text-xs font-semibold text-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPrescriptionForEdit(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 font-sans font-bold rounded-xl transition cursor-pointer"
                >
                  {currentLanguage === 'FR' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-sans font-bold rounded-xl transition cursor-pointer shadow-sm"
                >
                  {currentLanguage === 'FR' ? 'Enregistrer les modifications' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FICHE D'ADAPTATION MODAL PREVIEW (Imprimer) --- */}
      {selectedPrescriptionForAdaptation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col font-sans text-xs">
            {/* Header */}
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 bg-indigo-500/35 text-indigo-100 text-[10px] uppercase font-black rounded-lg border border-indigo-400/40">
                  {currentLanguage === 'FR' ? 'Fiche d\'Adaptation' : 'Fit Record Verification'}
                </span>
                <h3 className="text-lg font-black mt-2">{selectedPrescriptionForAdaptation.patientName}</h3>
                <p className="text-xs text-indigo-200 font-medium">Pointage de conformité d'assemblage officiel • {selectedPrescriptionForAdaptation.id}</p>
              </div>
              <button 
                onClick={() => setSelectedPrescriptionForAdaptation(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Preview Area */}
            <div className="p-6 space-y-6 text-slate-700 text-xs overflow-y-auto max-h-[60vh]">
              
              {/* Header metadata branding */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex justify-between items-center bg-indigo-50/20 border-indigo-100/40 text-xs">
                <div>
                  <span className="text-[9px] text-[#4F46E5] uppercase font-black tracking-wider block">Boutique Technique</span>
                  <span className="text-slate-900 font-extrabold text-sm font-sans">{boutiqueName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase font-black block">Date & Heure de Diagnostic</span>
                  <span className="text-slate-750 font-bold font-mono text-[11px]">📅 {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Réfractions table parameters */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest font-sans">1. Valeurs Réfractives d'Atelier</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* OD */}
                  <div className="p-3.5 bg-orange-50/30 border border-orange-100 rounded-xl space-y-1.5 font-mono text-[11px]">
                    <span className="text-[9px] font-black text-orange-700 uppercase tracking-wider block mb-1 font-sans">Oeil Droit (OD)</span>
                    <div className="grid grid-cols-2 gap-y-0.5 text-slate-650">
                      <span>Sphère :</span> <strong className="text-slate-900">{(selectedPrescriptionForAdaptation.od?.sphere ?? 0) > 0 ? `+${selectedPrescriptionForAdaptation.od?.sphere}` : selectedPrescriptionForAdaptation.od?.sphere}</strong>
                      <span>Cylindre :</span> <strong className="text-slate-900">{(selectedPrescriptionForAdaptation.od?.cylinder ?? 0) > 0 ? `+${selectedPrescriptionForAdaptation.od?.cylinder}` : selectedPrescriptionForAdaptation.od?.cylinder}</strong>
                      <span>Axe :</span> <strong className="text-slate-900">{selectedPrescriptionForAdaptation.od?.axis ?? 90}°</strong>
                      <span>Addition :</span> <strong className="text-slate-900">+{selectedPrescriptionForAdaptation.od?.addition ?? 2.00}</strong>
                    </div>
                  </div>

                  {/* OG */}
                  <div className="p-3.5 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-1.5 font-mono text-[11px]">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block mb-1 font-sans font-sans">Oeil Gauche (OG)</span>
                    <div className="grid grid-cols-2 gap-y-0.5 text-slate-650">
                      <span>Sphère :</span> <strong className="text-slate-900">{(selectedPrescriptionForAdaptation.og?.sphere ?? 0) > 0 ? `+${selectedPrescriptionForAdaptation.og?.sphere}` : selectedPrescriptionForAdaptation.og?.sphere}</strong>
                      <span>Cylindre :</span> <strong className="text-slate-900">{(selectedPrescriptionForAdaptation.og?.cylinder ?? 0) > 0 ? `+${selectedPrescriptionForAdaptation.og?.cylinder}` : selectedPrescriptionForAdaptation.og?.cylinder}</strong>
                      <span>Axe :</span> <strong className="text-slate-900">{selectedPrescriptionForAdaptation.og?.axis ?? 90}°</strong>
                      <span>Addition :</span> <strong className="text-slate-900">+{selectedPrescriptionForAdaptation.og?.addition ?? 2.00}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adaptation metrics check list */}
              <div className="space-y-2 font-sans">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest font-sans">2. Paramètres Avancés d'Adaptation et Montage</h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 grid grid-cols-1 sm:grid-cols-2 gap-4 font-medium text-slate-650 text-xs">
                  <div className="space-y-1.5 justify-between">
                    <div>• Écart Pupillaire (EP) : <strong className="text-slate-900 font-mono text-[11px]">{selectedPrescriptionForAdaptation.pd} mm</strong></div>
                    <div>• Hauteur de Montage : <strong className="text-slate-900 font-mono text-[11px]">18.5 mm</strong></div>
                    <div>• Distance Oeil-Verre : <strong className="text-slate-900 font-mono text-[11px]">12.0 mm standard</strong></div>
                  </div>
                  <div className="space-y-1.5">
                    <div>• Angle Pantoscopique : <strong className="text-slate-900 font-mono text-[11px]">8.0° d'inclinaison</strong></div>
                    <div>• Centrage & Alignement : <strong className="text-emerald-700 font-black">Validé pupillomètre laser</strong></div>
                    <div>• Type de verre spécifié : <strong className="text-slate-900 font-sans">Progressif Aminci Antireflet-hydrophobe</strong></div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/20 border border-blue-100 rounded-xl text-xs space-y-1">
                <span className="text-[9px] font-black text-[#1D4ED8] uppercase tracking-widest block font-sans">Observations d'Ajustage</span>
                <p className="text-slate-650 font-medium italic">"{selectedPrescriptionForAdaptation.notes || 'L\'ajustage de meulage se déroule de façon standard d\'atelier.'}"</p>
              </div>

              <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-100">
                <span>Émetteur : {currentUserEmail}</span>
                <span>Authenticité certifiée Alizé OPTIC</span>
              </div>
            </div>

            {/* Print and PDF trigger controls */}
            <div className="p-6 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <span className="text-[10px] text-slate-450 italic text-center sm:text-left">
                Imprimez directement la fiche physique ou téléchargez la version numérique scellée.
              </span>
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>{currentLanguage === 'FR' ? 'Lancer l\'Impression' : 'Print Fit Card'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadAdaptationPDF(selectedPrescriptionForAdaptation);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{currentLanguage === 'FR' ? 'Télécharger PDF' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeSubTab === 'patients' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  {currentLanguage === 'FR' ? 'Patients Reçus en Clinique & Prescriptions' : 'Patients Received in Clinic & Prescriptions'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Registre consolidé de tous les patients ayant effectué un examen de la vue ou bénéficiant d'une prescription active.
                </p>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setPatientTabMode('prescrits')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${patientTabMode === 'prescrits' ? 'bg-rose-500 text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Patients Prescrits
                </button>
                <button
                  type="button"
                  onClick={() => setPatientTabMode('registre')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${patientTabMode === 'registre' ? 'bg-[#0097A7] text-white shadow-3xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Registre des Clients
                </button>
              </div>
            </div>

            {patientTabMode === 'prescrits' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/70">
                    <tr>
                      <th className="p-3.5">ID Dossier</th>
                      <th className="p-3.5">Nom du Patient</th>
                      <th className="p-3.5 text-center">Examens Effectués</th>
                      <th className="p-3.5 text-center">Prescriptions Émises</th>
                      <th className="p-3.5">Dernière Visite</th>
                      <th className="p-3.5 text-right font-mono">Statut Clinique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receivedPatients.filter(pt => pt.presCount > 0).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-medium italic">
                          Aucun patient avec prescription active trouvé.
                        </td>
                      </tr>
                    ) : (
                      receivedPatients.filter(pt => pt.presCount > 0).map((pt) => (
                        <tr key={pt.name} className="hover:bg-slate-50/50 transition">
                          <td className="p-3.5 font-mono font-bold text-rose-600">{pt.id}</td>
                          <td className="p-3.5 font-bold text-slate-800">{pt.name}</td>
                          <td className="p-3.5 text-center font-bold">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px]">
                              {pt.examCount}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px]">
                              {pt.presCount}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">{pt.lastDate}</td>
                          <td className="p-3.5 text-right">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold">
                              Sous Ordonnance 🩺
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/70">
                    <tr>
                      <th className="p-3.5">Matricule Client</th>
                      <th className="p-3.5">Prénom & Nom</th>
                      <th className="p-3.5">Téléphone</th>
                      <th className="p-3.5">Adresse / Localisation</th>
                      <th className="p-3.5">Agence de Rattachement</th>
                      <th className="p-3.5 text-right">Statut Base</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dynamicCrmPatients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-medium italic">
                          Aucun client enregistré dans la base CRM.
                        </td>
                      </tr>
                    ) : (
                      dynamicCrmPatients.map((pt) => (
                        <tr key={pt.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3.5 font-mono font-bold text-[#0097a7]">{pt.id}</td>
                          <td className="p-3.5 font-bold text-slate-800">{`${pt.firstName} ${pt.lastName || ''}`}</td>
                          <td className="p-3.5 font-mono font-semibold text-slate-655">{pt.phone || 'Non spécifié'}</td>
                          <td className="p-3.5 text-slate-600 font-medium">{pt.ssn || pt.address || 'Non spécifiée'}</td>
                          <td className="p-3.5 font-sans font-bold text-slate-700 shrink-0">
                            🏢 {pt.branch || 'Paris Nation'}
                          </td>
                          <td className="p-3.5 text-right">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                              Enregistré ✓
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
