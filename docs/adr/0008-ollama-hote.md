# 0008. Permettre au copilote d'utiliser l'Ollama de la machine hôte

- Statut : proposée
- Date : 2026-11-12
- Décideurs : Fouad

## Contexte

Depuis l'ADR 0007, le copilote fait rédiger ses réponses par `llama3.2:3b`, servi par le service `ollama` de `compose.yaml`. Sur Mac, Docker n'accède pas à la puce graphique : le modèle tourne sur le processeur. Mesures sur la machine de développement (issue #26) : 107 secondes pour une nouvelle question, dont 36 s pour lire 1 850 tokens de contexte et 70 s pour écrire la réponse à 4 tokens par seconde ; 132 s juste après un redémarrage. nginx coupait à 120 s et le navigateur affichait une erreur 504. La démo de m2 dure 2 minutes et exige que `docker compose up` lance la tranche complète.

## Options

1. Garder Ollama dans Compose et allonger les délais : `docker compose up` reste autonome. L'erreur 504 disparaît, mais une réponse prend toujours une à deux minutes.
2. Passer le copilote sur `llama3.2:1b` : deux à trois fois plus rapide, tout reste dans Docker. Réponses moins bonnes, alors que l'équipe data a choisi le 3b après un comparatif (`benchmark_llm.pdf`).
3. Rendre l'adresse d'Ollama configurable, avec l'Ollama de Compose par défaut : sur un Mac où Ollama est installé, le copilote utilise la puce graphique. Sans configuration, rien ne change.

## Décision

Nous choisissons l'option 3, avec le délai de nginx porté à 300 secondes comme filet de sécurité. Le copilote lit `OLLAMA_HOST` depuis `${COPILOT_OLLAMA_HOST:-http://ollama:11434}`. Pour la démo, un fichier `.env` à la racine, non commité, contient `COPILOT_OLLAMA_HOST=http://host.docker.internal:11434`.

## Conséquences

- Positives : sans `.env`, `docker compose up` fonctionne seul comme avant. Avec, les réponses profitent de la puce graphique du Mac. Le modèle choisi par l'équipe data est conservé.
- Négatives, à accepter : en mode rapide, la démo dépend d'Ollama installé sur la machine qui présente, avec `llama3.2:3b` et `nomic-embed-text` téléchargés : il faut l'annoncer. Le service `ollama-pull` télécharge quand même les modèles dans Compose, même s'ils ne servent pas. Une attente de cinq minutes reste possible sans `.env`.
- À revoir si : la démo se fait sur une machine sans Ollama, ou si le copilote passe à un modèle hébergé.
