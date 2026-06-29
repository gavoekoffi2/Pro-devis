import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ArtisanHero, StepIcon } from "@/components/illustrations";
import { TEMPLATES } from "@/lib/quote-view";

const TRADES = [
  { name: "Maçonnerie", icon: "🧱" },
  { name: "Menuiserie alu", icon: "🪟" },
  { name: "Menuiserie bois", icon: "🪵" },
  { name: "Peinture", icon: "🎨" },
  { name: "Électricité", icon: "💡" },
  { name: "Plomberie", icon: "🚰" },
  { name: "Carrelage", icon: "◻️" },
  { name: "Architecture", icon: "📐" },
];

const STEPS = [
  {
    t: "Choisissez votre métier",
    d: "Maçon, menuisier, peintre, électricien… L'app s'adapte automatiquement à votre travail.",
  },
  {
    t: "Entrez les dimensions",
    d: "Longueur, hauteur, quantité… L'application calcule seule les matériaux, la main-d'œuvre et le total.",
  },
  {
    t: "Téléchargez le devis",
    d: "Un devis professionnel en PDF, prêt à imprimer en A4/A5 ou à envoyer sur WhatsApp.",
  },
];

const BENEFITS = [
  ["⏱️", "Gain de temps", "Un devis en 2 minutes au lieu d'une heure."],
  ["📄", "Devis professionnel", "Des modèles premium qui inspirent confiance."],
  ["✅", "Moins d'erreurs", "Des calculs fiables, sans oubli de matériaux."],
  ["🖨️", "Impression A4 / A5", "Économisez le papier et l'encre."],
  ["👥", "Carnet clients", "Tout l'historique de vos clients au même endroit."],
  ["📱", "Sur téléphone", "Pensé mobile-first, utilisable sur le chantier."],
];

const TESTIMONIALS = [
  {
    name: "Kossi A.",
    job: "Maçon, Lomé",
    text: "Avant je faisais mes devis à la main. Maintenant je les fais devant le client en 2 minutes. Ça m'a fait gagner des chantiers.",
  },
  {
    name: "Aïcha D.",
    job: "Menuisière alu, Kara",
    text: "Les modèles sont vraiment beaux. Mes clients pensent que j'ai une grande entreprise !",
  },
  {
    name: "Mensah K.",
    job: "Entrepreneur BTP, Lomé",
    text: "Plus d'erreurs de calcul. Le total est toujours juste et je partage le PDF direct sur WhatsApp.",
  },
];

