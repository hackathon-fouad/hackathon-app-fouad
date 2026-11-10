# 0004. Utiliser PostgreSQL comme base de données

- Statut : proposée
- Date : 2026-11-09
- Décideurs : Fouad

## Contexte

Le produit stocke des questions et les réponses de l'IA, avec leur date de création. Ces données ont une forme fixe : une table `questions` avec `id`, `question`, `answer` et `created_at`. La production utilise PostgreSQL 17. L'API tourne dans un conteneur et doit joindre la base par le réseau Compose.

## Options

1. PostgreSQL : même moteur qu'en production, image officielle, client `psql` dans le Dev Container. Un service de plus à lancer.
2. SQLite : aucun service, un simple fichier. Moteur différent de la production, donc des écarts de SQL et de comportement découverts trop tard.
3. MariaDB : relationnelle et disponible en image officielle. Différente de la production, sans avantage ici.
4. MongoDB : schéma souple. Les données ont une forme fixe, et on perdrait SQL et les contraintes `NOT NULL` qui les protègent.

## Décision

Nous choisissons PostgreSQL 17, lancé par le service `db` de `compose.yaml`, parce que c'est le moteur de production et que les données sont relationnelles. L'API s'y connecte avec le driver `pg` via `DATABASE_URL`. Le schéma et les données de test sont dans `db/init/`.

## Conséquences

- Positives : le même moteur et la même version partout, du poste de dev à la production. Le SQL testé en dev est celui de la production. Le schéma est versionné dans le dépôt.
- Négatives, à accepter : un conteneur à démarrer et à surveiller avant l'API. Pas encore d'outil de migration : `db/init/` n'est joué qu'au premier démarrage, et toute évolution du schéma demande de réinitialiser `db/data/` ou d'écrire le SQL à la main.
- À revoir si : l'hébergeur impose un autre moteur, ou si les changements de schéma deviennent fréquents et exigent un outil de migration.
