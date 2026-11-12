// Navigation par l'adresse (#/…) : le bouton précédent du navigateur fonctionne,
// sans bibliothèque de routage. Chaque écran est une section de index.html.
//   #/                          le chat
//   #/prospects?n=9&q=…         les résultats de prospection (issue #31)
//   #/prospects/<id>            la fiche « Pourquoi cette entreprise ? » (issue #33)

export type Route =
  | { view: 'chat' }
  | { view: 'prospects'; query: string; limit: number }
  | { view: 'prospect'; id: string };

const TITLES: Record<Route['view'], string> = {
  chat: 'Nouveau chat',
  prospects: 'Résultats de la recherche',
  prospect: 'Pourquoi cette entreprise ?',
};

export function prospectsHash(query: string, limit: number): string {
  const params = new URLSearchParams({ n: String(limit), q: query });
  return `#/prospects?${params}`;
}

export function parseRoute(hash: string): Route {
  const [path, search = ''] = hash.replace(/^#/, '').split('?');
  const detail = path.match(/^\/prospects\/([a-z0-9-]{1,100})$/);
  if (detail) return { view: 'prospect', id: detail[1] };
  if (path === '/prospects') {
    const params = new URLSearchParams(search);
    const limit = Number(params.get('n'));
    return {
      view: 'prospects',
      query: params.get('q') ?? '',
      limit: Number.isInteger(limit) && limit >= 1 && limit <= 50 ? limit : 9,
    };
  }
  return { view: 'chat' };
}

export function navigate(hash: string) {
  if (location.hash === hash) {
    // Même adresse : hashchange ne se déclenche pas, on réaffiche à la main
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = hash;
  }
}

type Screens = {
  chat: () => void;
  prospects: (route: { query: string; limit: number }) => void;
  prospect: (route: { id: string }) => void;
};

export function initRouter(screens: Screens) {
  const title = document.querySelector('#page-title')!;
  const homeLink = document.querySelector('#nav-home')!;
  const views = {
    chat: document.querySelector<HTMLElement>('#view-chat')!,
    prospects: document.querySelector<HTMLElement>('#view-prospects')!,
    prospect: document.querySelector<HTMLElement>('#view-prospect')!,
  };

  function render() {
    const route = parseRoute(location.hash);
    for (const [name, element] of Object.entries(views)) {
      element.hidden = name !== route.view;
    }
    title.textContent = TITLES[route.view];
    document.title = `Givaudan · ${TITLES[route.view]}`;
    if (route.view === 'chat') homeLink.setAttribute('aria-current', 'page');
    else homeLink.removeAttribute('aria-current');
    if (route.view === 'prospects') screens.prospects(route);
    else if (route.view === 'prospect') screens.prospect(route);
    else screens.chat();
  }

  window.addEventListener('hashchange', render);
  render();
}
