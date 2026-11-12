# 0007. Appeler le copilote de l'équipe data au lieu d'Ollama directement

- Statut : proposée
- Date : 2026-11-12
- Décideurs : Fouad
- Remplace : [0003](0003-fournisseur-ia.md)

## Contexte

L'ADR 0003 fait appeler Ollama directement par notre API, au format `chat/completions`. Le modèle répond alors sans rien savoir de Givaudan. L'équipe data a construit le copilote commercial dans le dépôt `sergiovanni/Casque-projet_data` : une API FastAPI qui cherche les passages utiles de `story.txt` dans ChromaDB, calcule en Python les faits chiffrés (remises, scores, délais) et fait seulement rédiger la réponse par Ollama. Ses 48 tests passent. Son endpoint `POST /ask` prend `{ "question" }` et renvoie `{ "answer", "faits_verifies", "sources" }` : ce n'est pas le format OpenAI. Le copilote n'a pas de Dockerfile et écoute par défaut sur `127.0.0.1`. La démo de m2 a lieu le 13 novembre.

## Options

1. Garder l'appel direct à Ollama (ADR 0003) : rien à changer. Les réponses ignorent les documents et les règles de Givaudan, et le travail de l'équipe data n'est pas montré.
2. Notre API Express appelle `POST /ask` du copilote : le front et la route `/api/questions` ne changent pas, les questions restent enregistrées dans PostgreSQL, aucun CORS. Il faut adapter `ask()` et lancer le copilote dans Compose.
3. Le front appelle le copilote directement : pas de changement dans l'API. Deux origines à gérer (CORS), les questions ne sont plus enregistrées, et `openapi.yaml` ne décrit plus ce que fait le front.
4. Copier le code Python du copilote dans notre dépôt : tout au même endroit. Deux copies qui divergent dès que l'équipe data pousse une correction.

## Décision

Nous choisissons l'option 2 parce qu'elle montre les réponses fondées sur les documents sans toucher au front ni au contrat d'API, à la veille de la démo. `ask()` dans `api/src/index.ts` appelle `{COPILOT_URL}/ask` et lit `answer`. Le service `copilot` de `compose.yaml` est construit depuis le dépôt GitHub, figé sur un commit, avec un Dockerfile écrit dans `compose.yaml` : le dépôt de l'équipe data n'est pas modifié. Au démarrage, il indexe `story.txt` puis lance son API sur toutes les interfaces.

## Conséquences

- Positives : les réponses s'appuient sur `story.txt` et sur des chiffres vérifiés par du code. Le front, la route `/api/questions` et la table `questions` ne changent pas. `docker compose up` lance toujours tout en une commande.
- Négatives, à accepter : on ne change plus de fournisseur d'IA par configuration dans notre API, c'est le copilote qui choisit son modèle. Deux modèles à télécharger (`llama3.2:3b` et `nomic-embed-text`, environ 2,3 Go), et un modèle 3b plus lent sur le processeur. Une dépendance à un autre dépôt : une nouvelle version du copilote demande de changer le commit dans `compose.yaml`. `faits_verifies` et `sources` ne sont pas encore affichés.
- À revoir si : le copilote expose le format OpenAI, s'il ajoute son propre Dockerfile, ou si une réponse dépasse le délai de 120 secondes de nginx pendant la démo.
