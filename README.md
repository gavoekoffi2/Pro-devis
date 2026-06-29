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
- **Historique** des devis : liste, détail, statut, duplication, suppression.
- **Mini-CRM clients**.
- **Tableau de bord** : nombre de devis, montant total, acceptés, en attente.
- **Plans SaaS** : gratuit (3 devis/mois), Pro (illimité), Entreprise.

---

## 🏗️ Architecture

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router) + React + Tailwind CSS (mobile-first) |
| Backend | Route Handlers Next.js (API REST) |
| Base de données | PostgreSQL + Prisma ORM |
| Authentification | JWT (cookie httpOnly) + bcrypt |
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
- Node.js 20+
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
lib/
  calc.ts                       Moteur de calcul
  materials.ts                  Résolution des prix entreprise
  auth.ts                       Sessions JWT / bcrypt
  prisma.ts                     Client Prisma
prisma/
  schema.prisma                 Schéma de base de données
  seed.ts                       Catalogue métiers + matériaux
```

---

## 🔜 Évolutions prévues

- Paiement Mobile Money / Flooz / TMoney pour les abonnements.
- Recherche automatique des prix fournisseurs.
- Upload de logo (stockage objet) au lieu d'une URL.
- Espace admin (métiers, formules, abonnements, statistiques).
- Conversion devis → facture.
- Application mobile native (Expo).
