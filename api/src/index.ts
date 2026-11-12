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
