import React, { useState } from 'react';
import { Mail, Lock, ShieldAlert, Globe, Eye, EyeOff, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { loginUser, verifyMFA } from '../lib/api';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('optic_remember_me') === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  // MFA states
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSessionId, setMfaSessionId] = useState<string | null>(null);
  const [mfaOtp, setMfaOtp] = useState('');
  const [mfaDemoCode, setMfaDemoCode] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await loginUser(email, password);
      
      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      if (data.mfaRequired) {
        setMfaRequired(true);
        setMfaSessionId(data.sessionId || null);
        setMfaDemoCode(data.mfaPin || null);
        setIsLoading(false);
        return;
      }

      if (data.accessToken && data.user) {
        if (rememberMe) {
          localStorage.setItem('optic_remember_me', 'true');
          localStorage.setItem('optic_remembered_email', data.user.email);
          localStorage.setItem('optic_remembered_password', password);
        } else {
          localStorage.removeItem('optic_remember_me');
          localStorage.removeItem('optic_remembered_email');
          localStorage.removeItem('optic_remembered_password');
        }

        setIsLoading(false);
        onLoginSuccess(data.user.email);
      }
    } catch (err: any) {
      setError(currentLanguage === 'FR' ? "Erreur d'authentification serveur." : "Server authentication error.");
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSessionId || !mfaOtp) return;

    setError(null);
    setIsLoading(true);

    try {
      const data = await verifyMFA(mfaSessionId, mfaOtp);
      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      if (data.accessToken && data.user) {
        setIsLoading(false);
        onLoginSuccess(data.user.email);
      }
    } catch (err: any) {
      setError(currentLanguage === 'FR' ? "Erreur de vérification OTP." : "OTP validation error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Decorative subtle dynamic blue-green background glow */}
      <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      
      {/* Upper bar with dynamic branding label and modern language switch */}
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[10px] uppercase font-black font-mono tracking-widest text-[#1E3A8A] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {mfaRequired ? 'MFA DOUBLE FACTEUR • ACTIF' : 'SÉCURISÉ • SSL COMPLIANT'}
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
            {appLogo && !logoFailed ? (
              <img 
                src={appLogo} 
                alt="Optic Alizé Logo" 
                className="w-12 h-12 object-contain rounded-xl z-10 animate-fade-in"
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
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
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-3xl shadow-xl relative space-y-6 overflow-hidden">
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

          {!mfaRequired ? (
            /* --- FORMULAIRE DE CONNEXION DE BASE --- */
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
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 transition cursor-pointer"
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
          ) : (
            /* --- FORMULAIRE OTP MFA DOUBLE FACTEUR --- */
            <form onSubmit={handleMFASubmit} className="space-y-4 text-left">
              <div className="space-y-2 text-center">
                <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h3 className="text-sm font-black text-blue-950 uppercase tracking-wide">
                  {currentLanguage === 'FR' ? "Vérification de Sécurité" : "Security Verification"}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {currentLanguage === 'FR' 
                    ? "Saisissez le code de validation à 6 chiffres généré par votre application MFA mobile." 
                    : "Enter the 6-digit confirmation code generated by your mobile MFA app."}
                </p>
              </div>

              {mfaDemoCode && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    MFA CODE SIMULÉ (DEV CONSOLE)
                  </span>
                  <button
                    type="button"
                    onClick={() => setMfaOtp(mfaDemoCode)}
                    className="mt-1 text-xs font-black text-emerald-800 bg-white border border-emerald-300 px-3 py-1 rounded-lg shadow-sm hover:bg-emerald-100 transition cursor-pointer"
                  >
                    Code : <span className="font-mono underline">{mfaDemoCode}</span> (Copier/Saisir)
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="mfaCode" className="block text-[10px] font-black text-blue-900 uppercase tracking-widest pl-1 text-center">
                  {currentLanguage === 'FR' ? "Code à 6 chiffres" : "6-digit code"}
                </label>
                <input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={mfaOtp}
                  onChange={(e) => setMfaOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-40 mx-auto text-center py-3 text-lg bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-blue-950 font-mono tracking-[0.4em] font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition duration-150"
                  placeholder="000000"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isLoading || mfaOtp.length !== 6}
                  className="w-full h-11 flex justify-center items-center px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition duration-150 disabled:opacity-50 cursor-pointer shadow-[0_4px_16px_rgba(16,185,129,0.25)]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{currentLanguage === 'FR' ? "VALIDER LE CODE MFA" : "VERIFY MFA CODE"}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false);
                    setMfaOtp('');
                    setError(null);
                  }}
                  className="w-full text-center py-2 text-[10px] font-bold text-slate-500 hover:text-blue-950 uppercase tracking-widest transition cursor-pointer"
                >
                  {currentLanguage === 'FR' ? "← Retour à l'écran de connexion" : "← Back to login screen"}
                </button>
              </div>
            </form>
          )}

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
