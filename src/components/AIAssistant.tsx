import React, { useState } from 'react';
import { ArchFile } from '../types/architecture';
import { Sparkles, Send, FileCode, Check, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIAssistantProps {
  onAddGeneratedFiles: (newFiles: ArchFile[]) => void;
}

export default function AIAssistant({ onAddGeneratedFiles }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<ArchFile[]>([]);
  const [activeGenFile, setActiveGenFile] = useState<ArchFile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const samplePrompts = [
    "Facturation Mutuelle (Complémentaires, remboursements)",
    "Suivi des commandes Verres Progressifs sur-mesure",
    "Gestion du Service Après-Vente (SAV, casses & garanties)",
    "Fidelisation Clients & parrainages boutiques"
  ];

  const handleGenerate = async (selectedPrompt?: string) => {
    const activePrompt = selectedPrompt || prompt;
    if (!activePrompt.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setGeneratedFiles([]);
    setActiveGenFile(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: activePrompt }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Le serveur a renvoyé une page invalide (HTML). Veuillez vérifier que le serveur Node.js d\'Optic Alizé est actif sur Hostinger.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur inconnue lors de la génération.');
      }

      if (data.files && data.files.length > 0) {
        setGeneratedFiles(data.files);
        setActiveGenFile(data.files[0]);
      } else {
        throw new Error('Aucun fichier de code n\'a été retourné par l\'IA.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur réseau est survenue lors de la connexion de l\'orchestrateur Express.');
    } finally {
      setLoading(false);
    }
  };

  const handleInjectFiles = () => {
    if (generatedFiles.length === 0) return;
    onAddGeneratedFiles(generatedFiles);
    setSuccessMessage(`Félicitations! Les ${generatedFiles.length} fichiers ont été injectés avec succès dans l'explorateur principal de G-LAB OPTIC !`);
    setGeneratedFiles([]);
    setActiveGenFile(null);
  };

  return (
    <div className="space-y-8 text-slate-850" id="ai-assistant-scaffolder">
      
      {/* Intro box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-display font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
          Scaffolder de Modules G-LAB OPTIC piloté par l'IA
        </h3>
        <p className="text-slate-600 text-xs leading-relaxed">
          Enrichissez l'architecture G-LAB OPTIC en décrivant un besoin métier (ex: tiers payant, gestion des lentilles). Le modèle <strong>Gemini-3.5-flash</strong> échafaudera les contrats Dart de la Clean Architecture ainsi que les contrôleurs d'API Express et schémas SQL correspondants de manière cohérente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Prompts, Form & Examples (Left 5 cols) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          
          <div className="space-y-3">
            <span className="text-xs font-mono text-slate-550 uppercase tracking-widest block font-bold">Rédiger votre besoin</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex. Ajouter un module de raccordement mutuelle Tiers Payant..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs outline-none text-slate-800 font-mono focus:border-[#0097a7]/50"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={loading || !prompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 p-2.5 rounded-lg text-white transition shrink-0-auto border-0 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick templates presets list */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-slate-550 uppercase tracking-widest block font-bold">Modèles rapides pré-sélectionnés</span>
            <div className="space-y-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleGenerate(p);
                  }}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition text-xs font-mono text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Warning state if API Key is missing */}
          {!(typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold mb-1">Clé API Gemini non détectée.</p>
                <p className="text-slate-600">N'oubliez pas d'indiquer votre clé dans le volet <strong>Secrets de AI Studio</strong>. Sans clé, l'appel du backend renverra une erreur de configuration.</p>
              </div>
            </div>
          )}

        </div>

        {/* Generated Files Viewer or Loader (Right 7 cols) */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col justify-between min-h-[460px] relative">
          
          {loading && (
            <div className="absolute inset-0 bg-white/90 rounded-2xl flex flex-col items-center justify-center space-y-4 z-20">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <div className="text-center space-y-1">
                <span className="font-mono text-xs text-indigo-700 uppercase tracking-wider block font-bold animate-pulse">Consultation de l'Architecte...</span>
                <span className="text-slate-500 text-[10px]">Génération des schémas, entités et providers G-LAB OPTIC</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {generatedFiles.length === 0 && !error && !successMessage && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 py-20 text-slate-400">
              <Sparkles className="w-10 h-10 text-indigo-300/40 mb-3" />
              <p className="font-semibold text-xs text-slate-600 font-mono">En attente de consignes de Scaffolding...</p>
              <p className="text-[10px] text-slate-500 max-w-sm mt-1">L'IA rédigera les fichiers, vous pourrez ensuite les inspecter et les incorporer d'un clic.</p>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-rose-700 space-y-3">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
              <p className="font-semibold text-xs font-mono">Échec de la Génération</p>
              <p className="text-xs text-rose-600 max-w-sm">{error}</p>
            </div>
          )}

          {/* Success Notification display */}
          {successMessage && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-emerald-800 space-y-3">
              <Check className="w-10 h-10 text-emerald-700 bg-emerald-50 p-2 rounded-full border border-emerald-250 animate-bounce" />
              <p className="font-semibold text-xs font-mono">Injection Accomplie !</p>
              <p className="text-xs text-emerald-600 max-w-sm">{successMessage}</p>
            </div>
          )}

          {/* Generated code results display wrapper */}
          {generatedFiles.length > 0 && activeGenFile && (
            <div className="flex-1 flex flex-col h-full space-y-5">
              
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-150">
                <span className="font-mono text-xs text-indigo-700 font-semibold animate-pulse">Fichiers Générés ({generatedFiles.length})</span>
                <button
                  onClick={handleInjectFiles}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 border-0 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Intégrer les Fichiers
                </button>
              </div>

              {/* Sidebar selectors for generated files */}
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar shrink-0">
                {generatedFiles.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setActiveGenFile(f)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[10px] border whitespace-nowrap transition cursor-pointer ${
                      activeGenFile.path === f.path
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                        : 'bg-transparent border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Preview Code box panel */}
              <div className="flex-1 bg-slate-50 border border-slate-150 rounded-lg p-4 font-mono text-[10px] overflow-auto max-h-72 custom-scrollbar select-text text-slate-800">
                <div className="text-[9px] text-slate-500 pb-2 border-b border-slate-200 mb-3 uppercase tracking-wider font-semibold">
                  CHEMIN: {activeGenFile.path} • {activeGenFile.description}
                </div>
                <pre>{activeGenFile.content}</pre>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
