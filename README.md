# Hackathon : questions à l'IA

Une page web où l'on pose une question à une IA. L'API transmet la question à un modèle de langage compatible OpenAI (Ollama en local, ou Mistral), puis enregistre la question et la réponse dans PostgreSQL. La page affiche les dix dernières.

## Stack

| Partie | Techno | Dossier |
|---|---|---|
| API | Node 24, TypeScript, Express, `pg` | `api/` |
| Front | Vite, TypeScript sans framework | `web/` |
| Base | PostgreSQL 17 | `db/init/` (schéma et données de test) |
| IA | API `chat/completions` compatible OpenAI | configurée dans `api/.env` |

Les raisons de ces choix sont dans [`docs/adr/`](docs/adr/).

## Lancer le projet

Prérequis : Docker et VS Code avec l'extension Dev Containers.

1. Ouvrir le dossier dans VS Code, puis « Reopen in Container ». Le service `db` démarre et charge `db/init/` au premier lancement.
2. Dans le terminal du conteneur :

   ```bash
   cp api/.env.example api/.env   # puis choisir le fournisseur d'IA
   npm install
   npm run dev
   ```

3. Ouvrir le front sur http://localhost:5173. L'API répond sur http://localhost:3000/api/health.

Pour repartir d'une base vide, supprimer `db/data/` puis reconstruire le conteneur.

## Routes de l'API

- `GET /api/health` : état de l'API et version de PostgreSQL.
- `GET /api/questions` : les dix dernières questions.
- `POST /api/questions` avec `{ "question": "..." }` : interroge l'IA et enregistre la réponse.

## Contribuer

Les branches partent de `develop` et y reviennent par pull request. Le job `qualite` de la CI doit être vert avant la fusion : il vérifie les types de l'API et construit le front.
