import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import {
  ArrowLeft,
  createIcons,
  Globe,
  House,
  Lightbulb,
  MessageSquareMore,
  PanelLeftClose,
  PanelLeftOpen,
  ScanEye,
  Search,
  Sparkles,
} from 'lucide';
import { initChat } from './chat';
import { showProspect } from './prospect';
import { lastResultsHash, showProspects } from './prospects';
import { initRouter, prospectsHash } from './router';
import './style.css';

// Remplace chaque <i data-lucide="…"> par son icône SVG, au trait fin comme la maquette
createIcons({
  icons: {
    ArrowLeft,
    Globe,
    House,
    Lightbulb,
    MessageSquareMore,
    PanelLeftClose,
    PanelLeftOpen,
    ScanEye,
    Search,
    Sparkles,
  },
  attrs: { 'stroke-width': 1.5 },
});

const sidebar = document.querySelector<HTMLElement>('#sidebar')!;
const toggle = document.querySelector<HTMLButtonElement>('#sidebar-toggle')!;
const healthDot = document.querySelector('#health-dot')!;
const healthText = document.querySelector('#health-text')!;

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

async function checkHealth() {
  try {
    const status = await fetch('/api/health').then((r) => r.json());
    healthDot.classList.replace('bg-on-sidebar/50', 'bg-success');
    healthText.textContent = 'API connectée';
    healthText.setAttribute('title', status.db);
  } catch {
    healthText.textContent = 'API injoignable';
  }
}

checkHealth();
initChat();
initRouter({
  chat: () => {},
  prospects: (route) => void showProspects(route),
  prospect: (route) => {
    // Retour ramène à la grille d'où l'on vient, sinon à la recherche par défaut
    document
      .querySelector<HTMLAnchorElement>('#prospect-back')!
      .setAttribute('href', lastResultsHash || prospectsHash('', 9));
    void showProspect(route);
  },
});
