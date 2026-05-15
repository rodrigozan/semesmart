import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

router.post('/ai-insights', isAuthenticated, async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'API_KEY não configurada.' });
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'O campo transactions é obrigatório e deve ser um array não vazio.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const simplified = transactions.map(({ description, amount, category }) => ({
      description,
      amount,
      category,
    }));

    const prompt = `Você é um consultor financeiro otimista e didático. Analise os seguintes gastos e gere exatamente 3 dicas curtas e práticas para ajudar a família a economizar ou gerenciar melhor o orçamento.

    Gastos recentes:
    ${JSON.stringify(simplified, null, 2)}
    `;

    const insightSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Um título curto e chamativo para a dica financeira.',
        },
        description: {
          type: Type.STRING,
          description: 'Uma descrição de uma frase, explicando a dica de forma simples e direta.',
        },
      },
      required: ['title', 'description'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: insightSchema },
      },
    });

    res.json(JSON.parse(response.text.trim()));
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
