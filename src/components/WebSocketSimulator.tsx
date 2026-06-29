import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  User, 
  Users, 
  Bell, 
  Terminal, 
  Code, 
  Smartphone, 
  AlertCircle, 
  Trash2, 
  PlusCircle, 
  Download, 
  Check, 
  CheckCheck,
  RefreshCw, 
  Briefcase, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Lock, 
  VolumeX, 
  FileText, 
  X,
  Megaphone,
  Radio,
  Phone,
  Video,
  Eye,
  EyeOff,
  MoreVertical,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  LockKeyhole,
  Search,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickAttachment {
  name: string;
  type: string;
  size: string;
  url: string;
}

interface Message {
  id: string;
  chatType: 'private' | 'group';
  channelId?: string;
  recipientId?: string;
  senderId: string;
  senderName: string;
  senderShop: string;
  content: string;
  attachment: QuickAttachment | null;
  createdAt: string;
  isViewOnce?: boolean;
  isOpened?: boolean;
  isDeletedForEveryone?: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  senderName: string;
}

interface OnlineUser {
  id: string;
  username: string;
  role: string;
  shop: string;
}

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

const PRESET_USERS = [
  { id: 'staff_1', username: 'Sophie (Opticienne-Conseil)', role: 'Directrice de Succursale', shop: '🏢 Boutique Alpha' },
  { id: 'staff_2', username: 'Jean-Marc (Montage Labo)', role: 'Opticien Technique', shop: '🏢 Boutique Bêta' },
  { id: 'staff_3', username: 'Marc (Conseil Externe)', role: 'Optométriste Diplômé', shop: '🏢 Boutique Gamma' },
  { id: 'staff_4', username: 'Alexandre (Administrateur)', role: 'Gérant Principal Optic Alizé', shop: 'Dépôt Central' }
];

const PRESET_ATTACHMENTS: QuickAttachment[] = [
  { name: 'Scan_Ordonnance_Patient_Dupont.pdf', type: 'application/pdf', size: '420 KB', url: '#' },
  { name: 'Facture_RayBan_Grossiste_Summer.png', type: 'image/png', size: '150 KB', url: '#' },
  { name: 'Devis_Mutuelle_Signe_TiersPayant.pdf', type: 'application/pdf', size: '890 KB', url: '#' }
];

interface WebSocketSimulatorProps {
  mode?: 'messenger' | 'riverpod' | 'logs';
}

