import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchCustomers, saveCustomer, fetchProducts, saveProduct, deleteCustomer, deleteProduct } from '../lib/api';
import { 
  FolderLock, UserCheck, Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, 
  Truck, CornerUpLeft, ClipboardList, RefreshCw, BarChart2, Layers, 
  Eye, Save, Trash2, Calendar, FileText, CheckCircle2, ChevronRight, Tags,
  Layers3, X, Sparkles, Box, SlidersHorizontal, Edit2, Printer,
  AlertTriangle, ShieldAlert, ArrowLeftRight
} from 'lucide-react';

// --- TS Types & Schemas ---
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyTier: 'VIP' | 'REGULAR' | 'PREMIUM';
  lastVisit: string;
  branch?: string;
  ssn?: string;
}

interface StockVoucher {
  id: string;
  type: 'ENTREE' | 'SORTIE' | 'COMMANDE' | 'DISTRIBUTION' | 'TRANSFERT' | 'RETOUR';
  reference: string;
  date: string;
  partner: string; // Supplier, Client or Branch
  itemsCount: number;
  totalValueFCFA: number;
  status: 'Brouillon' | 'En attente' | 'En Transit' | 'Validé' | 'Terminé';
  notes?: string;
}

export interface ComponentItem {
  id: string;
  type: 'MONTURE' | 'ACCESSOIRE' | 'VERRE' | 'TRAITEMENT';
  name: string;
  brand: string;
  sku: string;
  stock: number;
  priceFCFA: number;
  spec?: string; // e.g. Index, material, color, treatment type
}

// --- Initial Seed Data ---
const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_VOUCHERS: StockVoucher[] = [];

export const INITIAL_COMPONENTS: ComponentItem[] = [];

interface GestionOpticModuleProps {
  currentLanguage?: 'FR' | 'EN';
}

