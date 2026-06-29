import React, { useState } from 'react';
import { ArchFile } from '../types/architecture';
import { FileCode, Folder, Copy, Check, Search, Filter, Code, Info } from 'lucide-react';

interface CodeWorkspaceProps {
  files: ArchFile[];
}

export default function CodeWorkspace({ files }: CodeWorkspaceProps) {
  const [selectedModule, setSelectedModule] = useState<string>('Tous');
  const [selectedLayer, setSelectedLayer] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<ArchFile>(files[0]);
  const [copied, setCopied] = useState(false);

  // Extract unique modules and layers
  const modules = ['Tous', ...Array.from(new Set(files.map(f => f.module)))];
  const layers = ['Tous', 'domain', 'data', 'presentation', 'backend', 'database'];

  // Filter files
  const filteredFiles = files.filter(file => {
    const matchesModule = selectedModule === 'Tous' || file.module === selectedModule;
    const matchesLayer = selectedLayer === 'Tous' || file.layer === selectedLayer;
    const matchesQuery = searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesLayer && matchesQuery;
  });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur de copie dans le presse-papiers');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-800" id="code-workspace-container">
      
      {/* File browser panel (Left 4 cols) */}
      <div className="lg:col-span-4 flex flex-col bg-white border border-slate-100 shadow-sm rounded-xl p-4 lg:p-5 h-[620px] space-y-4">
        
        {/* Module / Layer selection filters */}
        <div className="space-y-3 shrink-0">
          <div className="font-display font-semibold text-xs tracking-widest text-slate-500 uppercase">
            Filtres de l'Architecture
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un fichier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-[#0097a7]/50 outline-none text-slate-800 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Module drop box */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Module</span>
              <select
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  // Auto focus first file of new filter
                  const first = files.find(f => e.target.value === 'Tous' || f.module === e.target.value);
                  if (first) setSelectedFile(first);
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none text-slate-700 focus:border-[#0097a7]/50"
              >
                {modules.map(mod => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
            </div>

            {/* Layer drop box */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Couche Clean Arch.</span>
              <select
                value={selectedLayer}
                onChange={(e) => {
                  setSelectedLayer(e.target.value);
                  // Auto focus first file of new filter
                  const first = files.find(f => e.target.value === 'Tous' || f.layer === e.target.value);
                  if (first) setSelectedFile(first);
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none text-slate-700 focus:border-[#0097a7]/50"
              >
                {layers.map(lay => (
                  <option key={lay} value={lay}>{lay === 'Tous' ? 'Tous' : lay.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Directory File-Tree list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar select-none pr-1">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-650 px-2 py-1 bg-slate-50 rounded">
              <Folder className="w-3.5 h-3.5 text-indigo-500" />
              <span>Optic Alizé Workspace</span>
            </div>

            <div className="mt-2 pl-2 space-y-1">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between border transition ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-semibold'
                        : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${
                        file.language === 'dart' ? 'text-amber-600' :
                        file.language === 'typescript' ? 'text-indigo-600' : 'text-emerald-600'
                      }`} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className="text-[9px] shrink-0 font-sans uppercase px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                      {file.type}
                    </span>
                  </button>
                );
              })}

              {filteredFiles.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-mono">
                  Aucun fichier correspondant aux filtres.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor & Viewer Code area (Right 8 cols) */}
      <div className="lg:col-span-8 flex flex-col bg-white border border-slate-100 shadow-sm rounded-xl h-[620px] overflow-hidden">
        
        {/* Editor Tab headers */}
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-indigo-600" />
            <div>
              <span className="font-mono text-xs font-semibold text-slate-800">{selectedFile.name}</span>
              <p className="text-[10px] text-slate-500 font-mono">{selectedFile.path}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Copy button */}
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0097a7]/10 hover:bg-[#0097a7] text-[#0097a7] hover:text-white border border-[#0097a7]/20 hover:border-transparent text-xs font-mono transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copier le code
                </>
              )}
            </button>
          </div>
        </div>

        {/* File information Banner */}
        <div className="bg-[#0097a7]/5 p-3 px-5 border-b border-slate-100 flex items-start gap-2.5 shrink-0">
          <Info className="w-4 h-4 text-[#0097a7] shrink-0 mt-0.5" />
          <p className="text-slate-700 text-xs leading-normal">
            <strong>{selectedFile.module} • {selectedFile.layer.toUpperCase()} • </strong>
            {selectedFile.description}
          </p>
        </div>

        {/* Code Content text-editor with custom styled lines number in light github mode */}
        <div className="flex-1 overflow-auto custom-scrollbar flex p-4 text-[11px] font-mono select-text bg-slate-50 relative">
          
          <div className="space-y-0.5 select-none text-slate-400 pr-4 text-right border-r border-slate-200 line-numbers shrink-0">
            {selectedFile.content.split('\n').map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>

          <div className="pl-4 text-slate-800 whitespace-pre">
            {selectedFile.content.split('\n').map((line, idx) => {
              // Simple syntax highlights in light theme
              let element = <span>{line}</span>;
              if (line.trim().startsWith('import ') || line.trim().startsWith('export ')) {
                element = <span className="text-rose-600 font-semibold">{line}</span>;
              } else if (line.trim().startsWith('class ') || line.trim().startsWith('abstract class ')) {
                element = <span className="text-[#0097a7] font-semibold">{line}</span>;
              } else if (line.trim().startsWith('CREATE ') || line.trim().startsWith('ALTER ') || line.trim().startsWith('INSERT ')) {
                element = <span className="text-indigo-600 font-semibold">{line}</span>;
              } else if (line.trim().startsWith('//') || line.trim().startsWith('--')) {
                element = <span className="text-emerald-600 italic font-normal">{line}</span>;
              } else if (line.includes('const ') || line.includes('final ') || line.includes('let ')) {
                element = <span className="text-blue-600">{line}</span>;
              }
              return (
                <div key={idx} className="hover:bg-indigo-50/50">
                  {element}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-mono shrink-0 font-sans">
          <span>LANGUE: {selectedFile.language.toUpperCase()}</span>
          <span>{selectedFile.content.split('\n').length} Lignes</span>
        </div>

      </div>
    </div>
  );
}
