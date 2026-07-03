import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Shield, Mail, Phone, MapPin, Edit2, Trash2, Check, X, Filter, Lock, Eye, EyeOff } from 'lucide-react';
import { fetchUsers, saveUser, deleteUser as apiDeleteUser } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Super Admin' | 'Directeur' | 'Manager' | 'Billing Manager' | 'Editor' | 'Viewer' | 'Gérant' | 'Caissier' | 'Opticien' | 'Magasinier' | 'Comptable' | 'Secrétaire';
  status: 'Active' | 'Suspended' | 'Pending MFA' | 'Invited';
  phone: string;
  location: string;
  lastActive: string;
  allowedBoutiques: string[];
  allowedModules: string[];
  password?: string;
}

interface SaaSUsersProps {
  darkMode?: boolean;
  currentLanguage?: 'FR' | 'EN';
  currentUserEmail?: string;
  users?: User[];
  setUsers?: React.Dispatch<React.SetStateAction<User[]>>;
  hrEmployees?: any[];
  createdBoutiques?: any[];
}

export default function SaaSUsers({ 
  darkMode = false,
  currentLanguage = 'FR',
  currentUserEmail = 'glabtech1@opticalize.com',
  users,
  setUsers,
  hrEmployees = [],
  createdBoutiques = []
}: SaaSUsersProps) {  // Local fallback if not passed as prop
  const [localUsers, setLocalUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('optic_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return [
      { id: 'USR-01', name: 'Administrateur Optic Alizé', email: 'glabtech1@opticalize.com', role: 'Admin', status: 'Active', phone: '+221 77 124 55 93', location: 'Optic Alizé - Dépôt Central', lastActive: 'Just now', allowedBoutiques: ['Optic Alizé - Dépôt Central'], allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'websockets', 'reports', 'hr', 'settings'], password: 'Gildas@00741' },
      { id: 'USR-GILDAS', name: 'Gildas Concepteur', email: 'anges.gildas@opticalizé.com', role: 'Admin', status: 'Active', phone: '+221 77 124 55 93', location: 'Optic Alizé - Dépôt Central', lastActive: 'Just now', allowedBoutiques: ['Optic Alizé - Dépôt Central'], allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'websockets', 'reports', 'hr', 'settings'], password: 'Gildas@00741' },
      { id: 'USR-GILDAS-ALT', name: 'Gildas Concepteur Alt', email: 'anges.gildas@opticalize.com', role: 'Admin', status: 'Active', phone: '+221 77 124 55 93', location: 'Optic Alizé - Dépôt Central', lastActive: 'Just now', allowedBoutiques: ['Optic Alizé - Dépôt Central'], allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'websockets', 'reports', 'hr', 'settings'], password: 'Gildas@00741' }
    ];
  });

  const queryClient = useQueryClient();

  const { data: qUsers, isLoading: isUsersLoading, refetch: refetchUsersQuery } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const dbUsers = await fetchUsers();
      if (dbUsers && dbUsers.length > 0) {
        return dbUsers as User[];
      }
      return localUsers;
    },
    initialData: users && users.length > 0 ? users : undefined,
  });

  const activeUsers = qUsers || users || localUsers;
  const activeSetUsers = setUsers || setLocalUsers;

  // React Query Cache synchronization effect
  useEffect(() => {
    if (qUsers) {
      if (setUsers) setUsers(qUsers);
      setLocalUsers(qUsers);
      localStorage.setItem('optic_users', JSON.stringify(qUsers));
    }
  }, [qUsers, setUsers]);

  // Mutations for instant React Query cache updates
  const saveUserMutation = useMutation({
    mutationFn: async (updatedUser: User) => {
      return await saveUser(updatedUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      refetchUsersQuery();
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiDeleteUser(email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      refetchUsersQuery();
    }
  });

  // Rendering optimization options
  const [renderMode, setRenderMode] = useState<'pagination' | 'virtualization'>('pagination');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Virtualization states
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const allEmployees = React.useMemo(() => {
    if (hrEmployees && hrEmployees.length > 0) return hrEmployees;
    const saved = localStorage.getItem('optic_hr_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  }, [hrEmployees]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Authenticated user checks
  const loggedInUser = activeUsers.find(u => u.email === currentUserEmail);
  const isAdmin = loggedInUser?.role === 'Admin' || 
                  currentUserEmail === 'glabtech1@gmail.com' || 
                  currentUserEmail === 'glabtech1@opticalize.com' || 
                  currentUserEmail === 'anges.gildas@gmail.com' || 
                  currentUserEmail === 'anges.gildas@opticalizé.com' ||
                  currentUserEmail === 'anges.gildas@opticalize.com';

  const canDeleteUser = true;

  // Read active boutiques from props, localStorage fallback or static defaults as requested
  let listAllBoutiques = [
    'Optic Alizé - Dépôt Central'
  ];

  if (createdBoutiques && createdBoutiques.length > 0) {
    listAllBoutiques = createdBoutiques.map((b: any) => b.name);
  } else {
    const savedBranchesStr = localStorage.getItem('optic_hq_branches');
    if (savedBranchesStr) {
      try {
        const branches = JSON.parse(savedBranchesStr);
        if (Array.isArray(branches) && branches.length > 0) {
          listAllBoutiques = branches.map((b: any) => b.name);
        }
      } catch (e) {}
    }
  }

  const listAllModules = [
    { id: 'dashboard', label: currentLanguage === 'FR' ? 'Dashboard' : 'Dashboard' },
    { id: 'fidelisation', label: currentLanguage === 'FR' ? 'Client & Registre' : 'Client & Register' },
    { id: 'fidelisation_sav', label: currentLanguage === 'FR' ? 'Fidélisation & S.A.V' : 'Loyalty & After-Sales' },
    { id: 'clinique', label: currentLanguage === 'FR' ? 'Clinique & Prescription' : 'Clinical & Prescription' },
    { id: 'products', label: currentLanguage === 'FR' ? 'Catalogue Optic' : 'Optical Catalog' },
    { id: 'commande', label: currentLanguage === 'FR' ? 'Commande Optic' : 'Optic Orders' },
    { id: 'orders', label: currentLanguage === 'FR' ? 'Point de Vente' : 'Point of Sale (POS)' },
    { id: 'journal', label: currentLanguage === 'FR' ? 'Journal de caisse' : 'Daily Cash Journal' },
    { id: 'websockets', label: currentLanguage === 'FR' ? 'Messagerie' : 'Messaging' },
    { id: 'revenue', label: currentLanguage === 'FR' ? 'Comptabilité & Trésorerie' : 'Accounting & Treasury' },
    { id: 'reports', label: currentLanguage === 'FR' ? 'Audits & reports' : 'Audits & Reports' },
    { id: 'hr', label: currentLanguage === 'FR' ? 'Ressources Humaines' : 'Human Resources' },
    { id: 'presence', label: currentLanguage === 'FR' ? 'Présence Employés' : 'Staff Attendance' },
    { id: 'gestion_optic', label: currentLanguage === 'FR' ? 'Gestion Optic' : 'Optic Management' },
    { id: 'super_admin_monitor', label: currentLanguage === 'FR' ? 'Supervision HQ (Super Admin)' : 'Supervision HQ (Super Admin)' },
    { id: 'settings', label: currentLanguage === 'FR' ? 'Paramètres' : 'Settings & Localization' }
  ];

  // Form states for new user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<User['role']>('Gérant');
  const [newUserStatus, setNewUserStatus] = useState<'Active' | 'Suspended' | 'Pending MFA' | 'Invited'>('Active');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserLocation, setNewUserLocation] = useState(listAllBoutiques[0] || 'Agence Alpha');
  const [newUserBoutiques, setNewUserBoutiques] = useState<string[]>([listAllBoutiques[0] || 'Agence Alpha']);
  const [newUserModules, setNewUserModules] = useState<string[]>(['dashboard', 'fidelisation']);
  const [selectedHrEmpId, setSelectedHrEmpId] = useState('');
  
  // Show / hidden passwords toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Default 8-character password generator helper based on exact format:
  // 3 letters of last name + 1 special char (@) + 2 letters of first name + 2 digits of birth year
  const generateFormatPassword = (firstName: string, lastName: string, birthDate?: string) => {
    let namePart = (lastName || 'USR')
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z]/g, "");
    if (namePart.length < 3) {
      namePart = (namePart + "XXX").substring(0, 3);
    } else {
      namePart = namePart.substring(0, 3);
    }

    const specPart = '@';

    let firstNamePart = (firstName || 'US')
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z]/g, "");
    if (firstNamePart.length < 2) {
      firstNamePart = (firstNamePart + "XX").substring(0, 2);
    } else {
      firstNamePart = firstNamePart.substring(0, 2);
    }

    let yearPart = '95'; // Sensible default
    if (birthDate) {
      const match = birthDate.match(/\d{4}/);
      if (match) {
        yearPart = match[0].substring(2, 4);
      } else {
        const match2 = birthDate.match(/\d{2}$/);
        if (match2) {
          yearPart = match2[0];
        }
      }
    } else {
      // Generate a static yet pseudo-stable or random two digits
      yearPart = '98';
    }
    return `${namePart}${specPart}${firstNamePart}${yearPart}`;
  };

  React.useEffect(() => {
    if (listAllBoutiques.length > 0) {
      setNewUserLocation(listAllBoutiques[0]);
      setNewUserBoutiques([listAllBoutiques[0]]);
    }
  }, [listAllBoutiques[0]]);

  // RBAC Access Matrix State
  const [selectedMatrixRole, setSelectedMatrixRole] = useState('Admin');
  const [rbacMatrix, setRbacMatrix] = useState<{
    [role: string]: { [permission: string]: boolean }
  }>({
    'Super Admin': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': true, 'clinique': true, 'products': true, 'commande': true, 'orders': true, 'journal': true, 'websockets': true, 'revenue': true, 'reports': true, 'hr': true, 'presence': true, 'gestion_optic': true, 'super_admin_monitor': true, 'settings': true
    },
    'Admin': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': true, 'clinique': true, 'products': true, 'commande': true, 'orders': true, 'journal': true, 'websockets': true, 'revenue': true, 'reports': true, 'hr': true, 'presence': true, 'gestion_optic': true, 'super_admin_monitor': true, 'settings': true
    },
    'Directeur': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': true, 'clinique': true, 'products': true, 'commande': true, 'orders': true, 'journal': true, 'websockets': true, 'revenue': true, 'reports': true, 'hr': true, 'presence': true, 'gestion_optic': true, 'super_admin_monitor': false, 'settings': true
    },
    'Manager': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': true, 'clinique': true, 'products': true, 'commande': true, 'orders': true, 'journal': true, 'websockets': true, 'revenue': false, 'reports': true, 'hr': false, 'presence': true, 'gestion_optic': true, 'super_admin_monitor': false, 'settings': false
    },
    'Gérant': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': true, 'clinique': true, 'products': true, 'commande': true, 'orders': true, 'journal': true, 'websockets': true, 'revenue': true, 'reports': true, 'hr': true, 'presence': true, 'gestion_optic': true, 'super_admin_monitor': false, 'settings': true
    },
    'Billing Manager': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': true, 'clinique': false, 'products': true, 'commande': false, 'orders': true, 'journal': true, 'websockets': false, 'revenue': true, 'reports': true, 'hr': false, 'presence': true, 'gestion_optic': false, 'super_admin_monitor': false, 'settings': false
    },
    'Editor': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': true, 'clinique': true, 'products': true, 'commande': true, 'orders': true, 'journal': true, 'websockets': true, 'revenue': false, 'reports': false, 'hr': false, 'presence': true, 'gestion_optic': false, 'super_admin_monitor': false, 'settings': false
    },
    'Viewer': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': false, 'clinique': false, 'products': true, 'commande': false, 'orders': false, 'journal': true, 'websockets': false, 'revenue': false, 'reports': true, 'hr': false, 'presence': false, 'gestion_optic': false, 'super_admin_monitor': false, 'settings': false
    },
    'Caissier': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': false, 'clinique': false, 'products': true, 'commande': false, 'orders': true, 'journal': true, 'websockets': false, 'revenue': false, 'reports': false, 'hr': false, 'presence': true, 'gestion_optic': false, 'super_admin_monitor': false, 'settings': false
    },
    'Opticien': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': true, 'clinique': true, 'products': true, 'commande': true, 'orders': false, 'journal': false, 'websockets': true, 'revenue': false, 'reports': false, 'hr': false, 'presence': false, 'gestion_optic': false, 'super_admin_monitor': false, 'settings': false
    },
    'Magasinier': {
      'dashboard': true, 'fidelisation': false, 'fidelisation_sav': false, 'clinique': false, 'products': true, 'commande': true, 'orders': false, 'journal': false, 'websockets': false, 'revenue': false, 'reports': false, 'hr': false, 'presence': false, 'gestion_optic': true, 'super_admin_monitor': false, 'settings': false
    },
    'Comptable': {
      'dashboard': true, 'fidelisation': false, 'fidelisation_sav': false, 'clinique': false, 'products': true, 'commande': false, 'orders': false, 'journal': true, 'websockets': false, 'revenue': true, 'reports': true, 'hr': false, 'presence': false, 'gestion_optic': false, 'super_admin_monitor': false, 'settings': false
    },
    'Secrétaire': {
      'dashboard': true, 'fidelisation': true, 'fidelisation_sav': false, 'clinique': false, 'products': false, 'commande': true, 'orders': false, 'journal': false, 'websockets': false, 'revenue': false, 'reports': false, 'hr': false, 'presence': false, 'gestion_optic': false, 'super_admin_monitor': false, 'settings': false
    }
  });

  const [lastSavedMatrix, setLastSavedMatrix] = useState<string | null>(null);

  const togglePermission = (role: string, permission: string) => {
    setRbacMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role][permission]
      }
    }));
  };

  const handleSaveMatrix = () => {
    setLastSavedMatrix(currentLanguage === 'FR' ? "Matrice d'accès de sécurité RBAC mise à jour et enregistrée avec succès !" : "RBAC security access matrix updated and saved successfully!");
    setTimeout(() => setLastSavedMatrix(null), 3500);
  };

  const handleDeleteUser = (id: string) => {
    if (!canDeleteUser) {
      alert(currentLanguage === 'FR' ? "Action refusée : Seul l'administrateur ou un compte ayant tous les droits peut supprimer un compte d'accès." : "Action denied: Only the administrator or accounts with full permissions can delete access accounts.");
      return;
    }
    const userToDelete = activeUsers.find(u => u.id === id);
    if (userToDelete?.email === currentUserEmail) {
      alert(currentLanguage === 'FR' ? "Vous ne pouvez pas supprimer votre propre compte !" : "You cannot delete your own account!");
      return;
    }
    if (confirm(currentLanguage === 'FR' ? 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?' : 'Are you sure you want to delete this collaborator?')) {
      const email = userToDelete?.email || '';
      const updated = activeUsers.filter(u => u.id !== id);
      activeSetUsers(updated);
      localStorage.setItem('optic_users', JSON.stringify(updated));
      if (email) {
        deleteUserMutation.mutate(email, {
          onError: (e) => console.error("Database delete failed, using local copy:", e)
        });
      }
      alert(currentLanguage === 'FR' ? "Compte d'accès supprimé avec succès !" : "Access account deleted successfully!");
    }
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const editEmailLower = editingUser.email.toLowerCase().trim();
    if (!editEmailLower.endsWith('@opticalize.com') && !editEmailLower.endsWith('@opticalizé.com')) {
      alert(currentLanguage === 'FR' 
        ? "Erreur : L'identifiant email doit obligatoirement se terminer par @opticalize.com" 
        : "Error: The email identifier must end with @opticalize.com"
      );
      return;
    }

    if (editingUser.password && editingUser.password.length < 8) {
      alert(currentLanguage === 'FR'
        ? "Erreur : Le mot de passe doit comporter au moins 8 caractères."
        : "Error: The password must be at least 8 characters long."
      );
      return;
    }

    // Check if password has been changed and user is not admin
    const oldUser = activeUsers.find(u => u.id === editingUser.id);
    if (!isAdmin && oldUser && editingUser.password !== oldUser.password) {
      alert(currentLanguage === 'FR' ? "Seul l'administrateur peut modifier un mot passe." : "Only the administrator can modify a password.");
      return;
    }

    const updated = activeUsers.map(u => u.id === editingUser.id ? editingUser : u);
    activeSetUsers(updated);
    localStorage.setItem('optic_users', JSON.stringify(updated));
    saveUserMutation.mutate(editingUser, {
      onError: (e) => console.error("Database save failed, using local copy:", e)
    });
    setEditingUser(null);
    alert(currentLanguage === 'FR' ? "Utilisateur mis à jour et enregistré avec succès !" : "User successfully updated and saved!");
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const emailLower = newUserEmail.toLowerCase().trim();
    if (!emailLower.endsWith('@opticalize.com') && !emailLower.endsWith('@opticalizé.com')) {
      alert(currentLanguage === 'FR' 
        ? "Erreur : L'identifiant email doit obligatoirement se terminer par @opticalize.com" 
        : "Error: The email identifier must end with @opticalize.com"
      );
      return;
    }

    if (newUserPassword.length < 8) {
      alert(currentLanguage === 'FR'
        ? "Erreur : Le mot de passe doit comporter au moins 8 caractères."
        : "Error: The password must be at least 8 characters long."
      );
      return;
    }

    const newUser: User = {
      id: `USR-0${activeUsers.length + 1}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: newUserStatus,
      phone: newUserPhone || '+228 90 00 00 00',
      location: newUserLocation || 'Agence Alpha',
      lastActive: 'Never',
      allowedBoutiques: newUserBoutiques,
      allowedModules: newUserModules,
      password: newUserPassword || 'password'
    };

    const updated = [newUser, ...activeUsers];
    activeSetUsers(updated);
    localStorage.setItem('optic_users', JSON.stringify(updated));
    saveUserMutation.mutate(newUser, {
      onError: (e) => console.error("Database save failed, using local copy:", e)
    });
    setShowAddModal(false);
    
    alert(currentLanguage === 'FR' ? "Nouvel utilisateur créé et enregistré avec succès !" : "New user successfully created and saved!");
    
    // Reset form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('Editor');
    setNewUserStatus('Active');
    setNewUserPhone('');
    setNewUserLocation('Agence Alpha');
    setNewUserBoutiques(['Agence Alpha']);
    setNewUserModules(['dashboard', 'fidelisation']);
    setSelectedHrEmpId('');
    
    // Reset pagination to first page
    setCurrentPage(1);
  };

  // Filter logic
  const filteredUsers = useMemo(() => {
    return activeUsers.filter(user => {
      // Masquer / cacher les adresses d'accès maître administrateur :
      // "ne pas les afficher parmis la liste des utilisateurs systeme il faut masqué ces deux adresses"
      const emailLower = user.email ? user.email.toLowerCase().trim() : '';
      if (emailLower === 'glabtech1@opticalize.com' || 
          emailLower === 'anges.gildas@opticalize.com' || 
          emailLower === 'anges.gildas@opticalizé.com') {
        return false;
      }

      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [activeUsers, searchQuery, roleFilter, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  // Pagination calculations
  const totalUsersCount = filteredUsers.length;
  const totalPages = Math.ceil(totalUsersCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  // Virtualization calculations
  const itemHeight = 72; // height of each row in pixels
  const viewportHeight = 350; // max-height of viewport in pixels
  const totalVirtualHeight = filteredUsers.length * itemHeight;
  
  const virtualStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const virtualEndIndex = Math.min(filteredUsers.length, Math.floor((scrollTop + viewportHeight) / itemHeight) + 2);
  const virtualVisibleUsers = useMemo(() => {
    return filteredUsers.slice(virtualStartIndex, virtualEndIndex);
  }, [filteredUsers, virtualStartIndex, virtualEndIndex]);
  const virtualOffsetY = virtualStartIndex * itemHeight;

  const getStatusStyle = (status: User['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50/80 text-emerald-700 border border-emerald-100/70 font-semibold';
      case 'Suspended':
        return 'bg-rose-50/80 text-rose-700 border border-rose-100/70 font-semibold';
      case 'Pending MFA':
        return 'bg-amber-50/80 text-amber-700 border border-amber-100/70 font-semibold';
      case 'Invited':
        return 'bg-indigo-50/80 text-indigo-700 border border-indigo-100/70 font-semibold';
    }
  };

  return (
    <div className={`p-1 space-y-8 ${darkMode ? 'dark text-slate-100' : 'text-slate-900'} font-sans`}>
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
            {currentLanguage === 'FR' ? "CONTRÔLE D'ACCÈS DU PERSONNEL" : "STAFF ACCESS SECURITY"}
          </span>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-1">
            {currentLanguage === 'FR' ? "Habilitations & Accès CRM" : "Users & CRM Access Permissions"}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
            {currentLanguage === 'FR' 
              ? "Gérez les comptes d'administration, configurez les rôles de sécurité de succursales et auditez l'état des sessions de l'enseigne."
              : "Provision system accounts, override branch privileges, and audit user sessions securely."}
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 text-xs bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl transition-all duration-150 shadow-xs hover:shadow-md shrink-0 cursor-pointer active:scale-98"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{currentLanguage === 'FR' ? "Nouveau Collaborateur" : "New Collaborator"}</span>
        </button>
      </div>

      {/* Modern Filter bar */}
      <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-900/60 border border-slate-800' : 'bg-slate-50/60 border border-slate-100'} flex flex-col md:flex-row gap-4 items-center justify-between`}>
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </span>
          <input
            type="text"
            className={`w-full pl-9.5 pr-4 py-2.5 text-xs rounded-xl border border-transparent focus:border-indigo-500 bg-white shadow-2xs font-medium focus:outline-none transition-all duration-150 ${darkMode ? 'bg-slate-900 text-slate-200' : 'text-slate-800'}`}
            placeholder={currentLanguage === 'FR' ? "Rechercher par nom, email, boutique..." : "Search by name, email, boutique..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">{currentLanguage === 'FR' ? 'Filtrer :' : 'Filter :'}</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-150/80 bg-white focus:outline-none cursor-pointer text-slate-700 shadow-2xs hover:bg-slate-50 transition-all ${darkMode ? 'border-slate-800 bg-slate-900 text-slate-200' : ''}`}
            >
              <option value="All">{currentLanguage === 'FR' ? "Tous les rôles" : "All Roles"}</option>
              <option value="Super Admin">{currentLanguage === 'FR' ? "Super Admin" : "Super Admin"}</option>
              <option value="Directeur">{currentLanguage === 'FR' ? "Directeur" : "Director"}</option>
              <option value="Manager">{currentLanguage === 'FR' ? "Manager" : "Manager"}</option>
              <option value="Admin">{currentLanguage === 'FR' ? "Administrateur" : "Administrator"}</option>
              <option value="Billing Manager">{currentLanguage === 'FR' ? "Finance / Facturation" : "Billing / Finance"}</option>
              <option value="Editor">{currentLanguage === 'FR' ? "Opticien / Éditeur" : "Optician / Editor"}</option>
              <option value="Viewer">{currentLanguage === 'FR' ? "Consultant / Lecteur" : "Consultant / Viewer"}</option>
              <option value="Gérant">{currentLanguage === 'FR' ? "Gérant" : "Gérant"}</option>
              <option value="Caissier">{currentLanguage === 'FR' ? "Caissier" : "Caissier"}</option>
              <option value="Opticien">{currentLanguage === 'FR' ? "Opticien" : "Opticien"}</option>
              <option value="Magasinier">{currentLanguage === 'FR' ? "Magasinier" : "Magasinier"}</option>
              <option value="Comptable">{currentLanguage === 'FR' ? "Comptable" : "Comptable"}</option>
              <option value="Secrétaire">{currentLanguage === 'FR' ? "Secrétaire" : "Secrétaire"}</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-150/80 bg-white focus:outline-none cursor-pointer text-slate-700 shadow-2xs hover:bg-slate-50 transition-all ${darkMode ? 'border-slate-800 bg-slate-900 text-slate-200' : ''}`}
          >
            <option value="All">{currentLanguage === 'FR' ? "Tous les statuts" : "All Statuses"}</option>
            <option value="Active">{currentLanguage === 'FR' ? "Actif" : "Active"}</option>
            <option value="Pending MFA">{currentLanguage === 'FR' ? "MFA Requis" : "MFA Required"}</option>
            <option value="Invited">{currentLanguage === 'FR' ? "Invité" : "Invited"}</option>
            <option value="Suspended">{currentLanguage === 'FR' ? "Suspendu" : "Suspended"}</option>
          </select>
        </div>
      </div>

      {/* Mode Selector and Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>
            {currentLanguage === 'FR' 
              ? `${filteredUsers.length} collaborateurs chargés en cache (React Query)` 
              : `${filteredUsers.length} collaborators loaded in cache (React Query)`}
          </span>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-850 p-0.5 rounded-xl border border-slate-200/40 shrink-0">
          <button
            onClick={() => setRenderMode('pagination')}
            className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${renderMode === 'pagination' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📄 {currentLanguage === 'FR' ? "Pagination" : "Pagination"}
          </button>
          <button
            onClick={() => setRenderMode('virtualization')}
            className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${renderMode === 'virtualization' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ⚡ {currentLanguage === 'FR' ? "Virtualisation" : "Virtualization"}
          </button>
        </div>
      </div>

      {isUsersLoading ? (
        /* --- BEAUTIFUL LAZY LOADING SKELETON SCREEN --- */
        <div className="space-y-3.5 p-6 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs">
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/4 animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 animate-pulse">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-9 h-9 rounded-xl bg-slate-150 dark:bg-slate-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-150 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-150 dark:bg-slate-800 rounded w-1/6" />
                <div className="h-3 bg-slate-150 dark:bg-slate-800 rounded w-1/6" />
                <div className="h-3 bg-slate-150 dark:bg-slate-800 rounded w-1/12" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* --- USER TABLE CARD CONTAINER --- */
        <div className={`overflow-hidden rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800 shadow-xl' : 'bg-white shadow-xs border-slate-150'}`}>
          <div 
            ref={renderMode === 'virtualization' ? containerRef : undefined}
            onScroll={renderMode === 'virtualization' ? handleScroll : undefined}
            className={`overflow-x-auto ${renderMode === 'virtualization' ? 'max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200' : ''}`}
          >
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead className={`${renderMode === 'virtualization' ? 'sticky top-0 z-20 shadow-xs' : ''}`}>
                <tr className={`text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest ${darkMode ? 'border-b border-slate-800 bg-slate-900/90' : 'bg-slate-50/95 border-b border-slate-100'}`}>
                  <th className="px-6 py-4.5 w-[28%]">{currentLanguage === 'FR' ? "Collaborateur" : "Collaborator"}</th>
                  <th className="px-6 py-4.5 w-[15%]">{currentLanguage === 'FR' ? "Rôle de sécurité" : "Security Role"}</th>
                  <th className="px-6 py-4.5 w-[14%]">{currentLanguage === 'FR' ? "État d'Accès" : "Access Status"}</th>
                  <th className="px-6 py-4.5 w-[25%]">{currentLanguage === 'FR' ? "Boutique d'Attribution" : "Assigned Boutiques"}</th>
                  <th className="px-6 py-4.5 w-[10%]">{currentLanguage === 'FR' ? "Dernier Accès" : "Last Active"}</th>
                  <th className="px-6 py-4.5 w-[8%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100/70">
                {renderMode === 'virtualization' ? (
                  /* --- MODE VIRTUALISÉ --- */
                  <>
                    {virtualStartIndex > 0 && (
                      <tr style={{ height: `${virtualOffsetY}px` }}><td colSpan={6} /></tr>
                    )}
                    {virtualVisibleUsers.length > 0 ? (
                      virtualVisibleUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all duration-100"
                          style={{ height: `${itemHeight}px` }}
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs tracking-wider uppercase shadow-2xs border border-indigo-100/40 shrink-0">
                                {user.name ? user.name.slice(0, 2) : "US"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
                                <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{user.role}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getStatusStyle(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{user.location}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 max-w-[280px]">
                                {(user.allowedBoutiques || []).map(b => (
                                  <span key={b} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-semibold border border-slate-200/40">
                                    {b.replace('Optic Alizé ', '')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-[10px] text-slate-400 font-mono font-bold">
                            {user.lastActive}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => setEditingUser(user)}
                                title={currentLanguage === 'FR' ? "Modifier" : "Edit"}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-slate-800 rounded-xl transition duration-100 shrink-0 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              
                              {canDeleteUser ? (
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  title={currentLanguage === 'FR' ? "Supprimer" : "Delete"}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 rounded-xl transition duration-100 shrink-0 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <div title={currentLanguage === 'FR' ? "Seul l'Admin ou un compte ayant tous les droits peut supprimer" : "Only administrator or accounts with full permissions can delete"} className="p-2 text-slate-300 dark:text-slate-600 cursor-not-allowed shrink-0">
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#64748B] font-mono text-xs">
                          {currentLanguage === 'FR' ? "Aucun collaborateur trouvé pour cette recherche." : "No collaborator found under this filter query."}
                        </td>
                      </tr>
                    )}
                    {virtualEndIndex < filteredUsers.length && (
                      <tr style={{ height: `${(filteredUsers.length - virtualEndIndex) * itemHeight}px` }}><td colSpan={6} /></tr>
                    )}
                  </>
                ) : (
                  /* --- MODE PAGINÉ CLASSIQUE --- */
                  paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all duration-100"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs tracking-wider uppercase shadow-2xs border border-indigo-100/40 shrink-0">
                              {user.name ? user.name.slice(0, 2) : "US"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{user.role}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getStatusStyle(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{user.location}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {(user.allowedBoutiques || []).map(b => (
                                <span key={b} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-semibold border border-slate-200/40">
                                  {b.replace('Optic Alizé ', '')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 font-mono font-bold">
                          {user.lastActive}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => setEditingUser(user)}
                              title={currentLanguage === 'FR' ? "Modifier" : "Edit"}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-slate-800 rounded-xl transition duration-100 shrink-0 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            
                            {canDeleteUser ? (
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                title={currentLanguage === 'FR' ? "Supprimer" : "Delete"}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 rounded-xl transition duration-100 shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div title={currentLanguage === 'FR' ? "Seul l'Admin ou un compte ayant tous les droits peut supprimer" : "Only administrator or accounts with full permissions can delete"} className="p-2 text-slate-300 dark:text-slate-600 cursor-not-allowed shrink-0">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#64748B] font-mono text-xs">
                        {currentLanguage === 'FR' ? "Aucun collaborateur trouvé pour cette recherche." : "No collaborator found under this filter query."}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {renderMode === 'pagination' && (
            <div className="px-6 py-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>{currentLanguage === 'FR' ? "Affichage de" : "Showing"}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {filteredUsers.length > 0 ? startIndex + 1 : 0}
                </span>
                <span>{currentLanguage === 'FR' ? "à" : "to"}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {Math.min(filteredUsers.length, endIndex)}
                </span>
                <span>{currentLanguage === 'FR' ? "sur" : "of"}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{filteredUsers.length}</span>
                <span>{currentLanguage === 'FR' ? "collaborateurs" : "collaborators"}</span>
              </div>

              <div className="flex items-center gap-4.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentLanguage === 'FR' ? 'Taille :' : 'Size :'}</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 shadow-3xs transition duration-100 cursor-pointer"
                  >
                    {currentLanguage === 'FR' ? 'Précédent' : 'Previous'}
                  </button>
                  <span className="text-xs font-bold text-slate-600 px-3 font-mono">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 shadow-3xs transition duration-100 cursor-pointer"
                  >
                    {currentLanguage === 'FR' ? 'Suivant' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RBAC Matrix Section */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'border-slate-800 bg-slate-900/40 shadow-xl' : 'border-slate-150 bg-slate-50/30 shadow-xs'} space-y-6`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              {currentLanguage === 'FR' ? "Matrice d'Habilitations (RBAC)" : "Access Authorization Matrix (RBAC)"}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {currentLanguage === 'FR' 
                ? "Configurez en direct les 16 modules métiers d'Opticalize pour chacun des 10 profils de sécurité."
                : "Grant or restrict access to any of the 16 core Opticalize modules dynamically for all 10 platform roles."}
            </p>
          </div>
          <button
            onClick={handleSaveMatrix}
            className="flex items-center gap-1.5 px-4.5 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-550 text-white font-bold rounded-xl transition-all duration-150 shadow-sm cursor-pointer active:scale-98"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'FR' ? "Sauvegarder la Matrice" : "Save Matrix"}</span>
          </button>
        </div>

        {lastSavedMatrix && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-bold animate-pulse">
            ✓ {lastSavedMatrix}
          </div>
        )}

        {/* Roles Column + Modules Bento Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Role selectors */}
          <div className="lg:col-span-4 space-y-2">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-1">
              {currentLanguage === 'FR' ? "1. Profil de Sécurité" : "1. Security Role"}
            </span>
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none max-h-[520px] pr-1">
              {[
                { key: 'Super Admin', label: currentLanguage === 'FR' ? 'Super Admin' : 'Super Admin', desc: currentLanguage === 'FR' ? 'Administration souveraine de la plateforme' : 'Sovereign system administrative control', color: 'text-red-700 bg-red-50 border-red-100/40' },
                { key: 'Admin', label: currentLanguage === 'FR' ? 'Administrateur' : 'Administrator', desc: currentLanguage === 'FR' ? 'Accès illimité d\'audit et configuration' : 'Unlimited developer options & systems', color: 'text-rose-700 bg-rose-50 border-rose-100/40' },
                { key: 'Directeur', label: currentLanguage === 'FR' ? 'Directeur' : 'Director', desc: currentLanguage === 'FR' ? 'Direction de l\'entreprise et des agences' : 'Full company and branch management', color: 'text-emerald-700 bg-emerald-50 border-emerald-100/40' },
                { key: 'Manager', label: currentLanguage === 'FR' ? 'Manager de Boutique' : 'Manager', desc: currentLanguage === 'FR' ? 'Supervision d\'agence et pilotage d\'équipe' : 'Branch operations and team pilot', color: 'text-teal-700 bg-teal-50 border-teal-100/40' },
                { key: 'Gérant', label: currentLanguage === 'FR' ? 'Gérant de Boutique' : 'Store Manager', desc: currentLanguage === 'FR' ? 'Contrôle logistique et clôtures d\'agence' : 'Full branch cash books & inventory', color: 'text-indigo-700 bg-indigo-50 border-indigo-100/40' },
                { key: 'Billing Manager', label: currentLanguage === 'FR' ? 'Responsable Finance' : 'Finance Manager', desc: currentLanguage === 'FR' ? 'Contrôle Tiers-payant, recettes et mutuelles' : 'Auditing health bills & credit receipts', color: 'text-sky-700 bg-sky-50 border-sky-100/40' },
                { key: 'Editor', label: currentLanguage === 'FR' ? 'Opticien Rédacteur' : 'Editor Optician', desc: currentLanguage === 'FR' ? 'Édition des fiches et des catalogues' : 'Full CRM & visual inventory editing', color: 'text-blue-700 bg-blue-50 border-blue-100/40' },
                { key: 'Viewer', label: currentLanguage === 'FR' ? 'Consultant Lecteur' : 'Consultant Viewer', desc: currentLanguage === 'FR' ? 'Lecture seule des audits et résultats' : 'Metrics read-only analytics dashboard', color: 'text-slate-700 bg-slate-50 border-slate-150/40' },
                { key: 'Caissier', label: currentLanguage === 'FR' ? 'Caissier' : 'Cashier Teller', desc: currentLanguage === 'FR' ? 'Vente comptoir directe et flux financiers' : 'Direct POS billing & daily cache inputs', color: 'text-teal-700 bg-teal-50 border-teal-100/40' },
                { key: 'Opticien', label: currentLanguage === 'FR' ? 'Opticien Praticien' : 'Optician Expert', desc: currentLanguage === 'FR' ? 'Réfraction clinique et montage d\'atelier' : 'Patient clinical files & prescription assembly', color: 'text-cyan-700 bg-cyan-50 border-cyan-100/40' },
                { key: 'Magasinier', label: currentLanguage === 'FR' ? 'Magasinier Stock' : 'Stock Replenisher', desc: currentLanguage === 'FR' ? 'Inventaires et mouvements inter-agences' : 'Incoming deliveries & stock levels', color: 'text-amber-700 bg-amber-50 border-amber-100/40' },
                { key: 'Comptable', label: currentLanguage === 'FR' ? 'Comptable Référent' : 'Referral Accountant', desc: currentLanguage === 'FR' ? 'Double écriture et écritures d\'achats' : 'Analytical charts & real-time bank reconciliation', color: 'text-purple-700 bg-purple-50 border-purple-100/40' },
                { key: 'Secrétaire', label: currentLanguage === 'FR' ? 'Secrétaire d\'accueil' : 'Secretary Receptionist', desc: currentLanguage === 'FR' ? 'Prise de rendez-vous et flux d\'entrée' : 'Appointment booking & patient boarding', color: 'text-pink-700 bg-pink-50 border-pink-100/40' }
              ].map((roleRow) => {
                const isActive = selectedMatrixRole === roleRow.key;
                return (
                  <button
                    key={roleRow.key}
                    onClick={() => setSelectedMatrixRole(roleRow.key)}
                    className={`flex-none w-[200px] lg:w-full text-left p-3 rounded-xl border transition-all duration-100 cursor-pointer focus:outline-none ${
                      isActive 
                        ? 'border-indigo-600 bg-white shadow-sm ring-1 ring-indigo-600' 
                        : 'border-slate-150 bg-white/70 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-800">{roleRow.label}</span>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md ${roleRow.color}`}>
                        {roleRow.key}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed truncate select-none">{roleRow.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: 16 modules in segmented grids */}
          <div className="lg:col-span-8 space-y-6">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
              {currentLanguage === 'FR' 
                ? `2. Activer les modules pour : ${selectedMatrixRole.toUpperCase()}` 
                : `2. Toggle active modules for: ${selectedMatrixRole.toUpperCase()}`}
            </span>

            {[
              {
                id: 'crm',
                title: currentLanguage === 'FR' ? "👥 FIDÉLISATION & EXPÉRIENCE CRM" : "👥 CRM & PATIENT LOYALTY",
                modules: [
                  { key: 'dashboard', name: currentLanguage === 'FR' ? 'Tableau de bord' : 'Dashboard', desc: currentLanguage === 'FR' ? 'Indicateurs clés, ventes et performance' : 'Metrics, sales and performance' },
                  { key: 'fidelisation', name: currentLanguage === 'FR' ? 'Fiches Patients (CRM)' : 'CRM Patient Profiles', desc: currentLanguage === 'FR' ? 'Dossiers patients, parrainages et historique' : 'Patient card and complete folders' },
                  { key: 'fidelisation_sav', name: currentLanguage === 'FR' ? 'Fidélisation & S.A.V' : 'After-sales & SAV', desc: currentLanguage === 'FR' ? 'Points de fidélité, claims et remboursements' : 'Complaint triage & satisfaction logs' },
                  { key: 'websockets', name: currentLanguage === 'FR' ? 'Messagerie & Lab' : 'Lab Messagerie', desc: currentLanguage === 'FR' ? 'Chat inter-boutique en direct et statuts lab' : 'Real-time internal chat & laboratory logs' }
                ]
              },
              {
                id: 'medical',
                title: currentLanguage === 'FR' ? "🩺 CLINIQUE, PRODUITS & ATELIER" : "🩺 OPTICAL METIER, CLINIC & SHOP",
                modules: [
                  { key: 'clinique', name: currentLanguage === 'FR' ? 'Espace Clinique & Rx' : 'Clinical Medical Rx', desc: currentLanguage === 'FR' ? 'Réfraction oculaire, ordonnances' : 'Refractions, visual acuity & eye charts' },
                  { key: 'products', name: currentLanguage === 'FR' ? 'Catalogue Optique' : 'Optical Catalog', desc: currentLanguage === 'FR' ? 'Stocks de montures, verres de correction' : 'Lenses options, frame assets & glass SKU' },
                  { key: 'commande', name: currentLanguage === 'FR' ? 'Commandes Atelier' : 'Workshop Orders', desc: currentLanguage === 'FR' ? 'Suivi assemblage, centrage et détourage' : 'Edging status & frame assembly lines' },
                  { key: 'orders', name: currentLanguage === 'FR' ? 'Point de Vente (POS)' : 'Point of Sale (POS)', desc: currentLanguage === 'FR' ? 'Prise d’ordonnance, devis mutuelle, POS' : 'Billing desk, credit notes & invoices' }
                ]
              },
              {
                id: 'finance',
                title: currentLanguage === 'FR' ? "💼 JOURNAL, COMPTABILITÉ & MUTUELLES" : "💼 FINANCE & LEDGER OPERATIONS",
                modules: [
                  { key: 'journal', name: currentLanguage === 'FR' ? 'Journal de caisse' : 'Daily Cash Ledger', desc: currentLanguage === 'FR' ? 'Billets de caisse réels, Mobile Money' : 'Teller money logs, MoMo & checkouts' },
                  { key: 'revenue', name: currentLanguage === 'FR' ? 'Comptabilité tiers' : 'Double entry Accounting', desc: currentLanguage === 'FR' ? 'Saisie fiscale des écritures et journaux' : 'Double-entry journal ledger outputs' },
                  { key: 'reports', name: currentLanguage === 'FR' ? 'Audits & Rapports' : 'Auditing & analytical reports', desc: currentLanguage === 'FR' ? 'Statistiques de vente d’agences' : 'Gross profit audits and visual charts' },
                  { key: 'gestion_optic', name: currentLanguage === 'FR' ? 'Gestion Multi-Boutiques' : 'Multi-branch Logistics', desc: currentLanguage === 'FR' ? 'Inventaires croisés et transferts de stocks' : 'Inter-agency replenishments & analytics' }
                ]
              },
              {
                id: 'admin',
                title: currentLanguage === 'FR' ? "⚙️ SÉCURITÉ, RECRUTEMENT & GLOBAL" : "⚙️ GLOBAL SYSTEM SECURITY & ADMINISTRATION",
                modules: [
                  { key: 'hr', name: currentLanguage === 'FR' ? 'Ressources Humaines (RH)' : 'Human Resources (HR)', desc: currentLanguage === 'FR' ? 'Paie, contrats salariés, livre d’or' : 'Payroll, staff contracts & pay books' },
                  { key: 'presence', name: currentLanguage === 'FR' ? 'Présence & Émargement' : 'Attendance Face-clock', desc: currentLanguage === 'FR' ? 'Émargement par selfie de garde intelligent' : 'Selfie biometric clock-in ledger' },
                  { key: 'super_admin_monitor', name: currentLanguage === 'FR' ? 'Supervision HQ (Global)' : 'Supervision HQ Monitoring', desc: currentLanguage === 'FR' ? 'État des services, santé BDD' : 'Technical logs & server status monitoring' },
                  { key: 'settings', name: currentLanguage === 'FR' ? 'Configuration générale' : 'Localization Settings', desc: currentLanguage === 'FR' ? 'TVA locales, options agences et logos' : 'VAT configurations, enterprise presets' }
                ]
              }
            ].map((category) => (
              <div key={category.id} className="space-y-2">
                <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 pl-1">
                  {category.title}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.modules.map((mod) => {
                    const isAllowed = rbacMatrix[selectedMatrixRole]?.[mod.key] ?? false;
                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => togglePermission(selectedMatrixRole, mod.key)}
                        className={`group flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-100 cursor-pointer focus:outline-none ${
                          isAllowed 
                            ? 'border-indigo-150 bg-white hover:border-indigo-200 hover:shadow-2xs' 
                            : 'border-slate-100 bg-slate-50/50 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* Status Check Circle */}
                        <div className="shrink-0 mt-0.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isAllowed 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {isAllowed ? (
                              <Check className="w-3 h-3 stroke-[3.5]" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            )}
                          </div>
                        </div>

                        {/* Title & description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold ${
                              isAllowed ? 'text-slate-800' : 'text-slate-600'
                            }`}>
                              {mod.name}
                            </span>
                            <span className={`text-[8px] font-extrabold font-mono uppercase px-1.5 py-0.5 rounded-md ${
                              isAllowed 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : 'bg-slate-150/70 text-slate-500'
                            }`}>
                              {isAllowed ? (currentLanguage === 'FR' ? "Actif" : "Active") : (currentLanguage === 'FR' ? "Off" : "Locked")}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 truncate select-none">
                            {mod.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add collaborater modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6 relative bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-left">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="shrink-0 mb-4">
              <h3 className="text-lg font-bold tracking-tight text-[#0F172A] mb-1">
                {currentLanguage === 'FR' ? "Ajouter un collaborateur" : "Add New Collaborator"}
              </h3>
              <p className="text-xs text-[#64748B]">
                {currentLanguage === 'FR' 
                  ? "Entrez les informations ou importez-les directement depuis le personnel RH de la boutique."
                  : "Register a user, or fetch values directly from the registered HR personnel list."}
              </p>
            </div>

            <form onSubmit={handleAddUser} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2 pb-1.5 space-y-4 max-h-[68vh] scrollbar-thin">
              
               {/* Name Selection / Dropdown from HR representing Nom complet */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">
                  {currentLanguage === 'FR' ? "🔗 Lier un employé RH (Optionnel)" : "🔗 Link HR Employee (Optional)"}
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none bg-white font-bold text-slate-800 cursor-pointer"
                  value={selectedHrEmpId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedHrEmpId(id);
                    const emp = allEmployees.find(x => x.id === id);
                    if (emp) {
                      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                      setNewUserName(fullName);
                      setNewUserEmail(emp.email || '');
                      if (emp.phone) setNewUserPhone(emp.phone);
                      if (emp.boutique) setNewUserLocation(emp.boutique);
                      
                      // Auto-generate formatted 8-character password
                      const generatedPass = generateFormatPassword(emp.firstName, emp.lastName, emp.birthDate);
                      setNewUserPassword(generatedPass);

                      // Suggest initial modules and roles for them based on department and position (Affectation automatique)
                      const rawPos = emp.position ? emp.position.toLowerCase() : '';
                      if (rawPos.includes('gérant') || rawPos.includes('directeur') || rawPos.includes('dirigeant')) {
                        setNewUserRole('Gérant');
                        setNewUserModules(['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'settings']);
                      } else if (rawPos.includes('caissier') || rawPos.includes('caisse')) {
                        setNewUserRole('Caissier');
                        setNewUserModules(['dashboard', 'fidelisation', 'orders', 'journal']);
                      } else if (rawPos.includes('opticien') || rawPos.includes('optométriste')) {
                        setNewUserRole('Opticien');
                        setNewUserModules(['dashboard', 'fidelisation', 'clinique', 'products', 'gestion_optic']);
                      } else if (rawPos.includes('magasinier') || rawPos.includes('stock')) {
                        setNewUserRole('Magasinier');
                        setNewUserModules(['dashboard', 'products', 'commande', 'gestion_optic']);
                      } else if (rawPos.includes('comptable') || rawPos.includes('finance')) {
                        setNewUserRole('Comptable');
                        setNewUserModules(['dashboard', 'revenue', 'journal', 'products']);
                      } else if (rawPos.includes('secrétaire') || rawPos.includes('secret') || rawPos.includes('accueil')) {
                        setNewUserRole('Secrétaire');
                        setNewUserModules(['dashboard', 'fidelisation', 'settings']);
                      } else if (rawPos.includes('admin')) {
                        setNewUserRole('Admin');
                        setNewUserModules(['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'settings']);
                      } else {
                        setNewUserRole('Opticien');
                        setNewUserModules(['dashboard', 'fidelisation', 'orders']);
                      }
                    } else {
                      setNewUserName('');
                      setNewUserEmail('');
                      setNewUserPassword('');
                    }
                  }}
                >
                  <option value="">-- {currentLanguage === 'FR' ? "Aucun lien (Entrée libre manuelle)" : "No Link (Manual free entry)"} --</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      👤 {emp.firstName} {emp.lastName} — {emp.position} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">
                  {currentLanguage === 'FR' ? "Nom Complet *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none bg-white font-bold text-slate-800"
                  placeholder={currentLanguage === 'FR' ? "Ex: Khadija Sy" : "e.g. Khadija Sy"}
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Email Professionnel" : "Professional Email"}</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none"
                  placeholder="khadija.sy@opticalize.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>

              {/* Password field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                    {currentLanguage === 'FR' ? "Mot de Passe de Connexion" : "Sign in Password"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const emp = allEmployees.find(x => x.id === selectedHrEmpId);
                      if (emp) {
                        const generatedPass = generateFormatPassword(emp.firstName, emp.lastName, emp.birthDate);
                        setNewUserPassword(generatedPass);
                      } else {
                        // Manual parse from Full Name input (first word vs remainder)
                        const nameParts = (newUserName || '').trim().split(/\s+/);
                        const fName = nameParts[0] || 'User';
                        const lName = nameParts.slice(1).join(' ') || fName;
                        const generatedPass = generateFormatPassword(fName, lName, undefined);
                        setNewUserPassword(generatedPass);
                      }
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold transition focus:outline-none cursor-pointer"
                  >
                    ⚡ {currentLanguage === 'FR' ? "Générer un mot de passe" : "Generate Password"}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    className="w-full pl-3 pr-10 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none font-mono"
                    placeholder={currentLanguage === 'FR' ? "Indiquer le mot de passe initial" : "Indicate initial password"}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Rôle Système" : "Security Role"}</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none cursor-pointer"
                    value={newUserRole}
                    onChange={(e: any) => {
                      const selectedRole = e.target.value;
                      setNewUserRole(selectedRole);
                      
                      // Auto-assign default modules when a role is selected manually (Affectation automatique)
                      if (selectedRole === 'Gérant') {
                        setNewUserModules(['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'settings']);
                      } else if (selectedRole === 'Caissier') {
                        setNewUserModules(['dashboard', 'fidelisation', 'orders', 'journal']);
                      } else if (selectedRole === 'Opticien') {
                        setNewUserModules(['dashboard', 'fidelisation', 'clinique', 'products', 'gestion_optic']);
                      } else if (selectedRole === 'Magasinier') {
                        setNewUserModules(['dashboard', 'products', 'commande', 'gestion_optic']);
                      } else if (selectedRole === 'Comptable') {
                        setNewUserModules(['dashboard', 'revenue', 'journal', 'products']);
                      } else if (selectedRole === 'Secrétaire') {
                        setNewUserModules(['dashboard', 'fidelisation', 'settings']);
                      } else if (selectedRole === 'Super Admin') {
                        setNewUserModules(['dashboard', 'fidelisation', 'fidelisation_sav', 'clinique', 'products', 'commande', 'orders', 'journal', 'websockets', 'revenue', 'reports', 'hr', 'presence', 'gestion_optic', 'settings', 'super_admin_hq', 'super_admin_monitor']);
                      } else if (selectedRole === 'Directeur') {
                        setNewUserModules(['dashboard', 'fidelisation', 'fidelisation_sav', 'clinique', 'products', 'commande', 'orders', 'journal', 'websockets', 'revenue', 'reports', 'hr', 'presence', 'gestion_optic', 'settings']);
                      } else if (selectedRole === 'Manager') {
                        setNewUserModules(['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'journal', 'gestion_optic', 'clinique']);
                      } else if (selectedRole === 'Admin') {
                        setNewUserModules(['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'settings']);
                      } else if (selectedRole === 'Billing Manager') {
                        setNewUserModules(['dashboard', 'revenue', 'journal']);
                      } else if (selectedRole === 'Editor') {
                        setNewUserModules(['dashboard', 'fidelisation', 'orders', 'products']);
                      } else if (selectedRole === 'Viewer') {
                        setNewUserModules(['dashboard']);
                      }
                    }}
                  >
                    <option value="Super Admin">{currentLanguage === 'FR' ? "Super Admin" : "Super Admin"}</option>
                    <option value="Directeur">{currentLanguage === 'FR' ? "Directeur" : "Director (Directeur)"}</option>
                    <option value="Manager">{currentLanguage === 'FR' ? "Manager" : "Manager"}</option>
                    <option value="Gérant">{currentLanguage === 'FR' ? "Gérant de Boutique" : "Store Manager"}</option>
                    <option value="Caissier">{currentLanguage === 'FR' ? "Caissier" : "Cashier (Caissier)"}</option>
                    <option value="Opticien">{currentLanguage === 'FR' ? "Opticien-Conseil" : "Optician (Opticien)"}</option>
                    <option value="Magasinier">{currentLanguage === 'FR' ? "Magasinier / Gestionnaire de Stock" : "Stock-keeper (Magasinier)"}</option>
                    <option value="Comptable">{currentLanguage === 'FR' ? "Comptable financier" : "Accountant (Comptable)"}</option>
                    <option value="Secrétaire">{currentLanguage === 'FR' ? "Secretaire / Accueil" : "Secretary (Secrétaire)"}</option>
                    <option value="Admin">{currentLanguage === 'FR' ? "Administrateur" : "Administrator (Admin)"}</option>
                    <option value="Billing Manager">{currentLanguage === 'FR' ? "Comptable Financier Global" : "Finance (Billing)"}</option>
                    <option value="Editor">{currentLanguage === 'FR' ? "Éditeur / Rédacteur" : "Editor"}</option>
                    <option value="Viewer">{currentLanguage === 'FR' ? "Lecteur Seul" : "Consultant (Viewer)"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "État d'Accès" : "Access State"}</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none cursor-pointer"
                    value={newUserStatus}
                    onChange={(e: any) => setNewUserStatus(e.target.value)}
                  >
                    <option value="Active">{currentLanguage === 'FR' ? "Actif d'emblée" : "Active"}</option>
                    <option value="Pending MFA">{currentLanguage === 'FR' ? "MFA Requis" : "MFA Required"}</option>
                    <option value="Invited">{currentLanguage === 'FR' ? "Invité par email" : "Invited"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Téléphone" : "Phone"}</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none"
                  placeholder="+228 90 00 00 00"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Agence d'Attribution" : "Default Assigned Agency"}</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none cursor-pointer text-slate-800 font-bold"
                  value={newUserLocation}
                  onChange={(e) => setNewUserLocation(e.target.value)}
                >
                  {listAllBoutiques.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Boutiques assignment checklist */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-800">
                  {currentLanguage === 'FR' ? "Autoriser le compte sur ces filiales :" : "Authorise account access on these branches:"}
                </span>
                <div className="space-y-1.5 mt-2">
                  {listAllBoutiques.map(b => {
                    const isChecked = newUserBoutiques.includes(b);
                    return (
                      <label key={b} className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-bold">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewUserBoutiques(newUserBoutiques.filter(x => x !== b));
                            } else {
                              setNewUserBoutiques([...newUserBoutiques, b]);
                            }
                          }}
                          className="rounded border-slate-350 text-blue-650 focus:ring-blue-500 h-4 w-4"
                        />
                        <span>🏢 {b}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modules assignment checklist */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-800">
                  {currentLanguage === 'FR' ? "Habiliter les modules visibles :" : "Authorise module interfaces visibility:"}
                </span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {listAllModules.map(m => {
                    const isChecked = newUserModules.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-700 font-medium">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewUserModules(newUserModules.filter(x => x !== m.id));
                            } else {
                              setNewUserModules([...newUserModules, m.id]);
                            }
                          }}
                          className="rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span>{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer"
                >
                  {currentLanguage === 'FR' ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition duration-150 cursor-pointer"
                >
                  {currentLanguage === 'FR' ? "Enregistrer" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit collaborator modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6 relative bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-left">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="shrink-0 mb-4">
              <h3 className="text-lg font-bold tracking-tight text-[#0F172A] mb-1">
                {currentLanguage === 'FR' ? "Modifier le collaborateur" : "Edit Collaborator Options"}
              </h3>
              <p className="text-xs text-[#64748B] font-semibold">
                ID: <span className="text-[#2563EB] font-bold font-mono">{editingUser.id}</span> — {editingUser.name}
              </p>
            </div>

            <form onSubmit={handleSaveEditUser} className="flex-1 flex flex-col min-h-0 font-sans text-left">
              <div className="flex-1 overflow-y-auto pr-2 pb-1.5 space-y-4 max-h-[68vh] scrollbar-thin">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Nom Complet" : "Full Name"}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Email Professionnel" : "Professional Email"}</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>

              {/* Edit Password field */}
              {isAdmin ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                      {currentLanguage === 'FR' ? "Réinitialiser / Modifier le Mot de passe" : "Reset / Edit Password"}
                    </label>
                    <span className="text-[10px] text-emerald-600 font-bold font-mono">🔒 {currentLanguage === 'FR' ? "Admin autorise" : "Admin override"}</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      required
                      className="w-full pl-3 pr-10 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none font-mono font-bold text-slate-800"
                      placeholder={currentLanguage === 'FR' ? "Laissez ou modifiez pour l'utilisateur" : "Modify password field"}
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 text-slate-500">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                    {currentLanguage === 'FR' ? "Mot de passe de Connexion" : "Sign in Password"}
                  </span>
                  <p className="text-[10px]">
                    {currentLanguage === 'FR' 
                      ? "🔒 Seul l'administrateur système peut modifier le mot de passe de ce collaborateur."
                      : "🔒 Only the system administrator can change this collaborator's sign-in password."}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Rôle" : "Role"}</label>
                   <select
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none cursor-pointer"
                    value={editingUser.role}
                    onChange={(e: any) => {
                      const selectedRole = e.target.value;
                      let updatedModules = editingUser.allowedModules || [];
                      
                      // Auto-assign default modules on role shift (Affectation automatique)
                      if (selectedRole === 'Gérant') {
                        updatedModules = ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'settings'];
                      } else if (selectedRole === 'Caissier') {
                        updatedModules = ['dashboard', 'fidelisation', 'orders', 'journal'];
                      } else if (selectedRole === 'Opticien') {
                        updatedModules = ['dashboard', 'fidelisation', 'clinique', 'products', 'gestion_optic'];
                      } else if (selectedRole === 'Magasinier') {
                        updatedModules = ['dashboard', 'products', 'commande', 'gestion_optic'];
                      } else if (selectedRole === 'Comptable') {
                        updatedModules = ['dashboard', 'revenue', 'journal', 'products'];
                      } else if (selectedRole === 'Secrétaire') {
                        updatedModules = ['dashboard', 'fidelisation', 'settings'];
                      } else if (selectedRole === 'Super Admin') {
                        updatedModules = ['dashboard', 'fidelisation', 'fidelisation_sav', 'clinique', 'products', 'commande', 'orders', 'journal', 'websockets', 'revenue', 'reports', 'hr', 'presence', 'gestion_optic', 'settings', 'super_admin_hq', 'super_admin_monitor'];
                      } else if (selectedRole === 'Directeur') {
                        updatedModules = ['dashboard', 'fidelisation', 'fidelisation_sav', 'clinique', 'products', 'commande', 'orders', 'journal', 'websockets', 'revenue', 'reports', 'hr', 'presence', 'gestion_optic', 'settings'];
                      } else if (selectedRole === 'Manager') {
                        updatedModules = ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'journal', 'gestion_optic', 'clinique'];
                      } else if (selectedRole === 'Admin') {
                        updatedModules = ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'settings'];
                      } else if (selectedRole === 'Billing Manager') {
                        updatedModules = ['dashboard', 'revenue', 'journal'];
                      } else if (selectedRole === 'Editor') {
                        updatedModules = ['dashboard', 'fidelisation', 'orders', 'products'];
                      } else if (selectedRole === 'Viewer') {
                        updatedModules = ['dashboard'];
                      }

                      setEditingUser({ ...editingUser, role: selectedRole, allowedModules: updatedModules });
                    }}
                  >
                    <option value="Super Admin">{currentLanguage === 'FR' ? "Super Admin" : "Super Admin"}</option>
                    <option value="Directeur">{currentLanguage === 'FR' ? "Directeur" : "Director (Directeur)"}</option>
                    <option value="Manager">{currentLanguage === 'FR' ? "Manager" : "Manager"}</option>
                    <option value="Gérant">{currentLanguage === 'FR' ? "Gérant de Boutique" : "Store Manager"}</option>
                    <option value="Caissier">{currentLanguage === 'FR' ? "Caissier" : "Cashier (Caissier)"}</option>
                    <option value="Opticien">{currentLanguage === 'FR' ? "Opticien-Conseil" : "Optician (Opticien)"}</option>
                    <option value="Magasinier">{currentLanguage === 'FR' ? "Magasinier / Gestionnaire de Stock" : "Stock-keeper (Magasinier)"}</option>
                    <option value="Comptable">{currentLanguage === 'FR' ? "Comptable financier" : "Accountant (Comptable)"}</option>
                    <option value="Secrétaire">{currentLanguage === 'FR' ? "Secretaire / Accueil" : "Secretary (Secrétaire)"}</option>
                    <option value="Admin">{currentLanguage === 'FR' ? "Administrateur" : "Administrator (Admin)"}</option>
                    <option value="Billing Manager">{currentLanguage === 'FR' ? "Comptable Financier Global" : "Finance (Billing)"}</option>
                    <option value="Editor">{currentLanguage === 'FR' ? "Éditeur / Rédacteur" : "Editor"}</option>
                    <option value="Viewer">{currentLanguage === 'FR' ? "Lecteur Seul" : "Consultant (Viewer)"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Statut" : "Status"}</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none cursor-pointer"
                    value={editingUser.status}
                    onChange={(e: any) => setEditingUser({ ...editingUser, status: e.target.value })}
                  >
                    <option value="Active">{currentLanguage === 'FR' ? "Actif" : "Active"}</option>
                    <option value="Pending MFA">{currentLanguage === 'FR' ? "MFA Requis" : "MFA Required"}</option>
                    <option value="Invited">{currentLanguage === 'FR' ? "Invité" : "Invited"}</option>
                    <option value="Suspended">{currentLanguage === 'FR' ? "Suspendu" : "Suspended"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Téléphone" : "Phone"}</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">{currentLanguage === 'FR' ? "Agence d'Attribution" : "Default Agency"}</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none cursor-pointer font-bold text-slate-800"
                  value={editingUser.location}
                  onChange={(e) => setEditingUser({ ...editingUser, location: e.target.value })}
                >
                  {listAllBoutiques.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Boutiques assignment checklist */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-800">
                  {currentLanguage === 'FR' ? "Boutiques autorisées :" : "Authorized boutiques:"}
                </span>
                <div className="space-y-1.5 mt-2">
                  {listAllBoutiques.map(b => {
                    const isChecked = (editingUser.allowedBoutiques || []).includes(b);
                    return (
                      <label key={b} className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-bold">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const current = editingUser.allowedBoutiques || [];
                            const updated = isChecked
                              ? current.filter(x => x !== b)
                              : [...current, b];
                            setEditingUser({ ...editingUser, allowedBoutiques: updated });
                          }}
                          className="rounded border-slate-350 text-[#2563EB] focus:ring-blue-500 h-4 w-4"
                        />
                        <span>🏢 {b}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modules assignment checklist */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-800">
                  {currentLanguage === 'FR' ? "Modules d'activités habilités :" : "Enabled activity modules:"}
                </span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {listAllModules.map(m => {
                    const isChecked = (editingUser.allowedModules || []).includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-700 font-medium">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const current = editingUser.allowedModules || [];
                            const updated = isChecked
                              ? current.filter(x => x !== m.id)
                              : [...current, m.id];
                            setEditingUser({ ...editingUser, allowedModules: updated });
                          }}
                          className="rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span>{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer"
                >
                  {currentLanguage === 'FR' ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition duration-150 cursor-pointer"
                >
                  {currentLanguage === 'FR' ? "Enregistrer" : "Apply Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
