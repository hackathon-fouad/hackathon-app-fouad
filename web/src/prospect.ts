import { BellRing, CircleDot, createElement, type IconNode } from 'lucide';
import { initials } from './prospects';

// Écran « Pourquoi cette entreprise ? » (issue #33). Toutes les données viennent de la
// fiche du copilote (GET /api/prospects/{id}) : rien n'est inventé côté front.

type Prospect = {
  id: string;
  nom: string;
  ville: string;
  score: number | null;
  score_maximum: number;
  rang: number | null;
  accroche: string;
  identite: string;
  signaux: string;
  pourquoi_cette_entreprise: string;
  produits_adaptes: string;
  codes_produits: string[];
  contact: { nom: string; role: string; texte: string };
  details_score: { libelle: string; points: number; maximum: number }[];
  prochaine_etape: string;
};

type Chip = { label: string; value: string };
type Tab = { id: string; title: string; lead: string; paragraphs: string[]; chips: Chip[] };

const status = document.querySelector('#prospect-status')!;
const body = document.querySelector('#prospect-body')!;

let shownId = '';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function icon(node: IconNode, className: string): SVGElement {
  const svg = createElement(node);
  svg.setAttribute('class', className);
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}

// 1 → « 1er prospect », 2 → « 2e prospect »
const rank = (value: number | null) =>
  value === null ? '—' : `${value}${value === 1 ? 'er' : 'e'} prospect`;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Les signaux du copilote sont une phrase avec des « ; » entre chaque élément
const splitSignals = (text: string) =>
  text
    .split(/\s*;\s*/)
    .map((part) => capitalize(part.trim().replace(/\.$/, '')))
    .filter(Boolean);

function tabs(prospect: Prospect): Tab[] {
  const strongest = [...prospect.details_score]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);
  return [
    {
      id: 'vue',
      title: "Vue d'ensemble",
      lead: `${prospect.nom} : ${prospect.identite}`,
      paragraphs: [prospect.contact.texte],
      chips: [
        { label: 'Ville', value: prospect.ville },
        { label: 'Contact', value: prospect.contact.nom },
        { label: 'Rang', value: rank(prospect.rang) },
      ],
    },
    {
      id: 'marche',
      title: 'Marché et tendances',
      lead: capitalize(prospect.pourquoi_cette_entreprise),
      paragraphs: [`Accroche : ${prospect.accroche}`],
      chips: strongest.map((d) => ({
        label: capitalize(d.libelle),
        value: `${d.points}/${d.maximum} points`,
      })),
    },
    {
      id: 'produits',
      title: 'Produits & positionnement',
      lead: capitalize(prospect.produits_adaptes),
      paragraphs: [],
      chips: prospect.codes_produits.map((code) => ({ label: 'Produit', value: code })),
    },
    {
      id: 'actualites',
      title: 'Actualités',
      lead: capitalize(prospect.accroche),
      paragraphs: splitSignals(prospect.signaux),
      chips: [],
    },
  ];
}

function chip({ label, value }: Chip): HTMLLIElement {
  const item = el('li', 'flex items-center gap-3 rounded-full bg-panel py-2 pr-5 pl-2');
  const dot = el('span', 'size-8 shrink-0 rounded-full bg-text');
  dot.setAttribute('aria-hidden', 'true');
  const text = el('p', 'text-xs');
  text.append(el('strong', 'block font-semibold', `${label} :`), value);
  item.append(dot, text);
  return item;
}

function panel(tab: Tab): HTMLDivElement {
  const container = el('div', 'flex flex-col gap-4 text-sm');
  container.append(el('p', 'font-semibold', tab.lead));
  for (const text of tab.paragraphs) container.append(el('p', '', text));
  if (tab.chips.length) {
    const list = el('ul', 'flex flex-wrap gap-3 pt-2');
    list.append(...tab.chips.map(chip));
    container.append(list);
  }
  return container;
}

// À la place des photos de la maquette : le score et son détail, calculés par le copilote
function scorePanel(prospect: Prospect): HTMLElement {
  const box = el('section', 'flex flex-col gap-4 rounded-card bg-panel p-5');
  box.setAttribute('aria-label', 'Détail du score');
  const total = el('p', 'text-3xl font-bold text-primary', `${prospect.score ?? '—'}`);
  total.append(el('span', 'text-base text-text', ` /${prospect.score_maximum}`));
  box.append(el('p', 'text-sm font-semibold', 'Score du prospect'), total);
  const list = el('ul', 'flex flex-col gap-3');
  for (const detail of prospect.details_score) {
    const item = el('li', 'flex flex-col gap-1 text-xs');
    const row = el('div', 'flex justify-between gap-2');
    row.append(
      el('span', '', capitalize(detail.libelle)),
      el('span', 'font-semibold', `${detail.points}/${detail.maximum}`),
    );
    const track = el('div', 'h-2 overflow-hidden rounded-full bg-surface');
    const bar = el('div', 'h-full rounded-full bg-primary');
    // Largeur calculée depuis la donnée : pas de classe en dur (ADR 0006)
    bar.style.width = `${detail.maximum ? (detail.points / detail.maximum) * 100 : 0}%`;
    track.append(bar);
    item.append(row, track);
    list.append(item);
  }
  box.append(list);
  return box;
}

