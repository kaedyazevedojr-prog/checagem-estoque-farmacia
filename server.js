import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readEstoque, writeEstoque } from './lib/storage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.static(join(__dirname, 'public')));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/estoque — retorna o inventário salvo
app.get('/api/estoque', async (req, res) => {
  try {
    res.json(await readEstoque());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/estoque — salva novo inventário (chamado após upload de CSV)
app.post('/api/estoque', async (req, res) => {
  try {
    const { inventory } = req.body;
    if (!Array.isArray(inventory)) {
      return res.status(400).json({ error: 'inventory deve ser um array.' });
    }
    const data = { inventory, updatedAt: new Date().toISOString() };
    await writeEstoque(data);
    res.json({ ok: true, count: inventory.length, updatedAt: data.updatedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analisar — cruza fórmula com estoque via Claude
app.post('/api/analisar', async (req, res) => {
  try {
    const { manual, fileBase64, fileType } = req.body;

    if (!manual && !fileBase64) {
      return res.status(400).json({ error: 'Envie a fórmula via texto (manual) ou arquivo (fileBase64).' });
    }

    const { inventory } = await readEstoque();
    if (!inventory || inventory.length === 0) {
      return res.status(400).json({ error: 'Nenhum estoque carregado no servidor. Faça o upload do CSV primeiro.' });
    }

    const mp = inventory.filter(i => i.grupo === 'Matéria-prima');
    const invSummary = mp.map(i => `${i.nome} | qty:${i.qty}`).join('\n');

    const userContent = [];

    if (fileBase64) {
      if (fileType === 'application/pdf') {
        userContent.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 }
        });
      } else {
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: fileType, data: fileBase64 }
        });
      }
    }

    userContent.push({
      type: 'text',
      text: `Você é farmacêutico especialista em manipulação.

ESTOQUE DE MATÉRIA-PRIMA (nome | quantidade):
${invSummary}

${manual ? 'FÓRMULA (lista manual):\n' + manual : 'A fórmula está na imagem/PDF acima.'}

Instruções:
1. Extraia TODOS os ativos/ingredientes da fórmula.
2. Para cada ativo, verifique se existe no estoque com correspondência FLEXÍVEL:
   - Nomes em PT, EN, latim, abreviações (UC-II = colágeno tipo II, NMN = nicotinamida mononucleotídeo, CoQ10 = coenzima Q10, Natoquinase = Nattokinase, etc.)
   - Ignore maiúsculas, acentos
   - Match parcial válido (ex: "Vitamina D3" encontra "VITAMINA D3 10.000UI")
3. Para ativos FALTANDO ou zerados, sugira UMA substituição disponível no estoque com justificativa clínica resumida.

Responda SOMENTE em JSON válido, sem markdown:
{
  "formula_nome": "nome da fórmula ou null",
  "ativos": [
    {
      "nome": "nome na fórmula",
      "dose": "dose ou null",
      "status": "found|low|partial|missing",
      "estoque_nome": "nome exato no estoque ou null",
      "estoque_qty": number_or_null,
      "observacao": "explicação curta",
      "substituicao": {"nome": "substituto", "qty": number, "justificativa": "motivo"} | null
    }
  ]
}`
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: userContent }]
    });

    const raw = message.content.map(b => b.text || '').join('');
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json(result);
  } catch (err) {
    console.error('Erro em /api/analisar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default app;

// Só sobe o servidor quando executado diretamente (não quando importado pela Vercel)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`⚗  Farmácia Magistral rodando em http://localhost:${PORT}`);
  });
}
