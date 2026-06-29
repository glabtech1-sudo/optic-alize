import { TableDefinition, WebSocketEvent } from '../types/architecture';

export const dbTables: TableDefinition[] = [
  {
    name: 'hr_attendance',
    description: 'Enregistre les pointages d\'émargement quotidiens du personnel optique (présence, retards, départs anticipés).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID du pointage.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Id du locataire (groupe de lunetterie) pour isolation.' },
      { name: 'employee_id', type: 'UUID', constraints: 'NOT NULL REFERENCES employees(id)', description: 'ID de l\'employé.' },
      { name: 'date', type: 'DATE', constraints: 'NOT NULL DEFAULT CURRENT_DATE', description: 'Date de l\'émargement.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Statut : Présent, Retard, Absent.' },
      { name: 'check_in_time', type: 'TIME', description: 'Heure de pointage d\'arrivée.' },
      { name: 'check_out_time', type: 'TIME', description: 'Heure de pointage de départ.' },
      { name: 'notes', type: 'TEXT', description: 'Commentaire ou justificatif médical/retard.' }
    ],
    policies: [
      { name: 'Attendance multi-tenant isolation', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Chaque magasin accède séparément à son registre de présence.' }
    ]
  },
  {
    name: 'hr_leaves',
    description: 'Suivi et arbitrage des plannings de congés (payés, maladie, maternité, sans solde) signés par le directeur de succursale.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID du congé.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Id du locataire pour isolation.' },
      { name: 'employee_id', type: 'UUID', constraints: 'NOT NULL REFERENCES employees(id)', description: 'Rattachement salarié.' },
      { name: 'leave_type', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Type de congé (Payé, Maladie, Maternité, Sans solde).' },
      { name: 'start_date', type: 'DATE', constraints: 'NOT NULL', description: 'Premier jour d\'absence.' },
      { name: 'end_date', type: 'DATE', constraints: 'NOT NULL', description: 'Dernier jour d\'absence.' },
      { name: 'days_count', type: 'INTEGER', constraints: 'NOT NULL', description: 'Nombre total de jours calendaires.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'NOT NULL DEFAULT \'En attente\'', description: 'Statut de la demande : En attente, Approuvé, Refusé.' },
      { name: 'reason', type: 'TEXT', description: 'Justificatif ou raison personnelle.' }
    ],
    policies: [
      { name: 'Leaves multi-tenant visibility', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Seul le personnel RH rattaché au même tenant peut arbitrer.' }
    ]
  },
  {
    name: 'hr_salary_adjustments',
    description: 'Inscrit l\'ensemble des primes exceptionnelles ou des acomptes/avances temporaires imputables sur le bulletin de salaire.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID de l\'ajustement variable.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Id du locataire.' },
      { name: 'employee_id', type: 'UUID', constraints: 'NOT NULL REFERENCES employees(id)', description: 'Employé bénéficiaire.' },
      { name: 'type', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Nature : Prime, Avance.' },
      { name: 'amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Montant en devise locale.' },
      { name: 'date', type: 'DATE', constraints: 'NOT NULL DEFAULT CURRENT_DATE', description: 'Date d\'inscription.' },
      { name: 'description', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Libellé explicatif.' }
    ],
    policies: [
      { name: 'Salary adjustments tenant checks', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Confidentialité stricte des écritures financières de salaires.' }
    ]
  },
  {
    name: 'hr_payslips',
    description: 'Stocke les fiches et livres de paie calculés de manière immuables par période comptable.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID de la ligne de paie.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Id du tenant.' },
      { name: 'employee_id', type: 'UUID', constraints: 'NOT NULL REFERENCES employees(id)', description: 'Salarié payé.' },
      { name: 'period', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Mois et année de liquidation de paie (ex : Juin 2026).' },
      { name: 'basic_salary', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Salaire contractuel.' },
      { name: 'total_primes', type: 'DECIMAL(10,2)', constraints: 'NOT NULL DEFAULT 0.00', description: 'Cumul des primes reçues.' },
      { name: 'total_avances', type: 'DECIMAL(10,2)', constraints: 'NOT NULL DEFAULT 0.00', description: 'Cumul des avances déduites.' },
      { name: 'social_deductions', type: 'DECIMAL(10,2)', constraints: 'NOT NULL DEFAULT 0.00', description: 'Charges de sécurité sociale.' },
      { name: 'tax_deductions', type: 'DECIMAL(10,2)', constraints: 'NOT NULL DEFAULT 0.00', description: 'Retenues fiscales directes (ITS).' },
      { name: 'net_salary', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Net net payable au salarié.' },
      { name: 'payment_status', type: 'VARCHAR(50)', constraints: 'NOT NULL DEFAULT \'Brouillon\'', description: 'Brouillon, Payé.' },
      { name: 'payment_date', type: 'DATE', description: 'Date d\'ordre de virement bancaire.' }
    ],
    policies: [
      { name: 'Payslips tenant access control', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Accès limité au service comptable ou gérant pour le paiement.' }
    ]
  },
  {
    name: 'users',
    description: 'Enregistre tous les comptes d\'accès de la plateforme G-LAB OPTIC. Intégré nativement avec Supabase Auth pour l\'authentification sécurisée multi-facteurs (MFA).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY REFERENCES auth.users(id)', description: 'ID de l\'utilisateur, mappé sur la table Supabase Auth.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Id du locataire (groupe de lunetterie) pour isolation.' },
      { name: 'email', type: 'VARCHAR(255)', constraints: 'UNIQUE NOT NULL', description: 'Adresse de messagerie de connexion.' },
      { name: 'is_active', type: 'BOOLEAN', constraints: 'DEFAULT TRUE', description: 'Statut du droit d\'accès.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Date de provisionnement du compte.' }
    ],
    policies: [
      { name: 'Users access self only', action: 'SELECT', roles: ['authenticated'], using: "auth.uid() = id", description: 'Un utilisateur peut lire son propre profil.' },
      { name: 'Tenant master full access', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'L\'administrateur général du tenant peut administrer tous les comptes.' }
    ]
  },
  {
    name: 'roles',
    description: 'Rôles RBAC (Role-Based Access Control) paramétrables par la chaîne optique (ex: Opticien-Conseil, Optométriste, Directeur de succursale, SuperAdmin).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'Identifiant unique du rôle.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'ID de la chaîne optique.' },
      { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Libellé du rôle utilisateur.' },
      { name: 'description', type: 'TEXT', constraints: '', description: 'Rôle fonctionnel au sein du magasin.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Date de définition.' }
    ],
    policies: [
      { name: 'Tenant isolation read', action: 'SELECT', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Lecture isolée par tenant.' }
    ]
  },
  {
    name: 'permissions',
    description: 'Permissions granulaires liant les rôles d\'accès aux actions ERP (ex: "inventory.write", "billing.sign", "medical.read").',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique.' },
      { name: 'code', type: 'VARCHAR(100)', constraints: 'UNIQUE NOT NULL', description: 'Code technique de la permission.' },
      { name: 'label', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Libellé usuel (ex: "Éditer l\'ordonnance patient").' },
      { name: 'module', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Module ERP concerné.' }
    ],
    policies: [
      { name: 'System wide read', action: 'SELECT', roles: ['authenticated'], using: "true", description: 'Toutes les permissions système sont lisibles par les utilisateurs authentifiés.' }
    ]
  },
  {
    name: 'zones',
    description: 'Découpage géographique de la franchise optique (ex: Europe de l\'Ouest, Île-de-France, Amérique du Nord) pour des consolidations analytiques régionales.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique de la zone.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Lien d\'appartenance SaaS.' },
      { name: 'name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Nom de la région.' },
      { name: 'currency', type: 'VARCHAR(10)', constraints: 'DEFAULT \'EUR\'', description: 'Devise monétaire de transaction.' },
      { name: 'tax_rate', type: 'DECIMAL(5,2)', constraints: 'DEFAULT 20.00', description: 'TVA par défaut appliquée dans la zone.' }
    ],
    policies: [
      { name: 'Zone Multi-tenant isolation', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Cloisonnement par enseigne.' }
    ]
  },
  {
    name: 'branches',
    description: 'Les points de vente physiques et cliniques optiques actifs au sein des différentes zones de l\'enseigne.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique du magasin.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'ID de la chaîne optique.' },
      { name: 'zone_id', type: 'UUID', constraints: 'REFERENCES zones(id) ON DELETE SET NULL', description: 'Région de rattachement commercial.' },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Nom commercial du point de vente.' },
      { name: 'address', type: 'TEXT', constraints: 'NOT NULL', description: 'Adresse postale complète.' },
      { name: 'phone', type: 'VARCHAR(50)', constraints: '', description: 'Téléphone direct de la succursale.' }
    ],
    policies: [
      { name: 'Branch isolation policy', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Chaque utilisateur ne manipule que les succursales de son groupe.' }
    ]
  },
  {
    name: 'employees',
    description: 'Fiches et contrats des employés, opticiens agréés et optométristes de la franchise rattachés à leurs boutiques respectives.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique technicien.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS tenant.' },
      { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id) ON DELETE SET NULL', description: 'Lien optionnel vers son compte d\'accès.' },
      { name: 'branch_id', type: 'UUID', constraints: 'REFERENCES branches(id) ON DELETE CASCADE', description: 'Boutique d\'affectation principale.' },
      { name: 'first_name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Prénom.' },
      { name: 'last_name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Nom de famille.' },
      { name: 'license_number', type: 'VARCHAR(100)', constraints: '', description: 'Numéro d\'agrément professionnel (Adeli/RPPS pour le remboursement mutuelle).' }
    ],
    policies: [
      { name: 'Employee multi-tenant', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Isolé par enseigne.' }
    ]
  },
  {
    name: 'customers',
    description: 'Dossier patient central contenant les informations administratives, optométriques clés et couverture d\'assurance maladie.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique du patient.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS tenant.' },
      { name: 'first_name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Prénom.' },
      { name: 'last_name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Nom de famille.' },
      { name: 'birth_date', type: 'DATE', constraints: 'NOT NULL', description: 'Date de naissance (nécessaire pour calcul de presbytie et tiers payant SECU).' },
      { name: 'email', type: 'VARCHAR(255)', constraints: '', description: 'E-mail.' },
      { name: 'phone', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Numéro de mobile pour alerte SMS de réception.' },
      { name: 'social_security_number', type: 'VARCHAR(30)', constraints: '', description: 'NIR pour le tiers payant direct.' },
      { name: 'loyalty_points', type: 'INT', constraints: 'DEFAULT 0', description: 'Points cumulés de fidélité obtenus via achats.' },
      { name: 'loyalty_tier', type: 'VARCHAR(50)', constraints: 'DEFAULT \'STANDARD\'', description: 'Niveau CRM : STANDARD, GOLD, PLATINUM, VIP.' }
    ],
    policies: [
      { name: 'Customers tenant isolation', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Sécurise le secret médical et commercial.' }
    ]
  },
  {
    name: 'suppliers',
    description: 'Centralise les données des fabricants de verres correcteurs, fabricants de montures, et laboratoires (ex: Essilor, Zeiss, Luxottica).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS tenant.' },
      { name: 'company_name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Raison sociale du fournisseur.' },
      { name: 'contact_name', type: 'VARCHAR(150)', constraints: '', description: 'Gestionnaire de compte.' },
      { name: 'email', type: 'VARCHAR(255)', constraints: '', description: 'Email pour EDI commandes de verres.' },
      { name: 'api_endpoint', type: 'TEXT', constraints: '', description: 'Endpoint EDI pour l\'envoi électronique de commandes à la commande.' }
    ],
    policies: [
      { name: 'Suppliers read write by tenant', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Chaque groupe négocie avec ses fournisseurs attitrés.' }
    ]
  },
  {
    name: 'categories',
    description: 'Segmentation hiérarchique du catalogue de stock (ex: Montures Optiques, Lunettes de Soleil, Verres Unifocaux, Verres Progressifs, Lentilles de Contact).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS tenant.' },
      { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Nom de la catégorie.' },
      { name: 'parent_id', type: 'UUID', constraints: 'REFERENCES categories(id) ON DELETE SET NULL', description: 'Hiérarchie produit.' }
    ],
    policies: [
      { name: 'Category tenant read-only', action: 'SELECT', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Sécurité multi-enseignes.' }
    ]
  },
  {
    name: 'brands',
    description: 'Marques de lunettes et sous-traitants verres reconnus (ex: Ray-Ban, Persol, Essilor, Shamir).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS tenant.' },
      { name: 'name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Nom de la marque.' },
      { name: 'manufacturer', type: 'VARCHAR(255)', constraints: '', description: 'Nom de l\'usine d\'origine.' }
    ],
    policies: [
      { name: 'Brands standard RLS', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Isolation de marque.' }
    ]
  },
  {
    name: 'products',
    description: 'Catalogue unifié des produits (Montures d\'origine, verres complexes brevetés, lentilles, accessoires).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS tenant.' },
      { name: 'category_id', type: 'UUID', constraints: 'REFERENCES categories(id)', description: 'Catégorie.' },
      { name: 'brand_id', type: 'UUID', constraints: 'REFERENCES brands(id)', description: 'Marque.' },
      { name: 'sku', type: 'VARCHAR(100)', constraints: 'UNIQUE NOT NULL', description: 'Code barre unique (Stock Keeping Unit).' },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Nom commercial complet d\'expédition.' },
      { name: 'cost_price', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Prix d\'achat direct usine unitaire.' },
      { name: 'sale_price', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Prix public affiché.' }
    ],
    policies: [
      { name: 'Products tenant control', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Sécurité multi-enseignes.' }
    ]
  },
  {
    name: 'inventory',
    description: 'Niveau d\'inventaire réel de chaque produit par rapport aux branches (boutiques) physiques de l\'opticien.',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID allocation.' },
      { name: 'branch_id', type: 'UUID', constraints: 'REFERENCES branches(id) ON DELETE CASCADE', description: 'Magasin affecté.' },
      { name: 'product_id', type: 'UUID', constraints: 'REFERENCES products(id) ON DELETE CASCADE', description: 'Produit matériel.' },
      { name: 'stock_qty', type: 'INT', constraints: 'NOT NULL DEFAULT 0', description: 'Nombre total en stock physique.' },
      { name: 'min_alert_qty', type: 'INT', constraints: 'DEFAULT 2', description: 'Seuil minimum pour alerte d\'achat usine.' }
    ],
    policies: [
      { name: 'Inventory branch RLS', action: 'ALL', roles: ['authenticated'], using: "branch_id IN (SELECT id FROM branches WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)", description: 'Isolement par l\'arbre de succursales.' }
    ]
  },
  {
    name: 'stock_movements',
    description: 'Enregistre tous les mouvements du stock : Entrée achat, Vente client, Rebut casse, Transfert d\'une boutique A à une boutique B.',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID mouvement.' },
      { name: 'from_branch_id', type: 'UUID', constraints: 'REFERENCES branches(id)', description: 'Succursale expéditrice (si transfert).' },
      { name: 'to_branch_id', type: 'UUID', constraints: 'REFERENCES branches(id)', description: 'Succursale réceptrice.' },
      { name: 'product_id', type: 'UUID', constraints: 'REFERENCES products(id)', description: 'Produit en mouvement.' },
      { name: 'qty', type: 'INT', constraints: 'NOT NULL', description: 'Quantité nette mobilisée.' },
      { name: 'type', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Type de flux: PURCHASE, SALE, TRANSFER, LOSS, ADJUSTMENT.' },
      { name: 'performed_by', type: 'UUID', constraints: 'REFERENCES employees(id)', description: 'ID de l\'employé ayant homologué l\'ajustement.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Horodatage transaction.' }
    ],
    policies: [
      { name: 'Movements constraint', action: 'ALL', roles: ['authenticated'], using: "to_branch_id IN (SELECT id FROM branches WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)", description: 'Vérification de tenant d\'arrivée.' }
    ]
  },
  {
    name: 'sales',
    description: 'Les ventes de lunettes complètes. Unifie la prise en charge tiers-payant de la caisse d\'Assurance Maladie.',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID de la facture.' },
      { name: 'branch_id', type: 'UUID', constraints: 'REFERENCES branches(id)', description: 'Boutique vendeuse.' },
      { name: 'customer_id', type: 'UUID', constraints: 'REFERENCES customers(id)', description: 'Acheteur (Patient).' },
      { name: 'sold_by', type: 'UUID', constraints: 'REFERENCES employees(id)', description: 'Opticien conseil signataire.' },
      { name: 'subtotal', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Montant HT.' },
      { name: 'tax_amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Montant de la TVA.' },
      { name: 'total_amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Total TTC à payer.' },
      { name: 'mutuelle_amount', type: 'DECIMAL(10,2)', constraints: 'DEFAULT 0.00', description: 'Part prise en charge directement par la complémentaire.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'DEFAULT \'PENDING\'', description: 'DRAFT, PENDING, PAID, REFUNDED.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Date de la transaction.' }
    ],
    policies: [
      { name: 'Sales RLS isolation', action: 'ALL', roles: ['authenticated'], using: "branch_id IN (SELECT id FROM branches WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)", description: 'Isolé par l\'arbre de succursales.' }
    ]
  },
  {
    name: 'sale_items',
    description: 'Détail de la vente (Equipement oculaire œil droit vs œil gauche, type de traitement verres antireflet/lumière bleue).',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique ligne.' },
      { name: 'sale_id', type: 'UUID', constraints: 'REFERENCES sales(id) ON DELETE CASCADE', description: 'Lien facture.' },
      { name: 'product_id', type: 'UUID', constraints: 'REFERENCES products(id)', description: 'Référence du verre ou monture.' },
      { name: 'qty', type: 'INT', constraints: 'NOT NULL DEFAULT 1', description: 'Quantité unitaire.' },
      { name: 'unit_price', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Prix facturé.' },
      { name: 'eye_side', type: 'VARCHAR(10)', constraints: '', description: 'Concerne: LEFT, RIGHT, BOTH, NONE.' }
    ],
    policies: [
      { name: 'Sales items read through sales join', action: 'ALL', roles: ['authenticated'], using: "sale_id IN (SELECT id FROM sales WHERE branch_id IN (SELECT id FROM branches WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid))", description: 'Accès restreint par ID de la facture jointe.' }
    ]
  },
  {
    name: 'prescriptions',
    description: 'Prescription clinique d\'un médecin ophtalmologiste ou ajustement clinique d\'optométrie issu d\'un test de vue G-LAB.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID ordonnance.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS tenant.' },
      { name: 'customer_id', type: 'UUID', constraints: 'REFERENCES customers(id) ON DELETE CASCADE', description: 'Patient sujet.' },
      { name: 'ophthalmologist_name', type: 'VARCHAR(200)', constraints: '', description: 'Médecin auteur de l\'ordonnance.' },
      { name: 'od_sphere', type: 'DECIMAL(4,2)', constraints: 'NOT NULL', description: 'Logistique vision oeil droit.' },
      { name: 'og_sphere', type: 'DECIMAL(4,2)', constraints: 'NOT NULL', description: 'Logistique vision oeil gauche.' },
      { name: 'prescription_date', type: 'DATE', constraints: 'NOT NULL', description: 'Date de signature d\'ordonnance.' },
      { name: 'is_expired', type: 'BOOLEAN', constraints: 'DEFAULT FALSE', description: 'Vérifie si l\'ordonnance de 3 ans ou 5 ans est expirée.' }
    ],
    policies: [
      { name: 'Prescriptions medical isolation', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Isolation stricte conforme rgpd.' }
    ]
  },
  {
    name: 'orders',
    description: 'Commandes d\'un opticien auprès d\'Essilor ou d\'un distributeur de monture. Contient les détails logistiques d\'approvisionnement.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS Tenant.' },
      { name: 'branch_id', type: 'UUID', constraints: 'REFERENCES branches(id) ON DELETE CASCADE', description: 'Succursale à livrer.' },
      { name: 'supplier_id', type: 'UUID', constraints: 'REFERENCES suppliers(id)', description: 'Fournisseur d\'approvisionnement.' },
      { name: 'order_number', type: 'VARCHAR(100)', constraints: 'UNIQUE NOT NULL', description: 'Numéro de lot logistique.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'DEFAULT \'INITIATED\'', description: 'INITIATED, SENT, RECEIVED, CLOSED.' },
      { name: 'estimated_delivery', type: 'DATE', constraints: '', description: 'Date de livraison verres estimée.' }
    ],
    policies: [
      { name: 'Orders isolation policy', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Chaque franchise pilote ses commandes.' }
    ]
  },
  {
    name: 'order_items',
    description: 'Articles constitutifs des commandes logistiques (verres minéraux, résines dures, montures, etc.).',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique.' },
      { name: 'order_id', type: 'UUID', constraints: 'REFERENCES orders(id) ON DELETE CASCADE', description: 'ID de la commande.' },
      { name: 'product_id', type: 'UUID', constraints: 'REFERENCES products(id)', description: 'Produit.' },
      { name: 'quantity', type: 'INT', constraints: 'NOT NULL', description: 'Quantité brute.' },
      { name: 'unit_cost', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Prix unitaire d\'achat concédé par le verrier.' }
    ],
    policies: [
      { name: 'Order items constraint', action: 'ALL', roles: ['authenticated'], using: "order_id IN (SELECT id FROM orders WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)", description: 'Restriction par ID de commande.' }
    ]
  },
  {
    name: 'expenses',
    description: 'Charges d\'exploitation d\'une boutique (Loyer, électricité, consommables meules optiques de l\'atelier d\'ajustement).',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique charge.' },
      { name: 'branch_id', type: 'UUID', constraints: 'REFERENCES branches(id) ON DELETE CASCADE', description: 'Succursale affectée.' },
      { name: 'description', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Intitulé de la dépense.' },
      { name: 'category', type: 'VARCHAR(100)', constraints: '', description: 'Loyers, Électricité, Achats outillage...' },
      { name: 'amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Dépense nette TTC.' },
      { name: 'expense_date', type: 'DATE', constraints: 'DEFAULT CURRENT_DATE', description: 'Date de la dépense.' }
    ],
    policies: [
      { name: 'Expenses branch RLS', action: 'ALL', roles: ['authenticated'], using: "branch_id IN (SELECT id FROM branches WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)", description: 'Les opticiens d\'une chaîne voient leurs dépenses de groupe.' }
    ]
  },
  {
    name: 'accounts',
    description: 'Plan comptable standard d\'un groupe de lunetterie servant au livre financier.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS Tenant.' },
      { name: 'account_number', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Numéro de compte (ex: 512 Banque, 707 Ventes de marchandises).' },
      { name: 'name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Intitulé du compte financier.' },
      { name: 'type', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Type de compte: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE.' }
    ],
    policies: [
      { name: 'Accounts RLS', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Le registre comptable est ultra-hermétique.' }
    ]
  },
  {
    name: 'transactions',
    description: 'Toutes les écritures réelles en partie double impactant le grand livre comptable (Débit vs Crédit).',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID unique transaction.' },
      { name: 'account_id', type: 'UUID', constraints: 'REFERENCES accounts(id) ON DELETE CASCADE', description: 'Compte comptable associé.' },
      { name: 'reference_type', type: 'VARCHAR(50)', constraints: '', description: 'Type de pièce justificative: SALE, PURCHASE, SALARY.' },
      { name: 'reference_id', type: 'UUID', constraints: '', description: 'UUID de la facture ou écriture connexe.' },
      { name: 'debit', type: 'DECIMAL(10,2)', constraints: 'DEFAULT 0.00', description: 'Montant à débiter.' },
      { name: 'credit', type: 'DECIMAL(10,2)', constraints: 'DEFAULT 0.00', description: 'Montant à créditer.' },
      { name: 'transaction_date', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Date d\'écriture.' }
    ],
    policies: [
      { name: 'Transactions protection policy', action: 'ALL', roles: ['authenticated'], using: "account_id IN (SELECT id FROM accounts WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)", description: 'Contrôlé par jointure directe de compte.' }
    ]
  },
  {
    name: 'payroll',
    description: 'Fiches de paie et rémunérations des opticiens, techniciens d\'atelier de montage et administratifs rattachés.',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID fiche de paie.' },
      { name: 'employee_id', type: 'UUID', constraints: 'REFERENCES employees(id) ON DELETE CASCADE', description: 'Technicien bénéficiaire.' },
      { name: 'period_start', type: 'DATE', constraints: 'NOT NULL', description: 'Début du mois de travail.' },
      { name: 'base_salary', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Salaire contractuel de base.' },
      { name: 'commission_amount', type: 'DECIMAL(10,2)', constraints: 'DEFAULT 0.00', description: 'Primes sur les volumes de ventes de verres ou traitements spécifiques.' },
      { name: 'net_paid', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Salaire net perçu.' }
    ],
    policies: [
      { name: 'Payroll restriction by tenant', action: 'ALL', roles: ['authenticated'], using: "employee_id IN (SELECT id FROM employees WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)", description: 'Seul la Direction RH de l\'enseigne manipule la paie.' }
    ]
  },
  {
    name: 'attendance',
    description: 'Suivi horaire de présence des opticiens dans les boutiques pour analyser la charge commerciale vs présence de praticiens diplômés.',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID pointage.' },
      { name: 'employee_id', type: 'UUID', constraints: 'REFERENCES employees(id) ON DELETE CASCADE', description: 'Staff concerné.' },
      { name: 'clock_in', type: 'TIMESTAMP', constraints: 'NOT NULL', description: 'Date/Heure d\'arrivée.' },
      { name: 'clock_out', type: 'TIMESTAMP', constraints: '', description: 'Date/Heure de départ.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'DEFAULT \'PRESENT\'', description: 'PRESENT, LATE, ABSENT.' }
    ],
    policies: [
      { name: 'Attendance branch restrictions', action: 'ALL', roles: ['authenticated'], using: "employee_id IN (SELECT id FROM employees WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)", description: 'Limité au tenant courant.' }
    ]
  },
  {
    name: 'leave_requests',
    description: 'Feuille d\'absence et demandes de congés payés ou formation visuelle continue validées par le directeur de succursale.',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID absence.' },
      { name: 'employee_id', type: 'UUID', constraints: 'REFERENCES employees(id) ON DELETE CASCADE', description: 'Praticien.' },
      { name: 'start_date', type: 'DATE', constraints: 'NOT NULL', description: 'Premier jour d\'absence.' },
      { name: 'end_date', type: 'DATE', constraints: 'NOT NULL', description: 'Dernier jour.' },
      { name: 'reason', type: 'VARCHAR(150)', constraints: '', description: 'Justification.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'DEFAULT \'SUBMITTED\'', description: 'SUBMITTED, APPROVED, REJECTED.' }
    ],
    policies: [
      { name: 'Leaves tenant limit', action: 'ALL', roles: ['authenticated'], using: "employee_id IN (SELECT id FROM employees WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)", description: 'Restriction par tenant.' }
    ]
  },
  {
    name: 'messages',
    description: 'Messagerie instantanée interne pour la communication logistique, de réassorts urgents ou conseils techniques entre ateliers de montage.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID message.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS Tenant.' },
      { name: 'sender_id', type: 'UUID', constraints: 'REFERENCES employees(id)', description: 'Auteur.' },
      { name: 'recipient_id', type: 'UUID', constraints: 'REFERENCES employees(id)', description: 'Destinataire d\'atelier.' },
      { name: 'content', type: 'TEXT', constraints: 'NOT NULL', description: 'Corps du message.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Dernière mise à jour.' }
    ],
    policies: [
      { name: 'Messages within same optical group', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Une succursale ne communique que dans son enseigne.' }
    ]
  },
  {
    name: 'notifications',
    description: 'Système d\'alerte de l\'ERP alertant des ordonnances expirées près des 3 ans, livraisons Essilor prêtes ou ruptures de stock critiques.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID alerte.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Tenant SaaS.' },
      { name: 'title', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Intitulé de l\'alerte.' },
      { name: 'message', type: 'TEXT', constraints: 'NOT NULL', description: 'Texte descriptif.' },
      { name: 'is_read', type: 'BOOLEAN', constraints: 'DEFAULT FALSE', description: 'Indique si l\'alerte a été acquittée.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Horodatage.' }
    ],
    policies: [
      { name: 'Read write notification limits', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Alerte isolée.' }
    ]
  },
  {
    name: 'warranties',
    description: 'Suivi des contrats de garantie de 2 ans contre la casse monture/verres et d\'adaptation visuelle (garantie d\'adaptation de 3 mois).',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID contrat.' },
      { name: 'sale_item_id', type: 'UUID', constraints: 'REFERENCES sale_items(id) ON DELETE CASCADE', description: 'Ligne d\'article assurée.' },
      { name: 'policy_number', type: 'VARCHAR(150)', constraints: 'UNIQUE NOT NULL', description: 'Numéro de couverture.' },
      { name: 'coverage_years', type: 'INT', constraints: 'DEFAULT 2', description: 'Nombre d\'années de couverture casse.' },
      { name: 'is_redeemed', type: 'BOOLEAN', constraints: 'DEFAULT FALSE', description: 'Indique si le verre a déjà été substitué (limité à 1 remplacement).' }
    ],
    policies: [
      { name: 'Warranties link checks', action: 'ALL', roles: ['authenticated'], using: "sale_item_id IN (SELECT id FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE branch_id IN (SELECT id FROM branches WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)))", description: 'Validation de l\'appartenance de la vente.' }
    ]
  },
  {
    name: 'payments',
    description: 'Historique des paiements de factures (Gère l\'échelonnement en 3x, les encaissements RO/Sécurités Sociales et part Mutuelles complémentaires).',
    isTenantSpecific: false,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID paiement unique.' },
      { name: 'sale_id', type: 'UUID', constraints: 'REFERENCES sales(id) ON DELETE CASCADE', description: 'Facture associée à l\'encaissement.' },
      { name: 'amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Montant encaissé.' },
      { name: 'payment_method', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Moyen de paiement : CB, ESPECES, CHEQUE, TIERS_PAYANT_AMO, TIERS_PAYANT_AMC.' },
      { name: 'transaction_reference', type: 'VARCHAR(150)', constraints: '', description: 'Numéro de télétransmission ou ID terminal bancaire.' },
      { name: 'status', type: 'VARCHAR(50)', constraints: 'DEFAULT \'SUCCESS\'', description: 'Statut : PENDING, SUCCESS, REJECTED.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Horodatage du paiement.' }
    ],
    policies: [
      { name: 'Payments read through sales join', action: 'SELECT', roles: ['authenticated'], using: "sale_id IN (SELECT id FROM sales WHERE branch_id IN (SELECT id FROM branches WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid))", description: 'Seuls les opticiens de la même enseigne peuvent consulter les règlements.' }
    ]
  },
  {
    name: 'documents',
    description: 'Fichiers dématérialisés stockés dans Supabase Storage (Prescriptions de correction, scans d\'ordonnances, devis normalisés signés conformes tiers-payant).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID document.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'SaaS Tenant.' },
      { name: 'customer_id', type: 'UUID', constraints: 'REFERENCES customers(id) ON DELETE CASCADE', description: 'Patient lié.' },
      { name: 'document_type', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Type de document: PRESCRIPTION_SCAN, QUOTE_SIGNED, MUTUELLE_CARD.' },
      { name: 'file_url', type: 'TEXT', constraints: 'NOT NULL', description: 'Lien direct vers l\'asset dans le bucket Supabase Storage sécurisé.' }
    ],
    policies: [
      { name: 'Documents isolation conform GDPR', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Confidentialité stricte des images et scans médicaux.' }
    ]
  },
  {
    name: 'accounting_revenues',
    description: 'Enregistre l\'ensemble des écritures de recettes comptabilisées par les succursales de lunetterie (ventes de lunettes, tiers-payant mutuelles, actes optométrie).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'Id unique de la recette.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Identifiant d\'appartenance de la chaîne optique.' },
      { name: 'date', type: 'DATE', constraints: 'NOT NULL DEFAULT CURRENT_DATE', description: 'Date de comptabilisation.' },
      { name: 'description', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Détail de la recette.' },
      { name: 'category', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Classification: Solaire, Lentilles, Lunettes, Optométrie.' },
      { name: 'payment_method', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Canal d\'encaissement: Caisse, Banque, Mobile Money.' },
      { name: 'total_amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Montant TTC perçu.' }
    ],
    policies: [
      { name: 'Revenue access by group accountants', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Seuls les gérants ou directeurs de magasin d\'une chaîne peuvent piloter ses recettes.' }
    ]
  },
  {
    name: 'accounting_expenses',
    description: 'Suivi permanent des dépenses et charges d\'exploitation opérationnelles de chaque magasin ou atelier (achats verres Essilor, loyer, outillage).',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'Identifiant de dépense.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Id de la chaîne optique.' },
      { name: 'date', type: 'DATE', constraints: 'NOT NULL DEFAULT CURRENT_DATE', description: 'Date de règlement.' },
      { name: 'description', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Sujet de la dépense.' },
      { name: 'supplier', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Fournisseur d\'approvisionnement.' },
      { name: 'category', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Catégorie budgétaire comptable.' },
      { name: 'payment_method', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Caisse, Banque ou Mobile Money.' },
      { name: 'total_amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Montant TTC de la charge.' }
    ],
    policies: [
      { name: 'Expense isolation row check', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Chaque franchise isole son livre de charges.' }
    ]
  },
  {
    name: 'accounting_mobile_money',
    description: 'Flux financiers et de trésorerie mobiles locaux (Wave, Orange Money, MTN MM) pour optimiser les encaissements dématérialisés sans compte de dépôt de proximité.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID transaction mobile.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Id de la franchise.' },
      { name: 'operator', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Opérateur GSM agréé.' },
      { name: 'type', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Encaissement, Retrait Flotte, Frais.' },
      { name: 'amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'Flux net.' },
      { name: 'reference_gsm', type: 'VARCHAR(100)', constraints: 'UNIQUE', description: 'ID de transaction unique de l\'opérateur.' }
    ],
    policies: [
      { name: 'Mobile money isolation limit', action: 'ALL', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid", description: 'Sécurise l\'accès aux flottes monétaires par franchise.' }
    ]
  },
  {
    name: 'auth_activity_logs',
    description: 'Journal complet d\'audit d\'activité. Enregistre toutes les opérations d\'écriture (CUD) des utilisateurs de manière immuable au niveau de la base PostgreSQL.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID du log.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Tenant SaaS.' },
      { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id)', description: 'Utilisateur auteur.' },
      { name: 'action', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Action (ex: UPDATE_PRESCRIPTION, DELETE_PRODUCT).' },
      { name: 'table_name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Table affectée.' },
      { name: 'record_id', type: 'UUID', description: 'Identifiant de la ligne modifiée.' },
      { name: 'old_data', type: 'JSONB', description: 'Données avant modification (pour rollback/historique).' },
      { name: 'new_data', type: 'JSONB', description: 'Données après modification.' },
      { name: 'client_ip', type: 'VARCHAR(45)', description: 'Adresse IP de l\'auteur.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Horodatage.' }
    ],
    policies: [
      { name: 'Read audit logs if auditor', action: 'SELECT', roles: ['authenticated'], using: "tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid AND (auth.jwt() -> 'user_metadata' -> 'permissions' ? 'audit.read')", description: 'Seuls les utilisateurs habilités (Comptable, RH, Gérant) peuvent consulter le journal d\'activité.' }
    ]
  },
  {
    name: 'auth_connection_history',
    description: 'Historique exhaustif des sessions et connexions avec suivi de la MFA/2FA, de l\'authentification par jeton de rafraîchissement (Refresh Token) et détection des anomalies de connexion.',
    isTenantSpecific: true,
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY DEFAULT uuid_generate_v4()', description: 'ID de session.' },
      { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL', description: 'Tenant SaaS.' },
      { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id)', description: 'Utilisateur.' },
      { name: 'session_token_hash', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Hash du token de session actif.' },
      { name: 'refresh_token_hash', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Hash du refresh token pour rotation.' },
      { name: 'client_ip', type: 'VARCHAR(45)', description: 'IP de connexion.' },
      { name: 'user_agent', type: 'TEXT', description: 'User-Agent du navigateur ou terminal mobile.' },
      { name: 'mfa_verified', type: 'BOOLEAN', constraints: 'DEFAULT FALSE', description: 'Indique si la double authentification par code TOTP a été passée.' },
      { name: 'is_revoked', type: 'BOOLEAN', constraints: 'DEFAULT FALSE', description: 'Jeton de session ou refresh token révoqué par l\'utilisateur ou le système.' },
      { name: 'expires_at', type: 'TIMESTAMP', constraints: 'NOT NULL', description: 'Date d\'expiration de la session.' },
      { name: 'last_used_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Date de dernière activité détectée.' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Horodatage initial.' }
    ],
    policies: [
      { name: 'Access self sessions', action: 'SELECT', roles: ['authenticated'], using: "user_id = auth.uid()", description: 'Chaque utilisateur peut voir l\'emplacement et le statut de ses sessions actives.' },
      { name: 'Revoke self sessions', action: 'UPDATE', roles: ['authenticated'], using: "user_id = auth.uid()", description: 'Chaque utilisateur peut déconnecter à distance une de ses sessions.' }
    ]
  }
];

export const websocketEvents: WebSocketEvent[] = [
  {
    event: 'SUBSCRIBE_BOUTIQUE',
    direction: 'client-to-server',
    payload: `{ "type": "SUBSCRIBE_BOUTIQUE", "boutiqueId": "e2a255be-ec75-4712-be20-1b5eeb430dcb" }`,
    description: 'Enregistre le client Flutter Web auprès de l\'orchestrateur WebSocket pour écouter en temps réel les transferts et ventes de la boutique sélectionnée.',
    handlerContext: 'Ajoute la socket client au map "boutiqueSubscriptions" et retourne un ACK.'
  },
  {
    event: 'STOCK_SYNCED',
    direction: 'server-to-client',
    payload: `{ "type": "STOCK_SYNCED", "boutiqueId": "e2a255be-ec75-4712-be20-1b5eeb430dcb", "frameId": "91a27e38-16ab-4f10-bf9d-f6ba62cde2a5", "stockCount": 4 }`,
    description: 'Déclenché par l\'orchestrateur Express lorsque le stock d\'une monture change (ex: vente, retour fabricant ou transfert inter-succursale). Met à jour instantanément la liste Riverpod sur toutes les sessions connectées de la boutique.',
    handlerContext: 'Le BoutiqueInventoryNotifier intercepte ce message dans Flutter et appelle state.copyWith() pour réviser le stock de l\'entité visée.'
  },
  {
    event: 'STOCK_ALERT_TRIGGERED',
    direction: 'server-to-client',
    payload: `{ "type": "STOCK_ALERT_TRIGGERED", "boutiqueId": "e2a255be-ec75-4712-be20-1b5eeb430dcb", "frameId": "91a27e38-16ab-4f10-bf9d-f6ba62cde2a5", "brand": "Ray-Ban", "model": "Wayfarer", "reason": "LOW_STOCK_ALERT" }`,
    description: 'Alerte instantanée poussée aux directeurs de boutiques lorsque le stock disponible de montures phares franchise tombe en deçà du seuil critique d\'approvisionnement.',
    handlerContext: 'Déclenche une bannière toast ou notification in-app dans le tableau de bord Flutter.'
  }
];
