import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Upload, Lock, Globe, Trash2, Download, AlertCircle, CheckCircle2, Shield, File, FileText, Image, RefreshCw, Layers, Database, HardDrive, Info } from 'lucide-react';
import { safeLocalStorage } from '../lib/supabaseSync';

interface StorageManagerProps {
  currentLanguage?: 'FR' | 'EN';
  darkMode?: boolean;
}

interface StoredFile {
  id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  provider: string;
  isPrivate: boolean;
  companyId: string;
  uploadedBy: string;
  createdAt: string;
  downloadUrl: string;
}

export default function StorageManager({ currentLanguage = 'FR', darkMode = false }: StorageManagerProps) {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the list of uploaded files from server
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = safeLocalStorage.getItem('optic_access_token');
      const response = await fetch('/api/storage/files', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setFiles(data.files || []);
      } else {
        setError(data.error || 'Impossible de récupérer la liste des fichiers.');
      }
    } catch (err: any) {
      setError('Erreur réseau lors de la récupération des fichiers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Helper to format file sizes
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Convert files to base64 and upload
  const handleUpload = async (rawFile: File) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          // Extract pure Base64 content from DataURL
          const base64Data = result.split(',')[1];

          const token = safeLocalStorage.getItem('optic_access_token');
          const response = await fetch('/api/storage/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
              originalname: rawFile.name,
              mimetype: rawFile.type || 'application/octet-stream',
              base64Data,
              isPrivate
            })
          });

          const data = await response.json();
          if (response.ok && data.success) {
            setSuccess(currentLanguage === 'FR' ? 'Fichier téléversé avec succès !' : 'File uploaded successfully!');
            fetchFiles();
          } else {
            setError(data.error || 'Échec du téléchargement du fichier.');
          }
        } catch (e: any) {
          setError('Erreur lors du traitement du fichier.');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier local.');
        setUploading(false);
      };

      reader.readAsDataURL(rawFile);
    } catch (err) {
      setError('Erreur d\'upload.');
      setUploading(false);
    }
  };

  // Handle manual file selection via input click
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleUpload(selectedFiles[0]);
    }
  };

  // Drag and Drop implementation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleUpload(droppedFiles[0]);
    }
  };

  // Delete file
  const handleDelete = async (fileId: string) => {
    if (!window.confirm(currentLanguage === 'FR' ? 'Êtes-vous sûr de vouloir supprimer définitivement ce fichier ?' : 'Are you sure you want to permanently delete this file?')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const token = safeLocalStorage.getItem('optic_access_token');
      const response = await fetch(`/api/storage/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(currentLanguage === 'FR' ? 'Fichier supprimé définitivement.' : 'File deleted permanently.');
        fetchFiles();
      } else {
        setError(data.error || 'Échec de la suppression du fichier.');
      }
    } catch (err) {
      setError('Erreur lors de la suppression du fichier.');
    }
  };

  // Helper to pick icons based on MIME-type
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <Image className="w-5 h-5 text-indigo-500 shrink-0" />;
    if (mimetype.includes('pdf')) return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
    if (mimetype.includes('text/') || mimetype.includes('json')) return <FileText className="w-5 h-5 text-amber-500 shrink-0" />;
    return <File className="w-5 h-5 text-slate-500 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Informative Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border flex items-start gap-3 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-150`}>
          <HardDrive className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-left">
            <span className="text-xs font-bold text-indigo-900 block">
              {currentLanguage === 'FR' ? 'Compatibilité S3 / MinIO / R2' : 'S3 / MinIO / R2 Compatible'}
            </span>
            <p className="text-[10px] text-indigo-700 mt-1 leading-relaxed">
              {currentLanguage === 'FR'
                ? "Le système s'intègre nativement avec le stockage local ou n'importe quel Bucket S3 (AWS, MinIO local ou Cloudflare R2) avec adaptation des régions et force-path configurations."
                : "The system integrates with local disk or any S3 bucket (AWS, local MinIO, or Cloudflare R2) with automated region and path style configuration."}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-start gap-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-150`}>
          <Shield className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-left">
            <span className="text-xs font-bold text-emerald-900 block">
              {currentLanguage === 'FR' ? "Contrôle d'Accès Multi-Tenant" : "Multi-Tenant Access Isolation"}
            </span>
            <p className="text-[10px] text-emerald-700 mt-1 leading-relaxed">
              {currentLanguage === 'FR'
                ? "Chaque fichier téléversé appartient exclusivement à votre entreprise (Tenant). L'accès aux fichiers privés nécessite une authentification stricte et est validé côté serveur."
                : "Every uploaded file belongs strictly to your enterprise (Tenant). Access to private files is secure, requiring valid authorization headers for verification."}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-start gap-3 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200`}>
          <Database className="w-6 h-6 text-slate-600 shrink-0 mt-0.5" />
          <div className="text-left">
            <span className="text-xs font-bold text-slate-900 block">
              {currentLanguage === 'FR' ? 'Journal d\'Audit et Traçabilité' : 'Audit Logging & Tracking'}
            </span>
            <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">
              {currentLanguage === 'FR'
                ? "Toutes les opérations d'importation, de téléchargement direct et de suppression physique sont enregistrées dans le registre d'audit centralisé."
                : "All file operations, uploads, secure downloads, and permanent deletions are instantly compiled inside the central audit logging system."}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Zone & Visibility Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              {currentLanguage === 'FR' ? 'Propriétés d\'importation' : 'Import Properties'}
            </h4>
            
            {/* Visibility Mode Switcher */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                {currentLanguage === 'FR' ? 'Niveau d\'accès' : 'Access Level'}
              </label>
              
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border text-left transition cursor-pointer ${
                  isPrivate
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Lock className="w-4 h-4" />
                <div>
                  <span className="font-bold block">{currentLanguage === 'FR' ? 'Privé (Recommandé)' : 'Private (Recommended)'}</span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    {currentLanguage === 'FR' ? 'Seul votre personnel autorisé y accède.' : 'Only authorized staff has access.'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border text-left transition cursor-pointer ${
                  !isPrivate
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-4 h-4" />
                <div>
                  <span className="font-bold block">{currentLanguage === 'FR' ? 'Public (Ressource)' : 'Public (Resource)'}</span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    {currentLanguage === 'FR' ? 'Disponible via URL publique directe.' : 'Available via direct public cloud URL.'}
                  </span>
                </div>
              </button>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-150 rounded-xl text-[10px] text-amber-800 leading-relaxed">
              <Info className="w-4 h-4 text-amber-600 inline-block mr-1 shrink-0 -mt-0.5" />
              {currentLanguage === 'FR'
                ? "Le mode privé requiert la transmission d'un jeton JWT valide et compare l'identifiant d'organisation pour prévenir les fuites de données."
                : "Private mode enforces JWT token authentication and matches organization scopes to prevent unauthorized data exposures."}
            </div>
          </div>
        </div>

        {/* Drag and Drop Uploader */}
        <div className="lg:col-span-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-full min-h-[180px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50/40'
                : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mb-3 shrink-0">
              {uploading ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <Upload className="w-8 h-8" />
              )}
            </div>

            {uploading ? (
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {currentLanguage === 'FR' ? 'Importation en cours...' : 'Uploading file...'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {currentLanguage === 'FR' ? 'Génération de signatures de hachage et transfert sécurisé.' : 'Generating hash signatures and transferring securely.'}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {currentLanguage === 'FR'
                    ? "Glissez-déposez un document ici, ou cliquez pour parcourir"
                    : "Drag and drop a file here, or click to browse local storage"}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1 leading-relaxed">
                  {currentLanguage === 'FR'
                    ? "Tous formats acceptés (Images, Ordonnances PDF, Bulletins de caisse, Fiches techniques). Limite recommandée : 10 Mo"
                    : "Supports all formats (Images, clinical PDFs, daily journal cards, receipts). Recommended limit: 10 MB"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Files Registry Table */}
      <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-xs text-left">
        <div className="p-4 border-b border-slate-150 flex flex-row items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {currentLanguage === 'FR' ? "Registre des Fichiers et Documents Actifs" : "Active Documents & File Storage Registry"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {currentLanguage === 'FR'
                ? "Liste multi-tenant des pièces jointes et ordonnances associées à votre boutique."
                : "Multi-tenant file directory of attachments and clinical prescriptions associated with your company."}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchFiles}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            <span className="text-[11px] text-slate-500">
              {currentLanguage === 'FR' ? 'Chargement du registre...' : 'Loading document ledger...'}
            </span>
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <FolderOpen className="w-8 h-8 text-slate-300" />
            <span className="text-[11px] text-slate-500 font-medium">
              {currentLanguage === 'FR' ? 'Aucun document importé pour le moment.' : 'No uploaded files found.'}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-2.5 px-4">{currentLanguage === 'FR' ? 'Type' : 'Type'}</th>
                  <th className="py-2.5 px-4">{currentLanguage === 'FR' ? 'Nom du fichier' : 'Filename'}</th>
                  <th className="py-2.5 px-4">{currentLanguage === 'FR' ? 'Identifiant Unique' : 'File Identifier'}</th>
                  <th className="py-2.5 px-4">{currentLanguage === 'FR' ? 'Taille' : 'Size'}</th>
                  <th className="py-2.5 px-4">{currentLanguage === 'FR' ? 'Accès' : 'Access'}</th>
                  <th className="py-2.5 px-4">{currentLanguage === 'FR' ? 'Date de transfert' : 'Uploaded'}</th>
                  <th className="py-2.5 px-4 text-right">{currentLanguage === 'FR' ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-4">
                      {getFileIcon(file.mimetype)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {file.originalname}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[9px] text-slate-400">
                      {file.id}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {formatSize(file.size)}
                    </td>
                    <td className="py-2.5 px-4">
                      {file.isPrivate ? (
                        <span className="inline-flex items-center gap-1 py-0.5 px-1.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-bold">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{currentLanguage === 'FR' ? 'Privé' : 'Private'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 py-0.5 px-1.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold">
                          <Globe className="w-2.5 h-2.5" />
                          <span>{currentLanguage === 'FR' ? 'Public' : 'Public'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(file.createdAt).toLocaleDateString(currentLanguage === 'FR' ? 'fr-FR' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1.5">
                      <a
                        href={file.downloadUrl || `/api/storage/files/${file.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 py-1 px-2 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600 transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>{currentLanguage === 'FR' ? 'Télécharger' : 'Download'}</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDelete(file.id)}
                        className="inline-flex items-center p-1 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-600 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
