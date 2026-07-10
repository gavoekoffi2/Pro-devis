# CLAUDE.md — Guide développeur Pro Devis

Générateur de devis professionnels pour artisans du bâtiment en Afrique de
l'Ouest (Togo). Ce fichier oriente tout développeur (humain ou IA) qui reprend
le projet.

## Stack

- **Next.js 16** (App Router, Turbopack) · React 19 · TypeScript
- **Tailwind CSS** (mobile-first) — design system dans `app/globals.css`
- **PostgreSQL + Prisma** — schéma dans `prisma/schema.prisma`
- **Auth** : JWT signé (jose) en cookie httpOnly + bcrypt (`lib/auth.ts`)
- **IA optionnelle** : OpenRouter (`lib/ai.ts`), activée si `OPENROUTER_API_KEY`
- **Déploiement** : Netlify (`netlify.toml`)

## Démarrage

```bash
npm install
cp .env.example .env        # renseigner DATABASE_URL et AUTH_SECRET
npm run db:push             # crée les tables
npm run db:seed             # charge le catalogue métiers + matériaux
npm run dev                 # http://localhost:3000
```

`AUTH_SECRET` est **obligatoire en production** (≥ 32 caractères). Générer :
`openssl rand -base64 48`.

## Architecture

```
app/
  (auth)/        login, register            — non authentifié
  (app)/         dashboard, devis, clients, materiaux, parametres — authentifié
  d/[publicId]/  page client publique (consultation + acceptation)
  devis/[id]/    apercu (choix modèle), imprimer (PDF)
  api/           routes REST
lib/
  auth.ts        sessions JWT / bcrypt / requireUser
  calc.ts        moteur de calcul (métriques, lignes, totaux, TVA)
  materials.ts   résolution des prix (global vs entreprise) + numérotation
  ai.ts          brouillon de devis + estimation de prix (OpenRouter)
  plans.ts       limites des plans SaaS (SOURCE UNIQUE)
  sanitize.ts    nettoyage anti-XSS des entrées
  rate-limit.ts  limiteur de débit (in-memory)
components/       UI (formulaires, actions devis, modèles PDF, illustrations)
prisma/           schema + seed (catalogue data-driven)
```

## Conventions & règles importantes

### Sécurité (à respecter pour toute nouvelle route)
1. **Toujours** authentifier les routes privées via `requireUser()` et vérifier
   l'appartenance : `resource.companyId === user.companyId`.
2. **Toujours** nettoyer les entrées texte avec `lib/sanitize.ts` avant écriture
   en base (les champs finissent dans des PDF → risque XSS).
3. Rate-limiter les endpoints sensibles ou coûteux (auth, IA) via
   `lib/rate-limit.ts`.
4. Ne jamais renvoyer de détails d'erreur internes au client (journaliser côté
   serveur uniquement).
5. Valider le format des identifiants publics (UUID) avant requête DB.

> ⚠️ `rate-limit.ts` est un store **en mémoire par instance**. En production
> serverless multi-instances, le remplacer par un store partagé (Upstash/Redis).

### Données
- Le **référentiel métiers** (matériaux, types de travaux, formules) est
  entièrement en base : ajouter un métier = ajouter des données dans `seed.ts`,
  sans toucher au code.
- Les montants sont **calculés puis stockés** sur le devis (`computeTotals`).
- Les infos client sont **figées** sur le devis au moment de la création.

### Plans SaaS
- Limites centralisées dans `lib/plans.ts`. Ne jamais recoder « 3 devis/mois »
  en dur ailleurs — importer `FREE_MONTHLY_LIMIT` / `canCreateQuote`.
- L'abonnement (`plan`) est porté par **Company**, pas par User : toute l'équipe
  partage le même plan.

### Accès multi-utilisateurs (équipe)
- Une entreprise peut avoir plusieurs `User`, chacun avec un `companyRole`
  (`OWNER` / `ADMIN` / `MEMBER`). Le créateur est `OWNER`.
- Gestion via `/equipe` ; API sous `/api/team/*`. Seuls OWNER/ADMIN gèrent
  l'équipe (`canManageTeam`). Fonctionnalité réservée aux plans payants
  (`canUseTeam`), quota par plan (`maxTeamMembers`).
- Invitation par lien signé (`Invitation.token`, expiration 7 j) ; le
  collaborateur crée son compte via `/rejoindre/[token]`.

## Vérifications avant commit

```bash
npx tsc --noEmit        # types
npm run build           # build complet (nécessite AUTH_SECRET défini)
```

## Évolutions prévues
- Paiement Mobile Money / Flooz / T-Money pour les abonnements
- Store de rate-limiting partagé (Redis) pour la production
- Espace admin (métiers, formules, statistiques)
- Notifications email (bienvenue, devis accepté)
- Accès multi-utilisateurs par entreprise (rôles)