export default function GestionOpticModule({ currentLanguage = 'FR' }: GestionOpticModuleProps) {
  // Navigation states
  const [activeCategory, setActiveCategory] = useState<'MAGASIN' | 'STOCK' | 'COMPOSANTES' | 'BOUTIQUES'>('MAGASIN');
  const [activeTab, setActiveTab] = useState<string>('BASE_CLIENTS');

  // Interactive role states (simulates Gérant vs Boutique teams)
  const [currentRole, setCurrentRole] = useState<any>('GESTIONNAIRE');

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
      { id: 'store-dk', name: 'Agence Alpha', country: 'Zone Ouest', city: 'Dakar' },
      { id: 'store-ab', name: 'Agence Bêta', country: 'Zone Ouest', city: 'Abidjan' },
      { id: 'store-lm', name: 'Agence Gamma', country: 'Zone Ouest', city: 'Lomé' }
    ];
  });

  const [selectedOpticBoutique, setSelectedOpticBoutique] = useState<string>(() => {
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

  // --- UNROLLED MULTI-BOUTIQUES STOCKS ---
  const [boutiqueStocks, setBoutiqueStocks] = useState<any[]>(() => {
    try {
      const savedBranches = localStorage.getItem('optic_hq_branches');
      let branchesList = [];
      if (savedBranches) {
        const parsed = JSON.parse(savedBranches);
        if (Array.isArray(parsed)) branchesList = parsed;
      }
      if (branchesList.length > 0) {
        return branchesList.map((b, index) => {
          const storeIdFallback = index === 0 ? 'store-dk' : index === 1 ? 'store-ab' : index === 2 ? 'store-lm' : `store-${b.id}`;
          return {
            id: storeIdFallback,
            name: b.name.replace(/Boutique/g, 'Agence'),
            country: b.zone_id === 'ZONE-UEMOA' ? 'Zone Ouest' : b.zone_id === 'ZONE-CEMAC' ? 'Zone Centrale' : 'Zone Nord',
            items: []
          };
        });
      }
    } catch (e) {}

    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }

    return [
      {
        id: 'store-dk',
        name: 'Agence Alpha',
        country: 'Zone Ouest',
        items: []
      },
      {
        id: 'store-ab',
        name: 'Agence Bêta',
        country: 'Zone Ouest',
        items: []
      },
      {
        id: 'store-lm',
        name: 'Agence Gamma',
        country: 'Zone Ouest',
        items: []
      }
    ];
  });

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
            setBoutiqueStocks(parsed.map((b, index) => {
              const storeIdFallback = index === 0 ? 'store-dk' : index === 1 ? 'store-ab' : index === 2 ? 'store-lm' : `store-${b.id}`;
              return {
                id: storeIdFallback,
                name: b.name.replace(/Boutique/g, 'Agence'),
                country: b.zone_id === 'ZONE-UEMOA' ? 'Zone Ouest' : b.zone_id === 'ZONE-CEMAC' ? 'Zone Centrale' : 'Zone Nord',
                items: []
              };
            }));
          }
        } else if (localStorage.getItem('optic_system_factory_reset') === 'true') {
          setLocalBranches([]);
          setBoutiqueStocks([]);
        }
      } catch (e) {}
    };
    window.addEventListener('storage', handleSync);
    handleSync();
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [selectedSupplyStoreId, setSelectedSupplyStoreId] = useState('');
  const [supplySku, setSupplySku] = useState('RB2140-50');
  const [supplyQty, setSupplyQty] = useState('');

  const [showTransferStockModal, setShowTransferStockModal] = useState(false);
  const [stockTransferSource, setStockTransferSource] = useState('store-dk');
  const [stockTransferDest, setStockTransferDest] = useState('store-ab');
  const [transferSku, setTransferSku] = useState('RB2140-50');
  const [transferWeightQty, setTransferWeightQty] = useState('');

  const handleBoutiqueStockSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplyStoreId || !supplySku || !supplyQty) {
      alert('Veuillez remplir tous les champs d\'approvisionnement.');
      return;
    }
    const val = parseInt(supplyQty);
    if (isNaN(val) || val <= 0) {
      alert('Quantité de réapprovisionnement non valide.');
      return;
    }

    // Verify and deduct from Stock General (componentsList)
    const targetComp = componentsList.find(c => c.sku === supplySku);
    if (!targetComp) {
      alert("Cet article n'existe pas dans le catalogue du Stock Général d'Optic Alizé.");
      return;
    }
    if (targetComp.stock < val) {
      alert(`Stock insuffisant dans le Dépôt Central : seulement ${targetComp.stock} disponibles. Veuillez réapprovisionner le Dépôt d'abord.`);
      return;
    }

    // Deduct and sync to PostgreSQL Database
    const updatedComp = {
      ...targetComp,
      stock: Math.max(0, targetComp.stock - val)
    };
    syncProductToDb(updatedComp);

    // Add to Boutique Stock
    const updated = boutiqueStocks.map(store => {
      if (store.id === selectedSupplyStoreId) {
        return {
          ...store,
          items: store.items.map(item => {
            if (item.sku === supplySku) {
              return { ...item, qty: item.qty + val };
            }
            return item;
          })
        };
      }
      return store;
    });

    setBoutiqueStocks(updated);
    setShowSupplyModal(false);
    setSupplyQty('');
    alert(`Transfert logistique réussi : -${val} unités déduites du Stock Général et ajoutées à la boutique.`);
  };

  const handleRecordBoutiqueSale = (storeId: string, sku: string) => {
    let success = true;
    setBoutiqueStocks(prev => prev.map(store => {
      if (store.id === storeId) {
        return {
          ...store,
          items: store.items.map(item => {
            if (item.sku === sku) {
              if (item.qty <= 0) {
                alert("Erreur : Rupture de stock de cet article dans votre boutique ! Veuillez demander un réapprovisionnement.");
                success = false;
                return item;
              }
              return { ...item, qty: item.qty - 1 };
            }
            return item;
          })
        };
      }
      return store;
    }));
    
    if (success) {
      alert("Vente enregistrée avec succès ! Le stock local de votre boutique d'optique a été décrémenté de 1 unité.");
    }
  };

  const handleBoutiqueStockTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockTransferSource || !stockTransferDest || !transferSku || !transferWeightQty) {
      alert('Veuillez remplir tous les champs de transfert.');
      return;
    }
    if (stockTransferSource === stockTransferDest) {
      alert('Les boutiques source et de destination doivent être de pays différents.');
      return;
    }
    const val = parseInt(transferWeightQty);
    if (isNaN(val) || val <= 0) {
      alert('Quantité de transfert non valide.');
      return;
    }

    const sourceStore = boutiqueStocks.find(s => s.id === stockTransferSource);
    const sourceItem = sourceStore?.items.find(i => i.sku === transferSku);
    if (!sourceItem || sourceItem.qty < val) {
      alert(`Stock insuffisant dans la boutique source (${sourceItem?.qty || 0} disponibles).`);
      return;
    }

    const updated = boutiqueStocks.map(store => {
      if (store.id === stockTransferSource) {
        return {
          ...store,
          items: store.items.map(item => {
            if (item.sku === transferSku) return { ...item, qty: item.qty - val };
            return item;
          })
        };
      }
      if (store.id === stockTransferDest) {
        return {
          ...store,
          items: store.items.map(item => {
            if (item.sku === transferSku) return { ...item, qty: item.qty + val };
            return item;
          })
        };
      }
      return store;
    });

    setBoutiqueStocks(updated);
    setShowTransferStockModal(false);
    setTransferWeightQty('');
    alert(`Transfert de stock réussi : ${val} unités transférées.`);
  };

  // Interactive local states (seeded with default) - cleared for sandbox tests
  // Synchronized Customer List (Binds with CRM Module)
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [componentsList, setComponentsList] = useState<ComponentItem[]>([]);

  const loadData = React.useCallback(() => {
    fetchCustomers().then(data => {
      setCustomersList(data.map((c: any) => ({
        id: c.id,
        name: c.name || `${c.firstName} ${c.lastName || ''}`.trim(),
        phone: c.phone || '',
        email: c.email || '',
        loyaltyTier: (c.loyaltyTier === 'REGULAR' || c.loyaltyTier === 'STANDARD' ? 'REGULAR' : c.loyaltyTier) as any,
        lastVisit: c.lastVisit || c.registrationDate || new Date().toISOString().substring(0, 10),
        branch: c.branch || 'Paris Nation',
        ssn: c.ssn || ''
      })));
    }).catch(err => console.error("Failed to fetch customers in GestionOpticModule:", err));

    fetchProducts().then(data => {
      setComponentsList(data.map((p: any) => ({
        id: p.id,
        type: p.category as any,
        name: p.name,
        brand: p.brand,
        sku: p.barcode || p.id,
        stock: 999, // default general stock if not specified
        priceFCFA: p.price,
        spec: p.icon || 'Standard optique calibré'
      })));
    }).catch(err => console.error("Failed to fetch products in GestionOpticModule:", err));
  }, []);

  React.useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const [transferringCustomer, setTransferringCustomer] = useState<Customer | null>(null);
  const [transferTargetBranch, setTransferTargetBranch] = useState<string>('Paris Nation');

  // Deletion Confirmation Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'customer' | 'voucher' | 'component';
    id: string;
    title: string;
    message: string;
  } | null>(null);

  const [vouchersList, setVouchersList] = useState<StockVoucher[]>(() => {
    const saved = localStorage.getItem('optic_vouchers_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  React.useEffect(() => {
    localStorage.setItem('optic_vouchers_list', JSON.stringify(vouchersList));
  }, [vouchersList]);

  // Search and filter queries
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPartner, setFilterPartner] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState<string | null>(null);

  // States for editing entries (pencil icon)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<StockVoucher | null>(null);
  const [editingComponent, setEditingComponent] = useState<ComponentItem | null>(null);

  // State to trigger beautiful themed print-to-PDF templates
  const [printingItem, setPrintingItem] = useState<{ type: 'client' | 'voucher' | 'component'; data: any } | null>(null);

  const handleDownloadPDF = (printingItem: { type: 'client' | 'voucher' | 'component'; data: any }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Erreur de blocage publicitaire, veuillez autoriser les fenêtres pop-up.");
      return;
    }
    
    let contentHtml = '';
    const dateStr = new Date().toLocaleDateString('fr-FR');
    
    if (printingItem.type === 'client') {
      contentHtml = `
        <div style="background-color: #f0f7ff; padding: 15px; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 20px;">
          <span style="font-size: 10px; color: #1d4ed8; font-weight: bold; letter-spacing: 0.1em; display: block;">IDENTIFIANT CLIENT</span>
          <h3 style="color: #d97706; font-family: monospace; font-size: 18px; margin: 5px 0 0 0;">${printingItem.data.id || 'N/A'}</h3>
          <div style="margin-top: 10px;">
            <span style="font-size: 10px; color: #4b5563; font-weight: bold; display: block;">FIDÉLITÉ</span>
            <strong style="font-size: 14px; color: #1f2937;">🏆 ${printingItem.data.loyaltyTier || 'REGULAR'}</strong>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <span style="font-size: 10px; color: #9ca3af; font-weight: bold; text-transform: uppercase;">Détails d'Identité</span>
            <p style="font-size: 14px; font-weight: bold; color: #111827; margin: 5px 0 0 0;">${printingItem.data.name || 'N/A'}</p>
            <p style="font-size: 11px; color: #6b7280; margin: 2px 0 0 0;">Consultation Active</p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <span style="font-size: 10px; color: #9ca3af; font-weight: bold; text-transform: uppercase;">Coordonnées</span>
            <p style="font-size: 14px; font-family: monospace; font-weight: bold; color: #111827; margin: 5px 0 0 0;">${printingItem.data.phone || 'N/A'}</p>
            <p style="font-size: 11px; color: #6b7280; margin: 2px 0 0 0;">${printingItem.data.email || 'N/A'}</p>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px; line-height: 1.5;">
          <h4 style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #374151; margin: 0 0 10px 0;">📜 Historique de Consultation (Optic Alizé Secure System)</h4>
          <p style="font-size: 12px; color: #4b5563; margin: 0;">
            Le patient a effectué sa dernière vérification de réfraction visuelle le <strong style="color: #1f2937;">${printingItem.data.lastVisit || 'N/A'}</strong>. Équipement recommandé : Verres correcteurs progressifs Essilor à index de réfraction élevé anti-fatigue.
          </p>
        </div>
      `;
    } else if (printingItem.type === 'voucher') {
      const formattedPrice = (printingItem.data.totalValueFCFA || 0).toLocaleString();
      contentHtml = `
        <div style="background-color: #f5f3ff; padding: 15px; border-radius: 8px; border: 1px solid #ddd6fe; margin-bottom: 20px;">
          <span style="font-size: 10px; color: #6d28d9; font-weight: bold; letter-spacing: 0.1em; display: block;">BON DE MOUVEMENT</span>
          <h3 style="color: #e11d48; font-family: monospace; font-size: 18px; margin: 5px 0 0 0;">${printingItem.data.reference || 'N/A'}</h3>
          <div style="margin-top: 10px;">
            <span style="font-size: 10px; color: #4b5563; font-weight: bold; display: block;">STATUT DE FLUX</span>
            <span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 11px; font-family: monospace; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-top: 3px;">
              ${printingItem.data.status || 'En attente'}
            </span>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; font-family: monospace;">
          <div style="background-color: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-family: sans-serif;">Date Émission</span><br/>
            <span style="font-size: 13px; font-weight: bold; color: #1f2937;">${printingItem.data.date || 'N/A'}</span>
          </div>
          <div style="background-color: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
            <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-family: sans-serif;">Volume de Pièces</span><br/>
            <span style="font-size: 13px; font-weight: bold; color: #6d28d9;">${printingItem.data.itemsCount || 0} unités</span>
          </div>
          <div style="background-color: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: right;">
            <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-family: sans-serif;">Coût global</span><br/>
            <span style="font-size: 13px; font-weight: bold; color: #1f2937;">${formattedPrice} FCFA</span>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
          <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold;">Tiers Partenaire Référencé</span>
          <strong style="font-size: 13px; color: #111827; display: block; margin-top: 5px;">${printingItem.data.partner || 'N/A'}</strong>
        </div>
        ${printingItem.data.notes ? `
          <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px; border: 1px solid #f3e8ff; font-size: 12px; margin-bottom: 20px;">
            <strong style="color: #4b5563; display: block; margin-bottom: 5px;">Notes logistiques :</strong>
            <p style="color: #6b7280; margin: 0;">${printingItem.data.notes}</p>
          </div>
        ` : ''}
      `;
    } else if (printingItem.type === 'component') {
      const formattedPrice = (printingItem.data.priceFCFA || 0).toLocaleString();
      contentHtml = `
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0; margin-bottom: 20px;">
          <span style="font-size: 10px; color: #047857; font-weight: bold; letter-spacing: 0.1em; display: block;">RÉFÉRENCE COMPOSANTE (SKU)</span>
          <h3 style="color: #047857; font-family: monospace; font-size: 18px; margin: 5px 0 0 0;">${printingItem.data.sku || 'N/A'}</h3>
          <div style="margin-top: 10px;">
            <span style="font-size: 10px; color: #4b5563; font-weight: bold; display: block;">CATÉGORISATION</span>
            <span style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-family: monospace; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-top: 3px;">
              ${printingItem.data.type || 'N/A'}
            </span>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-family: monospace;">
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-family: sans-serif;">Quantité Disponible</span><br/>
            <strong style="font-size: 14px; color: #1f2937;">${printingItem.data.stock === 999 ? 'Entreposé en quantité illimitée' : `${printingItem.data.stock || 0} unités`}</strong>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-family: sans-serif;">Tarification unitaire</span><br/>
            <strong style="font-size: 14px; color: #059669;">${formattedPrice} FCFA</strong>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
          <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold;">Spécifications constructeur</span>
          <strong style="font-size: 14px; color: #111827; display: block; margin-top: 5px;">${printingItem.data.name || 'N/A'}</strong>
          <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold; display: block; margin-top: 3px;">Marque : ${printingItem.data.brand || 'N/A'}</span>
          <p style="margin-top: 10px; color: #4b5563; font-size: 12px; font-style: italic; line-height: 1.5;">
            Descriptif Technique : "${printingItem.data.spec || 'Aucune spécification technique constructeur particulière.'}"
          </p>
        </div>
      `;
    }

    const docTitle = printingItem.type === 'client' 
      ? 'Client_' + (printingItem.data.id || '') 
      : printingItem.type === 'voucher' 
        ? 'Bon_' + (printingItem.data.reference || '') 
        : 'Composant_' + (printingItem.data.sku || '');

    const documentHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${docTitle}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #1a1a1a;
            background-color: #fff;
            margin: 0;
            padding: 40px;
            font-size: 12px;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px dashed #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h2 {
            margin: 0;
            color: #2563eb;
            font-size: 18px;
            font-weight: 800;
        }
        .header p {
            margin: 3px 0;
            color: #4b5563;
        }
        .badge {
            background-color: #111827;
            color: #fff;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            font-family: monospace;
            text-transform: uppercase;
            display: inline-block;
        }
        .signatures {
            margin-top: 40px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 45%;
        }
        .signature-title {
            font-size: 10px;
            color: #94a3b8;
            font-family: monospace;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .stamp {
            height: 50px;
            background-color: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-style: italic;
            color: #94a3b8;
            font-size: 10px;
        }
        .footer-banner {
            margin-top: 30px;
            background-color: #030712;
            color: #9ca3af;
            padding: 8px;
            text-align: center;
            font-size: 9px;
            font-family: monospace;
            border-radius: 6px;
        }
        @media print {
            body { padding: 0; }
            .container { border: none; box-shadow: none; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h2>🔬 ATELIER CENTRAL OPTIC ALIZÉ</h2>
                <p style="font-size: 11px; font-weight: bold;">Atelier Central • Chaîne d'Alizés</p>
                <p style="font-size: 10px; color: #6b7280;">Registre : GL-REG-2026-B15 • Service Optométrie & Réfraction</p>
            </div>
            <div style="text-align: right;">
                <div class="badge">DOCUMENT D'ARCHIVE</div>
                <p style="font-size: 10px; color: #6b7280; margin-top: 5px;">Généré le : ${dateStr}</p>
            </div>
        </div>
        
        <div id="print-main-content">
            ${contentHtml}
        </div>
        
        <div class="signatures">
            <div class="signature-box">
                <div class="signature-title">Signature Resp. Technique</div>
                <div class="stamp">Optic Alizé Approved</div>
            </div>
            <div class="signature-box" style="text-align: right;">
                <div class="signature-title">Visa Direction Générale</div>
                <div class="stamp" style="color: #2563eb; border-color: #dbeafe; background-color: #eff6ff;">[SÉCURISÉ NUMÉRIQUEMENT]</div>
            </div>
        </div>
        
        <div class="footer-banner">
            ⚠️ DOCUMENT STRICTEMENT CONFIDENTIEL À USAGE COMPTABLE DE G-LAB TECH OPTIC ALIZÉ.
        </div>
    </div>

    <script type="text/javascript">
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`;

    printWindow.document.write(documentHtml);
    printWindow.document.close();
  };

  // Modal forms states
  // Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustTier, setNewCustTier] = useState<'VIP' | 'REGULAR' | 'PREMIUM'>('REGULAR');

  // Stock Voucher Form
  const [vType, setVType] = useState<'ENTREE' | 'SORTIE' | 'COMMANDE' | 'DISTRIBUTION' | 'TRANSFERT' | 'RETOUR'>('ENTREE');
  const [vPartner, setVPartner] = useState('');
  const [vItems, setVItems] = useState(1);
  const [vValue, setVValue] = useState(0);
  const [vNotes, setVNotes] = useState('');

  // Component Item Form
  const [compType, setCompType] = useState<'MONTURE' | 'ACCESSOIRE' | 'VERRE' | 'TRAITEMENT'>('MONTURE');
  const [compName, setCompName] = useState('');
  const [compBrand, setCompBrand] = useState('');
  const [compSku, setCompSku] = useState('');
  const [compStock, setCompStock] = useState(10);
  const [compPrice, setCompPrice] = useState(0);
  const [compSpec, setCompSpec] = useState('');

  // Auto category & tab router sync helper
  const handleCategoryChange = (cat: 'MAGASIN' | 'STOCK' | 'COMPOSANTES' | 'BOUTIQUES') => {
    setActiveCategory(cat);
    if (cat === 'MAGASIN') {
      setActiveTab('BASE_CLIENTS');
    } else if (cat === 'STOCK') {
      setActiveTab('BON_COMMANDE');
    } else if (cat === 'COMPOSANTES') {
      setActiveTab('MONTURES');
    } else if (cat === 'BOUTIQUES') {
      setActiveTab('BOUTIQUES_STOCKS');
    }
    setSearchQuery('');
  };

  // --- Actions & Helpers ---
  const isCustomerInRoleBranch = (cBranch?: string) => {
    if (currentRole === 'GESTIONNAIRE') return true;
    const normalized = (cBranch || '').toLowerCase();
    if (currentRole === 'BOUTIQUE_DK') {
      return normalized.includes('alpha') || normalized.includes('paris') || normalized === '';
    }
    if (currentRole === 'BOUTIQUE_AB') {
      return normalized.includes('bêt') || normalized.includes('beta') || normalized.includes('lyon');
    }
    if (currentRole === 'BOUTIQUE_LM') {
      return normalized.includes('gamm') || normalized.includes('marseille') || normalized.includes('bordeaux');
    }
    return true;
  };

  const syncProductToDb = async (comp: ComponentItem) => {
    const payload = {
      id: comp.id,
      name: comp.name,
      brand: comp.brand || 'G-LAB Premium',
      category: comp.type, // maps to category
      price: comp.priceFCFA, // maps to price
      barcode: comp.sku, // maps to barcode
      icon: comp.spec || 'Standard optique calibré' // maps to icon
    };
    try {
      await saveProduct(payload);
      loadData();
    } catch (e) {
      console.error("Failed to sync product to database:", e);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    // Calculate sequential identification matricule
    let nextNum = 1;
    customersList.forEach(c => {
      if (c.id.startsWith('OA-CL-')) {
        const parts = c.id.split('-');
        const numPart = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(numPart) && numPart >= nextNum) {
          nextNum = numPart + 1;
        }
      }
    });
    const nextId = `OA-CL-${String(nextNum).padStart(3, '0')}`;
    const activeDestBranch = currentRole === 'BOUTIQUE_AB' ? 'Lyon Bellecour' : currentRole === 'BOUTIQUE_LM' ? 'Marseille Vieux-Port' : 'Paris Nation';

    const nameParts = newCustName.split(' ');
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || 'Nouveau';

    const payload = {
      id: nextId,
      firstName,
      lastName,
      birthDate: '1990-01-01',
      email: newCustEmail || 'aucun-email@opticalize.com',
      phone: newCustPhone || '+221 77 111 22 33',
      ssn: '',
      registrationDate: new Date().toISOString().substring(0, 10),
      loyaltyTier: newCustTier === 'REGULAR' ? 'STANDARD' : newCustTier || 'STANDARD',
      loyaltyPoints: newCustTier === 'VIP' ? 1000 : 0,
      branchId: activeDestBranch === 'Lyon Bellecour' ? 'store-ab' : activeDestBranch === 'Marseille Vieux-Port' ? 'store-lm' : 'store-dk',
      prescriptionsJson: JSON.stringify([]),
      purchasesJson: JSON.stringify([]),
      paymentsJson: JSON.stringify([])
    };

    try {
      await saveCustomer(payload);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustTier('REGULAR');
      setShowAddModal(null);
      loadData();
    } catch (err) {
      console.error("Failed to add customer:", err);
      alert("Erreur de sauvegarde du patient dans PostgreSQL.");
    }
  };

  const handleTransferCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringCustomer) return;
    
    const nameParts = transferringCustomer.name.split(' ');
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || 'Nouveau';

    const payload = {
      id: transferringCustomer.id,
      firstName,
      lastName,
      birthDate: '1990-01-01',
      email: transferringCustomer.email || 'aucun-email@opticalize.com',
      phone: transferringCustomer.phone,
      ssn: transferringCustomer.ssn || '',
      registrationDate: new Date().toISOString().substring(0, 10),
      loyaltyTier: transferringCustomer.loyaltyTier === 'REGULAR' ? 'STANDARD' : transferringCustomer.loyaltyTier || 'STANDARD',
      loyaltyPoints: 0,
      branchId: transferTargetBranch === 'Lyon Bellecour' ? 'store-ab' : transferTargetBranch === 'Marseille Vieux-Port' ? 'store-lm' : 'store-dk',
      prescriptionsJson: JSON.stringify([]),
      purchasesJson: JSON.stringify([]),
      paymentsJson: JSON.stringify([])
    };

    try {
      await saveCustomer(payload);
      setTransferringCustomer(null);
      loadData();
    } catch (err) {
      console.error("Failed to transfer customer:", err);
    }
  };

  const handleAddVoucher = (typeOverride?: 'ENTREE' | 'SORTIE' | 'COMMANDE' | 'DISTRIBUTION' | 'TRANSFERT' | 'RETOUR') => {
    const finalType = typeOverride || vType;
    let refPrefix = 'VCH';
    switch (finalType) {
      case 'ENTREE': refPrefix = 'BE'; break;
      case 'SORTIE': refPrefix = 'BS'; break;
      case 'COMMANDE': refPrefix = 'BC'; break;
      case 'DISTRIBUTION': refPrefix = 'DS'; break;
      case 'TRANSFERT': refPrefix = 'TR'; break;
      case 'RETOUR': refPrefix = 'BR'; break;
    }

    const newVch: StockVoucher = {
      id: `VCH-${Math.floor(100 + Math.random() * 900)}`,
      type: finalType,
      reference: `${refPrefix}-2026-${Math.floor(100 + Math.random() * 899)}`,
      date: new Date().toISOString().split('T')[0],
      partner: vPartner || 'Fournisseur Général Optique',
      itemsCount: vItems > 0 ? vItems : Math.floor(Math.random() * 50) + 1,
      totalValueFCFA: vValue > 0 ? vValue : (Math.floor(Math.random() * 8) + 1) * 125000,
      status: finalType === 'ENTREE' || finalType === 'RETOUR' ? 'Validé' : 'En attente',
      notes: vNotes || 'Créé à l\'aide du formulaire de Gestion G-LAB.'
    };

    setVouchersList([newVch, ...vouchersList]);
    setVPartner('');
    setVItems(1);
    setVValue(0);
    setVNotes('');
    setShowAddModal(null);
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName) return;
    const newId = `CMP-${Math.floor(500 + Math.random() * 499)}`;
    const newSku = compSku || `${compBrand.substring(0,3).toUpperCase()}-${Math.floor(100 + Math.random()*899)}`;
    
    const payload = {
      id: newId,
      name: compName,
      brand: compBrand || 'G-LAB Premium',
      category: compType, // maps to category
      price: compPrice > 0 ? compPrice : 45000,
      barcode: newSku, // maps to barcode
      icon: compSpec || 'Standard optique calibré' // maps to icon
    };

    try {
      await saveProduct(payload);
      setCompName('');
      setCompBrand('');
      setCompSku('');
      setCompStock(10);
      setCompPrice(0);
      setCompSpec('');
      setShowAddModal(null);
      loadData();
    } catch (err) {
      console.error("Failed to add component:", err);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    const cust = customersList.find(c => c.id === id);
    const displayName = cust ? `${cust.name} (${cust.id})` : id;
    setDeleteConfirmation({
      type: 'customer',
      id,
      title: currentLanguage === 'FR' ? "Supprimer le patient" : "Delete Patient",
      message: currentLanguage === 'FR' 
        ? `Êtes-vous sûr de vouloir supprimer définitivement le patient "${displayName}" ? Cette suppression sera synchronisée sur le CRM et mettra fin à son dossier de fidélité.`
        : `Are you sure you want to permanently delete the patient "${displayName}"? This deletion will sync with the CRM and end their loyalty record.`
    });
  };

  const handleSaveEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    
    const nameParts = editingCustomer.name.split(' ');
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || 'Nouveau';

    const payload = {
      id: editingCustomer.id,
      firstName,
      lastName,
      birthDate: '1990-01-01',
      email: editingCustomer.email || 'aucun-email@opticalize.com',
      phone: editingCustomer.phone,
      ssn: editingCustomer.ssn || '',
      registrationDate: new Date().toISOString().substring(0, 10),
      loyaltyTier: editingCustomer.loyaltyTier === 'REGULAR' ? 'STANDARD' : editingCustomer.loyaltyTier || 'STANDARD',
      loyaltyPoints: 0,
      branchId: editingCustomer.branch === 'Lyon Bellecour' ? 'store-ab' : editingCustomer.branch === 'Marseille Vieux-Port' ? 'store-lm' : 'store-dk',
      prescriptionsJson: JSON.stringify([]),
      purchasesJson: JSON.stringify([]),
      paymentsJson: JSON.stringify([])
    };

    try {
      await saveCustomer(payload);
      setEditingCustomer(null);
      loadData();
    } catch (err) {
      console.error("Failed to save customer edit:", err);
    }
  };

  const handleDeleteVoucher = (id: string) => {
    const vch = vouchersList.find(v => v.id === id);
    const displayName = vch ? `${vch.reference} (${vch.type})` : id;
    setDeleteConfirmation({
      type: 'voucher',
      id,
      title: currentLanguage === 'FR' ? "Supprimer le bon logistique" : "Delete Stock Voucher",
      message: currentLanguage === 'FR'
        ? `Êtes-vous sûr de vouloir supprimer le bon de mouvement "${displayName}" de l'historique ?`
        : `Are you sure you want to delete the stock movement voucher "${displayName}" from history?`
    });
  };

  const handleSaveEditVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher) return;
    setVouchersList(vouchersList.map(v => v.id === editingVoucher.id ? editingVoucher : v));
    setEditingVoucher(null);
  };

  const handleDeleteComponent = (id: string) => {
    const comp = componentsList.find(c => c.id === id);
    const displayName = comp ? `${comp.name} [${comp.sku}]` : id;
    setDeleteConfirmation({
      type: 'component',
      id,
      title: currentLanguage === 'FR' ? "Supprimer la composante" : "Delete Component",
      message: currentLanguage === 'FR'
        ? `Êtes-vous sûr de vouloir retirer définitivement "${displayName}" du catalogue actif de l'atelier ?`
        : `Are you sure you want to permanently remove "${displayName}" from the active workshop catalog?`
    });
  };

  const executeDelete = async () => {
    if (!deleteConfirmation) return;
    const { type, id } = deleteConfirmation;
    try {
      if (type === 'customer') {
        await deleteCustomer(id);
      } else if (type === 'component') {
        await deleteProduct(id);
      } else if (type === 'voucher') {
        setVouchersList(vouchersList.filter(v => v.id !== id));
      }
      loadData();
    } catch (err) {
      console.error("Deletion failed:", err);
    }
    setDeleteConfirmation(null);
  };

  const handleSaveEditComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComponent) return;

    const payload = {
      id: editingComponent.id,
      name: editingComponent.name,
      brand: editingComponent.brand || 'G-LAB Premium',
      category: editingComponent.type,
      price: editingComponent.priceFCFA,
      barcode: editingComponent.sku,
      icon: editingComponent.spec || 'Standard optique calibré'
    };

    try {
      await saveProduct(payload);
      setEditingComponent(null);
      loadData();
    } catch (err) {
      console.error("Failed to save component edit:", err);
    }
  };

  const handleUpdateVoucherStatus = (id: string, nextStatus: 'Brouillon' | 'En attente' | 'En Transit' | 'Validé' | 'Terminé') => {
    setVouchersList(vouchersList.map(v => v.id === id ? { ...v, status: nextStatus } : v));
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* 🚀 MAIN MODULE BANNER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider border border-blue-200/50">
            <FolderLock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            {currentLanguage === 'FR' ? "Module Gestion Optic Actif" : "Optical Management Workspace Active"}
          </div>
          <h2 className="text-xl font-black text-slate-850 tracking-tight font-display">
            {currentLanguage === 'FR' ? "Gestion Optic & Stocks d'Atelier Optic Alizé" : "Optic Alizé Optical Fitting, Edging & Stock Ledger"}
          </h2>
          <p className="text-slate-500 max-w-3xl leading-relaxed text-[11px]">
            {currentLanguage === 'FR' 
              ? "Supervision intégrée du magasin optique : gestion de votre clientèle, mouvements logistiques avancés (entrées, sorties, transferts boutique) et catalogue complet de composants optométriques."
              : "Integrated supervision of your optical stores: custom patient ledger, advanced inventory logging (in, out, branch transfers), and global optometric components master catalog."}
          </p>
        </div>

        {/* STATS SNIPPET */}
        <div className="flex gap-4 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono">
          <div className="text-center px-2">
            <span className="text-[9px] text-slate-400 block font-bold">CLIENTS CRM</span>
            <strong className="text-base font-black text-slate-800">{customersList.length}</strong>
          </div>
          <div className="border-r border-slate-200 h-8 self-center" />
          <div className="text-center px-2">
            <span className="text-[9px] text-slate-400 block font-bold">BONS EN ATTENTE</span>
            <strong className="text-base font-black text-amber-600">
              {vouchersList.filter(v => v.status === 'En attente' || v.status === 'En Transit').length}
            </strong>
          </div>
          <div className="border-r border-slate-200 h-8 self-center" />
          <div className="text-center px-2">
            <span className="text-[9px] text-slate-400 block font-bold">LIGNES DE STOCK</span>
            <strong className="text-base font-black text-emerald-600">{componentsList.length}</strong>
          </div>
        </div>
      </div>

      {/* Dynamic Boutique Selector for optical warehouse context */}
      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans">
        <div className="flex items-center gap-2.5 justify-start text-left">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-750 flex items-center justify-center shadow-sm">
            <Box className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <h4 className="font-extrabold text-slate-800">Filiale d'Optique active</h4>
            <p className="text-[10px] text-slate-500 font-medium">Basculez entre vos filiales d'optiques enregistrées pour isoler vos inventaires de montures et de verres.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-bold text-slate-600">Boutique :</label>
          <select 
            value={selectedOpticBoutique}
            onChange={(e) => setSelectedOpticBoutique(e.target.value)}
            className="text-xs font-bold rounded-lg border border-slate-250 bg-white p-2 outline-none cursor-pointer focus:ring-1 focus:ring-blue-600 text-slate-750"
          >
            <option value="ALL">🏢 Toutes les Succursales</option>
            {localBranches.map((b) => (
              <option key={b.id} value={b.id}>🏢 {b.name} ({b.city})</option>
            ))}
          </select>
          {localBranches.length === 0 && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-mono">
              Créer manuellement des boutiques dans SuperAdmin HQ
            </span>
          )}
        </div>
      </div>

      {/* 👑 SIMULATION PROFILE / WORKSPACE SELECTOR */}
      <div className="bg-gradient-to-r from-slate-900 to-[#2563EB]/80 text-white p-4 rounded-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-md font-sans">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <strong className="text-[11px] uppercase tracking-wider text-[#60A5FA]">Accès Multi-Boutiques &amp; Rôles d'Équipe</strong>
          </div>
          <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">
            {currentLanguage === 'FR' 
              ? "Basculez entre le Gérant (accès total & alerte seuils) et un Personnel de boutique (Enregistre les ventes d'optique locales, lecture seule du stock général, alertes reçues)."
              : "Toggle between Stock Manager (full access & thresholds) and a boutique store (records local sales, read-only central stock catalog, notifications received)."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => {
              setCurrentRole('GESTIONNAIRE');
              setActiveCategory('MAGASIN');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none ${
              currentRole === 'GESTIONNAIRE' 
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/50' 
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5" />
            <span>🔑 Gérant (Dépôt Central)</span>
          </button>
          
          {localBranches.map((b, index) => {
            const roleId = index === 0 ? 'BOUTIQUE_DK' : index === 1 ? 'BOUTIQUE_AB' : index === 2 ? 'BOUTIQUE_LM' : `BOUTIQUE_CUSTOM_${index}`;
            return (
              <button
                key={b.id || index}
                type="button"
                onClick={() => {
                  setCurrentRole(roleId as any);
                  setActiveCategory('BOUTIQUES'); // Redirect to boutiques view
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none ${
                  currentRole === roleId
                    ? 'bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-400/50'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>🏢 {b.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS CATEGORIES (Gestion Magasin, Gestion Stock, Gestion Composantes) */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200/80 p-1.5 rounded-xl gap-2 shadow-2xs">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => handleCategoryChange('MAGASIN')}
            className={`flex items-center gap-2 px-4 py-2 font-black rounded-lg transition-all cursor-pointer ${
              activeCategory === 'MAGASIN' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>Gestion Magasin</span>
          </button>

          <button
            onClick={() => handleCategoryChange('STOCK')}
            className={`flex items-center gap-2 px-4 py-2 font-black rounded-lg transition-all cursor-pointer ${
              activeCategory === 'STOCK' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Box className="w-4 h-4 text-indigo-400" />
            <span>Gestion de Stock</span>
          </button>

          <button
            onClick={() => handleCategoryChange('COMPOSANTES')}
            className={`flex items-center gap-2 px-4 py-2 font-black rounded-lg transition-all cursor-pointer ${
              activeCategory === 'COMPOSANTES' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Gestion Composantes</span>
          </button>

          <button
            onClick={() => handleCategoryChange('BOUTIQUES')}
            className={`flex items-center gap-2 px-4 py-2 font-black rounded-lg transition-all cursor-pointer ${
              activeCategory === 'BOUTIQUES' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4 text-cyan-400" />
            <span>🏬 Réappro &amp; Transferts Multi-Boutiques</span>
          </button>
        </div>

        {/* Quick action based on categorised tab */}
        <div>
          <button
            onClick={() => {
              if (activeCategory === 'MAGASIN') {
                setShowAddModal('CUSTOMER');
              } else if (activeCategory === 'STOCK') {
                setShowAddModal('VOUCHER');
              } else {
                setShowAddModal('COMPONENT');
              }
            }}
            className="w-full sm:w-auto px-4 py-2 font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeCategory === 'MAGASIN' ? 'Créer Client ou Bon' : activeCategory === 'STOCK' ? 'Créer un Bon Logistique' : 'Ajouter un Élément'}
            </span>
          </button>
        </div>
      </div>

      {/* 🧭 SECONDARY SUB-TABS NAVIGATION BAR */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1.5 pt-1 text-[11px] font-extrabold justify-start text-left bg-slate-50/50 p-2 rounded-lg">
        {activeCategory === 'MAGASIN' && (
          <>
            <button 
              onClick={() => setActiveTab('BASE_CLIENTS')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'BASE_CLIENTS' ? 'bg-blue-50 text-blue-700 font-black border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              💼 Base Clients
            </button>
            <button 
              onClick={() => setActiveTab('BON_ENTREE')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'BON_ENTREE' ? 'bg-blue-50 text-blue-700 font-black border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              📥 Bon d'Entrée
            </button>
            <button 
              onClick={() => setActiveTab('BON_SORTIE')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'BON_SORTIE' ? 'bg-blue-50 text-blue-700 font-black border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              📤 Bon de Sortie
            </button>
          </>
        )}

        {activeCategory === 'STOCK' && (
          <>
            <button 
              onClick={() => setActiveTab('BON_COMMANDE')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'BON_COMMANDE' ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-205' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              📑 Bon de Commande
            </button>
            <button 
              onClick={() => setActiveTab('DISTRIBUTION')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'DISTRIBUTION' ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-205' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              🚚 Distribution
            </button>
            <button 
              onClick={() => setActiveTab('TRANSFERT_BOUTIQUE')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'TRANSFERT_BOUTIQUE' ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-205' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              🔁 Transfert Boutique
            </button>
            <button 
              onClick={() => setActiveTab('BON_RETOUR')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'BON_RETOUR' ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-205' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              ↩️ Bon de Retour
            </button>
            <button 
              onClick={() => setActiveTab('MOUVEMENT_LOGISTIQUE')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'MOUVEMENT_LOGISTIQUE' ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-205' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              📊 Mouvement Logistique
            </button>
            <button 
              onClick={() => setActiveTab('INVENTAIRE')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'INVENTAIRE' ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-205' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              📋 Inventaire général
            </button>
          </>
        )}

        {activeCategory === 'COMPOSANTES' && (
          <>
            <button 
              onClick={() => setActiveTab('MONTURES')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'MONTURES' ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              🕶️ Montures
            </button>
            <button 
              onClick={() => setActiveTab('ACCESSOIRES')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'ACCESSOIRES' ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              🧼 Accessoires
            </button>
            <button 
              onClick={() => setActiveTab('VERRES')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'VERRES' ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              🔎 Verres
            </button>
            <button 
              onClick={() => setActiveTab('TRAITEMENT')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'TRAITEMENT' ? 'bg-emerald-50 text-emerald-700 font-black border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              ✨ Traitement &amp; Options
            </button>
          </>
        )}
      </div>

      {/* 🔍 SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filtrer par mots-clés (référence, désignation ou tiers) dans l'onglet actif...`}
            className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl"
          />
        </div>
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="text-[10px] text-[#E11D48] font-bold border border-red-200 bg-rose-50 px-3 py-2.5 rounded-xl transition cursor-pointer"
          >
            Effacer recherche
          </button>
        )}
      </div>

      {/* 🚀 TAB CONTENT AREA */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
        
        {/* --- 1. GESTION MAGASIN --- */}
        {activeCategory === 'MAGASIN' && activeTab === 'BASE_CLIENTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-450 border-b border-slate-200 tracking-wider">
                  <th className="px-5 py-4">Réf Client</th>
                  <th className="px-5 py-4">Nom Complet</th>
                  <th className="px-5 py-4">Fiche Contact</th>
                  <th className="px-5 py-4">Badge Fidélité</th>
                  <th className="px-5 py-4">Dernière Consultation</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customersList
                  .filter(c => isCustomerInRoleBranch(c.branch) && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{c.id}</td>
                      <td className="px-5 py-3.5">
                        <strong className="text-slate-800 text-xs block font-extrabold">{c.name}</strong>
                        {c.branch && <span className="text-[9px] text-emerald-600 font-mono font-semibold">📍 {c.branch}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-700 font-medium">{c.phone}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-full ${
                          c.loyaltyTier === 'VIP' ? 'bg-amber-100 text-amber-800 outline-amber-200' :
                          c.loyaltyTier === 'PREMIUM' ? 'bg-purple-100 text-purple-800 outline-purple-200' :
                          'bg-slate-100 text-slate-700'
                        } border border-transparent`}>
                          🏆 {c.loyaltyTier}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-slate-500 font-bold">{c.lastVisit}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {currentRole === 'GESTIONNAIRE' && (
                            <button 
                              onClick={() => {
                                setTransferringCustomer(c);
                                setTransferTargetBranch(c.branch || 'Paris Nation');
                              }}
                              className="p-1 px-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="Transférer de boutique"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                            </button>
                          )}
                          <button 
                            onClick={() => setPrintingItem({ type: 'client', data: c })}
                            className="p-1 px-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Télécharger PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setEditingCustomer(c)}
                            className="p-1 px-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition"
                            title="Modifier client"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomer(c.id)}
                            className="p-1 px-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Supprimer client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeCategory === 'MAGASIN' && (activeTab === 'BON_ENTREE' || activeTab === 'BON_SORTIE') && (
          <div className="overflow-x-auto">
            <div className="bg-slate-50/80 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
              <strong className="text-slate-700 text-[11px] font-black uppercase tracking-wide">
                Bons de mouvement optique ({activeTab === 'BON_ENTREE' ? "Entrée de stock" : "Sortie atelier"})
              </strong>
              <button 
                onClick={() => {
                  setVType(activeTab === 'BON_ENTREE' ? 'ENTREE' : 'SORTIE');
                  setShowAddModal('VOUCHER');
                }}
                className="px-3 py-1.5 bg-slate-900 text-white font-black hover:bg-slate-800 rounded-md transition shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Bon</span>
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-450 border-b border-slate-200 tracking-wider">
                  <th className="px-5 py-4">Réf Bon</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Tiers Origine/Dest</th>
                  <th className="px-5 py-4 text-center">Quantité d'unités</th>
                  <th className="px-5 py-4 text-right">Valeur estimée</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4 text-right">Action rapide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchersList
                  .filter(v => v.type === (activeTab === 'BON_ENTREE' ? 'ENTREE' : 'SORTIE'))
                  .filter(v => v.partner.toLowerCase().includes(searchQuery.toLowerCase()) || v.reference.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 text-xs">
                        <div className="font-mono font-black text-rose-600">{v.reference}</div>
                        <div className="text-[9px] text-slate-400 mt-1">{v.notes}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 font-bold">{v.date}</td>
                      <td className="px-5 py-3.5">
                        <strong className="text-slate-850 font-bold text-xs">{v.partner}</strong>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-700 font-mono">{v.itemsCount} pcs</td>
                      <td className="px-5 py-3.5 text-right font-black text-slate-800 font-mono">
                        {v.totalValueFCFA.toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black border ${
                          v.status === 'Validé' || v.status === 'Terminé' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setPrintingItem({ type: 'voucher', data: v })}
                            className="p-1 px-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Télécharger PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setEditingVoucher(v)}
                            className="p-1 px-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteVoucher(v.id)}
                            className="p-1 px-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {v.status !== 'Validé' && v.status !== 'Terminé' ? (
                            <button 
                              onClick={() => handleUpdateVoucherStatus(v.id, 'Validé')}
                              className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition whitespace-nowrap"
                            >
                              Approuver
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-450 font-semibold italic whitespace-nowrap">Verrouillé</span>
                          )}
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- 2. GESTION DE STOCK --- */}
        {activeCategory === 'STOCK' && (
          currentRole !== 'GESTIONNAIRE' ? (
            <div className="bg-amber-50/70 border border-amber-200 p-8 rounded-2xl text-center space-y-4 font-sans shadow-2xs max-w-2xl mx-auto my-12 animate-fade-in">
              <ShieldAlert className="w-14 h-14 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Accès Restreint : Stock Général d'Atelier</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                En tant que personnel de la boutique <strong>{boutiqueStocks.find(b => b.id === (currentRole === 'BOUTIQUE_DK' ? 'store-dk' : currentRole === 'BOUTIQUE_AB' ? 'store-ab' : 'store-lm'))?.name}</strong>, vous n'avez pas l'autorisation de modifier ou d'effectuer des ajustements sur le stock d'atelier central ou les bons logistiques unifiés.
              </p>
              <div className="text-[10px] text-slate-400 font-medium">Pour toute réclamation, veuillez contacter le gérant principal d'Optic Alizé.</div>
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2 font-mono">
              <span className="text-[11px] font-black uppercase text-slate-700">
                🗂️ Workflow de Stock : {activeTab.replace('_', ' ')}
              </span>
              <button 
                onClick={() => {
                  // Auto infer type
                  const linkType: Record<string, 'ENTREE' | 'SORTIE' | 'COMMANDE' | 'DISTRIBUTION' | 'TRANSFERT' | 'RETOUR'> = {
                    BON_COMMANDE: 'COMMANDE',
                    DISTRIBUTION: 'DISTRIBUTION',
                    TRANSFERT_BOUTIQUE: 'TRANSFERT',
                    BON_RETOUR: 'RETOUR'
                  };
                  setVType(linkType[activeTab] || 'COMMANDE');
                  setShowAddModal('VOUCHER');
                }}
                className="px-3 py-1 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-[10px] rounded transition shadow-2xs"
              >
                + Ajouter Bon {activeTab.replace('_', ' ')}
              </button>
            </div>

            {/* If tab is not LOGISTICS or GENERAL INVENTORY, display vouchers list */}
            {activeTab !== 'MOUVEMENT_LOGISTIQUE' && activeTab !== 'INVENTAIRE' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-450 border-b border-slate-200 tracking-wider">
                    <th className="px-5 py-4">Réf Voucher</th>
                    <th className="px-5 py-4">Date Émission</th>
                    <th className="px-5 py-4">Partenaire tiers</th>
                    <th className="px-5 py-4 text-center font-mono">Pièces</th>
                    <th className="px-5 py-4 text-right font-mono">Finances (FCFA)</th>
                    <th className="px-5 py-4">Statut</th>
                    <th className="px-5 py-4 text-right">Actions de transit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vouchersList
                    .filter(v => {
                      const linkType: Record<string, string> = {
                        BON_COMMANDE: 'COMMANDE',
                        DISTRIBUTION: 'DISTRIBUTION',
                        TRANSFERT_BOUTIQUE: 'TRANSFERT',
                        BON_RETOUR: 'RETOUR'
                      };
                      return v.type === linkType[activeTab];
                    })
                    .filter(v => v.reference.toLowerCase().includes(searchQuery.toLowerCase()) || v.partner.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/60 transition text-[11px]">
                        <td className="px-5 py-4 font-mono font-black text-indigo-700">
                          {v.reference}
                          <span className="block text-[9px] text-slate-400 font-sans font-medium mt-0.5">{v.notes}</span>
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-600">{v.date}</td>
                        <td className="px-5 py-4 font-extrabold text-[#0F172A]">{v.partner}</td>
                        <td className="px-5 py-4 text-center font-bold font-mono text-slate-700">{v.itemsCount} pcs</td>
                        <td className="px-5 py-4 text-right font-black font-mono text-slate-800">{v.totalValueFCFA.toLocaleString()} FCFA</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black border uppercase tracking-widest ${
                            v.status === 'Validé' || v.status === 'Terminé' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            v.status === 'En Transit' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                            'bg-yellow-50 text-yellow-700 border-yellow-250'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => setPrintingItem({ type: 'voucher', data: v })}
                              className="p-1 px-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Télécharger PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setEditingVoucher(v)}
                              className="p-1 px-1 text-slate-400 hover:text-amber-653 hover:bg-amber-50 rounded transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteVoucher(v.id)}
                              className="p-1 px-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <select 
                              value={v.status}
                              onChange={(e) => handleUpdateVoucherStatus(v.id, e.target.value as any)}
                              className="bg-slate-50 text-[10px] font-black font-mono border border-slate-200 rounded p-1 cursor-pointer"
                            >
                              <option value="Brouillon">Brouillon</option>
                              <option value="En attente">En attente</option>
                              <option value="En Transit">En Transit</option>
                              <option value="Validé">Validé</option>
                              <option value="Terminé">Terminé</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Log mouvements logistiques */}
            {activeTab === 'MOUVEMENT_LOGISTIQUE' && (
              <div className="p-5 space-y-4">
                <div className="bg-slate-900 text-[#00BCD4] p-4 rounded-xl font-mono text-[10px] space-y-1.5 leading-relaxed shadow-3xs text-left max-h-96 overflow-y-auto">
                  <p className="text-white text-xs border-b border-[#00BCD4]/30 pb-1 mb-2 font-black tracking-wider uppercase">
                    📁 DIRECT TRAIL • LOGISTIQUE EN DIRECT G-LAB
                  </p>
                  <p className="text-slate-500">[2026-06-11 10:44] - <span className="text-emerald-400">Validé</span> : Réception de 45 montures d'été Luxottica (BE-2026-094)</p>
                  <p className="text-slate-500">[2026-06-11 10:20] - <span className="text-blue-400">En Transit</span> : Transfert Boutique Gamma (TR-2026-008) pour Boutique Ouest</p>
                  <p className="text-slate-500">[2026-06-10 16:15] - <span className="text-emerald-400">Validé</span> : Commande Verres progressifs complexes Essilor (BC-2026-112)</p>
                  <p className="text-slate-500">[2026-06-10 09:30] - <span className="text-rose-400">Archivé</span> : Retours défectueux Safilo Group (BR-2026-003) expédiés</p>
                  <p className="text-slate-500">[2026-06-09 14:15] - <span className="text-emerald-400">Terminé</span> : Distribution succursale secondaire effectuée (DS-2026-015)</p>
                  <p className="text-slate-500">[2026-06-08 11:10] - <span className="text-slate-350">Initialisé</span> : Création du bon d'inventaire semestriel G-LAB</p>
                </div>
              </div>
            )}

            {/* General physical inventory */}
            {activeTab === 'INVENTAIRE' && (
              <div className="p-4 space-y-4">
                <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-850 rounded-xl text-[11px] leading-relaxed flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <strong className="font-extrabold text-indigo-900 block">Ajustement de l'Inventaire Semestriel G-LAB</strong>
                    Comparez les quantités physiques de l'atelier aux stocks informatiques locaux et validez les disparités éventuelles.
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-450 border-b border-slate-200 tracking-wider">
                        <th className="px-5 py-3">Réf SKU</th>
                        <th className="px-5 py-3">Désignation</th>
                        <th className="px-5 py-3 text-center">Quantité Système</th>
                        <th className="px-5 py-3 text-center">Quantité Physique Réelle</th>
                        <th className="px-5 py-3">Écart constaté</th>
                        <th className="px-5 py-3 text-right">Action d'ajustement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 leading-normal text-[11px]">
                      {componentsList.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3 font-mono font-bold text-slate-500">{item.sku}</td>
                          <td className="px-5 py-3">
                            <strong className="text-slate-800 text-xs block font-bold">{item.name}</strong>
                            <span className="text-[10px] text-slate-400 font-mono italic">{item.brand} • {item.type}</span>
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-600 font-mono">{item.stock} pcs</td>
                          <td className="px-5 py-3 text-center font-mono">
                            <input 
                              type="number" 
                              defaultValue={item.stock} 
                              className="w-16 p-1 border border-slate-200 rounded text-center font-bold text-slate-800 focus:outline-[#512DA8]" 
                            />
                          </td>
                          <td className="px-5 py-3 font-semibold text-emerald-600 font-mono">0 (Match correct)</td>
                          <td className="px-5 py-3 text-right">
                            <button className="text-[10px] font-black text-indigo-650 hover:bg-indigo-50 border border-indigo-200 px-2 py-1 rounded transition">
                              Enregistrer écart
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          )
        )}

        {/* --- 4. GESTION DES REAPPROS & TRANSFERTS DES BOUTIQUES EN DIRECT --- */}
        {activeCategory === 'BOUTIQUES' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800 font-display">
                  {currentRole === 'GESTIONNAIRE' 
                    ? "🏬 Supervision Centrale de Stock par Boutique (Réseau Unifié)" 
                    : "🏬 Votre Espace de Stock Boutique Local"}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  {currentRole === 'GESTIONNAIRE'
                    ? "Vue à plat et directe des stocks disponibles dans chaque filiale nationale, avec pouvoir de transfert et de réapprovisionnement depuis le Dépôt Central d'Optic Alizé."
                    : "Consultez le stock en temps réel de votre franchise, enregistrez des ventes, et suivez les alertes de réapprovisionnement reçues."}
                </p>
              </div>
              
              {currentRole === 'GESTIONNAIRE' && (
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStockTransferSource(boutiqueStocks[0].id);
                      setStockTransferDest(boutiqueStocks[1].id);
                      setTransferSku('RB2140-50');
                      setShowTransferStockModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-emerald-450 animate-pulse animate-duration-1000" />
                    <span>Transfert Logistique Inter-Boutiques</span>
                  </button>
                </div>
              )}
            </div>

            {/* ALERT BANNERS SECTION */}
            {currentRole === 'GESTIONNAIRE' ? (
              /* --- MANAGER THRESHOLD ALERTS --- */
              <div className="p-4 bg-red-50/80 border border-red-205 rounded-xl space-y-2 text-left">
                <div className="flex items-center gap-2 text-red-850">
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
                  <span className="font-extrabold uppercase tracking-wide text-[10px]">📟 ALERTES SEUILS DE RÉAPPROVISIONNEMENT (Vue Gérant)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {/* General Stock alert */}
                  {componentsList.filter(c => c.stock < 20).map(c => (
                    <div key={c.id} className="bg-white p-2.5 rounded-lg border border-red-100 flex justify-between items-center text-[11px] shadow-3xs">
                      <div>
                        <strong className="text-slate-800 block text-xs truncate max-w-[170px]">{c.name}</strong>
                        <span className="text-red-650 font-mono text-[9px] uppercase font-bold">Stock Général : {c.stock} u. restant (Seuil: 20)</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 font-bold rounded-md font-mono text-[9px]">CRITIQUE</span>
                    </div>
                  ))}
                  {/* Boutique stocks alerts */}
                  {boutiqueStocks.flatMap(store => store.items.filter(item => item.qty < 10).map(item => (
                    <div key={`${store.id}-${item.sku}`} className="bg-white p-2.5 rounded-lg border border-orange-100 flex justify-between items-center text-[11px] shadow-3xs">
                      <div>
                        <strong className="text-slate-800 block text-xs truncate max-w-[170px]">{item.name}</strong>
                        <span className="text-amber-700 font-mono text-[9px] uppercase font-bold">{store.name} : {item.qty} u. restant (Seuil: 10)</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 font-bold rounded-md font-mono text-[9px]">RÉAPPRO</span>
                    </div>
                  )))}
                </div>
              </div>
            ) : (
              /* --- BOUTIQUE ALERTS & REPLENISHMENT STATUS --- */
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 text-left">
                <div className="flex items-center gap-2 text-emerald-850">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span className="font-extrabold uppercase tracking-wide text-[10px]">🔔 CENTRE DE NOTIFICATIONS BOUTIQUE : RÉASSORT REÇU / ATTENDU</span>
                </div>
                <div className="text-[11px] text-slate-700 font-medium space-y-1">
                  {(() => {
                    const activeStoreId = currentRole === 'BOUTIQUE_DK' ? 'store-dk' : currentRole === 'BOUTIQUE_AB' ? 'store-ab' : 'store-lm';
                    const activeStore = boutiqueStocks.find(b => b.id === activeStoreId);
                    return activeStore?.items.map(item => {
                      if (item.qty < 10) {
                        return (
                          <div key={item.sku} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-emerald-100 text-emerald-800 shadow-3xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>Alerte d'approvisionnement envoyée pour <strong>{item.name}</strong> (Quantité critique en boutique : {item.qty} u.). Une palette de réapprovisionnement depuis le Dépôt Central d'Optic Alizé est attendue.</span>
                          </div>
                        );
                      }
                      return null;
                    }).filter(Boolean);
                  })().length === 0 && (
                    <p className="bg-white p-2.5 rounded-lg border border-slate-150 text-slate-500 text-center">
                      Aucune alerte de réapprovisionnement. Vos stocks de boutique locaux sont à des niveaux optimaux.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {boutiqueStocks
                .filter(store => {
                  if (currentRole === 'GESTIONNAIRE') return true;
                  return store.id === (currentRole === 'BOUTIQUE_DK' ? 'store-dk' : currentRole === 'BOUTIQUE_AB' ? 'store-ab' : 'store-lm');
                })
                .map((store, idx) => (
                  /* CARD PALETTE - BACKGROUNDS COLORED USING SYSTEM AND LOGO COLOR SCHEMES */
                  <div key={idx} className="bg-gradient-to-b from-[#2563EB]/7 to-white border border-[#2563EB]/25 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-3xs hover:border-[#2563EB]/45 transition text-left">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-[#1F2937] text-xs uppercase tracking-wide font-sans">{store.name}</h4>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-500/10 rounded-full text-[9px] font-bold uppercase tracking-wider">{store.country}</span>
                      </div>
                      <span className="text-[10px] text-[#2563EB] font-mono tracking-widest font-bold">Store ID : {store.id}</span>
                    </div>

                    <div className="space-y-2 border-t border-b border-[#2563EB]/15 py-4 flex-1">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Composants Ophtalmiques &amp; Montures :</p>
                      {store.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-3xs">
                          <div className="space-y-0.5 pr-2">
                            <span className="text-xs font-extrabold text-slate-800 truncate block max-w-[150px]">{item.name}</span>
                            <span className="text-[9px] font-mono text-slate-450 block tracking-wide font-semibold">{item.sku} • {item.spec}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-black shrink-0 ${
                              item.qty < 10 ? 'bg-red-50 text-red-700 font-bold' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.qty} u.
                            </span>
                            
                            {/* EXCLUSIVE SALES BUTTON (ils pourront faire la vente mais n'ont pas accès direct au stock central) */}
                            {currentRole !== 'GESTIONNAIRE' && (
                              <button
                                type="button"
                                onClick={() => handleRecordBoutiqueSale(store.id, item.sku)}
                                className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[9px] rounded-lg transition uppercase select-none cursor-pointer tracking-wider shadow-3xs"
                                title="Enregistrer une vente locale client"
                              >
                                Vendre
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {currentRole === 'GESTIONNAIRE' ? (
                      /* ONLY THE MANAGER CAN ALLOCATE STOCK FROM GENERAL TO STORES */
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSupplyStoreId(store.id);
                          setSupplySku(store.items[0].sku);
                          setShowSupplyModal(true);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-[#2563EB] to-[#2563EB]/85 hover:opacity-95 text-white font-extrabold text-[10px] rounded-xl transition uppercase tracking-wider cursor-pointer shadow-sm"
                      >
                        📦 Approvisionner depuis Stock Général
                      </button>
                    ) : (
                      /* FOR BOUTIQUE STAFF: OPTION TO SEND REPLENISH ALARM TO CENTRAL */
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Demande logistique d'approvisionnement envoyée ! Le gérant d'Optic Alizé a été notifié de planifier des transferts pour ${store.name}.`);
                        }}
                        className="w-full py-2 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 font-bold text-[10px] rounded-xl transition uppercase tracking-wider cursor-pointer"
                      >
                        📢 Envoyer Alerte d'approvisionnement
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* --- 3. GESTION COMPOSANTES --- */}
        {activeCategory === 'COMPOSANTES' && (
          currentRole !== 'GESTIONNAIRE' ? (
            <div className="bg-amber-50/70 border border-amber-200 p-8 rounded-2xl text-center space-y-4 font-sans shadow-2xs max-w-2xl mx-auto my-12 animate-fade-in">
              <ShieldAlert className="w-14 h-14 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Accès Restreint : Catalogue des Composantes d'Atelier</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                En tant que personnel de la boutique <strong>{boutiqueStocks.find(b => b.id === (currentRole === 'BOUTIQUE_DK' ? 'store-dk' : currentRole === 'BOUTIQUE_AB' ? 'store-ab' : 'store-lm'))?.name}</strong>, vous n'avez pas l'autorisation de voir ou de modifier le catalogue de base des pièces, verres et traitements de l'atelier central.
              </p>
              <div className="text-[10px] text-slate-400 font-medium">Pour toute modification, veuillez contacter le gérant principal d'Optic Alizé.</div>
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2 font-mono">
              <span className="text-[11px] font-black uppercase text-slate-700">
                🏷️ Catalogue de composants : {activeTab.replace('_', ' ')} (Verres, montures, fournitures ou traitements optiques)
              </span>
              <button 
                onClick={() => {
                  const mapType: Record<string, 'MONTURE' | 'ACCESSOIRE' | 'VERRE' | 'TRAITEMENT'> = {
                    MONTURES: 'MONTURE',
                    ACCESSOIRES: 'ACCESSOIRE',
                    VERRES: 'VERRE',
                    TRAITEMENT: 'TRAITEMENT'
                  };
                  setCompType(mapType[activeTab] || 'MONTURE');
                  setShowAddModal('COMPONENT');
                }}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded transition shadow-2xs"
              >
                + Ajouter {activeTab.replace('_', ' ').substring(0, activeTab.length - 1)}
              </button>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-450 border-b border-slate-200 tracking-wider">
                  <th className="px-5 py-4">ID Élément</th>
                  <th className="px-5 py-4">Nom de la pièce</th>
                  <th className="px-5 py-4">Marque / Sourcing</th>
                  <th className="px-5 py-4">Fiche Technique / Spécifications</th>
                  <th className="px-5 py-4 text-center">Quantité en Stock</th>
                  <th className="px-5 py-4 text-right">Tarification d'atelier</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {componentsList
                  .filter(c => {
                    const mapType: Record<string, string> = {
                      MONTURES: 'MONTURE',
                      ACCESSOIRES: 'ACCESSOIRE',
                      VERRES: 'VERRE',
                      TRAITEMENT: 'TRAITEMENT'
                    };
                    return c.type === mapType[activeTab];
                  })
                  .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.brand.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition text-[11px]">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-500">
                        {c.sku}
                        <span className="block text-[8px] text-slate-400 font-sans font-medium mt-0.5">{c.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <strong className="text-slate-800 text-xs block font-extrabold">{c.name}</strong>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-extrabold text-[#374151]">{c.brand}</span>
                      </td>
                      <td className="px-5 py-3.5 italic text-slate-500">{c.spec}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-black ${
                          c.stock < 10 ? 'bg-red-100 text-red-800 font-bold animate-pulse' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.stock === 999 ? 'À la Demande' : `${c.stock} unités`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black font-mono text-slate-850">
                        {c.priceFCFA.toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setPrintingItem({ type: 'component', data: c })}
                            className="p-1 px-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Télécharger PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setEditingComponent(c)}
                            className="p-1 px-1.5 text-slate-400 hover:text-amber-653 hover:bg-amber-50 rounded transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteComponent(c.id)}
                            className="p-1 px-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        )}

      </div>

      {/* --- ADD MODALS AND POPUPS --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 text-left relative"
            >
              <button 
                onClick={() => setShowAddModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg absolute top-4 right-4"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 1. Add Customer Form Modal */}
              {showAddModal === 'CUSTOMER' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase">G-LAB • Ajouter un Nouveau Client</h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Formulaire de client de passage ou abonné mutuelle</p>
                  
                  <form onSubmit={handleAddCustomer} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nom Complet *</label>
                      <input 
                        type="text" 
                        required 
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        placeholder="Ex: Amadou Diome" 
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Téléphone</label>
                      <input 
                        type="text" 
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        placeholder="Ex: +228 90 45 67 89" 
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Courriel Électronique (Email)</label>
                      <input 
                        type="email" 
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        placeholder="Ex: amadou@gmail.com" 
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Statut fidélité</label>
                      <select 
                        value={newCustTier}
                        onChange={(e: any) => setNewCustTier(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 font-bold"
                      >
                        <option value="REGULAR">Regular Base Client</option>
                        <option value="VIP">VIP Gold Club</option>
                        <option value="PREMIUM">Premium Privilege G-LAB</option>
                      </select>
                    </div>

                    <div className="pt-4 flex gap-2">
                      <button 
                        type="submit" 
                        className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black transition text-center text-xs"
                      >
                        Enregistrer dans la base
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 2. Add Stock Voucher Form Modal */}
              {showAddModal === 'VOUCHER' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-indigo-900 uppercase">Nouveau Bon / Mouvement de Stock</h3>
                  
                  <div className="space-y-3 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Type de Mouvement Logistique</label>
                      <select 
                        value={vType} 
                        onChange={(e: any) => setVType(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="ENTREE">Entrée de Stock (Fournisseur)</option>
                        <option value="SORTIE">Sortie de Stock (Atelier)</option>
                        <option value="COMMANDE">Bon de Commande (Luxottica, Essilor...)</option>
                        <option value="DISTRIBUTION">Distribution (Succursales)</option>
                        <option value="TRANSFERT">Transfert de Boutique (Transits)</option>
                        <option value="RETOUR">Bon de Retour (Retours fournisseur)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du Partenaire / Labo de destination</label>
                      <input 
                        type="text" 
                        value={vPartner}
                        onChange={(e) => setVPartner(e.target.value)}
                        placeholder="Ex: Essilor France ou Boutique Alpha" 
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre de pièces</label>
                        <input 
                          type="number" 
                          value={vItems}
                          onChange={(e) => setVItems(parseInt(e.target.value))}
                          placeholder="Ex: 10" 
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Frais / Valeur FCFA</label>
                        <input 
                          type="number" 
                          value={vValue}
                          onChange={(e) => setVValue(parseFloat(e.target.value))}
                          placeholder="Ex: 500000" 
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Notes explicatives d'encours</label>
                      <textarea 
                        value={vNotes}
                        onChange={(e) => setVNotes(e.target.value)}
                        placeholder="Précisez la provenance ou l'atelier référent..." 
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg h-20"
                      />
                    </div>

                    <button 
                      onClick={() => handleAddVoucher()}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg transition text-xs text-center cursor-pointer mt-2"
                    >
                      Enregistrer le Mouvement
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Add Component/Optique Form Modal */}
              {showAddModal === 'COMPONENT' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-emerald-900 uppercase">Nouveau Composant d'Atelier Optique</h3>
                  
                  <form onSubmit={handleAddComponent} className="space-y-3 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Type de composant</label>
                      <select 
                        value={compType}
                        onChange={(e: any) => setCompType(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="MONTURE">Monture Solaire / Optique</option>
                        <option value="ACCESSOIRE">Chains, Cordons, Sprays, Boîtiers</option>
                        <option value="VERRE">Verres (Essilor, Zeiss, progressive...)</option>
                        <option value="TRAITEMENT">Traitement additionnel des verres </option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Désignation du composant ou référence commerciale *</label>
                      <input 
                        type="text" 
                        required
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        placeholder="Ex: Verre Varilux Comfort 1.6" 
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Marque de fabrique</label>
                        <input 
                          type="text" 
                          value={compBrand}
                          onChange={(e) => setCompBrand(e.target.value)}
                          placeholder="Ex: Essilor" 
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro SKU de fabrication</label>
                        <input 
                          type="text" 
                          value={compSku}
                          onChange={(e) => setCompSku(e.target.value)}
                          placeholder="Ex: VX-CMFT-01" 
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Stock disponible</label>
                        <input 
                          type="number" 
                          value={compStock}
                          onChange={(e) => setCompStock(parseInt(e.target.value))}
                          placeholder="Ex: 24" 
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Tarif unitaire FCFA</label>
                        <input 
                          type="number" 
                          value={compPrice}
                          onChange={(e) => setCompPrice(parseFloat(e.target.value))}
                          placeholder="Ex: 85000" 
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Spécifications techniques / Traitements d'usine</label>
                      <input 
                        type="text" 
                        value={compSpec}
                        onChange={(e) => setCompSpec(e.target.value)}
                        placeholder="Ex: Index 1.6, Traitement anti-salissure, Teinte gris" 
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg transition text-xs text-center cursor-pointer mt-2 shadow-2xs"
                    >
                      Ajouter au catalogue et stock d'atelier
                    </button>
                  </form>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL EDIT CUSTOMER --- */}
      <AnimatePresence>
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 text-left relative"
            >
              <button 
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg absolute top-4 right-4"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase">G-LAB • Modifier Fiche Client</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Édition des données d'identité et de contact</p>
                
                <form onSubmit={handleSaveEditCustomer} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nom Complet *</label>
                    <input 
                      type="text" 
                      required 
                      value={editingCustomer.name} 
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Téléphone *</label>
                    <input 
                      type="text" 
                      required 
                      value={editingCustomer.phone} 
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                    <input 
                      type="email" 
                      value={editingCustomer.email} 
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Catégorie de Fidélité *</label>
                    <select 
                      value={editingCustomer.loyaltyTier}
                      onChange={(e: any) => setEditingCustomer({ ...editingCustomer, loyaltyTier: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <option value="REGULAR">Régulier (REGULAR)</option>
                      <option value="PREMIUM">Premium de passage (PREMIUM)</option>
                      <option value="VIP">Membre d'honneur G-LAB (VIP)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingCustomer(null)}
                      className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-2xs"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL EDIT VOUCHER --- */}
      <AnimatePresence>
        {editingVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 text-left relative"
            >
              <button 
                onClick={() => setEditingVoucher(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg absolute top-4 right-4"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase font-display">G-LAB • Modifier le Bon</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Mise à jour des flux logistiques et quantitatifs</p>

                <form onSubmit={handleSaveEditVoucher} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Référence Bon (Interne / SKU)*</label>
                    <input 
                      type="text" 
                      required 
                      value={editingVoucher.reference} 
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, reference: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-indigo-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tiers Destinataire / Partenaire *</label>
                    <input 
                      type="text" 
                      required 
                      value={editingVoucher.partner} 
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, partner: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre de pièces</label>
                      <input 
                        type="number" 
                        required 
                        value={editingVoucher.itemsCount} 
                        onChange={(e) => setEditingVoucher({ ...editingVoucher, itemsCount: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Valeur estimée FCFA *</label>
                      <input 
                        type="number" 
                        required 
                        value={editingVoucher.totalValueFCFA} 
                        onChange={(e) => setEditingVoucher({ ...editingVoucher, totalValueFCFA: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Statut réglementaire</label>
                    <select 
                      value={editingVoucher.status}
                      onChange={(e: any) => setEditingVoucher({ ...editingVoucher, status: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <option value="Brouillon">Brouillon</option>
                      <option value="En attente">En attente</option>
                      <option value="En Transit">En Transit</option>
                      <option value="Validé">Validé (Verrouillé comptable)</option>
                      <option value="Terminé">Terminé</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Notes explicatives d'encours</label>
                    <textarea 
                      value={editingVoucher.notes} 
                      onChange={(e) => setEditingVoucher({ ...editingVoucher, notes: e.target.value })}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg h-16"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingVoucher(null)}
                      className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-2xs"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL EDIT COMPONENT --- */}
      <AnimatePresence>
        {editingComponent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 text-left relative"
            >
              <button 
                onClick={() => setEditingComponent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg absolute top-4 right-4"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase">G-LAB • Modifier Composant</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Éditions du catalogue technique actif</p>

                <form onSubmit={handleSaveEditComponent} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nom de la pièce *</label>
                    <input 
                      type="text" 
                      required 
                      value={editingComponent.name} 
                      onChange={(e) => setEditingComponent({ ...editingComponent, name: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Marque / Origine *</label>
                      <input 
                        type="text" 
                        required 
                        value={editingComponent.brand} 
                        onChange={(e) => setEditingComponent({ ...editingComponent, brand: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Désignation SKU *</label>
                      <input 
                        type="text" 
                        required 
                        value={editingComponent.sku} 
                        onChange={(e) => setEditingComponent({ ...editingComponent, sku: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Quantité Stock</label>
                      <input 
                        type="number" 
                        required 
                        value={editingComponent.stock} 
                        onChange={(e) => setEditingComponent({ ...editingComponent, stock: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tarif unitaire FCFA *</label>
                      <input 
                        type="number" 
                        required 
                        value={editingComponent.priceFCFA} 
                        onChange={(e) => setEditingComponent({ ...editingComponent, priceFCFA: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Spécifications techniques</label>
                    <input 
                      type="text" 
                      value={editingComponent.spec || ''} 
                      onChange={(e) => setEditingComponent({ ...editingComponent, spec: e.target.value })}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingComponent(null)}
                      className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-2xs"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL TRANSFER CUSTOMER --- */}
      <AnimatePresence>
        {transferringCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 text-left relative"
            >
              <button 
                onClick={() => setTransferringCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg absolute top-4 right-4"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider">Transfert d'Agence (Base Client)</h3>
                </div>
                <p className="text-xs text-slate-500">
                  En tant que <strong>Gestionnaire Optic</strong>, vous pouvez modifier l'affectation et déplacer le dossier client <strong>{transferringCustomer.name}</strong> ({transferringCustomer.id}) vers une autre agence.
                </p>

                <form onSubmit={handleTransferCustomerSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block animate-pulse">Agence d'origine actuelle</label>
                    <div className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono font-bold">
                      📍 {transferringCustomer.branch || 'Paris Nation'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nouvelle agence de destination *</label>
                    <select 
                      value={transferTargetBranch}
                      onChange={(e) => setTransferTargetBranch(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer font-bold border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {localBranches.length === 0 ? (
                        <option value="Paris Nation">Paris Nation (Agence Alpha)</option>
                      ) : (
                        localBranches.map((b) => (
                          <option key={b.id} value={b.city || b.name}>
                            {b.city || b.name} ({b.name})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setTransferringCustomer(null)}
                      className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition animate-none"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-2xs"
                    >
                      Confirmer le transfert
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FLOATING PRINT PREVIEW MODAL (TELECHARGER PDF GENERATOR) --- */}
      <AnimatePresence>
        {printingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-200 text-left relative overflow-hidden"
            >
              <button 
                onClick={() => setPrintingItem(null)}
                className="p-1 px-3 text-xs bg-slate-100 font-extrabold text-slate-500 hover:bg-slate-200 rounded-lg absolute top-4 right-4"
              >
                Fermer l'aperçu [ESC]
              </button>

              <div id="section-print-target" className="space-y-6 bg-white p-6 border border-slate-200 rounded-xl max-h-[75vh] overflow-y-auto">
                {/* PDF Header Block */}
                <div className="flex justify-between items-start border-b border-dashed border-slate-300 pb-4">
                  <div className="text-left">
                    <h2 className="text-base font-black text-blue-600 tracking-tight">🔬 ATELIER CENTRAL G-LAB OPTIC</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-medium">Atelier Central • Hub West Africa</p>
                    <p className="text-[9px] text-slate-400 font-mono">Registre : GL-REG-2026-B11 • Service Clinique & Réfraction</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="px-2.5 py-1 bg-slate-900 text-white rounded text-[9px] font-black uppercase tracking-widest block text-center mb-1">
                      DOCUMENT PDF
                    </span>
                    <p className="text-[9px] text-slate-500">Généré le : {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* --- 1. Client Card Template --- */}
                {printingItem.type === 'client' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <div>
                        <span className="text-[8px] font-mono uppercase text-blue-600 font-black tracking-widest block">IDENTIFIANT CLIENT</span>
                        <h3 className="text-amber-600 font-mono font-black text-sm">{printingItem.data.id}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-mono uppercase text-slate-500 font-bold block">FIDELITE</span>
                        <strong className="text-slate-800 text-xs font-black">🏆 {printingItem.data.loyaltyTier}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Détails d'Identité</span>
                        <p className="text-slate-800 font-extrabold text-xs">{printingItem.data.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Consultation Planétaire active</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Coordonnées</span>
                        <p className="text-slate-800 font-mono font-bold">{printingItem.data.phone}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{printingItem.data.email}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 leading-relaxed">
                      <h4 className="text-[10px] uppercase font-black text-slate-700 tracking-wider mb-2">📜 Historique de Consultation (West Africa Digital Vault)</h4>
                      <p className="text-slate-500 text-[10px]">
                        Le patient a effectué sa dernière vérification de réfraction visuelle le <strong className="text-slate-700 font-mono font-bold">{printingItem.data.lastVisit}</strong> dans notre cabinet. Équipement recommandé : Verres correcteurs progressifs Essilor à index de réfraction élevé anti-fatigue.
                      </p>
                    </div>
                  </div>
                )}

                {/* --- 2. Voucher Card Template --- */}
                {printingItem.type === 'voucher' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <div>
                        <span className="text-[8px] font-mono uppercase text-indigo-700 font-black tracking-widest block">BON DE MOUVEMENT</span>
                        <h3 className="text-rose-600 font-mono font-black text-sm">{printingItem.data.reference}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-mono uppercase text-slate-500 font-bold block">STATUT DE FLUX</span>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[9px] font-mono font-black px-2 py-0.5 rounded">
                          {printingItem.data.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-left">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Date Émission</span>
                        <span className="text-slate-800 font-bold">{printingItem.data.date}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Volume de Pièces</span>
                        <span className="text-indigo-700 font-black">{printingItem.data.itemsCount} unités</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-right">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Cout global</span>
                        <span className="text-slate-850 font-black">{printingItem.data.totalValueFCFA.toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Tiers Partenaire Référencé</span>
                      <strong className="text-slate-800 text-xs font-black block mt-0.5">{printingItem.data.partner}</strong>
                    </div>

                    {printingItem.data.notes && (
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-[10px] leading-relaxed">
                        <strong className="text-slate-700 font-black block mb-1">Notes logistiques :</strong>
                        <p className="text-slate-500">{printingItem.data.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* --- 3. Component Card Template --- */}
                {printingItem.type === 'component' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <div>
                        <span className="text-[8px] font-mono uppercase text-emerald-800 font-black tracking-widest block">RÉFÉRENCE COMPOSANTE (SKU)</span>
                        <h3 className="text-emerald-700 font-mono font-black text-sm">{printingItem.data.sku}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-mono uppercase text-slate-500 font-bold block">CATÉGORISATION</span>
                        <span className="text-blue-700 bg-blue-50 border border-blue-200 text-[9px] font-mono font-black px-2 py-0.5 rounded">
                          {printingItem.data.type}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Quantité Disponible</span>
                        <strong className="text-slate-850 text-xs">{printingItem.data.stock === 999 ? 'Entreposé en quantité illimitée' : `${printingItem.data.stock} unités`}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Tarification unitaire</span>
                        <strong className="text-emerald-600 text-xs">{printingItem.data.priceFCFA.toLocaleString()} FCFA</strong>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-left">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Spécifications constructeur</span>
                      <strong className="text-slate-800 text-xs font-black block mt-1">{printingItem.data.name}</strong>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mt-0.5">Marque : {printingItem.data.brand}</span>
                      <p className="mt-3 text-slate-600 text-[10px] leading-relaxed italic">
                        Descriptif Technique : "{printingItem.data.spec || 'Aucune spécification technique constructeur particulière.'}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Simulated Signature and Stamps block */}
                <div className="pt-6 border-t border-dashed border-slate-300 flex justify-between items-center text-[9px] text-slate-400 font-mono uppercase tracking-wide">
                  <div className="text-left">
                    <p>Signature Directeur Technique</p>
                    <div className="h-10 w-24 border border-transparent mt-1 bg-slate-50/50 rounded flex items-center justify-center italic text-slate-300 font-bold text-[8px]">
                      G-LAB SECURE APPROVED
                    </div>
                  </div>
                  <div className="text-right">
                    <p>Visa Comptabilité Générale</p>
                    <div className="h-10 w-24 border border-transparent mt-1 bg-slate-50/50 rounded flex items-center justify-center italic text-indigo-400 font-bold text-[8px] border-indigo-100/30">
                      [SECURE SEAL]
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-2 text-center text-[8px] text-slate-400 rounded-lg font-mono tracking-wider">
                  ⚠️ DOCUMENT STRICTEMENT CONFIDENTIEL À USAGE COMPTABLE DE G-LAB SYSTEM LTD.
                </div>
              </div>

              {/* Action utilities */}
              <div className="flex gap-2.5 mt-4">
                <button 
                  onClick={() => setPrintingItem(null)}
                  className="flex-1 py-3 text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  Annuler l'exportation
                </button>
                <button 
                  onClick={() => handleDownloadPDF(printingItem)}
                  className="flex-1 py-3 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer en PDF / Télécharger le document</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- STOCK RE-STOCK/RESTOCK MODAL SANS LISTE DEROULANTE --- */}
      {showSupplyModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-205 shadow-xl max-w-sm w-full p-6 space-y-4 text-xs text-[#1F2937] text-left">
            <div>
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-cyan-705">Approvisionner le stock local G-LAB</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Ajouter des fournitures de meulage, verres ou montures à ce magasin particulier.</p>
            </div>
            <form onSubmit={handleBoutiqueStockSupply} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold block text-slate-600 text-[10px] uppercase">Magasin d'optique cible</label>
                <input 
                  type="text" 
                  disabled 
                  value={boutiqueStocks.find(b => b.id === selectedSupplyStoreId)?.name || ''} 
                  className="w-full p-2.5 rounded-lg border outline-none bg-slate-50 font-bold text-slate-700" 
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block text-slate-600 text-[10px] uppercase">Référence de l'article</label>
                <select 
                  value={supplySku} 
                  onChange={e => setSupplySku(e.target.value)}
                  className="w-full p-2.5 rounded-lg border outline-none bg-slate-50 font-semibold"
                >
                  <option value="RB2140-50">Ray-Ban Wayfarer Classic (RB2140-50)</option>
                  <option value="VX-PHY-167">Varilux Physio Eye-protect (VX-PHY-167)</option>
                  <option value="TRT-GENS-GY">Transitions Gen S Photochromic (TRT-GENS-GY)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold block text-slate-600 text-[10px] uppercase">Quantité physique à ajouter</label>
                <input 
                  type="number" 
                  value={supplyQty}
                  onChange={e => setSupplyQty(e.target.value)}
                  placeholder="Ex: 25" 
                  className="w-full p-2.5 rounded-lg border outline-none focus:border-cyan-600 font-sans" 
                  required 
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowSupplyModal(false)}
                  className="px-4 py-2 bg-slate-100 border text-slate-700 rounded-lg hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-cyan-700 text-white font-bold rounded-lg hover:bg-cyan-800 cursor-pointer animate-pulse"
                >
                  Restocker la boutique
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STOCK TRANSFER MODAL SANS LISTE DEROULANTE --- */}
      {showTransferStockModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-205 shadow-xl max-w-md w-full p-6 space-y-4 text-xs text-[#1F2937] text-left">
            <div>
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-cyan-705">Virement Logistique Inter-Boutique</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Transférer des montures ou verres d'une filiale d'optique à une autre.</p>
            </div>
            <form onSubmit={handleBoutiqueStockTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold block text-slate-600 text-[10px] uppercase">Boutique Source</label>
                  <select 
                    value={stockTransferSource} 
                    onChange={e => setStockTransferSource(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none bg-slate-50"
                  >
                    {boutiqueStocks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold block text-slate-600 text-[10px] uppercase">Boutique Destination</label>
                  <select 
                    value={stockTransferDest} 
                    onChange={e => setStockTransferDest(e.target.value)}
                    className="w-full p-2.5 rounded-lg border outline-none bg-slate-50"
                  >
                    {boutiqueStocks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold block text-slate-600 text-[10px] uppercase font-sans">Comportement / Produit cible</label>
                <select 
                  value={transferSku} 
                  onChange={e => setTransferSku(e.target.value)}
                  className="w-full p-2.5 rounded-lg border outline-none bg-slate-50 font-sans"
                >
                  <option value="RB2140-50">Ray-Ban Wayfarer Classic (RB2140-50)</option>
                  <option value="VX-PHY-167">Varilux Physio Eye-protect (VX-PHY-167)</option>
                  <option value="TRT-GENS-GY">Transitions Gen S Photochromic (TRT-GENS-GY)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold block text-slate-600 text-[10px] uppercase">Quantité logistique à délocaliser</label>
                <input 
                  type="number" 
                  value={transferWeightQty}
                  onChange={e => setTransferWeightQty(e.target.value)}
                  placeholder="Ex: 5" 
                  className="w-full p-2.5 rounded-lg border outline-none focus:border-cyan-600 font-mono font-bold text-center" 
                  required 
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTransferStockModal(false)}
                  className="px-4 py-2 bg-slate-100 border text-slate-700 rounded-lg hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-cyan-700 text-white font-bold rounded-lg hover:bg-cyan-800 cursor-pointer"
                >
                  Valider le transfert de stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Deletion Confirmation Modal Overlay */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="delete-confirmation-overlay">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {deleteConfirmation.title}
                </h3>
                <p className="text-xs text-slate-500 leading-normal">
                  {deleteConfirmation.message}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 bg-slate-100 border text-slate-700 rounded-lg hover:bg-slate-200 font-bold transition text-xs cursor-pointer"
              >
                {currentLanguage === 'FR' ? "Annuler" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg transition text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {currentLanguage === 'FR' ? "Confirmer la suppression" : "Confirm Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
