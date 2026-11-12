import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import {
  BookOpen,
  createIcons,
  Globe,
  House,
  Lightbulb,
  MessagesSquare,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  ScanEye,
  Search,
  SendHorizontal,
  SquarePen,
} from 'lucide';
import './style.css';

type Question = { id: number; question: string; answer: string };

// Remplace chaque <i data-lucide="…"> par son icône SVG, au trait fin comme la maquette
createIcons({
  icons: {
    BookOpen,
    Globe,
    House,
    Lightbulb,
    MessagesSquare,
    Mic,
    PanelLeftClose,
    PanelLeftOpen,
    Paperclip,
    ScanEye,
    Search,
    SendHorizontal,
    SquarePen,
  },
  attrs: { 'stroke-width': 1.5 },
});

const sidebar = document.querySelector<HTMLElement>('#sidebar')!;
const toggle = document.querySelector<HTMLButtonElement>('#sidebar-toggle')!;
const healthDot = document.querySelector('#health-dot')!;
const healthText = document.querySelector('#health-text')!;
const form = document.querySelector('form')!;
const textarea = document.querySelector<HTMLTextAreaElement>('#question')!;
const list = document.querySelector('#questions')!;

// Barre latérale rétractable. L'état est mémorisé dans le navigateur ;
// sans préférence enregistrée, elle démarre rétractée sur petit écran.
const SIDEBAR_KEY = 'sidebar-collapsed';

function setCollapsed(collapsed: boolean) {
  sidebar.dataset.collapsed = String(collapsed);
  toggle.setAttribute('aria-expanded', String(!collapsed));
  toggle.setAttribute(
    'aria-label',
    collapsed ? 'Déplier la barre latérale' : 'Rétracter la barre latérale',
  );
  try {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  } catch {
    // Stockage indisponible (navigation privée) : l'état n'est juste pas mémorisé
  }
}

function savedCollapsed(): boolean | null {
  try {
    const value = localStorage.getItem(SIDEBAR_KEY);
    return value === null ? null : value === 'true';
  } catch {
    return null;
  }
}

setCollapsed(
  savedCollapsed() ?? window.matchMedia('(max-width: 768px)').matches,
);
toggle.addEventListener('click', () =>
  setCollapsed(sidebar.dataset.collapsed !== 'true'),
);

async function refresh() {
  try {
    const status = await fetch('/api/health').then((r) => r.json());
    healthDot.classList.replace('bg-muted', 'bg-success');
    healthText.textContent = 'API connectée';
    healthText.setAttribute('title', status.db);
  } catch {
    healthText.textContent = 'API injoignable';
  }

  const questions: Question[] = await fetch('/api/questions').then((r) =>
    r.json(),
  );
  list.replaceChildren(
    ...questions.map((q) => {
      const item = document.createElement('li');
      item.className =
        'flex flex-col gap-1 rounded-card border border-border bg-surface p-4';
      const asked = document.createElement('p');
      asked.className = 'text-sm font-semibold';
      asked.textContent = q.question;
      const answer = document.createElement('p');
      answer.className = 'text-sm text-muted';
      answer.textContent = q.answer;
      item.append(asked, answer);
      return item;
    }),
  );
}

// Entrée envoie, Maj + Entrée passe à la ligne
textarea.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = new FormData(form).get('question');
  await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  form.reset();
  await refresh();
});

refresh();
