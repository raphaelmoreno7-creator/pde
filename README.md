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
- interphone visuel simulé ;
- navigation vers rendez-vous et archives.

Les dossiers historiques et les autres fonctions (appels simulés, rendez-vous, pièces jointes, journal détaillé) seront ajoutés progressivement.
