# Pro Devis 🧱📄

Application web/mobile de **génération automatique de devis professionnels**
pour les artisans du bâtiment en Afrique (Togo).

Choisissez votre métier, entrez les dimensions, et l'application calcule
automatiquement les matériaux, quantités, main-d'œuvre et le total — puis
génère un devis professionnel imprimable / partageable sur WhatsApp.

---

## ✨ Fonctionnalités (MVP)

- **Authentification** artisan/entreprise (inscription, connexion sécurisée JWT).
- **Profil entreprise** : logo, coordonnées, WhatsApp, conditions de paiement,
  validité, TVA, devise.
- **8 métiers** prêts à l'emploi : maçonnerie, menuiserie alu, menuiserie bois,
  peinture, électricité, plomberie, carrelage, architecture.
- **Base de matériaux** (68 matériaux) avec prix locaux modifiables et marge.
- **Assistant de devis en 5 étapes** : client → métier → type de travail →
  mesures → devis calculé et éditable.
- **Moteur de calcul** data-driven (recettes par type de travail, surface,
  volume, périmètre, pertes, main-d'œuvre, transport).
- **8 modèles de devis premium** (Simple, Moderne, BTP, Architecte, Artisan,
  Luxe, Économique, Identité forte) en **A4 ou A5**, avec aperçu en direct.
- **Logo & en-tête générés automatiquement** (monogramme SVG) à partir du nom,
  du métier et de la couleur de marque — ou import d'un logo / en-tête existant.
- **Page d'aperçu éditable** : changer le modèle, le format, corriger les
  textes, prix et lignes, ajouter des **instructions spéciales**, vérifier le
  total — puis valider avant impression.
- **Devis PDF** professionnel (logo, tableau détaillé, totaux, conditions,
  instructions spéciales, « Bon pour accord »), imprimable et partageable WhatsApp.
- **Page d'accueil marketing** complète (hero, problème/solution, étapes,
  métiers, modèles, témoignages, tarifs, CTA).
- **Devis multi-postes** : plusieurs types de travaux + lignes libres dans un
  même devis, regroupés par poste (sections) dans le PDF.
- **Assistant IA** (optionnel) : décrivez le chantier en langage naturel →
  l'IA propose postes, quantités et prix ; **estimation des prix du marché**
  par recherche web. Branché sur OpenRouter (voir `.env.example`).
- **Facture & paiement** : conversion devis → facture, acompte, solde,
  statut payé/partiel/impayé.
- **Acceptation en ligne** : lien client public (`/d/...`) pour consulter et
  accepter/refuser le devis sans compte ; tampon « Devis accepté » sur le PDF.
- **Mode légal optionnel** : NIF/RCCM **désactivés par défaut** (la plupart des
  artisans ne sont pas formalisés) ; montant en toutes lettres automatique.
- **PWA** : application installable sur téléphone, tolérante au hors-ligne.
- **Recherche & filtres** sur les devis et les clients.
- **Historique** des devis : liste, détail, statut, duplication, suppression.
- **Mini-CRM clients** avec historique (nombre de devis, montant cumulé) et
  création de devis pré-rempli en un clic.
- **Tableau de bord orienté action** : montant accepté, encaissé, taux
  d'acceptation, devis **à relancer** (sans réponse depuis 3 jours) et
  paiements **à encaisser** — relance WhatsApp en 1 clic.
- **Reçu de paiement WhatsApp** : après un acompte ou un solde, envoyez la
  preuve de paiement au client en un clic.
- **Devis expirés** détectés automatiquement (badge + alerte, suggestion de
  duplication).
- **Matériaux personnalisés** : ajoutez vos propres articles au catalogue,
  en plus de la surcharge des prix locaux.
- **Plans SaaS** : gratuit (3 devis/mois), Pro (illimité), Entreprise.

---

## 🏗️ Architecture

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind CSS (mobile-first) |
| Backend | Route Handlers Next.js (API REST) |
| Base de données | PostgreSQL + Prisma ORM |
| Authentification | JWT (cookie httpOnly, SameSite=Lax) + bcrypt |
| Validation | Zod sur toutes les entrées d'API |
| Qualité | TypeScript strict, ESLint, tests `node:test` |
| PDF | Vue HTML A4 imprimable → PDF / WhatsApp |

Le **référentiel métiers** (matériaux, types de travaux, formules de calcul)
est entièrement stocké en base : ajouter un métier = ajouter des données,
sans toucher au code.

### Schéma de données

```
User ─┐
      ├─ Company ─┬─ Client ─┐
      │           ├─ Quote ──┴─ QuoteItem
      │           └─ Material (prix propres à l'entreprise)
Trade ─┬─ WorkType (inputs + recipe JSON)
       └─ Material (catalogue global)
```

---

## 🚀 Démarrage

### Prérequis
- Node.js 22+
- PostgreSQL 14+

### Installation

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env
#   puis ajustez DATABASE_URL et AUTH_SECRET

