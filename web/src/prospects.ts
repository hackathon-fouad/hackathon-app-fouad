// Écran « Résultats de la recherche » (issue #31). Les prospects et leurs scores
// viennent du copilote, calculés en Python sans IA : la réponse est immédiate.

type ProspectSummary = {
  id: string;
  nom: string;
  ville: string;
  score: number;
  rang: number;
  accroche: string;
};

const intro = document.querySelector('#prospects-intro')!;
const status = document.querySelector('#prospects-status')!;
const grid = document.querySelector('#prospects-grid')!;

// Évite de relancer la même recherche quand on revient sur l'écran
let shownKey = '';

// « Maison Alizé » → « MA », « Bulle d'Écume » → « BÉ », « Ondine & Sel » → « OS »
function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word.replace(/^[a-z]'/i, ''))
    .filter((word) => /^\p{L}/u.test(word) && word.length > 2)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function card(prospect: ProspectSummary): HTMLLIElement {
  const item = document.createElement('li');
  item.className =
    'flex flex-col items-center gap-4 rounded-card bg-panel p-6 text-center';

  const logo = document.createElement('span');
  logo.className =
    'flex size-24 items-center justify-center rounded-card bg-surface text-2xl font-bold text-primary';
  logo.setAttribute('aria-hidden', 'true');
  logo.textContent = initials(prospect.nom);

  const title = document.createElement('h2');
  title.className = 'text-lg leading-tight font-bold';
  const name = document.createElement('span');
  name.className = 'block';
  name.textContent = prospect.nom;
  const score = document.createElement('span');
  score.className = 'block';
  score.textContent = `Score : ${prospect.score}/100`;
  title.append(name, score);

  const text = document.createElement('p');
  text.className = 'text-sm';
  const city = document.createElement('strong');
  city.className = 'font-semibold';
  city.textContent = `${prospect.ville} : `;
  text.append(city, capitalize(prospect.accroche));

  // La fiche détaillée arrive avec l'écran « Pourquoi cette entreprise ? »
  const consult = document.createElement('button');
  consult.type = 'button';
  consult.setAttribute('aria-disabled', 'true');
  consult.title = 'Bientôt disponible';
  consult.className =
    'mt-auto cursor-not-allowed rounded-control bg-primary px-5 py-2 text-sm font-semibold text-on-primary';
  consult.textContent = 'Consulter';
  consult.setAttribute('aria-label', `Consulter ${prospect.nom}`);

  item.append(logo, title, text, consult);
  return item;
}

function showLoading() {
  intro.textContent = '';
  grid.replaceChildren();
  const spinner = document.createElement('span');
  spinner.className =
    'size-5 animate-spin rounded-full border-2 border-primary border-t-transparent';
  spinner.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = 'Recherche en cours…';
  status.replaceChildren(spinner, label);
}

function showError(retry: () => void) {
  const message = document.createElement('span');
  message.textContent = "Le copilote n'a pas pu répondre.";
  const button = document.createElement('button');
  button.type = 'button';
  button.className =
    'rounded-control font-semibold text-primary underline hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none';
  button.textContent = 'Réessayer';
  button.addEventListener('click', retry);
  status.replaceChildren(message, button);
}

export async function showProspects({ query, limit }: { query: string; limit: number }) {
  const key = `${limit}|${query}`;
  if (key === shownKey) return;
  shownKey = key;
  showLoading();

  try {
    const response = await fetch('/api/prospects/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { prospects } = (await response.json()) as {
      prospects: ProspectSummary[];
    };
    status.replaceChildren();
    intro.textContent = `Voici ma sélection de ${prospects.length} marques prometteuses :`;
    grid.replaceChildren(...prospects.map(card));
  } catch {
    shownKey = '';
    showError(() => void showProspects({ query, limit }));
  }
}
