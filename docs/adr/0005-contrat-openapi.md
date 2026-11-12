# 0005. Écrire le contrat d'API à la main dans `openapi.yaml`

- Statut : proposée
- Date : 2026-11-10
- Décideurs : Fouad

## Contexte

Le front (`web/`) et l'API (`api/`) avancent en parallèle, souvent à des personnes différentes. Le front a besoin de connaître les routes et le format des réponses sans lire le code de l'API. L'API utilise Express (ADR 0001), qui ne produit aucune description des routes. Le cours exige un fichier OpenAPI dans le dépôt : une route `/docs` seule ne suffit pas. Aujourd'hui, l'API a trois routes : `GET /api/health`, `GET /api/questions` et `POST /api/questions`.

## Options

1. Écrire `openapi.yaml` à la main, à la racine du dépôt : aucune dépendance, relu en pull request comme le code, utilisable avant que la route existe. Il peut diverger du code si on oublie de le mettre à jour.
2. Générer le fichier depuis le code (annotations JSDoc avec `swagger-jsdoc`, ou schémas `zod` convertis) : le fichier suit le code. Une dépendance et une syntaxe de plus, et le contrat n'existe qu'après le code.
3. Servir seulement une route `/docs` avec Swagger UI : pratique à consulter. Ne satisfait pas l'exigence du cours, et il faut lancer l'API pour la lire.

## Décision

Nous choisissons l'option 1 parce que le contrat doit exister avant le code pour que le front et l'API avancent en même temps, et que trois routes ne justifient pas un outil de génération. Le fichier [`openapi.yaml`](../../openapi.yaml) est la référence : une route ajoutée ou modifiée dans `api/src/` l'est dans la même pull request.

## Conséquences

- Positives : le front sait quoi appeler sans attendre l'API. Les changements de contrat sont visibles et discutés en pull request. Le fichier documente aussi les cas d'erreur, comme le 400 « Question manquante ».
- Négatives, à accepter : rien ne vérifie automatiquement que le code respecte le contrat. Les erreurs 500 renvoient encore la page HTML par défaut d'Express, et le contrat le dit tel quel.
- À revoir si : l'API dépasse une dizaine de routes, ou si un écart entre le code et `openapi.yaml` casse le front. Il faudra alors valider les requêtes contre le contrat, ou le générer.
