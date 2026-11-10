# 0001. Construire l'application en TypeScript : API Express, front Vite sans framework

- Statut : proposée
- Date : 2026-11-10
- Décideurs : Fouad

## Contexte

La stack est imposée par le cours « Environnements de dev prêts pour la production ». Le projet de départ fourni contient une API Node 24 en TypeScript avec Express et `pg`, un front Vite en TypeScript sans framework, et un Dev Container préconfiguré pour cette stack. Le hackathon dure deux semaines, et la tranche verticale doit tourner pour le pitch du 13 novembre. Le produit est simple : une page envoie une question, l'API la soumet à l'IA et stocke la réponse.

## Options

1. Garder la stack imposée : conforme au sujet, le Dev Container et le code de départ marchent déjà. Un seul langage du front à la base. Le front sans framework deviendra pénible si l'interface grossit.
2. Passer à Python/FastAPI pour l'API et React pour le front : stack que Fouad pratique au quotidien, documentation OpenAPI générée par FastAPI. Hors du cadre du cours : il faudrait refaire le Dev Container et le code de départ, avec deux langages dans l'équipe.
3. Garder l'API Express et ajouter React au front : composants et état mieux organisés. Une dépendance et un outillage de plus, pour une page qui tient aujourd'hui en un formulaire et une liste.

## Décision

Nous choisissons l'option 1 parce que la stack est imposée et que le délai de deux semaines ne laisse pas de place pour refaire l'environnement. TypeScript partout permet à tout le monde de relire tout le code. L'API vit dans `api/`, le front dans `web/`, réunis en workspaces npm et lancés ensemble par `npm run dev`.

## Conséquences

- Positives : un seul langage et un seul gestionnaire de paquets. Le Dev Container fourni s'applique tel quel. La CI vérifie les types de l'API et construit le front avec les mêmes commandes qu'en local.
- Négatives, à accepter : Express ne valide pas les entrées et ne génère pas d'OpenAPI : la validation et le fichier `openapi.yaml` sont à écrire à la main. Sans framework, le front manipule le DOM directement.
- À revoir si : le front dépasse quelques écrans, ce qui justifierait un nouvel ADR pour adopter un framework.