export default function WebSocketSimulator({ mode = 'messenger' }: WebSocketSimulatorProps) {
  const [currentUser, setCurrentUser] = useState(PRESET_USERS[0]);
  const [activeTab, setActiveTab] = useState<'chat' | 'blueprints' | 'broker_logs'>(() => {
    if (mode === 'riverpod') return 'blueprints';
    if (mode === 'logs') return 'broker_logs';
    return 'chat';
  });

  const isUserAdmin = (user: { id: string; role: string; shop: string }) => {
    return user.id === 'staff_4' || 
           user.role.toLowerCase().includes('admin') || 
           user.shop.toLowerCase().includes('dépôt') || 
           user.shop.toLowerCase().includes('administration');
  };
  
  const [activeDestination, setActiveDestination] = useState<{ type: 'group' | 'private'; id: string; label: string }>({
    type: 'private',
    id: 'staff_4',
    label: 'Alexandre (Administrateur) (Dépôt Central)'
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_init_1',
      chatType: 'group',
      channelId: 'general',
      senderId: 'staff_1',
      senderName: 'Sophie (Opticienne-Conseil)',
      senderShop: '🏢 Boutique Alpha',
      content: "Bonjour l'équipe d'Optic Alizé ! Est-ce que le transfert de montures et verres progressifs depuis le Dépôt Central a bien été validé ?",
      attachment: null,
      createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
    },
    {
      id: 'msg_init_2',
      chatType: 'group',
      channelId: 'general',
      senderId: 'staff_2',
      senderName: 'Jean-Marc (Montage Labo)',
      senderShop: '🏢 Boutique Bêta',
      content: "Oui Sophie ! C'est en cours. Le Gérant a procédé à l'approvisionnement des stocks de nos boutiques ce matin.",
      attachment: null,
      createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
    },
    {
      id: 'msg_init_3',
      chatType: 'group',
      channelId: 'atelier',
      senderId: 'staff_2',
      senderName: 'Jean-Marc (Montage Labo)',
      senderShop: '🏢 Boutique Bêta',
      content: "Rappel laboratoire : Les meules automatiques ont été inspectées et calibrées pour les verres minéraux et organiques.",
      attachment: null,
      createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
    }
  ]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 'ann_init_1',
      title: '📦 Procédure d\'approvisionnement inter-boutiques activée',
      content: 'Chaque filiale d\'Optic Alizé peut désormais enregistrer ses ventes locales et envoyer des alertes de réapprovisionnement. Seul le Dépôt Central d\'Optic Alizé dispose du bouton d\'émission du transfert logistique.',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      senderName: 'Direction Générale Optic Alizé'
    }
  ]);

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([
    { id: 'staff_1', username: 'Sophie (Opticienne-Conseil)', role: 'Directrice de Succursale', shop: '🏢 Boutique Alpha' },
    { id: 'staff_2', username: 'Jean-Marc (Montage Labo)', role: 'Opticien Technique', shop: '🏢 Boutique Bêta' },
    { id: 'staff_3', username: 'Marc (Conseil Externe)', role: 'Optométriste Diplômé', shop: '🏢 Boutique Gamma' },
    { id: 'staff_4', username: 'Alexandre (Administrateur)', role: 'Gérant Principal Optic Alizé', shop: 'Dépôt Central' }
  ]);

  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [rawLogs, setRawLogs] = useState<string[]>([]);

  // Form & Settings states
  const [inputText, setInputText] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<QuickAttachment | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [showAnnouncementCreator, setShowAnnouncementCreator] = useState(false);
  const [isViewOnceMode, setIsViewOnceMode] = useState(false);
  
  // Deleted & custom views state
  const [deletedLocalMessageIds, setDeletedLocalMessageIds] = useState<string[]>([]);
  
  // Call simulation states
  const [activeCall, setActiveCall] = useState<{
    type: 'audio' | 'video';
    isOpen: boolean;
    stream: MediaStream | null;
    status: 'connecting' | 'connected' | 'ended' | 'denied';
    duration: number;
    micMuted: boolean;
    camOff: boolean;
  } | null>(null);

  // Connection & Ref state
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const callVideoRef = useRef<HTMLVideoElement | null>(null);
  const callTimerRef = useRef<any>(null);

  // Max 1MB size checking with custom warning modal/toast
  const [fileLimitWarning, setFileLimitWarning] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxLimitBytes = 1 * 1024 * 1024; // 1 MB
      if (file.size > maxLimitBytes) {
        setFileLimitWarning(`Le fichier "${file.name}" dépasse la taille maximale autorisée de 1 Mo (Taille actuelle: ${(file.size / (1024 * 1024)).toFixed(2)} Mo). Veuillez choisir un document plus léger.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
      setSelectedAttachment({
        name: file.name,
        type: file.type,
        size: sizeStr,
        url: URL.createObjectURL(file)
      });
      setFileLimitWarning(null);
    }
  };

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  // Synchronize tab with mode changes and embeds
  useEffect(() => {
    if (mode === 'riverpod') {
      setActiveTab('blueprints');
    } else if (mode === 'logs') {
      setActiveTab('broker_logs');
    }
  }, [mode]);

  // Handle Toast notifications
  const addToast = (title: string, message: string) => {
    const id = 'toast_' + Date.now();
    const newToast = { id, title, message, createdAt: new Date().toLocaleTimeString() };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Add raw broker log
  const addLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setRawLogs((prev) => [`[${timestamp}] ${text}`, ...prev.slice(0, 99)]);
  };

  // Initialize and connect WebSocket
  useEffect(() => {
    setConnectionStatus('CONNECTING');
    addLog(`Tentative de connexion au canal d'Optic Alizé pour ${currentUser.username}...`);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}`;
    
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(socketUrl);
      wsRef.current = ws;
    } catch (e) {
      console.warn("WebSocket construction is blocked or unavailable in this sandbox environment:", e);
      setConnectionStatus('DISCONNECTED');
      addLog(`✗ Impossible d'initier la connexion WebSocket (Bloqué par la sécurité de l'iframe).`);
      wsRef.current = null;
    }

    if (ws) {
      ws.onopen = () => {
        setConnectionStatus('CONNECTED');
        addLog(`✓ Socket raccordée avec succès au serveur d'Optic Alizé.`);
        
        if (ws) {
          ws.send(JSON.stringify({
            type: 'register',
            user: {
              id: currentUser.id,
              username: currentUser.username,
              role: currentUser.role,
              shop: currentUser.shop
            }
          }));
          addLog(`Enregistrement client transmis : ${currentUser.username}`);
        }
      };

      ws.onmessage = (event) => {
        try {
          const rawData = event.data;
          const data = JSON.parse(rawData);
          addLog(`Événement réseau reçu [${data.type}]`);

          switch (data.type) {
            case 'init': {
              setMessages(data.messages);
              setAnnouncements(data.announcements);
              setOnlineUsers(data.onlineUsers);
              addLog(`Base synchronisée : ${data.messages.length} messages, ${data.announcements.length} mémos.`);
              break;
            }
            case 'user_joined': {
              setOnlineUsers((prev) => {
                if (prev.some((u) => u.id === data.user.id)) return prev;
                return [...prev, data.user];
              });
              break;
            }
            case 'user_left': {
              setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
              addLog(`Départ notifié de l'utilisateur ${data.userId}`);
              break;
            }
            case 'message_received': {
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
              break;
            }
            case 'announcement_received': {
              setAnnouncements((prev) => [data.announcement, ...prev]);
              break;
            }
            case 'typing_broadcast': {
              const state = data.typingState;
              if (state.isTyping) {
                const fromGeneral = state.channelId === 'general' && activeDestination.id === 'general';
                const fromAtelier = state.channelId === 'atelier' && activeDestination.id === 'atelier';
                const fromPrivate = state.recipientId === currentUser.id && activeDestination.id === state.senderId;
                
                if (fromGeneral || fromAtelier || fromPrivate) {
                  setTypingUsers((prev) => ({ ...prev, [state.senderId]: state.senderName }));
                }
              } else {
                setTypingUsers((prev) => {
                  const next = { ...prev };
                  delete next[state.senderId];
                  return next;
                });
              }
              break;
            }
            case 'notification': {
              addToast(data.notification.title, data.notification.message);
              addLog(`Alerte Broadcast: ${data.notification.title} - ${data.notification.message}`);
              break;
            }
            default:
              addLog(`Événement inconnu ignoré.`);
          }
        } catch (err) {
          addLog(`⚠ Erreur de parsing du frame WebSocket.`);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('DISCONNECTED');
        addLog(`⚠ WebSocket déconnectée. Repli sur le simulateur local.`);
      };

      ws.onerror = () => {
        setConnectionStatus('DISCONNECTED');
        addLog(`✗ Erreur critique de transport sur le canal WebSocket.`);
      };
    }

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          console.warn("Error during WebSocket cleanup close:", e);
        }
        wsRef.current = null;
      }
    };
  }, [currentUser, activeDestination.id]);

  // Emit typing indicators when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        typingState: {
          isTyping: e.target.value.length > 0,
          senderName: currentUser.username,
          channelId: activeDestination.type === 'group' ? activeDestination.id : undefined,
          recipientId: activeDestination.type === 'private' ? activeDestination.id : undefined
        }
      }));
    }
  };

  // Submit actual message over WS or fallback to local simulator
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedAttachment) return;

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      chatType: activeDestination.type,
      channelId: activeDestination.type === 'group' ? activeDestination.id : undefined,
      recipientId: activeDestination.type === 'private' ? activeDestination.id : undefined,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderShop: currentUser.shop,
      content: inputText,
      attachment: selectedAttachment,
      createdAt: new Date().toISOString(),
      isViewOnce: isViewOnceMode,
      isOpened: false
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'message',
        message: {
          chatType: activeDestination.type,
          channelId: activeDestination.type === 'group' ? activeDestination.id : undefined,
          recipientId: activeDestination.type === 'private' ? activeDestination.id : undefined,
          content: inputText,
          attachment: selectedAttachment,
          isViewOnce: isViewOnceMode,
          isOpened: false
        }
      };

      wsRef.current.send(JSON.stringify(payload));
      addLog(`Message envoyé à destination de [${activeDestination.label}]`);

      setInputText('');
      setSelectedAttachment(null);
      setIsViewOnceMode(false);

      wsRef.current.send(JSON.stringify({
        type: 'typing',
        typingState: {
          isTyping: false,
          senderName: currentUser.username,
          channelId: activeDestination.type === 'group' ? activeDestination.id : undefined,
          recipientId: activeDestination.type === 'private' ? activeDestination.id : undefined
        }
      }));
    } else {
      // Local fallback simulation mode
      setMessages((prev) => [...prev, newMsg]);
      addLog(`[SIMULÉ CONCURRENT] Message envoyé localement à [${activeDestination.label}]`);
      addToast('Message transmis', 'Message de liaison envoyé en local.');

      setInputText('');
      setSelectedAttachment(null);
      setIsViewOnceMode(false);

      // Auto-reply simulation from other branch managers!
      const potentialMockUsers = PRESET_USERS.filter(user => user.id !== currentUser.id);
      const responder = potentialMockUsers[Math.floor(Math.random() * potentialMockUsers.length)];
      
      setTimeout(() => {
        setTypingUsers((prev) => ({ ...prev, [responder.id]: responder.username }));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[responder.id];
            return next;
          });

          const localizedAnswers = [
            "Bien reçu ! Le transfert d'atelier d'Optic Alizé a été notifié de mon côté.",
            "Très bien, je surveille s'il y a des alertes de réappro pour nos boutiques secondaires.",
            "Parfait ! Notre équipe de montage est prévenue, nous préparons les fiches de liaison.",
            "Merci pour le mémo. Tout est opérationnel dans nos ateliers locaux.",
            "Note prise. Je confirme que les stocks locaux d'optométrie sont conformes."
          ];
          const randomAnswer = localizedAnswers[Math.floor(Math.random() * localizedAnswers.length)];

          const simulatedReply: Message = {
            id: 'msg_sim_' + Date.now(),
            chatType: activeDestination.type,
            channelId: activeDestination.type === 'group' ? activeDestination.id : undefined,
            recipientId: activeDestination.type === 'private' ? currentUser.id : undefined,
            senderId: responder.id,
            senderName: responder.username,
            senderShop: responder.shop,
            content: randomAnswer,
            attachment: null,
            createdAt: new Date().toISOString()
          };

          setMessages((prev) => [...prev, simulatedReply]);
          addToast('Message reçu', `${responder.username} : ${randomAnswer.substring(0, 30)}...`);
        }, 1500);
      }, 1000);
    }
  };

  // Broadcast an announcement
  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    const newAnn: Announcement = {
      id: 'ann_' + Date.now(),
      title: announcementTitle,
      content: announcementContent,
      createdAt: new Date().toISOString(),
      senderName: currentUser.username
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'announcement',
        announcement: {
          title: announcementTitle,
          content: announcementContent
        }
      }));
    } else {
      setAnnouncements((prev) => [newAnn, ...prev]);
      addLog(`[SIMULÉ] Nouvelle annonce diffusée localement : ${announcementTitle}`);
      addToast('Annonce publiée', 'Mémo diffusé localement à tout le réseau.');
    }

    setAnnouncementTitle('');
    setAnnouncementContent('');
    setShowAnnouncementCreator(false);
  };

  // Switch persona to test multi-user conversations
  const handleSwitchUser = (user: typeof PRESET_USERS[0]) => {
    addLog(`Changement d'identité : Passage de ${currentUser.username} à ${user.username}...`);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        typingState: { isTyping: false, senderName: currentUser.username }
      }));
    }
    setCurrentUser(user);
    setMessages([]);

    if (!isUserAdmin(user)) {
      setActiveDestination({
        type: 'private',
        id: 'staff_4',
        label: 'Alexandre (Administrateur) (Dépôt Central)'
      });
    } else {
      setActiveDestination({
        type: 'group',
        id: 'general',
        label: 'Général (#general)'
      });
    }
  };

  // Supprimer pour moi
  const handleDeleteForMe = (messageId: string) => {
    setDeletedLocalMessageIds((prev) => [...prev, messageId]);
    addToast('Message effacé', 'Ce message a été masqué pour vous.');
    addLog(`Message ${messageId} supprimé localement (pour moi).`);
  };

  // Supprimer pour tous
  const handleDeleteForEveryone = (messageId: string) => {
    setMessages((prev) => 
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: "🚫 Ce message a été supprimé pour tous.",
            attachment: null,
            isDeletedForEveryone: true
          };
        }
        return msg;
      })
    );
    addToast('Message supprimé', 'Le message a été supprimé pour tout le monde.');
    addLog(`Message ${messageId} supprimé globalement (pour tous).`);
  };

  // Vider la conversation
  const handleClearConversation = () => {
    // Collect all message IDs currently shown in the active conversation
    const activeMsgIds = filteredMessages.map((m) => m.id);
    setDeletedLocalMessageIds((prev) => [...prev, ...activeMsgIds]);
    addToast('Conversation vidée', 'L\'historique de ce tchat a été vidé pour vous.');
    addLog(`Historique vidé pour la destination ${activeDestination.label}.`);
  };

  // View once message click revealer
  const handleOpenViewOnceMessage = (messageId: string) => {
    setMessages((prev) => 
      prev.map((msg) => {
        if (msg.id === messageId) {
          return { ...msg, isOpened: true };
        }
        return msg;
      })
    );
    addLog(`Message éphémère (Vue unique) ${messageId} ouvert et consommé.`);
  };

  // Real webcam starting mechanism
  const startCall = async (type: 'audio' | 'video') => {
    addLog(`Lancement d'un appel ${type} vers ${activeDestination.label}...`);
    setActiveCall({
      type,
      isOpen: true,
      stream: null,
      status: 'connecting',
      duration: 0,
      micMuted: false,
      camOff: false
    });

    try {
      // Request active webcam/mic matching the intent
      if (!navigator || !navigator.mediaDevices) {
        throw new Error("Les API MediaDevices ne sont pas disponibles dans ce contexte d'iframe.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      
      setActiveCall((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          stream,
          status: 'connected'
        };
      });

      // Assign camera preview stream to local video tag
      setTimeout(() => {
        if (callVideoRef.current) {
          callVideoRef.current.srcObject = stream;
        }
      }, 300);

      // Start duration increment timer
      let secs = 0;
      callTimerRef.current = setInterval(() => {
        secs++;
        setActiveCall((prev) => {
          if (!prev) return null;
          return { ...prev, duration: secs };
        });
      }, 1000);

      addLog(`✓ Appel connecté avec succès. Webcam active.`);
    } catch (err) {
      console.error("Erreur de caméra/micro", err);
      // Fallback state if user declines permissions, no camera found
      setActiveCall((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'denied'
        };
      });
      addLog(`⚠ Droits d'accès caméra/micro refusés ou absents. Canal audio virtuel actif.`);
    }
  };

  const endCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (activeCall?.stream) {
      activeCall.stream.getTracks().forEach((track) => track.stop());
    }

    setActiveCall((prev) => {
      if (!prev) return null;
      return { ...prev, status: 'ended' };
    });

    setTimeout(() => {
      setActiveCall(null);
    }, 1500);

    addLog(`Appel vers ${activeDestination.label} terminé.`);
  };

  const toggleMute = () => {
    if (activeCall?.stream) {
      const audioTrack = activeCall.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setActiveCall((prev) => prev ? { ...prev, micMuted: !prev.micMuted } : null);
      }
    }
  };

  const toggleCamera = () => {
    if (activeCall?.stream) {
      const videoTrack = activeCall.stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setActiveCall((prev) => prev ? { ...prev, camOff: !prev.camOff } : null);
      }
    }
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Core filter applying "Vider la conversation" deletions
  const filteredMessages = messages
    .filter((msg) => !deletedLocalMessageIds.includes(msg.id))
    .filter((msg) => {
      if (activeDestination.type === 'group') {
        return msg.chatType === 'group' && msg.channelId === activeDestination.id;
      } else {
        const isSentByMeToTarget = msg.chatType === 'private' && msg.senderId === currentUser.id && msg.recipientId === activeDestination.id;
        const isSentByTargetToMe = msg.chatType === 'private' && msg.senderId === activeDestination.id && msg.recipientId === currentUser.id;
        return isSentByMeToTarget || isSentByTargetToMe;
      }
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* File Size Warning Modal (In French) */}
      {fileLimitWarning && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 mt-2 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="text-xs font-bold text-red-900 uppercase">Fichier trop volumineux</h5>
            <p className="text-xs text-red-700 leading-relaxed mt-0.5">{fileLimitWarning}</p>
          </div>
          <button 
            onClick={() => setFileLimitWarning(null)}
            className="text-red-400 hover:text-red-600 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Slide-in Toast Notifications Container */}
      <div className="fixed top-20 right-6 z-50 space-y-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 50 }}
              className="bg-white border-l-4 border-[#128C7E] shadow-2xl p-4 rounded-xl flex gap-3 pointer-events-auto border border-slate-100"
            >
              <div className="p-1.5 rounded-lg bg-emerald-50 text-[#128C7E] h-fit shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 font-sans">
                <p className="text-xs font-bold text-slate-800 tracking-tight uppercase">{toast.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
                <span className="text-[9px] font-mono text-slate-400 mt-1 block">{toast.createdAt}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {mode === 'messenger' && (
        <>
          {/* Top Controls Header */}
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-[#128C7E] animate-pulse" />
                <span className="text-xs font-bold text-[#128C7E] font-mono tracking-widest uppercase">Canal Temps Réel Optic Alizé</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Messagerie Interne d'Optic Alizé</h2>
              <p className="text-xs text-slate-500 max-w-2xl">
                Coordonnez vos succursales en temps réel. Partagez instantanément des ordonnances, des conseils de meulage et communiquez en direct.
              </p>
            </div>

            {/* Identity selector component */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 w-full md:w-auto space-y-2 shrink-0 text-left">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acteur connecté :</span>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-[#25D366] animate-pulse' : 'bg-rose-500'}`}></span>
                  <span className="text-[10px] font-mono text-slate-500">{connectionStatus === 'CONNECTED' ? 'En ligne' : 'Locaux'}</span>
                </div>
              </div>
              
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const selected = PRESET_USERS.find(u => u.id === e.target.value);
                  if (selected) handleSwitchUser(selected);
                }}
                className="w-full md:w-56 bg-white border border-slate-200 text-xs text-slate-800 font-medium py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm cursor-pointer"
              >
                {PRESET_USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
              <span className="text-[9px] font-mono text-slate-400 block text-right mt-0.5">{currentUser.role} • {currentUser.shop}</span>
            </div>
          </div>

        </>
      )}

      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* LEFT SIDEBAR: Conversatons List (WhatsApp style) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Announcements memo */}
            <div className="bg-[#E3F2FD] border border-blue-200 p-4 rounded-2xl shadow-sm space-y-3 text-left font-sans">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-blue-600" />
                  Mémos Direction Optic Alizé
                </span>
                <button
                  onClick={() => setShowAnnouncementCreator(!showAnnouncementCreator)}
                  className="text-[10px] font-bold text-blue-700 hover:text-blue-900 border border-blue-200 rounded bg-blue-50 px-1.5 py-0.5 cursor-pointer hover:bg-blue-100 transition"
                >
                  {showAnnouncementCreator ? 'Fermer' : 'Écrire'}
                </button>
              </div>

              {showAnnouncementCreator && (
                <form onSubmit={handlePublishAnnouncement} className="space-y-2 bg-white/85 p-3 rounded-xl border border-blue-100">
                  <input
                    type="text"
                    required
                    placeholder="Titre de l'annonce..."
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
                  />
                  <textarea
                    required
                    placeholder="Contenu..."
                    rows={2}
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase text-[9px] font-bold py-1 px-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    Diffuser aux filiales
                  </button>
                </form>
              )}

              <div className="max-h-36 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {announcements.length === 0 ? (
                  <p className="text-blue-700 text-xs italic">Aucune annonce.</p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="bg-white/90 p-2.5 rounded-xl space-y-1 border border-blue-100 shadow-sm text-xs">
                      <p className="font-bold text-blue-900 leading-tight">{ann.title}</p>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-sans">{ann.content}</p>
                      <div className="flex justify-between items-center text-[9px] text-blue-600 pt-1 font-mono">
                        <span>Par {ann.senderName}</span>
                        <span>{new Date(ann.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Conversation list (WhatsApp styled) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest block">Discussions d'Équipe</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-mono font-bold text-slate-500">
                  {onlineUsers.length} en ligne
                </span>
              </div>

              {/* Groups section */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Groupes d'Ateliers</span>
                <div className="space-y-1">
                  {[
                    { id: 'general', label: 'Optic Alizé Général 📢', desc: 'Discussions globales, actualités des ventes' },
                    { id: 'atelier', label: 'Espace Atelier de Montage ⚙️', desc: 'Commandes de verres, meulage urgent' }
                  ].map((chan) => {
                    const isSelected = activeDestination.type === 'group' && activeDestination.id === chan.id;
                    return (
                      <button
                        key={chan.id}
                        onClick={() => setActiveDestination({ type: 'group', id: chan.id, label: chan.label })}
                        className={`w-full text-left p-3 rounded-xl transition duration-150 flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-[#E1F5FE] text-[#075E54] border-l-4 border-[#128C7E]'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-[#128C7E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#075E54]' : 'text-slate-800'}`}>{chan.label}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{chan.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Private communications list */}
              <div className="mt-6 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Discussions Privées (WhatsApp)</span>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {onlineUsers.filter(u => {
                    if (u.id === currentUser.id) return false;
                    if (!isUserAdmin(currentUser) && !isUserAdmin(u)) return false;
                    return true;
                  }).length === 0 ? (
                    <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-[10px] text-slate-400 font-medium">Aucun destinataire autorisé en ligne.</p>
                      <p className="text-[9px] text-slate-400 mt-1 leading-normal">Seuls les membres administratifs sont joignables en direct pour les succursales.</p>
                    </div>
                  ) : (
                    onlineUsers.filter(u => {
                      if (u.id === currentUser.id) return false;
                      if (!isUserAdmin(currentUser) && !isUserAdmin(u)) return false;
                      return true;
                    }).map((member) => {
                      const isSelected = activeDestination.type === 'private' && activeDestination.id === member.id;
                      return (
                        <button
                          key={member.id}
                          onClick={() => setActiveDestination({ type: 'private', id: member.id, label: `${member.username} (${member.shop})` })}
                          className={`w-full text-left p-3 rounded-xl transition duration-150 flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-[#E1F5FE] text-[#075E54] border-l-4 border-[#128C7E]'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 relative">
                            {member.username.substring(0, 2).toUpperCase()}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate leading-tight">{member.username}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{member.role} • {member.shop}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* MAIN CHAT DISPLAY WITH CHAT GENERAL STYLINGS */}
          <div className="lg:col-span-8 flex flex-col bg-[#efeae2] border border-slate-200 rounded-2xl h-[580px] relative overflow-hidden shadow-md">
            
            {/* WhatsApp Green Top Header */}
            <div className="bg-[#075E54] px-5 py-3 flex items-center justify-between text-white shadow-md z-15">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-emerald-300 shadow-sm shrink-0">
                  {activeDestination.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5 relative" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase">{activeDestination.label}</h4>
                  <span className="text-[10px] text-emerald-100 font-light mt-0.5 block">
                    {connectionStatus === 'CONNECTED' ? 'En ligne • Chiffré SSL' : 'Mode offline local'}
                  </span>
                </div>
              </div>
              
              {/* Top Controls: Audio, Video Call and Clear chat button */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startCall('audio')}
                  title="Appel audio Optic Alizé"
                  className="p-2 rounded-full hover:bg-black/10 transition text-white active:scale-95 cursor-pointer shrink-0"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startCall('video')}
                  title="Appel vidéo Facecam"
                  className="p-2 rounded-full hover:bg-black/10 transition text-white active:scale-95 cursor-pointer shrink-0"
                >
                  <Video className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-white/20 mx-1.5 shrink-0"></div>
                <button
                  onClick={handleClearConversation}
                  title="Vider la conversation"
                  className="p-2 rounded-full hover:bg-red-900/20 text-[#FFF] hover:text-rose-200 transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Messages space */}
            <div 
              className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar relative" 
              style={{
                backgroundImage: 'radial-gradient(#dfd5ca 0.9px, transparent 0.9px), radial-gradient(#dfd5ca 0.9px, #efeae2 0.9px)',
                backgroundSize: '18px 18px',
                backgroundPosition: '0 0, 9px 9px'
              }}
              ref={scrollRef}
            >
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-teal-600 mb-2">
                    <MessageSquare className="w-6 h-6 stroke-1.5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Pas encore de messages de liaison</p>
                  <p className="text-[11px] font-sans text-slate-500 max-w-sm leading-relaxed">
                    Échangez des détails de montage de lentilles, devis, ordonnances ou verres progressifs directement ci-dessous.
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isOwnMessage = msg.senderId === currentUser.id;
                  
                  // View once checking
                  const showAsViewOnce = msg.isViewOnce;
                  const opened = msg.isOpened;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} space-y-1 relative group`}
                    >
                      {/* Name with shop label info */}
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                        <span className="font-bold text-slate-600">{msg.senderName}</span>
                        <span>•</span>
                        <span>{msg.senderShop}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>

                      <div className="relative flex items-center gap-2 max-w-[80%]">
                        
                        {/* Outgoing delete triggers for everyone */}
                        {isOwnMessage && !msg.isDeletedForEveryone && (
                          <div className="opacity-0 group-hover:opacity-100 transition absolute -left-12 flex gap-1 bg-white p-1 rounded-lg border border-slate-250 shadow-sm">
                            <button
                              onClick={() => handleDeleteForMe(msg.id)}
                              title="Masquer pour moi"
                              className="p-1 hover:bg-slate-150 text-slate-400 hover:text-black rounded transition text-[10px]"
                            >
                              Me
                            </button>
                            <button
                              onClick={() => handleDeleteForEveryone(msg.id)}
                              title="Supprimer pour tous"
                              className="p-1 hover:bg-red-50 text-[#F00] rounded transition text-[10px] font-bold"
                            >
                              Tous
                            </button>
                          </div>
                        )}

                        {/* Incoming delete trigger for user only */}
                        {!isOwnMessage && !msg.isDeletedForEveryone && (
                          <div className="opacity-0 group-hover:opacity-100 transition absolute -right-8 bg-white p-1 rounded-lg border border-slate-250 shadow-sm">
                            <button
                              onClick={() => handleDeleteForMe(msg.id)}
                              title="Masquer pour moi"
                              className="p-1 hover:bg-slate-150 text-slate-400 hover:text-black rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Real Balloon Box styled like WhatsApp */}
                        <div
                          className={`p-3.5 rounded-2xl text-xs font-sans shadow-md leading-relaxed relative ${
                            msg.isDeletedForEveryone 
                              ? 'bg-slate-200 text-slate-500 italic rounded-2xl border border-slate-300'
                              : isOwnMessage
                                ? 'bg-[#d9fdd3] text-slate-850 rounded-tr-none border-t-0'
                                : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                          }`}
                        >
                          {/* If View Once is enabled */}
                          {showAsViewOnce ? (
                            opened ? (
                              <div className="flex flex-col gap-1 py-1 text-slate-400 font-mono font-bold select-none text-left">
                                <div className="flex items-center gap-2">
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                  <span>① {msg.attachment ? "Fichier" : "Message"} éphémère consommé</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3 py-1 text-left">
                                <div className="flex items-center gap-2 text-[#075E54] font-bold font-sans">
                                  <Eye className="w-4 h-4 animate-pulse text-[#128C7E]" />
                                  <span>① {msg.attachment ? "Fichier" : "Message"} éphémère reçu (Vue unique)</span>
                                </div>
                                {msg.attachment && (
                                  <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/60 py-1 px-2.5 rounded-lg text-[9px] font-mono leading-none">
                                    <Paperclip className="w-3 h-3 shrink-0 text-amber-600" />
                                    <span className="truncate">Donnée : {msg.attachment.name}</span>
                                  </div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => handleOpenViewOnceMessage(msg.id)}
                                  className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white text-[10px] font-mono tracking-wider font-bold py-1 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition shadow-sm"
                                >
                                  <LockKeyhole className="w-3.5 h-3.5" />
                                  Révéler & Consommer le {msg.attachment ? "fichier" : "message"}
                                </button>
                              </div>
                            )
                          ) : (
                            // Standard output message text
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                          )}

                          {/* File attachment preview with 1MB safety limits */}
                          {msg.attachment && !msg.isDeletedForEveryone && (!showAsViewOnce || opened) && (
                            <div className={`mt-2.5 p-2 rounded-xl flex items-center justify-between gap-3 border ${
                              isOwnMessage 
                                ? 'bg-emerald-100/40 text-emerald-950 border-emerald-300/30' 
                                : 'bg-slate-50 text-slate-700 border-slate-100'
                            }`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 shrink-0 text-amber-500" />
                                <div className="min-w-0 text-left">
                                  <p className="text-[10px] font-bold truncate leading-tight">{msg.attachment.name}</p>
                                  <p className="text-[9px] opacity-85 leading-none mt-0.5">{msg.attachment.size}</p>
                                </div>
                              </div>
                              <button className="p-1 rounded hover:bg-black/10 transition cursor-pointer shrink-0">
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                            </div>
                          )}

                          {/* Double Blue WhatsApp checkmark and timestamp */}
                          <div className="flex justify-end items-center gap-1 mt-1 text-[8.5px] text-slate-400 float-right h-3 font-mono leading-none">
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOwnMessage && (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                            )}
                          </div>
                          <div className="clear-both"></div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Typing indicators */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-[#075E54] font-sans font-medium bg-emerald-50 border border-emerald-100/50 py-1.5 px-3 rounded-xl absolute bottom-3 left-4 animate-pulse shadow-sm z-10 text-left">
                  <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full inline-block animate-bounce"></span>
                  <span>{Object.values(typingUsers).join(', ')} écrit un message...</span>
                </div>
              )}
            </div>

            {/* Input message form bottom bar (White background, styled) */}
            <div className="border-t border-slate-100 bg-white p-4 space-y-3">
              
              {/* Preset quick files attachments picker row (WhatsApp Attachment presets) */}
              <div className="flex flex-wrap items-center gap-2 text-left">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mr-1">Raccourcis documents :</span>
                {PRESET_ATTACHMENTS.map((file, i) => {
                   const isSelected = selectedAttachment?.name === file.name;
                   return (
                     <button
                       key={i}
                       type="button"
                       onClick={() => setSelectedAttachment(isSelected ? null : file)}
                       className={`text-[10px] px-2.5 py-1 rounded-full border cursor-pointer font-sans transition flex items-center gap-1 leading-none ${
                         isSelected
                           ? 'bg-emerald-50 text-[#075E54] border-emerald-200 font-bold'
                           : 'hover:bg-slate-50 text-slate-600 border-slate-200 bg-white'
                       }`}
                     >
                       <PlusCircle className="w-3 h-3 text-slate-400" />
                       {file.name.replace(/_Patient|_Grossiste|_TiersPayant/g, '')}
                     </button>
                   );
                })}
              </div>

              {/* Selection previews details */}
              {selectedAttachment && (
                <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl flex items-center justify-between gap-3 text-xs text-left">
                  <div className="flex items-center gap-2 text-emerald-950 font-medium">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Fichier prêt : <strong className="font-bold">{selectedAttachment.name}</strong> ({selectedAttachment.size})</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedAttachment(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Real Input field and ViewOnce activator */}
              {!isUserAdmin(currentUser) && activeDestination.type === 'group' ? (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-center gap-2 text-xs text-amber-800 font-sans font-bold shadow-3xs animate-fade-in w-full text-center">
                  <span>📢 Ce canal de groupe est en lecture seule pour les succursales. Adressez-vous directement à l'administration en discussion privée.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
                  
                  {/* View Once button toggle */}
                  <button
                    type="button"
                    onClick={() => setIsViewOnceMode(!isViewOnceMode)}
                    title={isViewOnceMode ? "Désactiver le message ou fichier unique éphémère" : "Activer comme message ou fichier unique (Vue unique)"}
                    className={`p-2.5 rounded-xl border flex items-center justify-center transition cursor-pointer shrink-0 ${
                      isViewOnceMode 
                        ? 'bg-amber-100 text-amber-600 border-amber-300 font-bold scale-105' 
                        : 'hover:bg-slate-50 text-slate-400 border-slate-200 bg-white'
                    }`}
                  >
                    <Eye className="w-4.5 h-4.5" />
                    <span className="text-[10px] font-mono ml-1 font-bold">①</span>
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder={
                        isViewOnceMode 
                          ? `Écrire un message ou joindre un fichier ÉPHÉMÈRE pour ${activeDestination.label}...`
                          : `Écrire un message pour ${activeDestination.label}...`
                      }
                      className="w-full pl-4 pr-11 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-sans focus:bg-white transition-all"
                    />
                    
                    {/* File Upload paperclip trigger */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Joindre un fichier de votre appareil (Max 1 Mo)"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-teal-600 transition cursor-pointer"
                    >
                      <Paperclip className="h-4.5 w-4.5" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!inputText.trim() && !selectedAttachment}
                    className="bg-[#128C7E] hover:bg-[#075E54] text-white font-mono text-[10px] font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Envoyer
                  </button>
                </form>
              )}
              
              {isViewOnceMode && (
                <p className="text-[10px] text-amber-600 font-medium italic text-left pl-1">
                  💡 Option message éphémère activée : Le contenu textuel ou multimédia sera caché et détruit dès la première lecture par le destinataire.
                </p>
              )}
            </div>

            {/* LIVE WEBCAM ACTIVE PANEL OVERLAY (WhatsApp calling dialog) */}
            {activeCall && activeCall.isOpen && (
              <div className="absolute inset-0 bg-[#075E54]/95 backdrop-blur-md z-40 flex flex-col justify-between p-6 text-white font-sans text-center">
                
                {/* Header layout */}
                <div className="space-y-1">
                  <p className="text-emerald-200 text-xs font-mono uppercase tracking-widest">
                    {activeCall.type === 'video' ? 'Appel Vidéo Chiffré • Optic Alizé' : 'Appel Audio Chiffré • Optic Alizé'}
                  </p>
                  <h3 className="text-lg font-bold mt-1">{activeDestination.label}</h3>
                  <p className="text-sm font-light">
                    {activeCall.status === 'connecting' && 'Connexion au périphérique...'}
                    {activeCall.status === 'connected' && `En cours • ${formatCallDuration(activeCall.duration)}`}
                    {activeCall.status === 'ended' && 'Appel raccroché'}
                    {activeCall.status === 'denied' && 'Accès caméra/micro non autorisé'}
                  </p>
                </div>

                {/* Webcam/Call avatar workspace container */}
                <div className="flex-1 flex items-center justify-center relative my-4">
                  
                  {/* Real Web Camera stream feed is displayed here if Video Call and permitted */}
                  {activeCall.type === 'video' && activeCall.status === 'connected' && !activeCall.camOff ? (
                    <div className="w-full h-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-black relative">
                      <video 
                        ref={callVideoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-3 left-3 bg-[#075E54] text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                        Votre Camera
                      </span>
                    </div>
                  ) : (
                    // Elegant Pulse Animated Calling Interface fallback
                    <div className="space-y-4">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-24 h-24 rounded-full bg-white/10 animate-ping"></span>
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold text-2xl relative shadow-xl">
                          {activeDestination.label.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      
                      {activeCall.status === 'denied' && (
                        <div className="bg-red-950/40 p-4 border border-red-500/20 max-w-xs rounded-xl text-xs space-y-1">
                          <p className="font-bold text-red-200">Accès matériel introuvable</p>
                          <p className="text-red-300">Aucune webcam/micro détectés. Mode simulé sécurisé actif sans capture réelle.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Controls actionbar bottom */}
                <div className="flex items-center justify-center gap-4 border-t border-white/10 pt-4">
                  
                  {/* Micro on/off */}
                  <button
                    onClick={toggleMute}
                    className={`p-3.5 rounded-full hover:bg-white/15 transition cursor-pointer ${
                      activeCall.micMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white'
                    }`}
                    title="Muet"
                  >
                    {activeCall.micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Camera Toggle (Only for Video Call) */}
                  {activeCall.type === 'video' && (
                    <button
                      onClick={toggleCamera}
                      className={`p-3.5 rounded-full hover:bg-white/15 transition cursor-pointer ${
                        activeCall.camOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white'
                      }`}
                      title="Caméra"
                    >
                      {activeCall.camOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>
                  )}

                  {/* RED Hang up option */}
                  <button
                    onClick={endCall}
                    className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition active:scale-95 cursor-pointer shadow-lg"
                    title="Raccrocher"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* REVER_POD BLUEPRINTS STATE VIEW - DART CODESNIPPETS */}
      {activeTab === 'blueprints' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 text-slate-200 space-y-6 text-left">
          <div className="space-y-1.5 border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold font-mono tracking-widest text-teal-400 uppercase flex items-center gap-2">
              <Code className="w-4.5 h-4.5" />
              Blueprints Optic Alizé Clean Architecture (Flutter + Riverpod)
            </h3>
            <p className="text-xs text-slate-400">
              Découvrez nos modèles de données immuables et le StateNotifierProvider Riverpod du client mobile Dart Flutter synchronisant les flux réactifs du réseau WebSocket.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-2 lg:col-span-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block px-1">Fichiers d'Architecture</span>
              {[
                { id: 'riverpod', label: 'chat_provider.dart', type: 'Riverpod State' },
                { id: 'entity', label: 'message_entity.dart', type: 'Domain Entity' },
                { id: 'service', label: 'websocket_service.dart', type: 'Infrastructure Service' },
                { id: 'express', label: 'ws_server_controller.ts', type: 'Node.js Express Controller' }
              ].map((snippet) => (
                <div key={snippet.id} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono text-white text-[11px] font-semibold">{snippet.label}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{snippet.type}</p>
                  </div>
                  <span className="text-[8px] font-mono uppercase bg-teal-950 text-teal-300 border border-teal-900 px-1.5 py-0.5 rounded">Dart</span>
                </div>
              ))}
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/60 text-xs font-mono max-h-[460px] overflow-y-auto custom-scrollbar">
                <span className="text-teal-400 text-[10px] block border-b border-teal-950 pb-2 mb-2">// lib/presentation/providers/chat_provider.dart (Riverpod StateNotifier)</span>
                <pre className="text-slate-350 leading-relaxed text-[11px] select-text">
{`import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/message_entity.dart';
import '../../data/services/websocket_service.dart';

/// Provider gérant la liste de messages synchronisée par WebSocket d'Optic Alizé
final chatProvider = StateNotifierProvider<ChatNotifier, List<MessageEntity>>((ref) {
  final wsService = ref.watch(webSocketServiceProvider);
  return ChatNotifier(wsService);
});

class ChatNotifier extends StateNotifier<List<MessageEntity>> {
  final WebSocketService _wsService;

  ChatNotifier(this._wsService) : super([]) {
    _initializeListener();
  }

  void _initializeListener() {
    _wsService.messageStream.listen((event) {
      if (event['type'] == 'message_received') {
        final messageMap = event['message'] as Map<String, dynamic>;
        final message = MessageEntity.fromJson(messageMap);
        
        // Empêcher les doublons d'événements grâce à l'idempotence
        if (!state.any((m) => m.id == message.id)) {
          state = [...state, message];
        }
      } else if (event['type'] == 'init') {
        final list = event['messages'] as List;
        state = list.map((m) => MessageEntity.fromJson(m)).toList();
      }
    });
  }

  void sendMessage(String content, {String? channelId, String? recipientId}) {
    final payload = {
      'type': 'message',
      'message': {
        'chatType': channelId != null ? 'group' : 'private',
        'channelId': channelId,
        'recipientId': recipientId,
        'content': content,
        'attachment': null
      }
    };
    _wsService.send(payload);
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONSOLE RAW COMMUNICATIONS */}
      {activeTab === 'broker_logs' && (
        <div className="flex flex-col bg-slate-950 border border-slate-850 rounded-2xl h-[560px] relative overflow-hidden shadow-2xl text-left">
          
          <div className="bg-slate-900/80 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs text-slate-300">Optic Alizé Communications Broker Logs (WebSocket Frames)</span>
            </div>
            <button
              onClick={() => {
                setRawLogs([`[${new Date().toLocaleTimeString()}] Console de traçabilité effacée.`]);
              }}
              className="text-slate-500 hover:text-slate-300 text-xs font-mono transition px-2 py-1 rounded bg-slate-950/40 border border-slate-850 cursor-pointer"
            >
              Effacer
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar text-[11px] font-mono text-slate-350">
            {rawLogs.length === 0 ? (
              <p className="text-slate-500 italic">En attente de communications WebSocket...</p>
            ) : (
              rawLogs.map((log, i) => (
                <div key={i} className="border-b border-slate-900 pb-1 flex gap-2">
                  <span className="text-emerald-500">▶</span>
                  <p className="leading-relaxed select-text">{log}</p>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-900/40 p-3 border-t border-slate-850 text-slate-500 text-[10px] uppercase font-mono">
            <span>Broker Server URL : {window.location.protocol === 'https:' ? 'wss' : 'ws'}://{window.location.host}/api/ws</span>
          </div>
        </div>
      )}

    </div>
  );
}
