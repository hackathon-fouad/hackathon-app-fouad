# Hackathon : questions à l'IA

Une page web où l'on pose une question à une IA. L'API transmet la question au copilote commercial de l'équipe data, qui répond à partir des documents de Givaudan, puis enregistre la question et la réponse dans PostgreSQL. La page affiche les dix dernières.

## Stack

| Partie | Techno | Dossier |
|---|---|---|
| API | Node 24, TypeScript, Express, `pg` | `api/` |
| Front | Vite, TypeScript sans framework | `web/` |
| Base | PostgreSQL 17 | `db/init/` (schéma et données de test) |
| IA | Copilote de l'équipe data (FastAPI, ChromaDB, Ollama), appelé sur `POST /ask` | [`sergiovanni/Casque-projet_data`](https://github.com/sergiovanni/Casque-projet_data), service `copilot` de `compose.yaml` |
| Service du front | nginx, qui relaie `/api` vers l'API | `web/Dockerfile`, `web/nginx.conf` |

Les raisons de ces choix sont dans [`docs/adr/`](docs/adr/).

## Lancer toute l'application

Prérequis : Docker.

```bash
docker compose up
```

Ouvrir http://localhost:8080 et poser une question. Compose construit l'API, le front et le copilote, démarre PostgreSQL et Ollama, indexe les documents du copilote, puis lance le reste.

Le premier lancement télécharge les modèles `llama3.2:3b` et `nomic-embed-text` (environ 2,3 Go) dans le volume `ollama`. Les lancements suivants les réutilisent. Le modèle tourne sur le processeur : une réponse peut prendre plusieurs dizaines de secondes.

Le copilote est construit depuis son dépôt GitHub, figé sur un commit dans `compose.yaml`. Pour prendre une nouvelle version, changer ce commit par une pull request.

## Développer

Prérequis : Docker et VS Code avec l'extension Dev Containers.

1. Ouvrir le dossier dans VS Code, puis « Reopen in Container ». Le service `db` démarre et charge `db/init/` au premier lancement.
2. Dans le terminal du conteneur :

   ```bash
   cp api/.env.example api/.env
   npm install
   npm run dev
   ```

3. Ouvrir le front sur http://localhost:5173. L'API répond sur http://localhost:3000/api/health.

Pour repartir d'une base vide, supprimer `db/data/` puis reconstruire le conteneur.

## Routes de l'API

- `GET /api/health` : état de l'API et version de PostgreSQL.
- `GET /api/questions` : les dix dernières questions.
- `POST /api/questions` avec `{ "question": "..." }` : interroge le copilote et enregistre la réponse.

En dev, l'API a besoin du copilote : lancer `docker compose up -d copilot` depuis la machine hôte.

## Contribuer

Les branches partent de `develop` et y reviennent par pull request. Le job `qualite` de la CI doit être vert avant la fusion. Il lance le lint, vérifie les types de l'API et du front, audite les failles graves des dépendances, puis construit le front. En local, les mêmes vérifications se lancent avec `npm run lint` et `npm run typecheck`.

Avant chaque commit, un hook `pre-commit` (husky et lint-staged) lance ESLint sur les fichiers `.ts` et `.js` modifiés et refuse le commit en cas d'erreur. Il s'installe tout seul avec `npm install`.
