# AGENTS.md

Consignes pour les agents de code (Claude Code, Copilot, Codex…) qui travaillent sur ce dépôt. Le produit est décrit dans le [README](README.md).

## Environnement

Tout se lance dans le Dev Container (ADR 0002). Les commandes ci-dessous s'exécutent dans le terminal du conteneur, dans `/workspace`.

- N'installe jamais de dépendances depuis la machine hôte : `node_modules` recevrait des binaires macOS ou Windows et casserait le conteneur.
- La base est le service `db` de `compose.yaml`, joignable sous `db:5432` (utilisateur, mot de passe et base : `app`). Client : `psql postgres://app:app@db:5432/app`.
- En dev, la configuration de l'API est dans `api/.env`, copié depuis `api/.env.example`. Ne commite jamais `api/.env` et n'écris aucune clé dans le code.
- `docker compose up` lance l'application complète, sans le Dev Container : front nginx sur :8080, API, copilote IA, Ollama et base. Ses variables sont dans `compose.yaml`.

## Commandes

```bash
npm install            # dépendances des deux workspaces
npm run dev            # API sur :3000 et front sur :5173, ensemble
npm run lint           # ESLint sur api/ et web/
npm run typecheck      # tsc --noEmit dans api/ et web/
npm run build -w web   # build Vite du front
```

Depuis la machine hôte, pour tester l'application telle qu'elle sera montrée :

```bash
docker compose up --build   # http://localhost:8080
```

Avant de proposer une modification, `npm run lint` et `npm run typecheck` doivent passer : le job `qualite` de `.github/workflows/ci.yml` lance les mêmes commandes.

Un hook `pre-commit` (`.husky/pre-commit`, configuré par la clé `lint-staged` de `package.json`) lance ESLint sur les fichiers indexés. Corrige l'erreur signalée au lieu de le contourner avec `--no-verify`.

## Organisation du code

- `api/src/index.ts` : l'API Express, les requêtes SQL avec `pg` et l'appel au copilote (`ask()`).
- `web/index.html` et `web/src/main.ts` : le front en TypeScript sans framework. Vite redirige `/api` vers l'API en dev, nginx (`web/nginx.conf`) dans Compose.
- `web/src/style.css` : import de Tailwind et tokens du thème (`@theme`). Une nouvelle couleur ou un nouvel arrondi s'ajoute ici, puis s'utilise par son nom (`bg-primary`, `rounded-card`).
- Icônes : `lucide`, sans framework. Écris `<i data-lucide="nom">` dans le HTML et ajoute l'icône à l'appel `createIcons` de `web/src/main.ts`. Police : Poppins, servie par `@fontsource/poppins` (pas de Google Fonts : la démo doit marcher hors ligne).
- Les éléments de la maquette non branchés sur l'API portent `aria-disabled="true"` et `title="Bientôt disponible"`. Ne leur invente pas de comportement simulé.
- `api/Dockerfile` et `web/Dockerfile` : les images de l'API et du front, construites depuis la racine du dépôt. Une dépendance ajoutée à un workspace n'a rien à changer ici.
- `db/init/` : schéma (`001-schema.sql`) et données de test (`002-seed.sql`), joués seulement si `db/data/` est vide.
- `openapi.yaml` : le contrat de l'API.
- `docs/adr/` : les décisions d'architecture.

## Respecter les ADR

Les choix de `docs/adr/` sont actés. Toute réponse, tout code et toute commande proposés doivent s'y conformer, sans alternative non demandée.

| ADR | Choix acté | Ce que tu ne proposes pas |
|---|---|---|
| 0001 | TypeScript, API Express, front Vite sans framework | Python, NestJS, Fastify, React, Vue, Svelte |
| 0002 | Tout tourne dans le Dev Container et `compose.yaml` | Installer Node, Postgres ou des outils sur la machine hôte |
| 0007 | L'API appelle `POST {COPILOT_URL}/ask` du copilote de l'équipe data (remplace l'ADR 0003) | Appeler Ollama ou un autre LLM directement, SDK `openai`, LangChain, modifier ou copier le code du copilote dans ce dépôt |
| 0004 | PostgreSQL 17 avec le driver `pg` | MySQL, MariaDB, SQLite, MongoDB, un ORM, une syntaxe SQL propre à un autre moteur |
| 0005 | Contrat d'API écrit à la main dans `openapi.yaml` | Générer le contrat, ou le remplacer par une route `/docs` |
| 0006 | Styles en Tailwind CSS 4, tokens dans `web/src/style.css` | CSS écrit à la main, Bootstrap, valeurs en dur comme `p-[13px]` ou `#4f46e5` dans les classes, noms de classes construits par concaténation |

Si une demande semble exiger de sortir d'un ADR, ne l'applique pas : signale le conflit, cite l'ADR concerné, et propose d'écrire un nouvel ADR qui le remplace (modèle : `docs/adr/0000-modele.md`).

## Règles

- Toute route ajoutée ou modifiée dans `api/src/` doit l'être dans `openapi.yaml`, dans la même pull request (ADR 0005).
- Les requêtes SQL passent toujours des paramètres (`$1`, `$2`), jamais de chaînes concaténées.
- L'adresse du copilote est `COPILOT_URL` (`api/.env` en dev, `compose.yaml` sinon). Son code vit dans `sergiovanni/Casque-projet_data` : une modification se propose à l'équipe data, puis on change le commit figé dans `compose.yaml` (ADR 0007).
- Une modification du schéma va dans un nouveau fichier `db/init/00N-*.sql`, jamais dans un fichier existant.

## Git

- Branches depuis `develop` (`feature/...`), retour par pull request vers `develop`, avec `qualite` vert.
- Messages de commit en anglais : `type: description courte`, avec `feat`, `fix`, `refactor`, `docs`, `chore` ou `test`.
- Ne pousse, ne fusionne et ne pose de tag qu'à la demande explicite d'un membre de l'équipe.
- Un ADR accepté ne se réécrit pas : on en crée un nouveau qui le remplace (modèle : `docs/adr/0000-modele.md`).
