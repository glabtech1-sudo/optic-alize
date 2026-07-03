import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { dbGetHRCollaborators } from '../../../db';
import { authenticateToken, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';

const router = Router();

// Lazy-loader helper for Gemini API
let aiClientInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClientInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('Le service d\'IA n\'est pas encore configuré. Veuillez renseigner votre clé dans l\'onglet Secrets de Google AI Studio.');
    }
    aiClientInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiClientInstance;
}

// Helpers for biometric face identification
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

// HR Collaborators List
router.get('/hr', authenticateToken as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const collaborators = await dbGetHRCollaborators(companyId);
    res.json({
      companyId,
      collaborators
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Biometric facial presence identification via Gemini-3.5-flash
router.post('/presence/identify', async (req, res) => {
  const { webcamImage, livenessChallengeImage, candidates } = req.body;

  if (!webcamImage) {
    return res.status(400).json({ error: 'L\'image de la webcam est requise.' });
  }

  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: 'La liste des collaborateurs candidats est requise.' });
  }

  try {
    const ai = getGeminiClient();
    
    const parsedWebcam = parseDataUrl(webcamImage);
    if (!parsedWebcam) {
      return res.status(400).json({ error: 'Format d\'image webcam invalide.' });
    }

    const parsedChallenge = livenessChallengeImage ? parseDataUrl(livenessChallengeImage) : null;

    const prompt = `
    Tu es un système de reconnaissance faciale biométrique de HAUTE SÉCURITÉ d'Optic Alizé.
    Ton rôle est de faire deux choses :
    1. ANALYSE ANTI-SPOOFING MULTI-COUCHES : Détecter et contrer toute tentative d'usurpation d'identité ou d'attaque par rejeu (par exemple, présenter une photo imprimée sur papier, afficher l'image d'un employé sur un smartphone/tablette, ou rediffuser une vidéo).
    2. RECONNAISSANCE BIOMÉTRIQUE : Comparer l'image capturée avec les photos de référence des candidats enregistrés dans le roster RH.

    SÉCURITÉ MAXIMUM - PROTOCOLE ZÉRO FAUX POSITIF :
    - S'il y a le moindre indice de spoofing (contours de papier froissés, reflets d'écran, trame de pixels LCD/OLED, moirage, cadrage anormal, absence totale de micro-mouvement d'expression faciale), tu DOIS refuser la connexion (matchedId: "unknown", score: 0).
    - Si deux images de webcam (IMAGE CIBLE PRINCIPALE et IMAGE DÉFI DE VIVACITÉ) te sont fournies :
      a) Elles doivent correspondre à la même personne.
      b) Elles doivent impérativement présenter un changement d'expression naturel et subtil (comme cligner des yeux, sourire ou tourner légèrement la tête) prouvant que le flux est vivant et dynamique.
      c) Si les deux images sont rigoureusement identiques au pixel près, cela indique une tentative de triche avec une photo statique téléchargée. Refuse immédiatement !

    Analyse faciale minutieuse :
    - Compare la structure osseuse, la forme des yeux, la forme du nez, les lèvres, les sourcils, l'espacement oculaire, la pilosité faciale (barbe/moustache) et les contours généraux.
    - Ne te base pas sur les vêtements ni sur l'arrière-plan.
    - Si le candidat a été supprimé ou est inconnu, ne l'associe pas à une personne ressemblante.

    Tu reçois :
    1. IMAGE CIBLE PRINCIPALE (Image webcam initiale).
    2. IMAGE DÉFI DE VIVACITÉ (Optionnelle - Image capturée pendant le défi de sourire ou de clignement).
    3. Liste des photos de référence de chaque collaborateur candidat, précédée de son identification sous le format "=== CANDIDAT : ID = {id}, Nom = {name} ===".

    Renvoie obligatoirement un objet JSON STRICTEMENT sous ce format :
    {
      "matchedId": "ID_DU_COLLABORATEUR_SÉLECTIONNÉ" ou "unknown",
      "score": un nombre entier entre 0 et 100 représentant la confiance de la correspondance (ne doit être >= 95 que s'il y a certitude absolue),
      "reason": "Une explication détaillée en français justifiant la décision (ex. confirmation de vivacité neuromusculaire, détection de reflets LCD/OLED suspect, ou absence de correspondance biométrique valide)."
    }
    `;

    const parts: any[] = [
      { text: prompt },
      { text: "=== IMAGE CIBLE PRINCIPALE ===" },
      {
        inlineData: {
          mimeType: parsedWebcam.mimeType,
          data: parsedWebcam.data
        }
      }
    ];

    if (parsedChallenge) {
      parts.push({ text: "=== IMAGE DÉFI DE VIVACITÉ ===" });
      parts.push({
        inlineData: {
          mimeType: parsedChallenge.mimeType,
          data: parsedChallenge.data
        }
      });
    }

    // Load candidates references asynchronously
    for (const cand of candidates) {
      if (cand.logo) {
        let base64Img: { mimeType: string; data: string } | null = null;
        if (cand.logo.startsWith('data:')) {
          base64Img = parseDataUrl(cand.logo);
        } else {
          base64Img = await fetchImageAsBase64(cand.logo);
        }

        if (base64Img) {
          parts.push({ text: `=== CANDIDAT : ID = ${cand.id}, Nom = ${cand.name} ===` });
          parts.push({
            inlineData: {
              mimeType: base64Img.mimeType,
              data: base64Img.data
            }
          });
        }
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'Tu es le moteur biométrique exclusif d\'Optic Alizé. Tu réponds exclusivement sous forme de JSON valide sans aucune fioriture ni bloc markdown.',
      },
    });

    const responseText = response.text || '{}';
    const parsedJson = JSON.parse(responseText);
    res.json(parsedJson);

  } catch (err: any) {
    console.error('Biometric Identification Error:', err);
    res.status(500).json({ error: err.message || 'Erreur interne de reconnaissance faciale.' });
  }
});

export default router;
