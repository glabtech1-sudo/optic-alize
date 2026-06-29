import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

// Initialiser le client Gemini en respectant STRICTEMENT les consignes du skill
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. API - Endpoint de santé
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. API - Génération d'architecture G-LAB OPTIC par IA (Gemini-3.5-flash)
  app.post('/api/generate', async (req, res) => {
    const { prompt, currentContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Le champ "prompt" est requis.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Le service d\'IA n\'est pas encore configuré. Veuillez renseigner votre clé dans l\'onglet Secrets de Google AI Studio.',
      });
    }

    try {
      const promptInstruction = `
      Agis comme l'architecte logiciel principal de Optic Alizé.
      L'utilisateur demande d'étendre ou d'ajouter une fonctionnalité dans l'ERP SaaS optique sous la forme de : "${prompt}".
      
      Génère STRICTEMENT les fichiers de code Clean Architecture correspondants.
      Tu dois renvoyer exactement de 3 à 5 fichiers structurés, chacun ayant un nom, un chemin correct, une description, un langage, et le code complet.
      
      Formate la réponse en JSON valide respectant cette structure exacte :
      {
        "files": [
          {
            "name": "nom_du_fichier.dart",
            "path": "chemin/vers/nom_du_fichier.dart",
            "language": "dart",
            "module": "Nom du module ou sous-module",
            "layer": "domain" ou "data" ou "presentation" ou "backend" ou "database",
            "type": "entity" ou "model" ou "repository" ou "provider" ou "route" ou "middleware" ou "controller" ou "service" ou "schema",
            "description": "Explication brève du rôle de ce fichier dans l'ERP.",
            "content": "CODE COMPLET SANS COUPE"
          }
        ]
      }
      
      Le code généré doit être professionnel, rédigé en français pour les commentaires/descriptions et en anglais/français pour le code, complet, et correspondre à l'architecture de Optic Alizé (Flutter Web + Riverpod + Clean Arch, Backend Express + Postgres/Supabase).
      Génère du VRAI code, pas de mocks tronqués.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptInstruction,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'Tu es l\'architecte logiciel exclusif de l\'ERP SaaS Optic Alizé. Tu ne génères que du JSON valide respectant scrupuleusement le format de fichier demandé.',
        },
      });

      const responseText = response.text || '{}';
      try {
        const parsedJson = JSON.parse(responseText);
        res.json(parsedJson);
      } catch (parseError) {
        console.error('Erreur de parsing de la réponse de Gemini :', responseText);
        res.status(500).json({
          error: 'Gemini a produit un format JSON corrompu. Veuillez réessayer.',
          raw: responseText,
        });
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'appel de Gemini API :', err);
      res.status(500).json({ error: err.message || 'Erreur interne lors de la génération avec l\'IA.' });
    }
  });

  // Helpers pour la reconnaissance faciale biométrique
  const parseDataUrl = (dataUrl: string) => {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  };

  const fetchImageAsBase64 = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      return {
        mimeType: contentType,
        data: buffer.toString('base64')
      };
    } catch (error) {
      console.error(`Error fetching candidate image from ${url}:`, error);
      return null;
    }
  };

  // 2.5 API - Reconnaissance biométrique faciale via Gemini
  app.post('/api/presence/identify', async (req, res) => {
    const { webcamImage, candidates } = req.body;

    if (!webcamImage) {
      return res.status(400).json({ error: 'L\'image de la webcam est requise.' });
    }

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'La liste des collaborateurs candidats est requise.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Le service d\'IA n\'est pas encore configuré. Veuillez renseigner votre clé dans l\'onglet Secrets de Google AI Studio.',
      });
    }

    try {
      const parsedWebcam = parseDataUrl(webcamImage);
      if (!parsedWebcam) {
        return res.status(400).json({ error: 'Format d\'image webcam invalide.' });
      }

      const prompt = `
      Tu es un système de reconnaissance faciale biométrique de HAUTE SÉCURITÉ d'Optic Alizé.
      Ton rôle est d'analyser l'image de la webcam (IMAGE CIBLE) et de déterminer avec une certitude absolue si cette personne correspond à l'un des candidats de la base (PHOTOS DE RÉFÉRENCE).

      SÉCURITÉ MAXIMUM - PROTOCOLE ZÉRO FAUX POSITIF :
      1. FAUX POSITIF INTERDIT : Il est mille fois préférable de refuser un employé légitime (retourner "unknown") que d'attribuer par erreur l'identité d'un employé à un autre.
      2. Si la personne sur la webcam (IMAGE CIBLE) n'est pas EXACTEMENT, CLAIREMENT et INDISCUTABLEMENT la même personne physique qu'un des candidats, tu DOIS retourner "unknown" pour matchedId, avec un score de 0.
      3. Attention aux utilisateurs supprimés ou inconnus : si l'employé devant la webcam n'est plus présent dans la liste de candidats ci-dessous (par exemple s'il a été supprimé des RH), tu ne dois JAMAIS essayer de lui attribuer le profil d'un autre employé qui lui ressemble vaguement (par genre, couleur de peau ou coiffure). Si son identité précise n'est pas représentée dans les candidats, retourne impérativement {"matchedId": "unknown", "score": 0, "reason": "Visage non enregistré ou utilisateur supprimé de la base RH."}.
      4. Analyse faciale minutieuse :
         - Compare rigoureusement la structure osseuse, la forme des yeux, la forme du nez, les lèvres, les sourcils, l'espacement oculaire, la pilosité faciale (barbe/moustache) et les contours généraux.
         - Si les cheveux ou d'autres traits accessoires diffèrent, sois très prudent. Si l'ossature faciale ou les traits clés ne sont pas identiques, rejette la correspondance.
         - Ne te base pas sur les vêtements ni sur l'arrière-plan.
      5. En cas de doute, même infime, tu DOIS retourner "unknown".

      Tu reçois :
      1. L'image de la webcam (Image Cible).
      2. Une liste de photos de référence de chaque collaborateur candidat, précédée de son identification sous le format "=== CANDIDAT : ID = {id}, Nom = {name} ===".

      Renvoie obligatoirement un objet JSON STRICTEMENT sous ce format :
      {
        "matchedId": "ID_DU_COLLABORATEUR_SÉLECTIONNÉ" ou "unknown",
        "score": un nombre entier entre 0 et 100 représentant la confiance de la correspondance (ne doit être >= 95 que s'il y a certitude absolue),
        "reason": "Une explication détaillée en français justifiant pourquoi cette personne correspond de manière indiscutable, ou pourquoi aucun profil de la base ne correspond exactement (visage inconnu/intrus/utilisateur supprimé/ressemblance insuffisante)."
      }
      `;

      const parts: any[] = [
        { text: prompt },
        { text: "=== IMAGE CIBLE (WEBCAM) ===" },
        {
          inlineData: {
            mimeType: parsedWebcam.mimeType,
            data: parsedWebcam.data
          }
        }
      ];

      // Récupérer et encoder les images des candidats
      for (const cand of candidates) {
        let partData = null;
        if (cand.photo) {
          if (cand.photo.startsWith('data:')) {
            partData = parseDataUrl(cand.photo);
          } else if (cand.photo.startsWith('http')) {
            partData = await fetchImageAsBase64(cand.photo);
          }
        }

        if (partData) {
          parts.push({ text: `=== CANDIDAT : ID = ${cand.id}, Nom = ${cand.firstName} ${cand.lastName} ===` });
          parts.push({
            inlineData: {
              mimeType: partData.mimeType,
              data: partData.data
            }
          });
        }
      }

      parts.push({ text: "Effectue la comparaison maintenant et retourne le JSON." });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'Tu es un expert en biométrie faciale et sécurité militaire de haut niveau. Tu n\'autorises de correspondance que si l\'identité est indiscutable. Tu renvoies exclusivement un objet JSON valide.',
          temperature: 0.0,
        },
      });

      const responseText = response.text || '{}';
      try {
        const parsedJson = JSON.parse(responseText);
        res.json(parsedJson);
      } catch (parseError) {
        console.error('Erreur de parsing de la réponse de Gemini :', responseText);
        res.status(500).json({
          error: 'L\'IA a renvoyé un format corrompu. Veuillez réessayer.',
          raw: responseText
        });
      }

    } catch (err: any) {
      console.error('Erreur lors de la reconnaissance faciale avec Gemini :', err);
      res.status(500).json({ error: err.message || 'Erreur interne lors de la reconnaissance faciale.' });
    }
  });

  // 3. Configuration du middleware Vite ou distribution Statique en production
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

  // In-memory data store for messages, announcements & clients
  const activeClients = new Map<string, ClientInfo>();
  
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
  });

  // Attach real WebSocket Server (wss) to same port 3000
  const wss = new WebSocketServer({ server });

  // Function to broadcast event payload to all or specific registered clients
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

            // Send initial ERP state to the newly connected socket
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

            // Notify everyone database-wide that a new boutique opticien has logged in
            broadcast({
              type: 'user_joined',
              user: {
                id: data.user.id,
                username: data.user.username,
                role: data.user.role,
                shop: data.user.shop
              }
            }, clientUserId!);

            // Trigger a push notification event
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
              attachment: data.message.attachment || null, // pieces jointes support
              createdAt: new Date().toISOString()
            };

            serverMessages.push(newMsg);

            // Broadcast message back to ALL clients to allow real-time reactivity in preview
            broadcast({
              type: 'message_received',
              message: newMsg
            });

            // Send generic live notification
            broadcast({
              type: 'notification',
              notification: {
                id: 'notif_msg_' + Date.now(),
                title: newMsg.chatType === 'private' ? 'Message Privé' : `Canal #${newMsg.channelId}`,
                message: `${newMsg.senderName} : ${newMsg.content.substring(0, 40)}${newMsg.content.length > 40 ? '...' : ''}`,
                createdAt: new Date().toISOString()
              }
            }, client.id); // Exclude sender from receipt of their own notification Toast
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

            // Broadcast announcement to everyone
            broadcast({
              type: 'announcement_received',
              announcement: newAnn
            });

            // Trigger severe notification
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
            // Broadcast typing state to other clients
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

          // Broadcast user left event
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
