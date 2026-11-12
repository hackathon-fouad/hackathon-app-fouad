import { createElement, Sparkles } from 'lucide';

// Le chat avec le copilote (issue #20). Le copilote répond d'un bloc, en 25 secondes
// environ : pas d'affichage mot par mot simulé, mais une bulle d'attente.

type Turn = { role: 'user' | 'assistant'; content: string };

// Une variante par rôle, pour que TypeScript sache quels champs existent
type Entry =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'pending' }
  | { role: 'error'; question: string };

// Le copilote ne lit que les derniers échanges : inutile d'envoyer toute la conversation
const HISTORY_SENT = 12;

const main = document.querySelector<HTMLElement>('#main')!;
const content = document.querySelector<HTMLElement>('#content')!;
const log = document.querySelector<HTMLOListElement>('#messages')!;
const form = document.querySelector('form')!;
const textarea = document.querySelector<HTMLTextAreaElement>('#question')!;
const send = document.querySelector<HTMLButtonElement>('#send')!;
const newChat = document.querySelector<HTMLButtonElement>('#new-chat')!;

let entries: Entry[] = [];
// Les seuls échanges réussis : c'est l'historique transmis au copilote
let turns: Turn[] = [];
let busy = false;

function setBusy(value: boolean) {
  busy = value;
  textarea.disabled = value;
  send.disabled = value;
  newChat.disabled = value;
  log.setAttribute('aria-busy', String(value));
}

function setMode(mode: 'home' | 'chat') {
  main.dataset.mode = mode;
}

function assistantRow(bubble: HTMLElement): HTMLLIElement {
  const row = document.createElement('li');
  row.className = 'flex max-w-3xl items-start gap-3 self-start';
  const avatar = document.createElement('span');
  avatar.className =
    'flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary';
  avatar.setAttribute('aria-hidden', 'true');
  const icon = createElement(Sparkles);
  icon.setAttribute('class', 'size-4');
  icon.setAttribute('stroke-width', '1.5');
  avatar.append(icon);
  row.append(avatar, bubble);
  return row;
}

function renderEntry(entry: Entry): HTMLLIElement {
  if (entry.role === 'user') {
    const row = document.createElement('li');
    row.className =
      'max-w-2xl self-end rounded-card bg-primary px-4 py-3 text-sm whitespace-pre-line text-on-primary';
    row.textContent = entry.content;
    return row;
  }

  const bubble = document.createElement('div');

  if (entry.role === 'assistant') {
    bubble.className =
      'rounded-card bg-panel px-4 py-3 text-sm whitespace-pre-line';
    bubble.textContent = entry.content;
    return assistantRow(bubble);
  }

  if (entry.role === 'pending') {
    bubble.className =
      'flex items-center gap-3 rounded-card bg-panel px-4 py-3 text-sm text-muted';
    const spinner = document.createElement('span');
    spinner.className =
      'size-4 animate-spin rounded-full border-2 border-primary border-t-transparent';
    spinner.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'animate-pulse';
    label.textContent = "L'IA réfléchit…";
    bubble.append(spinner, label);
    return assistantRow(bubble);
  }

  bubble.className =
    'flex flex-wrap items-center gap-3 rounded-card border border-primary bg-surface px-4 py-3 text-sm';
  const message = document.createElement('span');
  message.textContent = "Le copilote n'a pas pu répondre.";
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className =
    'rounded-control font-semibold text-primary underline hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none';
  retry.textContent = 'Réessayer';
  const question = entry.question;
  retry.addEventListener('click', () => {
    if (busy) return;
    // Retire cette erreur et la question juste avant, puis renvoie la même question
    const index = entries.indexOf(entry);
    if (index > 0) entries.splice(index - 1, 2);
    void ask(question);
  });
  bubble.append(message, retry);
  return assistantRow(bubble);
}

function render() {
  log.replaceChildren(...entries.map(renderEntry));
  content.scrollTo({ top: content.scrollHeight, behavior: 'smooth' });
}

async function ask(question: string) {
  if (busy) return;
  setMode('chat');
  setBusy(true);
  entries.push({ role: 'user', content: question }, { role: 'pending' });
  render();

  try {
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history: turns.slice(-HISTORY_SENT) }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { answer } = (await response.json()) as { answer: string };
    entries[entries.length - 1] = { role: 'assistant', content: answer };
    turns.push(
      { role: 'user', content: question },
      { role: 'assistant', content: answer },
    );
  } catch {
    entries[entries.length - 1] = { role: 'error', question };
  } finally {
    // Toujours déverrouiller, même après une erreur
    setBusy(false);
    render();
    textarea.focus();
  }
}

function reset() {
  entries = [];
  turns = [];
  log.replaceChildren();
  setMode('home');
  form.reset();
  textarea.focus();
}

export function initChat() {
  // Entrée envoie, Maj + Entrée passe à la ligne
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = textarea.value.trim();
    if (!question || busy) return;
    form.reset();
    void ask(question);
  });

  newChat.addEventListener('click', reset);
}