const PLANS = [
  {
    name: "Gratuit",
    price: "0 FCFA",
    period: "/ mois",
    features: ["3 devis par mois", "Tous les métiers", "Modèle simple", "Export PDF"],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  {
    name: "Pro",
    price: "5 000 FCFA",
    period: "/ mois",
    features: [
      "Devis illimités",
      "Tous les modèles premium",
      "Impression A4 & A5",
      "Carnet clients illimité",
      "Logo & en-tête personnalisés",
    ],
    cta: "Passer au Pro",
    highlight: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    period: "",
    features: [
      "Plusieurs utilisateurs",
      "Modèles premium exclusifs",
      "Prix multi-villes",
      "Support prioritaire",
    ],
    cta: "Nous contacter",
    highlight: false,
  },
];

export default async function Landing() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="bg-white text-slate-800">
      {/* NAV */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <div className="text-2xl font-extrabold text-brand-600">
            Pro<span className="text-accent-500">Devis</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost btn-sm">
              Se connecter
            </Link>
            <Link href="/register" className="btn-primary btn-sm">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-up">
            <span className="badge bg-brand-50 text-brand-700 mb-4">
              🇹🇬 Conçu pour les artisans africains
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              Créez vos devis professionnels{" "}
              <span className="text-brand-600">en quelques minutes</span>, sans
              calculs compliqués.
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              Choisissez votre métier, entrez les dimensions, et l'application
              calcule les matériaux, la main-d'œuvre et le total — puis génère un
              devis PDF prêt à envoyer.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary text-lg">
                Créer mon premier devis gratuitement
              </Link>
              <Link href="#exemples" className="btn-ghost text-lg">
                Voir un exemple de devis
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Gratuit pour vos 3 premiers devis. Aucune carte requise.
            </p>
          </div>
          <div className="animate-fade-in delay-200">
            <ArtisanHero className="w-full max-w-md mx-auto animate-float" />
          </div>
        </div>
      </section>

      {/* PROBLÈME */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <h2 className="text-3xl font-bold">Faire un devis prend trop de temps</h2>
          <p className="mt-4 text-slate-600 text-lg">
            Aujourd'hui, beaucoup d'artisans font leurs devis à la main. Résultat :
          </p>
          <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
            {[
              ["😓", "Du temps perdu", "Des heures de calculs au lieu de travailler."],
              ["❌", "Des erreurs", "On oublie des matériaux, on se trompe dans les totaux."],
              ["📃", "Peu professionnel", "Des devis sur papier qui n'inspirent pas confiance."],
            ].map(([i, t, d]) => (
              <div key={t} className="card p-5">
                <div className="text-3xl">{i}</div>
                <div className="font-semibold mt-2">{t}</div>
                <div className="text-sm text-slate-500 mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="badge bg-accent-500/10 text-accent-600 mb-3">
            La solution
          </span>
          <h2 className="text-3xl font-bold">
            Pro Devis calcule et génère le devis à votre place
          </h2>
          <p className="mt-4 text-slate-600 text-lg">
            Vous entrez les mesures, l'application s'occupe des matériaux, des
            quantités, de la main-d'œuvre et du total. Vous obtenez un devis
            professionnel en PDF, imprimable et partageable.
          </p>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-brand-600 text-white py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-3xl font-bold text-center">
            Comment ça marche, en 3 étapes
          </h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div
                key={s.t}
                className="bg-white/10 rounded-2xl p-6 backdrop-blur animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <StepIcon n={i + 1} color="#16a34a" />
                <div className="font-bold text-lg mt-4">{s.t}</div>
                <div className="text-white/80 mt-2 text-sm">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÉTIERS */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <h2 className="text-3xl font-bold">Tous les métiers du bâtiment</h2>
          <p className="mt-3 text-slate-600">
            Chaque métier a ses matériaux, ses unités et ses formules de calcul.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TRADES.map((t) => (
              <div
                key={t.name}
                className="card p-5 hover:shadow-md transition hover:-translate-y-0.5"
              >
                <div className="text-4xl">{t.icon}</div>
                <div className="font-semibold mt-2 text-sm">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXEMPLES / MODÈLES PREMIUM */}
      <section id="exemples" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Des modèles de devis premium</h2>
            <p className="mt-3 text-slate-600">
              Choisissez le style qui vous ressemble, en format A4 ou A5.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TEMPLATES.map((t) => (
              <div key={t.id} className="card overflow-hidden">
                <div
                  className="h-20 flex items-end p-3"
                  style={{
                    background: `linear-gradient(120deg, ${t.swatch[0]}, ${t.swatch[1]})`,
                  }}
                >
                  <div className="h-2 w-16 bg-white/80 rounded" />
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold flex items-center gap-1">
                    {t.name}
                    {t.badge && (
                      <span className="badge bg-amber-100 text-amber-700 text-[9px] !px-1.5 !py-0">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-3xl font-bold text-center">
            Pourquoi les artisans adorent Pro Devis
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(([i, t, d]) => (
              <div key={t} className="card p-5 flex gap-3">
                <div className="text-2xl">{i}</div>
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="text-sm text-slate-500">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-3xl font-bold text-center">
            Ils ont gagné du temps
          </h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="text-amber-400 text-lg">★★★★★</div>
                <p className="mt-3 text-slate-600 text-sm">« {t.text} »</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.job}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-3xl font-bold text-center">Des prix simples</h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-6 items-start">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`card p-6 ${
                  p.highlight
                    ? "ring-2 ring-brand-500 shadow-lg relative"
                    : ""
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-brand-600 text-white">
                    Le plus populaire
                  </span>
                )}
                <div className="font-bold text-lg">{p.name}</div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold">{p.price}</span>
                  <span className="text-slate-400">{p.period}</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-accent-500">✓</span>
                      <span className="text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 w-full ${
                    p.highlight ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">
            Paiement par Mobile Money, Flooz, T-Money ou carte — bientôt
            disponible.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-brand-600 text-white py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            Prêt à faire vos devis comme un pro ?
          </h2>
          <p className="mt-4 text-white/85 text-lg">
            Rejoignez les artisans qui gagnent du temps et des chantiers avec Pro
            Devis.
          </p>
          <Link
            href="/register"
            className="btn-accent text-lg mt-7 inline-flex"
          >
            Créer mon premier devis gratuitement
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="mx-auto max-w-6xl px-5 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="text-xl font-extrabold text-white">
              Pro<span className="text-accent-500">Devis</span>
            </div>
            <p className="text-sm mt-1">
              Devis professionnels pour les artisans du bâtiment en Afrique.
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/login" className="hover:text-white">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-white">
              Inscription
            </Link>
            <a href="#exemples" className="hover:text-white">
              Modèles
            </a>
          </div>
        </div>
        <div className="text-center text-xs mt-8">
          © {new Date().getFullYear()} Pro Devis · Lomé, Togo
        </div>
      </footer>
    </div>
  );
}