# 3. Base de données : créer les tables et charger le catalogue
npm run db:push
npm run db:seed

# 4. Lancer en développement
npm run dev
# → http://localhost:3000
```

### Vérification (avant de pousser)

```bash
npm run verify      # typecheck + lint + tests unitaires
```

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (génère le client Prisma) |
| `npm start` | Serveur de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint (`next lint` n'existe plus depuis Next.js 16) |
| `npm test` | Tests unitaires (calcul, montants en lettres, statuts, marque) |
| `npm run verify` | Les trois précédents, comme en intégration continue |
| `npm run db:push` | Synchronise le schéma avec la base |
| `npm run db:seed` | Charge le catalogue métiers (idempotent) |

### Production

```bash
npm run build
npm start
```

---

## 📂 Structure

```
app/
  (auth)/login, register        Pages d'authentification
  (app)/dashboard               Tableau de bord
  (app)/devis                   Liste / détail des devis
  (app)/devis/nouveau           Assistant de création (5 étapes)
  (app)/clients                 Mini-CRM
  (app)/materiaux               Gestion des prix
  (app)/parametres              Profil entreprise + abonnement
  devis/[id]/imprimer           Devis PDF imprimable
  api/                          Routes API REST
  error.tsx / not-found.tsx     Pages d'erreur et 404
  robots.ts                     Exclusion des pages privées des moteurs
lib/
  calc.ts                       Moteur de calcul
  materials.ts                  Résolution des prix entreprise
  auth.ts                       Sessions JWT / bcrypt, garde « entreprise »
  session.ts                    Garde d'accès des pages (Server Components)
  api.ts                        Helpers d'API (auth, erreurs, garde 500)
  validation.ts                 Schémas Zod partagés (URLs d'image, couleurs)
  quote-input.ts                Validation des lignes de devis
  prisma.ts                     Client Prisma
prisma/
  schema.prisma                 Schéma de base de données
  seed.ts                       Catalogue métiers + matériaux
tests/                          Tests unitaires (node:test + tsx)
```

---

## 🔒 Sécurité & notes de production

- **`AUTH_SECRET` obligatoire en production** (16 caractères minimum).
  L'application refuse de démarrer si la variable est absente, trop courte
  **ou égale à la valeur d'exemple** — un secret public permettrait de forger
  n'importe quelle session. Générez-le avec `openssl rand -base64 32`.
- **Cloisonnement par entreprise** : chaque requête de devis, client ou
  matériau filtre sur `companyId` directement en base. Un compte sans
  entreprise est rejeté (400) au lieu de retomber sur `companyId = null`,
  qui désigne le **catalogue global** partagé.
- **Validation systématique** : toutes les entrées d'API passent par Zod
  (bornes de texte, énumérations, montants, plafond de 300 lignes par devis).
  Une saisie invalide donne un 400 explicite, jamais un 500.
- **URLs d'images** (logo, en-tête, cachet) restreintes à `http(s)://` et
  `data:image/…`.
- **En-têtes de sécurité** : CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  HSTS, `Permissions-Policy`. Les liens publics `/d/…` portent en plus un
  `X-Robots-Tag: noindex` et sont exclus par `robots.txt` : ils contiennent
  le nom, le téléphone et l'adresse du client.
- **Authentification** : limitation de débit par adresse IP **et par email**
  (force brute répartie), plus une comparaison bcrypt factice quand l'email
  est inconnu — sinon le temps de réponse révèle les comptes existants.
  Cookie `httpOnly`, `SameSite=Lax`, `Secure` en production.
- **Endpoints IA** limités en débit : chaque appel est facturé par le
  fournisseur, un compte compromis suffirait à faire exploser la note.
- Le limiteur de débit est **en mémoire** : prévoir Redis pour du
  multi-instance.
- Les numéros de devis sont uniques par entreprise (contrainte en base) et
  repartent du dernier numéro attribué, jamais d'un simple comptage.
- Un devis **périmé ne peut plus être accepté en ligne** : le prix affiché
  n'engage plus l'artisan.
- Le déploiement GitHub Actions synchronise le schéma (`prisma db push`)
  et le catalogue métiers (seed idempotent) avant chaque mise en production.

> ⚠️ **Migration** : le schéma ajoute une contrainte d'unicité
> `Material(companyId, key)`. Si une base existante contient deux prix pour
> la même clé dans une même entreprise, supprimez le doublon avant
> `npm run db:push`.

## 🔜 Évolutions prévues

- Paiement Mobile Money / Flooz / TMoney pour les abonnements.
- Réinitialisation de mot de passe (nécessite un service d'email/SMS).
- Révocation de session côté serveur (les jetons sont valables 30 jours).
- Recherche automatique des prix fournisseurs.
- Upload de logo (stockage objet) au lieu d'une URL.
- Espace admin (métiers, formules, abonnements, statistiques).
- Application mobile native (Expo).
