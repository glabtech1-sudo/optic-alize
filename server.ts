import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './src/lib/server/router';
import { z } from 'zod';
import { runDatabaseMigration } from './src/lib/server/modules/database/dbMigration';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  // 1. Helmet Security Headers (iframe-friendly configuration with CSP)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "referrer"],
        connectSrc: ["'self'", "wss:", "ws:", "https:"],
        frameAncestors: ["'self'", "https://*.google.com", "https://*.run.app", "https://ai.studio", "https://*.studio"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  }));

  // 2. CORS Setup
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // 3. API Rate Limiting (15 mins window, max 500 requests per IP)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, 
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    message: { error: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer après 15 minutes.' }
  });
  app.use('/api/', apiLimiter);

  app.use(express.json());

  // 4. XSS Sanitization Middleware
  function sanitizeInput(obj: any): any {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, 'no-javascript:')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '');
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitizeInput(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        cleaned[key] = sanitizeInput(obj[key]);
      }
      return cleaned;
    }
    return obj;
  }

  app.use((req, res, next) => {
    if (req.body) req.body = sanitizeInput(req.body);
    if (req.query) req.query = sanitizeInput(req.query);
    next();
  });

  // 5. CSRF Protection for stateful actions (Proxy and Cloud Run Sandbox aware)
  app.use((req, res, next) => {
    const hasCookie = req.headers.cookie;
    if (hasCookie && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.headers.origin || req.headers.referer;
      const host = req.headers.host;
      if (origin && host) {
        const isCloudRun = origin.includes('.run.app') || origin.includes('google.com');
        const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isHostMatched = origin.includes(host);
        
        if (!isCloudRun && !isLocal && !isHostMatched) {
          return res.status(403).json({ error: 'CSRF security block: Origin mismatch.' });
        }
      }
    }
    next();
  });

  // 6. Mount Enterprise Modular Router
  app.use('/api', apiRouter);

  // Centralized Error Handling Middleware for API Routes
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API ERROR]', err);

    if (err instanceof z.ZodError || err.name === 'ZodError') {
      return res.status(400).json({
        error: 'Échec de validation des données',
        details: err.errors ? err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`) : [err.message]
      });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Une erreur interne du serveur est survenue.';

    res.status(status).json({
      error: message,
      ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
    });
  });

  // 7. Configuration du middleware Vite ou distribution Statique en production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  interface ClientInfo {
    id: string;
    username: string;
    role: string;
    shop: string;
    socket: WebSocket;
  }

  const activeClients = new Map<string, ClientInfo>();
  const activeLocks = new Map<string, { userId: string, username: string, documentId: string, lockedAt: string }>();
  
  const serverMessages = [
    {
      id: 'msg_1',
      chatType: 'group',
      channelId: 'general',
      senderId: 'staff_1',
      senderName: 'Sophie (Opticienne-Conseil)',
      senderShop: 'Paris Opéra',
      content: 'Bonjour à tous ! Est-ce que quelqu\'un a reçu la nouvelle livraison Ray-Ban de la collection été ? On a un patient qui attend sa monture.',
      createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
    },
    {
      id: 'msg_2',
      chatType: 'group',
      channelId: 'general',
      senderId: 'staff_2',
      senderName: 'Jean-Marc (Montage Labo)',
      senderShop: 'Nice Centre',
      content: 'Oui Sophie ! Reçue ce matin à Nice. Le code barre SKU est déjà injecté en base de données, tu peux faire la commande à l\'atelier.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'msg_3',
      chatType: 'group',
      channelId: 'atelier',
      senderId: 'staff_2',
      senderName: 'Jean-Marc (Montage Labo)',
      senderShop: 'Nice Centre',
      content: 'Alerte meuleuse : J\'ai nettoyé le filtre de la meuleuse Essilor Kappa. Consommables OK.',
      createdAt: new Date(Date.now() - 3650000).toISOString()
    }
  ];

  const serverAnnouncements = [
    {
      id: 'ann_1',
      title: 'Campagne Tiers-Payant Mutuelles 2026',
      content: 'Le renouvellement d\'accord tiers payant avec le réseau de mutuelles KALIXIA est effectif. Pensez à scanner le QR code de carte de mutuelle.',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      senderName: 'Direction SaaS Optic Alizé'
    }
  ];

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Optic Alizé dev Server] Running on http://localhost:${PORT}`);
    // Run database auto-migrations to ensure tables exist in real-time
    runDatabaseMigration().catch((e) => console.error('[SERVER] Migration failed:', e));
  });

  const wss = new WebSocketServer({ server });

  const broadcast = (payload: any, excludeClientId?: string) => {
    const rawPayload = JSON.stringify(payload);
    activeClients.forEach((client) => {
      if (client.id !== excludeClientId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(rawPayload);
      }
    });
  };

  wss.on('connection', (socket: WebSocket) => {
    let clientUserId: string | null = null;
    console.log('[WebSocket Server] Nouvelle connexion entrante.');

    socket.on('message', (messageBuffer) => {
      try {
        const rawMessage = messageBuffer.toString();
        const data = JSON.parse(rawMessage);

        switch (data.type) {
          case 'register': {
            clientUserId = data.user.id;
            activeClients.set(clientUserId!, {
              id: data.user.id,
              username: data.user.username,
              role: data.user.role,
              shop: data.user.shop,
              socket: socket
            });

            console.log(`[WebSocket Server] Utilisateur enregistré : ${data.user.username} (${data.user.role})`);

            socket.send(JSON.stringify({
              type: 'init',
              messages: serverMessages,
              announcements: serverAnnouncements,
              onlineUsers: Array.from(activeClients.values()).map(c => ({
                id: c.id,
                username: c.username,
                role: c.role,
                shop: c.shop
              }))
            }));

            broadcast({
              type: 'user_joined',
              user: {
                id: data.user.id,
                username: data.user.username,
                role: data.user.role,
                shop: data.user.shop
              }
            }, clientUserId!);

            broadcast({
              type: 'notification',
              notification: {
                id: 'notif_join_' + Date.now(),
                title: 'Connexion Personnel',
                message: `${data.user.username} (${data.user.shop}) s'est connecté au canal temps réel d'Optic Alizé.`,
                createdAt: new Date().toISOString()
              }
            });
            break;
          }

          case 'message': {
            if (!clientUserId) return;
            const client = activeClients.get(clientUserId);
            if (!client) return;

            const newMsg = {
              id: 'msg_' + Date.now(),
              chatType: data.message.chatType || 'group',
              channelId: data.message.channelId,
              recipientId: data.message.recipientId,
              senderId: client.id,
              senderName: client.username,
              senderShop: client.shop,
              content: data.message.content,
              attachment: data.message.attachment || null,
              createdAt: new Date().toISOString()
            };

            serverMessages.push(newMsg);

            broadcast({
              type: 'message_received',
              message: newMsg
            });

            broadcast({
              type: 'notification',
              notification: {
                id: 'notif_msg_' + Date.now(),
                title: newMsg.chatType === 'private' ? 'Message Privé' : `Canal #${newMsg.channelId}`,
                message: `${newMsg.senderName} : ${newMsg.content.substring(0, 40)}${newMsg.content.length > 40 ? '...' : ''}`,
                createdAt: new Date().toISOString()
              }
            }, client.id);
            break;
          }

          case 'announcement': {
            if (!clientUserId) return;
            const client = activeClients.get(clientUserId);
            if (!client) return;

            const newAnn = {
              id: 'ann_' + Date.now(),
              title: data.announcement.title,
              content: data.announcement.content,
              createdAt: new Date().toISOString(),
              senderName: client.username
            };

            serverAnnouncements.push(newAnn);

            broadcast({
              type: 'announcement_received',
              announcement: newAnn
            });

            broadcast({
              type: 'notification',
              notification: {
                id: 'notif_ann_' + Date.now(),
                title: '🚨 ANNONCE GÉNÉRALE',
                message: `${newAnn.title} : ${newAnn.content.substring(0, 60)}...`,
                createdAt: new Date().toISOString()
              }
            });
            break;
          }

          case 'typing': {
            if (!clientUserId) return;
            broadcast({
              type: 'typing_broadcast',
              typingState: {
                isTyping: data.typingState.isTyping,
                senderId: clientUserId,
                senderName: data.typingState.senderName,
                recipientId: data.typingState.recipientId,
                channelId: data.typingState.channelId
              }
            }, clientUserId);
            break;
          }

          case 'lock_acquire': {
            const { documentId, username } = data;
            if (!clientUserId || !documentId) return;

            const existingLock = activeLocks.get(documentId);
            if (existingLock && existingLock.userId !== clientUserId) {
              socket.send(JSON.stringify({
                type: 'lock_denied',
                documentId,
                holderName: existingLock.username,
                lockedAt: existingLock.lockedAt
              }));
            } else {
              const lockDetails = {
                userId: clientUserId,
                username: username || 'Un autre utilisateur',
                documentId,
                lockedAt: new Date().toISOString()
              };
              activeLocks.set(documentId, lockDetails);
              
              socket.send(JSON.stringify({
                type: 'lock_granted',
                documentId
              }));

              broadcast({
                type: 'document_locked',
                documentId,
                holderName: lockDetails.username,
                holderId: clientUserId
              }, clientUserId);
            }
            break;
          }

          case 'lock_release': {
            const { documentId } = data;
            if (!clientUserId || !documentId) return;

            const existingLock = activeLocks.get(documentId);
            if (existingLock && existingLock.userId === clientUserId) {
              activeLocks.delete(documentId);
              
              socket.send(JSON.stringify({
                type: 'lock_released_confirm',
                documentId
              }));

              broadcast({
                type: 'document_unlocked',
                documentId
              }, clientUserId);
            }
            break;
          }

          case 'sync_change': {
            const { documentId, fieldName, fieldValue, username } = data;
            if (!clientUserId || !documentId) return;

            broadcast({
              type: 'live_field_update',
              documentId,
              fieldName,
              fieldValue,
              updaterName: username || 'Collaborateur',
              updaterId: clientUserId
            }, clientUserId);
            break;
          }

          default:
            console.log(`[WebSocket Server] Type d'événement inconnu : ${data.type}`);
        }
      } catch (err) {
        console.error('[WebSocket Server] Erreur de parsing du message :', err);
      }
    });

    socket.on('close', () => {
      if (clientUserId) {
        const client = activeClients.get(clientUserId);
        if (client) {
          console.log(`[WebSocket] Déconnexion : ${client.username}`);
          activeClients.delete(clientUserId);

          activeLocks.forEach((lock, docId) => {
            if (lock.userId === clientUserId) {
              activeLocks.delete(docId);
              broadcast({
                type: 'document_unlocked',
                documentId: docId
              });
            }
          });

          broadcast({
            type: 'user_left',
            userId: clientUserId
          });
        }
      }
    });
  });
}

startServer();
