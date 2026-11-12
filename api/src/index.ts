import express from 'express';
import pg from 'pg';

// En dev, la configuration vient de api/.env ; en production, de l'hébergeur
try {
  process.loadEnvFile();
} catch {
  // Pas de .env : on garde l'environnement tel quel
}

const { DATABASE_URL, COPILOT_URL } = process.env;
const PORT = Number(process.env.PORT ?? 3000);

const db = new pg.Pool({ connectionString: DATABASE_URL });
const app = express();
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const { rows } = await db.query('SELECT version()');
  res.json({ status: 'ok', db: rows[0].version });
});

app.get('/api/questions', async (_req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM questions ORDER BY id DESC LIMIT 10',
  );
  res.json(rows);
});

// Un échange précédent de la conversation, au format attendu par le copilote
type Turn = { role: 'user' | 'assistant'; content: string };

const MAX_HISTORY = 20;

// Valide l'historique envoyé par le front : absent, ou une liste courte d'échanges
// bien formés. Renvoie null si le format est invalide.
function parseHistory(value: unknown): Turn[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY) return null;
  const turns: Turn[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string' || !content.trim()) return null;
    turns.push({ role, content: content.trim() });
  }
  return turns;
}

app.post('/api/questions', async (req, res) => {
  const question = String(req.body?.question ?? '').trim();
  if (!question) {
    res.status(400).json({ error: 'Question manquante' });
    return;
  }
  const history = parseHistory(req.body?.history);
  if (!history) {
    res.status(400).json({ error: 'Historique invalide' });
    return;
  }
  const answer = await ask(question, history);
  const { rows } = await db.query(
    'INSERT INTO questions (question, answer) VALUES ($1, $2) RETURNING *',
    [question, answer],
  );
  res.status(201).json(rows[0]);
});

// Prospection (issue #29) : le copilote classe les prospects par un score calculé en
// Python, sans IA. On relaie ses réponses, avec score et rang en nombres.

class CopilotError extends Error {
  constructor(readonly status: number) {
    super(`Copilote : ${status}`);
  }
}

async function copilot<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${COPILOT_URL}${path}`, init);
  } catch {
    throw new CopilotError(502);
  }
  if (!response.ok) throw new CopilotError(response.status);
  return (await response.json()) as T;
}

function sendCopilotError(res: express.Response, error: unknown, notFound: string) {
  if (error instanceof CopilotError && error.status === 404) {
    res.status(404).json({ error: notFound });
    return;
  }
  res.status(502).json({ error: 'Copilote indisponible' });
}

type ProspectSummary = {
  id: string;
  nom: string;
  ville: string;
  score: string | number;
  rang: string | number;
  accroche: string;
};

const toNumber = (value: string | number | null) =>
  value === null ? null : Number(value);

app.post('/api/prospects/search', async (req, res) => {
  const query = String(req.body?.query ?? '').trim();
  const limit = req.body?.limit ?? 10;
  if (query.length > 500) {
    res.status(400).json({ error: 'Recherche trop longue' });
    return;
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    res.status(400).json({ error: 'Limite invalide' });
    return;
  }
  try {
    const data = await copilot<{ total: number; prospects: ProspectSummary[] }>(
      '/prospects/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit }),
      },
    );
    res.json({
      query,
      total: data.total,
      prospects: data.prospects.map((p) => ({
        ...p,
        score: toNumber(p.score),
        rang: toNumber(p.rang),
      })),
    });
  } catch (error) {
    sendCopilotError(res, error, 'Recherche introuvable');
  }
});

// Identifiant du copilote : nom sans accents, en minuscules, avec des tirets
const PROSPECT_ID = /^[a-z0-9-]{1,100}$/;

app.get('/api/prospects/:id', async (req, res) => {
  const { id } = req.params;
  if (!PROSPECT_ID.test(id)) {
    res.status(400).json({ error: 'Identifiant invalide' });
    return;
  }
  try {
    const prospect = await copilot<Record<string, unknown>>(
      `/prospects/${encodeURIComponent(id)}`,
    );
    res.json({
      ...prospect,
      score: toNumber(prospect.score as string | null),
      rang: toNumber(prospect.rang as string | null),
    });
  } catch (error) {
    sendCopilotError(res, error, 'Prospect introuvable');
  }
});

// Le copilote de l'équipe data répond à partir de ses documents (ADR 0007).
// Appel de serveur à serveur : le navigateur ne le voit pas, pas de CORS.
// L'historique lui permet de comprendre « Et pour Solenza ? » après une autre question.
async function ask(question: string, history: Turn[]): Promise<string> {
  const response = await fetch(`${COPILOT_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  });
  if (!response.ok) {
    throw new Error(`Copilote : ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { answer: string };
  return data.answer;
}

// Sans adresse, Node écoute sur toutes les interfaces : joignable hors du conteneur
app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
