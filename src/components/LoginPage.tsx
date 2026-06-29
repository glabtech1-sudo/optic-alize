import React, { useState } from 'react';
import { Mail, Lock, ShieldAlert, Globe, Eye, EyeOff, Sparkles, CheckCircle, ChevronRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  users: any[];
  currentLanguage: 'FR' | 'EN';
  setCurrentLanguage: (lang: 'FR' | 'EN') => void;
  onLoginSuccess: (email: string) => void;
  appLogo?: string;
}

export default function LoginPage({ 
  users, 
  currentLanguage, 
  setCurrentLanguage, 
  onLoginSuccess,
  appLogo
}: LoginPageProps) {
  const [email, setEmail] = useState(() => localStorage.getItem('optic_remembered_email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('optic_remembered_password') || '');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('optic_remember_me') === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick credentials prefill helper
  const handlePrefill = (demoEmail: string) => {
    setEmail(demoEmail.toLowerCase().trim());
    const userMatched = users.find(u => u.email === demoEmail);
    setPassword(userMatched?.password || 'password');
    setError(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      let userMatched = users.find(
        (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
      );

      const isBypassedAdmin = email.toLowerCase().trim() === 'glabtech1@opticalize.com' || 
                              email.toLowerCase().trim() === 'anges.gildas@opticalize.com';

      if (isBypassedAdmin) {
        userMatched = {
          id: 'USR-BYPASS-' + (email.toLowerCase().trim() === 'glabtech1@opticalize.com' ? 'GLAB' : 'GILD'),
          name: email.toLowerCase().trim() === 'glabtech1@opticalize.com' ? 'Glabtech1 Super Admin' : 'Anges Gildas Super Admin',
          email: email.toLowerCase().trim(),
          password: 'Gildas@00741', // Strict admin bypass secret key
          role: 'Admin',
          status: 'Active',
          phone: '+221 77 124 55 93',
          location: 'Optic Alizé - Dépôt Central',
          lastActive: 'Just now',
          allowedBoutiques: ['Optic Alizé - Dépôt Central'],
          allowedModules: ['dashboard', 'fidelisation', 'fidelisation_sav', 'clinique', 'products', 'commande', 'orders', 'journal', 'websockets', 'revenue', 'reports', 'hr', 'presence', 'gestion_optic', 'settings', 'super_admin_hq', 'dev_portal', 'super_admin_monitor']
        };
      }

      if (!userMatched) {
        setError(
          currentLanguage === 'FR' 
            ? "Aucun collaborateur trouvé avec cette adresse email." 
            : "No collaborator found with this email address."
        );
        setIsLoading(false);
        return;
      }

      if (userMatched.status === 'Suspended') {
        setError(
          currentLanguage === 'FR' 
            ? "Ce compte utilisateur a été suspendu par la direction générale." 
            : "This account has been suspended by general management."
        );
        setIsLoading(false);
        return;
      }

      const matchPass = userMatched.password || 'password';
      if (password !== matchPass) {
        setError(
          currentLanguage === 'FR' 
            ? "Mot de passe incorrect. Veuillez vérifier vos accès de sécurité." 
            : "Incorrect security credentials. Please try again."
        );
        setIsLoading(false);
        setPassword('');
        return;
      }

      if (rememberMe) {
        localStorage.setItem('optic_remember_me', 'true');
        localStorage.setItem('optic_remembered_email', userMatched.email);
        localStorage.setItem('optic_remembered_password', password);
      } else {
        localStorage.removeItem('optic_remember_me');
        localStorage.removeItem('optic_remembered_email');
        localStorage.removeItem('optic_remembered_password');
      }

      setIsLoading(false);
      onLoginSuccess(userMatched.email);
    }, 850);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Decorative subtle dynamic blue-green background glow */}
      <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] rounded-full bg-blue-150/15 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-emerald-150/15 blur-[130px] pointer-events-none" />
      
      {/* Upper bar with dynamic branding label and modern language switch */}
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[10px] uppercase font-black font-mono tracking-widest text-[#1E3A8A] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            SÉCURISÉ • SSL COMPLIANT
          </span>
        </div>
        
        <button
          type="button"
          onClick={() => setCurrentLanguage(currentLanguage === 'FR' ? 'EN' : 'FR')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white hover:bg-slate-50 text-blue-900 hover:text-blue-700 font-bold rounded-xl border border-slate-200 transition duration-150 cursor-pointer shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentLanguage === 'FR' ? 'English' : 'Français'}</span>
        </button>
      </div>

      {/* Main Container / Beautiful centered grid */}
      <div className="w-full max-w-md mx-auto my-auto z-10 space-y-6">
        
        {/* Brand visual header */}
        <div className="text-center space-y-3.5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center shadow-md relative group overflow-hidden">
            <div className="absolute inset-0 bg-blue-50/50 group-hover:opacity-100 transition duration-150" />
            {appLogo ? (
              <img 
                src={appLogo} 
                alt="Optic Alizé Logo" 
                className="w-12 h-12 object-contain rounded-xl z-10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="relative font-bold text-blue-950 text-xl tracking-tight z-10 flex flex-col items-center">
                <span className="text-blue-700 font-black leading-none drop-shadow-sm">OA</span>
                <span className="text-[7.5px] tracking-[0.2em] text-slate-500 uppercase mt-0.5">Optics</span>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#1E3A8A] tracking-tight font-display uppercase">
              OPTIC ALIZÉ
            </h1>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.25em]">
              {currentLanguage === 'FR' ? "CONTRÔLEUR DE RESSOURCES & PILOTAGE" : "RESOURCE CONTROL & PILOTGATEWAY"}
            </p>
          </div>
        </div>

        {/* Beautiful Light-themed Login Card */}
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-3xl shadow-xl relative space-y-6">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-400 rounded-t-3xl" />
          
          {error && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2.5 text-left"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1">
                {currentLanguage === 'FR' ? "Identifiant Professionnel (Email)" : "Professional ID (Email)"}
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  className="block w-full pl-10 pr-3 py-3 text-xs bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition duration-150 lowercase font-medium"
                  placeholder="nom@opticalize.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label htmlFor="password" className="block text-[10px] font-black text-blue-900 uppercase tracking-widest">
                  {currentLanguage === 'FR' ? "Clef de chiffrement (Mot de Passe)" : "Encryption Key (Password)"}
                </label>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-blue-600" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 text-xs bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition duration-150 font-mono"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pl-1 py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#10B981] bg-slate-50 border-slate-200 rounded focus:ring-emerald-500/30 accent-[#10B981] cursor-pointer"
                />
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider">
                  {currentLanguage === 'FR' ? "Se souvenir de moi" : "Remember me"}
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 flex justify-center items-center px-4 bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition duration-150 disabled:opacity-50 cursor-pointer shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.4)]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="flex items-center gap-1.5 font-sans">
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    <span>{currentLanguage === 'FR' ? "S'AUTHENTIFIER" : "AUTHENTICATE"}</span>
                  </div>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Required footer specified by the user */}
      <div className="w-full text-center z-10 py-2">
        <span className="text-[10px] text-blue-950 font-bold font-mono tracking-wide">
          ©2026 G-lab tech Optic alizé v2 pro
        </span>
      </div>

    </div>
  );
}
