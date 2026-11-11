# Palais des Enquêtes

Première base responsive du bureau P.D.E., conçue pour fonctionner sur Mac et iPad avec une connexion et une sauvegarde cloud.

## Mise en route du cloud

1. Créer un projet Supabase et un utilisateur de connexion pour Camille Lou.
2. Coller le contenu de `supabase/schema.sql` dans le SQL Editor du projet et l'exécuter.
3. Copier l'URL du projet et sa clé publishable dans `src/config.js`.
4. Publier le dossier du site sur un hébergeur web relié au dépôt GitHub.

Les tables sont protégées avec Row Level Security : un compte ne peut accéder qu'à ses propres dossiers. La clé secrète/service role ne doit jamais être mise dans le navigateur ni dans GitHub. Tant que `src/config.js` n'est pas renseigné, l'application affiche l'écran de préparation et n'enregistre aucune donnée localement.

## Version actuelle

- écran de préparation cloud ;
- connexion par e-mail et mot de passe ;
- tableau de bord responsive ;
- création et mise à jour cloud des dossiers ;
- import des dossiers historiques des documents PDE ;
- suppression confirmée des dossiers (après activation de la politique SQL dédiée) ;
- interphone visuel simulé ;
- quatre vues de caméras simulées avec commandes d'activation ;
- navigation vers rendez-vous et archives.

Les dossiers historiques et les autres fonctions (appels simulés, rendez-vous, pièces jointes, journal détaillé) seront ajoutés progressivement.

## Activer les fonctions IA

Le code IA sécurisé se trouve dans `supabase/functions/pde-ai/`. La clé OpenAI ne doit jamais être ajoutée à `config.js`, au site GitHub Pages ou envoyée dans une conversation. Configure-la comme secret `OPENAI_API_KEY` des fonctions Edge Supabase, puis publie la fonction `pde-ai`. Configure aussi le secret `OPENAI_MODEL` si tu veux choisir un autre modèle (par défaut : `gpt-4.1-mini`).

Exécute ensuite `supabase/ai-consent.sql` dans le SQL Editor Supabase. Dans l’application, Lili demande une confirmation avant chaque brouillon envoyé à OpenAI. Les réponses automatiques et rapports de laboratoire générés par l’IA sont désactivés par défaut et s’activent séparément dans chaque message ou demande d’analyse. L’API OpenAI peut être facturée séparément de ChatGPT.
