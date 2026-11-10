# 0003. Appeler l'IA via l'API compatible OpenAI, sans SDK

- Statut : proposée
- Date : 2026-11-09
- Décideurs : Fouad

## Contexte

`POST /api/questions` envoie la question à un modèle de langage puis stocke la question et la réponse en base. Selon la machine et le moment, le fournisseur change : Ollama en local, gratuit et sans clé, ou un service hébergé comme Mistral. Ollama, Mistral et OpenAI exposent tous la même route `chat/completions`. Node 24 fournit `fetch` nativement.

## Options

1. SDK d'un fournisseur (`openai`, `@mistralai/mistralai`) : intégration simple et typée. Changer de fournisseur oblige à changer le code.
2. Bibliothèque multi-fournisseurs (LangChain, Vercel AI SDK) : changement de fournisseur possible. Dépendance lourde et API à apprendre pour un seul appel.
3. Appel HTTP direct au format OpenAI : aucune dépendance, fournisseur choisi par la configuration. Seules les fonctions communes à tous les fournisseurs sont disponibles.

## Décision

Nous choisissons l'option 3 parce qu'un seul appel suffit au produit et que l'équipe doit pouvoir passer d'Ollama à un service hébergé sans toucher au code. La fonction `ask()` de `api/src/index.ts` appelle `{AI_BASE_URL}/chat/completions`. `AI_BASE_URL`, `AI_MODEL` et `AI_API_KEY` viennent de `api/.env`, qui n'est pas commité.

## Conséquences

- Positives : changer de fournisseur revient à modifier trois variables. Aucune dépendance ajoutée. Dev gratuit et hors ligne avec Ollama. Aucune clé dans le code.
- Négatives, à accepter : pas de fonctions propres à un fournisseur (outils, sorties structurées). Pas encore de timeout ni de nouvel essai : une erreur du fournisseur renvoie une erreur 500. Avec un service hébergé, les questions partent chez un tiers.
- À revoir si : le produit a besoin de streaming ou de fonctions propres à un fournisseur, ou si un fournisseur retenu n'expose pas le format OpenAI.
