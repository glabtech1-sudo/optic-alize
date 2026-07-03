import { Router, Response, Request } from 'express';
import { GoogleGenAI } from '@google/genai';

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

// Generate code structures via Gemini
router.post('/generate', async (req: Request, res: Response) => {
  const { prompt, currentContext } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Le champ "prompt" est requis.' });
  }

  try {
    const ai = getGeminiClient();

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
    console.error('Gemini Generation Error:', err);
    res.status(500).json({ error: err.message || 'Erreur interne lors de la génération avec l\'IA.' });
  }
});

export default router;
