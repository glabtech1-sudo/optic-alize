import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Layers, 
  Activity, 
  FileText, 
  Settings, 
  ChevronRight, 
  Globe, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Lock,
  Boxes,
  Eye,
  HeartHandshake
} from 'lucide-react';
interface LandingPageProps {
  currentLanguage: 'FR' | 'EN';
  setCurrentLanguage: (lang: 'FR' | 'EN') => void;
  onEnterLogin: () => void;
  appLogo?: string;
}

export default function LandingPage({
  currentLanguage,
  setCurrentLanguage,
  onEnterLogin,
  appLogo
}: LandingPageProps) {
  const [logoFailed, setLogoFailed] = React.useState(false);

  // Smooth scroll helper
  const scrollToFeatures = () => {
    const element = document.getElementById('features-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isFR = currentLanguage === 'FR';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-blue-500/20 text-slate-800">
      
      {/* Dynamic atmospheric background glow */}
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-blue-400/10 to-emerald-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-emerald-400/10 to-blue-400/5 blur-[130px] pointer-events-none" />

      {/* Modern Top Navigation Bar */}
      <header className="w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-50/40 group-hover:opacity-100 transition duration-150" />
              {appLogo && !logoFailed ? (
                <img 
                  src={appLogo} 
                  alt="Optic Alizé Logo" 
                  className="w-8 h-8 object-contain rounded-lg z-10"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="relative font-bold text-blue-950 text-base tracking-tight z-10 flex flex-col items-center">
                  <span className="text-blue-700 font-black leading-none">OA</span>
                  <span className="text-[5px] tracking-[0.2em] text-slate-500 uppercase font-bold">Optics</span>
                </div>
              )}
            </div>
            
            <div>
              <span className="text-lg font-black text-blue-950 tracking-tight font-display block">
                OPTIC ALIZÉ
              </span>
              <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest block">
                {isFR ? "PORTAIL DE PILOTAGE" : "MANAGEMENT GATEWAY"}
              </span>
            </div>
          </div>

          {/* Nav Right (Language & Connect button) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentLanguage(isFR ? 'EN' : 'FR')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white hover:bg-slate-50 text-blue-950 hover:text-blue-700 font-bold rounded-xl border border-slate-200 transition duration-150 cursor-pointer shadow-sm"
              id="lang-toggle-nav"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{isFR ? 'English' : 'Français'}</span>
              <span className="sm:hidden">{isFR ? 'EN' : 'FR'}</span>
            </button>

            <button
              onClick={onEnterLogin}
              className="px-4.5 py-2 text-xs bg-blue-950 hover:bg-blue-900 text-white font-black uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1"
              id="connexion-btn-nav"
            >
              <span>{isFR ? "CONNEXION" : "SIGN IN"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Showcase Section */}
      <main className="flex-grow">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Rich Pitch & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
                <span className="text-[10px] uppercase font-black font-mono tracking-widest">
                  {isFR ? "Version 2.0 Pro • Performance Optimisée" : "Version 2.0 Pro • Optimized Performance"}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-blue-950 tracking-tight font-display leading-tight">
                {isFR ? (
                  <>
                    Le Système de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Pilotage Ultime</span> pour l'Optique
                  </>
                ) : (
                  <>
                    The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Ultimate Gateway</span> for Optics Businesses
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
                {isFR ? (
                  "Optic Alizé orchestre et centralise l'ensemble de vos activités : des dossiers de réfractions cliniques aux stocks de montures, du suivi rigoureux des commandes de verres aux encaissements sécurisés et au pilotage multisite."
                ) : (
                  "Optic Alizé orchestrates and centralizes your entire workflow: from clinical vision examinations to frame inventories, lens order tracking to multi-store performance monitoring and central management."
                )}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={onEnterLogin}
                  className="px-6 py-3.5 bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2 group"
                  id="hero-cta-connect"
                >
                  <span>{isFR ? "ACCÉDER AU PORTAIL DE PILOTAGE" : "ACCESS MANAGEMENT PORTAL"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={scrollToFeatures}
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-blue-950 font-black text-[11px] uppercase tracking-wider rounded-xl border border-slate-200 transition duration-150 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  id="hero-cta-features"
                >
                  <span>{isFR ? "EXPLORER LES MODULES" : "EXPLORE THE MODULES"}</span>
                </button>
              </div>

              {/* Security indicators */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-blue-950 uppercase tracking-wider">{isFR ? "MFA Double Facteur" : "Double-Factor MFA"}</h4>
                    <p className="text-[9px] text-slate-500 font-bold">{isFR ? "Sécurité Absolue" : "Full Security"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-blue-950 uppercase tracking-wider">{isFR ? "Conforme RGPD" : "GDPR Compliant"}</h4>
                    <p className="text-[9px] text-slate-500 font-bold">{isFR ? "Données Protégées" : "Protected Data"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-blue-950 uppercase tracking-wider">{isFR ? "Temps Réel" : "Real-Time"}</h4>
                    <p className="text-[9px] text-slate-500 font-bold">{isFR ? "Sync Instantanée" : "Instant Sync"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Preview Dashboard Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto w-full max-w-sm rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-6 space-y-6 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-emerald-50 to-emerald-400" />
                
                {/* Simulated App Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-wider font-mono text-slate-400">
                      {isFR ? "Statut : Connecté" : "Status: Live Sync"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">10:42 AM</span>
                </div>

                {/* Dashboard Widgets inside Mockup */}
                <div className="space-y-4">
                  {/* Metric Box */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{isFR ? "Chiffre d'Affaires" : "Revenue Today"}</span>
                      <p className="text-xl font-black text-blue-950 font-mono">1,420,500 FCFA</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Orders Pipeline */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-blue-950 uppercase tracking-wider pl-1">{isFR ? "Commandes Récentes" : "Recent Orders"}</h4>
                    <div className="space-y-2">
                      <div className="p-2.5 bg-white border border-slate-250 rounded-xl flex justify-between items-center text-xs shadow-sm">
                        <div className="space-y-0.5 text-left">
                          <p className="font-bold text-slate-800">M. SARR (Progressif)</p>
                          <p className="text-[9px] text-slate-400 font-mono">CMD-2026-0043</p>
                        </div>
                        <span className="px-2 py-0.5 text-[8px] font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                          {isFR ? "En Montage" : "Glazing"}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white border border-slate-250 rounded-xl flex justify-between items-center text-xs shadow-sm">
                        <div className="space-y-0.5 text-left">
                          <p className="font-bold text-slate-800">Mme DIALLO (Solaire)</p>
                          <p className="text-[9px] text-slate-400 font-mono">CMD-2026-0042</p>
                        </div>
                        <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                          {isFR ? "Livré" : "Delivered"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Boutique */}
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <div>
                        <p className="font-black text-blue-950 uppercase tracking-wide text-[9px]">{isFR ? "Boutique Active" : "Active Location"}</p>
                        <p className="font-bold text-slate-700">Optic Alizé - DIRECTION</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure Badge */}
                <div className="pt-2 flex items-center justify-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100">
                  <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                  <span>{isFR ? "SYSTÈME SAAS HAUTEMENT SÉCURISÉ" : "SECURE SAAS ENVIRONMENT"}</span>
                </div>
              </div>

              {/* Decorative extra elements */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-tr from-[#10B981]/20 to-blue-500/10 blur-xl pointer-events-none rounded-full" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-emerald-500/10 blur-xl pointer-events-none rounded-full" />
            </div>

          </div>
        </section>

        {/* Feature Overview Grid (Bento Grid Style) */}
        <section id="features-section" className="bg-white border-t border-b border-slate-200/80 py-16 sm:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                {isFR ? "FONCTIONNALITÉS EXCLUSIVES" : "EXCLUSIVE CAPABILITIES"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-blue-950 tracking-tight font-display">
                {isFR ? "Une suite complète de gestion" : "A complete corporate management suite"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                {isFR ? (
                  "Conçu spécifiquement pour le workflow exigeant des cabinets d'optique et des réseaux de boutiques."
                ) : (
                  "Tailored specifically for high-performing optical shops, clinics, and multi-location networks."
                )}
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-left">
              
              {/* Feature 1 */}
              <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-3xl hover:border-blue-500/40 hover:bg-white transition duration-200 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 mb-5 group-hover:bg-blue-50 transition duration-150">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-blue-950 uppercase tracking-wide mb-2">
                  {isFR ? "Dossiers Cliniques & Réfractions" : "Clinical Vision Records"}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isFR ? (
                    "Saisissez précisément les examens de réfraction (sphère, cylindre, axe, addition) de vos patients, l'historique de santé oculaire et gérez les ordonnances directement."
                  ) : (
                    "Precisely register optical refractions, visual acuity tests, ophthalmic history, and direct prescription archives for every patient."
                  )}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-3xl hover:border-emerald-500/40 hover:bg-white transition duration-200 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 mb-5 group-hover:bg-emerald-50 transition duration-150">
                  <Boxes className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-blue-950 uppercase tracking-wide mb-2">
                  {isFR ? "Gestion des Stocks & Verres" : "Inventory & Lens Stock"}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isFR ? (
                    "Suivez en temps réel le catalogue de montures et verres avec des attributs optiques (Matière, Indice, Traitement) et soyez alerté lorsque les stocks atteignent le seuil d'alerte."
                  ) : (
                    "Keep track of frame catalogs, contact lenses, and specific raw lens attributes in real-time, coupled with critical low-stock thresholds."
                  )}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-3xl hover:border-indigo-500/40 hover:bg-white transition duration-200 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600 mb-5 group-hover:bg-indigo-50 transition duration-150">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-blue-950 uppercase tracking-wide mb-2">
                  {isFR ? "Suivi des Commandes & SAV" : "Order Lifecycle & Support"}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isFR ? (
                    "Gérez l'ensemble des étapes d'une commande client, du choix de la monture et de l'envoi au laboratoire jusqu'au montage en atelier et au service après-vente (SAV)."
                  ) : (
                    "Orchestrate order statuses from initial lab ordering, frame allocation, local glazing, to final collection and subsequent support tickets."
                  )}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-3xl hover:border-teal-500/40 hover:bg-white transition duration-200 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-teal-600 mb-5 group-hover:bg-teal-50 transition duration-150">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-blue-950 uppercase tracking-wide mb-2">
                  {isFR ? "Journal de Caisse & Finance" : "Cash Ledger & Analytics"}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isFR ? (
                    "Enregistrez les acomptes, les reliquats et les méthodes de paiement multiples (Espèce, Chèque, Carte, Mobile Money) avec des rapports de caisse quotidiens automatiques."
                  ) : (
                    "Log down payments, remaining balances, and multiple payment methods with detailed, tamper-proof daily cash register closure sheets."
                  )}
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-3xl hover:border-amber-500/40 hover:bg-white transition duration-200 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-amber-600 mb-5 group-hover:bg-amber-50 transition duration-150">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-blue-950 uppercase tracking-wide mb-2">
                  {isFR ? "Fidélisation & Alertes SMS" : "Loyalty & Automation SMS"}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isFR ? (
                    "Fidélisez votre clientèle avec l'historique complet d'achats et informez-les instantanément par SMS lorsque leurs lunettes sont montées et prêtes pour la livraison."
                  ) : (
                    "Keep your customer base engaged with comprehensive purchase histories, and notify them instantly via SMS once glasses are ready."
                  )}
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-3xl hover:border-purple-500/40 hover:bg-white transition duration-200 group">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-purple-600 mb-5 group-hover:bg-purple-50 transition duration-150">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-blue-950 uppercase tracking-wide mb-2">
                  {isFR ? "Ressources Humaines & Pointages" : "HR & Automated Attendance"}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isFR ? (
                    "Suivez les temps de travail de vos opticiens et conseillers de vente, enregistrez les retards et calculez de manière transparente les primes d'objectifs de vente."
                  ) : (
                    "Track clock-ins, record shift delays, manage employee roles, and transparently compute sales-performance bonuses across branches."
                  )}
                </p>
              </div>

            </div>

          </div>
        </section>
      </main>

      {/* Styled Footer */}
      <footer className="w-full bg-blue-950 text-white border-t border-slate-800 z-10 pt-10 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800 text-left">
          
          <div className="space-y-3">
            <h3 className="text-sm font-black tracking-widest text-[#10B981] uppercase">OPTIC ALIZÉ</h3>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-xs">
              {isFR ? (
                "Portail de gestion et d'excellence opérationnelle pour cabinets d'optique haut de gamme."
              ) : (
                "High-performance operations portal built for modern optical retail networks."
              )}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black tracking-wider text-slate-300 uppercase">{isFR ? "Sécurité & Technologie" : "Security & Platform"}</h3>
            <ul className="text-[10px] text-slate-400 font-bold space-y-1.5 uppercase tracking-wide">
              <li>MFA • TOTP DOUBLE FACTEUR</li>
              <li>SSL SECURE SESSION LOCK</li>
              <li>REALTIME SUPABASE DATA FLUX</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black tracking-wider text-slate-300 uppercase">{isFR ? "Accès Rapide" : "Quick Action"}</h3>
            <button
              onClick={onEnterLogin}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-black tracking-widest uppercase transition flex items-center gap-1 cursor-pointer"
            >
              <span>{isFR ? "→ S'AUTHENTIFIER AU SYSTÈME" : "→ CONNECT TO SYSTEM"}</span>
            </button>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wide">
            ©2026 G-lab tech Optic alizé v2 pro
          </span>
          <span className="text-[9px] text-slate-500 font-medium">
            {isFR ? "Tous droits réservés." : "All rights reserved."}
          </span>
        </div>
      </footer>

    </div>
  );
}
