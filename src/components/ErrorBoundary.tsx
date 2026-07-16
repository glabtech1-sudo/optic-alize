import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { safeLocalStorage } from '../lib/supabaseSync';

interface Props {
  children: ReactNode;
  fallbackLanguage?: 'FR' | 'EN';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Optic Alizé App:", error, errorInfo);
  }

  private handleResetAndLogout = () => {
    try {
      safeLocalStorage.setItem('optic_is_authenticated', 'false');
      safeLocalStorage.removeItem('optic_user_email');
      safeLocalStorage.setItem('optic_system_factory_reset', 'true');
      window.location.reload();
    } catch (e) {
      console.error("Failed to perform session reset:", e);
    }
  };

  public render() {
    if (this.state.hasError) {
      const isFR = this.props.fallbackLanguage !== 'EN';
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
          <div className="bg-white max-w-md w-full border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {isFR ? "Erreur d'Exécution Inattendue" : "Unexpected Runtime Error"}
              </h1>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {isFR 
                  ? "Une exception est survenue lors de l'affichage de ce module. Pour restaurer l'intégrité de votre espace, vous pouvez réinitialiser la session."
                  : "An unexpected exception occurred while rendering this module. To restore your workspace, you can reset your session."}
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left max-h-32 overflow-y-auto">
                <p className="text-[10px] font-mono font-bold text-rose-700 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              id="reset-session-btn"
              onClick={this.handleResetAndLogout}
              className="w-full h-11 flex justify-center items-center gap-2 px-4 bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition duration-150 shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isFR ? "Réinitialiser & Aller au Login" : "Reset & Go to Login"}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
