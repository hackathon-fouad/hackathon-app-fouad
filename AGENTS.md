# AGENTS.md

Consignes pour les agents de code (Claude Code, Copilot, Codex…) qui travaillent sur ce dépôt. Le produit est décrit dans le [README](README.md).

## Environnement

Tout se lance dans le Dev Container (ADR 0002). Les commandes ci-dessous s'exécutent dans le terminal du conteneur, dans `/workspace`.

- N'installe jamais de dépendances depuis la machine hôte : `node_modules` recevrait des binaires macOS ou Windows et casserait le conteneur.
- La base est le service `db` de `compose.yaml`, joignable sous `db:5432` (utilisateur, mot de passe et base : `app`). Client : `psql postgres://app:app@db:5432/app`.
- La configuration de l'API est dans `api/.env`, copié depuis `api/.env.example`. Ne commite jamais `api/.env` et n'écris aucune clé dans le code.

## Commandes

```bash
npm install            # dépendances des deux workspaces
npm run dev            # API sur :3000 et front sur :5173, ensemble
npm run lint           # ESLint sur api/ et web/
npm run typecheck      # tsc --noEmit dans api/ et web/
npm run build -w web   # build Vite du front
```

Avant de proposer une modification, `npm run lint` et `npm run typecheck` doivent passer : le job `qualite` de `.github/workflows/ci.yml` lance les mêmes commandes.

## Organisation du code

- `api/src/index.ts` : l'API Express, les requêtes SQL avec `pg` et l'appel à l'IA (`ask()`).
- `web/index.html` et `web/src/main.ts` : le front en TypeScript sans framework. Vite redirige `/api` vers l'API.
- `db/init/` : schéma (`001-schema.sql`) et données de test (`002-seed.sql`), joués seulement si `db/data/` est vide.
- `openapi.yaml` : le contrat de l'API.
- `docs/adr/` : les décisions d'architecture.

## Respecter les ADR

Les choix de `docs/adr/` sont actés. Toute réponse, tout code et toute commande proposés doivent s'y conformer, sans alternative non demandée.

| ADR | Choix acté | Ce que tu ne proposes pas |
|---|---|---|
| 0001 | TypeScript, API Express, front Vite sans framework | Python, NestJS, Fastify, React, Vue, Svelte |
| 0002 | Tout tourne dans le Dev Container et `compose.yaml` | Installer Node, Postgres ou des outils sur la machine hôte |
| 0003 | IA via `chat/completions` compatible OpenAI, avec `fetch` | SDK `openai` ou `@mistralai/mistralai`, LangChain |
| 0004 | PostgreSQL 17 avec le driver `pg` | MySQL, MariaDB, SQLite, MongoDB, un ORM, une syntaxe SQL propre à un autre moteur |
| 0005 | Contrat d'API écrit à la main dans `openapi.yaml` | Générer le contrat, ou le remplacer par une route `/docs` |

Si une demande semble exiger de sortir d'un ADR, ne l'applique pas : signale le conflit, cite l'ADR concerné, et propose d'écrire un nouvel ADR qui le remplace (modèle : `docs/adr/0000-modele.md`).

## Règles

- Toute route ajoutée ou modifiée dans `api/src/` doit l'être dans `openapi.yaml`, dans la même pull request (ADR 0005).
- Les requêtes SQL passent toujours des paramètres (`$1`, `$2`), jamais de chaînes concaténées.
- L'appel à l'IA est configuré par `AI_BASE_URL`, `AI_MODEL` et `AI_API_KEY` dans `api/.env` (ADR 0003).
- Une modification du schéma va dans un nouveau fichier `db/init/00N-*.sql`, jamais dans un fichier existant.

## Git

- Branches depuis `develop` (`feature/...`), retour par pull request vers `develop`, avec `qualite` vert.
- Messages de commit en anglais : `type: description courte`, avec `feat`, `fix`, `refactor`, `docs`, `chore` ou `test`.
- Ne pousse, ne fusionne et ne pose de tag qu'à la demande explicite d'un membre de l'équipe.
- Un ADR accepté ne se réécrit pas : on en crée un nouveau qui le remplace (modèle : `docs/adr/0000-modele.md`).
