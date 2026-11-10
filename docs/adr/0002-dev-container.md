# 0002. Développer dans un Dev Container lancé par Docker Compose

- Statut : proposée
- Date : 2026-11-09
- Décideurs : Fouad

## Contexte

Le projet comporte une API Node/TypeScript, un front Vite et une base PostgreSQL. L'équipe travaille sur des machines différentes (macOS, Linux, Windows), avec des versions de Node différentes, et Postgres n'est pas installé partout. La production tourne sur Node 24 (Debian trixie) et PostgreSQL 17 : le dev doit utiliser les mêmes versions.

## Options

1. Tout installer sur l'hôte : aucun Docker requis. Chacun gère ses versions de Node et de Postgres, qui divergent vite.
2. Postgres en conteneur, Node sur l'hôte : base identique pour tous. Les versions de Node et des outils restent différentes d'une machine à l'autre.
3. Dev Container rattaché à `compose.yaml` : toute la stack et les outils (Node, `psql`, `gh`, extensions VS Code) sont identiques pour tous. Docker et un éditeur compatible deviennent obligatoires.

## Décision

Nous choisissons l'option 3 parce que c'est la seule qui fige à la fois Node, Postgres et l'outillage aux versions de production. `compose.yaml` décrit un service `dev` (image `typescript-node:24-trixie` + `postgresql-client`) et un service `db` (`postgres:17`). Le service `dev` attend que `db` réponde à `pg_isready`.

## Conséquences

- Positives : « Reopen in Container » suffit pour démarrer. Le schéma et les données de test de `db/init/` sont chargés au premier lancement. Mêmes réglages de format et de lint pour tous.
- Négatives, à accepter : Docker est obligatoire et le premier build est long. Les fichiers montés sont plus lents sur macOS et Windows. Pour rejouer `db/init/`, il faut supprimer `db/data/`, ce qui efface les données locales.
- À revoir si : les lenteurs de fichiers gênent le travail, ou si un membre de l'équipe ne peut pas installer Docker.
