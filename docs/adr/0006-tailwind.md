# 0006. Styler le front avec Tailwind CSS

- Statut : proposée
- Date : 2026-11-12
- Décideurs : Fouad

## Contexte

Le front (`web/`) n'a aucun style : `index.html` contient un titre, un formulaire et une liste, que `web/src/main.ts` remplit. Pour la démo de m2, le 13 novembre, il doit reproduire une maquette Figma. L'ADR 0001 garde le front sans framework JavaScript : les éléments de la liste sont créés en TypeScript avec `document.createElement`. Le front est construit par Vite 8, en dev comme dans l'image de `docker compose up`. L'équipe connaît Tailwind.

## Options

1. CSS simple avec des variables : aucune dépendance, une seule feuille. Il faut nommer chaque classe et écrire chaque règle à la main, et les écarts avec la maquette (espacements, tailles) se multiplient.
2. Tailwind CSS 4 avec son plugin Vite : échelles d'espacement, de couleurs et d'arrondis prêtes, tokens de la maquette déclarés en variables CSS dans un bloc `@theme`. Ajoute une dépendance de build et allonge les attributs `class`.
3. Une feuille toute faite, comme Pico CSS : joli sans effort sur du HTML brut. Difficile de coller à une maquette précise, et on se bat contre ses styles par défaut.

## Décision

Nous choisissons l'option 2 parce que l'équipe la maîtrise et qu'elle permet de reproduire la maquette Figma rapidement avant la démo, sans ajouter de framework JavaScript. Tailwind est installé dans le workspace `web` et branché par `@tailwindcss/vite` dans `web/vite.config.ts`. Les tokens de la maquette (couleurs, arrondis, police) vivent dans `web/src/style.css`.

## Conséquences

- Positives : les styles s'écrivent là où l'élément est créé, dans `index.html` ou `main.ts`. Les tokens sont au même endroit et réutilisables. Rien ne change pour l'API ni pour `docker compose up` : l'image du front lance déjà `vite build`.
- Négatives, à accepter : une dépendance de build en plus. De longues listes de classes dans `main.ts`. Tailwind ne détecte que les noms de classes écrits en entier : une classe construite par concaténation (`'bg-' + couleur`) ne sera pas générée. Pas de valeurs en dur comme `p-[13px]` : on passe par les tokens.
- À revoir si : le front adopte un framework JavaScript, ce qui demanderait un nouvel ADR remplaçant l'ADR 0001, ou si les listes de classes rendent `main.ts` illisible.