function tabsBlock(prospect: Prospect): HTMLElement {
  const all = tabs(prospect);
  const wrapper = el('div', 'flex flex-col gap-6');
  const list = el('div', 'flex flex-wrap gap-x-8 gap-y-2 border-b border-border');
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', `Fiche de ${prospect.nom}`);
  const content = el('div', 'grid gap-6 md:grid-cols-2');
  const panelSlot = el('div', '');
  panelSlot.setAttribute('role', 'tabpanel');
  panelSlot.tabIndex = 0;
  content.append(scorePanel(prospect), panelSlot);

  const buttons = all.map((tab, index) => {
    const button = el(
      'button',
      '-mb-px border-b-2 border-transparent py-3 text-sm text-muted hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none aria-selected:border-primary aria-selected:font-semibold aria-selected:text-text',
      tab.title,
    );
    button.type = 'button';
    button.id = `tab-${tab.id}`;
    button.setAttribute('role', 'tab');
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', (event) => {
      const moves: Record<string, number> = {
        ArrowRight: 1,
        ArrowLeft: -1,
      };
      if (event.key in moves) {
        event.preventDefault();
        const next = (index + moves[event.key] + all.length) % all.length;
        select(next);
        buttons[next].focus();
      }
    });
    return button;
  });

  function select(index: number) {
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    panelSlot.setAttribute('aria-labelledby', buttons[index].id);
    panelSlot.replaceChildren(panel(all[index]));
  }

  list.append(...buttons);
  wrapper.append(list, content);
  select(0);
  return wrapper;
}

function header(prospect: Prospect): HTMLElement {
  const block = el('div', 'flex flex-wrap items-center gap-6');
  const logo = el(
    'span',
    'flex size-40 shrink-0 items-center justify-center rounded-card bg-panel text-4xl font-bold text-primary',
    initials(prospect.nom),
  );
  logo.setAttribute('aria-hidden', 'true');
  const text = el('div', 'flex max-w-md flex-col items-start gap-3');
  text.append(
    el('h2', 'text-2xl font-bold', prospect.nom),
    el('p', 'text-sm', capitalize(prospect.accroche)),
    el('span', 'rounded-full bg-panel px-5 py-2 text-sm font-semibold', prospect.ville),
  );
  block.append(logo, text);
  return block;
}

function signals(prospect: Prospect): HTMLElement {
  const box = el('section', 'flex flex-wrap items-end gap-6 rounded-card bg-panel p-6');
  box.setAttribute('aria-labelledby', 'signals-title');
  const left = el('div', 'flex min-w-0 flex-1 flex-col gap-4');
  const title = el('h3', 'flex items-center gap-2 text-sm font-semibold');
  title.id = 'signals-title';
  title.append(icon(BellRing, 'size-5'), 'Signaux clés');
  const list = el('ul', 'flex flex-col gap-3 text-sm');
  const items = [
    ...splitSignals(prospect.signaux).map((text) => ({ label: '', text })),
    { label: 'Prochaine étape : ', text: capitalize(prospect.prochaine_etape) },
  ];
  for (const { label, text } of items) {
    const item = el('li', 'flex items-start gap-3');
    const content = el('p', '');
    if (label) content.append(el('strong', 'font-semibold', label));
    content.append(text);
    item.append(icon(CircleDot, 'mt-0.5 size-5 shrink-0 text-primary'), content);
    list.append(item);
  }
  left.append(title, list);

  const generate = el(
    'button',
    'cursor-not-allowed rounded-control bg-primary px-6 py-3 text-sm font-semibold text-on-primary',
    'Générer la fiche détaillée',
  );
  generate.type = 'button';
  generate.setAttribute('aria-disabled', 'true');
  generate.title = 'Bientôt disponible';
  box.append(left, generate);
  return box;
}

function showMessage(text: string, action?: { label: string; run: () => void }) {
  body.replaceChildren();
  const message = el('span', '', text);
  if (!action) {
    status.replaceChildren(message);
    return;
  }
  const button = el(
    'button',
    'rounded-control font-semibold text-primary underline hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
    action.label,
  );
  button.type = 'button';
  button.addEventListener('click', action.run);
  status.replaceChildren(message, button);
}

export async function showProspect({ id }: { id: string }) {
  if (id === shownId) return;
  shownId = id;
  body.replaceChildren();
  const spinner = el(
    'span',
    'size-5 animate-spin rounded-full border-2 border-primary border-t-transparent',
  );
  spinner.setAttribute('aria-hidden', 'true');
  status.replaceChildren(spinner, el('span', '', 'Chargement de la fiche…'));

  try {
    const response = await fetch(`/api/prospects/${encodeURIComponent(id)}`);
    if (response.status === 404) {
      shownId = '';
      showMessage('Prospect introuvable.');
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const prospect = (await response.json()) as Prospect;
    status.replaceChildren();
    body.replaceChildren(header(prospect), tabsBlock(prospect), signals(prospect));
  } catch {
    shownId = '';
    showMessage("Le copilote n'a pas pu répondre.", {
      label: 'Réessayer',
      run: () => void showProspect({ id }),
    });
  }
}
