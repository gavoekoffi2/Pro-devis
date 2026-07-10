import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ArtisanHero, ArtisanWoman, TradeAvatar } from "@/components/illustrations";
import { Reveal, CountUp } from "@/components/Reveal";
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
    d: "Maçon, menuisier, peintre, électricien… L'application s'adapte automatiquement à votre travail.",
  },
  {
    t: "Entrez les dimensions",
    d: "Longueur, hauteur, quantité… Pro Devis calcule seul les matériaux, la main-d'œuvre et le total.",
  },
  {
    t: "Envoyez le devis",
    d: "Un devis professionnel en PDF, prêt à imprimer en A4/A5 ou à partager sur WhatsApp en un clic.",
  },
];

const BENEFITS = [
  ["⏱️", "Gagnez des heures", "Un devis en 2 minutes au lieu d'une heure de calculs."],
  ["📄", "Image professionnelle", "Des modèles premium qui inspirent confiance à vos clients."],
  ["✅", "Zéro erreur de calcul", "Des totaux toujours justes, sans oubli de matériaux."],
  ["🖨️", "Impression A4 / A5", "Économisez le papier et l'encre sur chaque devis."],
  ["👥", "Carnet clients intégré", "Tout l'historique de vos clients réuni au même endroit."],
  ["📱", "Pensé pour le chantier", "Mobile-first, utilisable directement depuis votre téléphone."],
];

const TESTIMONIALS = [
  {
    name: "Kossi A.",
    job: "Maçon, Lomé",
    tone: "warm" as const,
    text: "Avant je faisais mes devis à la main. Maintenant je les fais devant le client en 2 minutes. Ça m'a fait gagner des chantiers.",
  },
  {
    name: "Aïcha D.",
    job: "Menuisière alu, Kara",
    tone: "deep" as const,
    text: "Les modèles sont vraiment beaux. Mes clients pensent que j'ai une grande entreprise !",
  },
  {
    name: "Mensah K.",
    job: "Entrepreneur BTP, Lomé",
    tone: "brown" as const,
    text: "Plus d'erreurs de calcul. Le total est toujours juste et je partage le PDF direct sur WhatsApp.",
  },
];

const STATS = [
  { value: 2, suffix: " min", label: "pour créer un devis complet" },
  { value: 8, suffix: "", label: "métiers du bâtiment couverts" },
  { value: 68, suffix: "", label: "matériaux avec prix locaux" },
  { value: 100, suffix: "%", label: "hors-ligne sur le chantier" },
];

const FAQ = [
  {
    q: "Faut-il savoir utiliser un ordinateur ?",
    a: "Non. Pro Devis est pensé pour le téléphone. Vous choisissez votre métier, vous entrez quelques mesures, et le devis se fait tout seul. Aussi simple qu'envoyer un message WhatsApp.",
  },
  {
    q: "Les calculs sont-ils adaptés à mon métier ?",
    a: "Oui. Chaque métier a ses propres matériaux, unités et formules (surface, volume, périmètre, pertes, main-d'œuvre). Vous pouvez aussi ajuster tous les prix à vos tarifs et à votre ville.",
  },
  {
    q: "Combien ça coûte ?",
    a: "C'est gratuit pour vos 3 premiers devis chaque mois, sans carte bancaire. Pour des devis illimités et tous les modèles premium, passez au plan Pro à 5 000 FCFA/mois.",
  },
  {
    q: "Mes clients peuvent-ils accepter le devis en ligne ?",
    a: "Oui. Chaque devis a un lien privé que le client ouvre sans compte pour le consulter et l'accepter. Un tampon « Devis accepté » apparaît alors automatiquement sur le PDF.",
  },
  {
    q: "Est-ce que je peux mettre mon logo et mes coordonnées ?",
    a: "Bien sûr. Ajoutez votre logo, votre en-tête, votre WhatsApp, vos conditions de paiement et votre couleur de marque. Sinon, un logo professionnel est généré automatiquement pour vous.",
  },
];

const PLANS = [
  {
    name: "Gratuit",
    price: "0 FCFA",
    period: "/ mois",
    tagline: "Pour démarrer sans risque",
    features: ["3 devis par mois", "Tous les métiers", "Modèle simple", "Export PDF & WhatsApp"],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  {
    name: "Pro",
    price: "5 000 FCFA",
    period: "/ mois",
    tagline: "Le choix des artisans qui grandissent",
    features: [
      "Devis illimités",
      "Tous les modèles premium",
      "Impression A4 & A5",
      "Carnet clients illimité",
      "Logo & en-tête personnalisés",
      "Devis → facture & suivi paiement",
    ],
    cta: "Passer au Pro",
    highlight: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    period: "",
    tagline: "Pour les équipes et le multi-villes",
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
      <header className="sticky top-0 z-40 glass border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <div className="text-2xl font-extrabold text-brand-600">
            Pro<span className="text-accent-500">Devis</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#solution" className="hover:text-brand-600 transition">Solution</a>
            <a href="#etapes" className="hover:text-brand-600 transition">Comment ça marche</a>
            <a href="#exemples" className="hover:text-brand-600 transition">Modèles</a>
            <a href="#tarifs" className="hover:text-brand-600 transition">Tarifs</a>
          </nav>
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
        {/* halos décoratifs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-24 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center relative">
          <div className="animate-fade-up">
            <span className="badge bg-brand-50 text-brand-700 mb-5 gap-1.5">
              🌍 Conçu pour les artisans africains
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight text-slate-900">
              Vos devis professionnels,{" "}
              <span className="text-gradient">prêts en 2 minutes.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              Fini les calculs à la main et les feuilles froissées. Choisissez
              votre métier, entrez vos mesures — Pro Devis calcule les matériaux,
              la main-d'œuvre et le total, puis génère un devis PDF que vos clients
              respectent.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary text-lg shadow-lg shadow-brand-600/20">
                Créer mon premier devis — gratuit
              </Link>
              <Link href="#exemples" className="btn-ghost text-lg">
                Voir un exemple
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              ✓ Gratuit pour vos 3 premiers devis · ✓ Aucune carte requise · ✓ Prêt sur téléphone
            </p>
          </div>
          <div className="animate-fade-in delay-200 relative">
            <ArtisanHero className="w-full max-w-md mx-auto animate-float drop-shadow-xl" />
          </div>
        </div>

        {/* BARRE DE STATISTIQUES */}
        <div className="border-y border-slate-100 bg-slate-50/60">
          <div className="mx-auto max-w-6xl px-5 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={(i % 4) as 0 | 1 | 2 | 3} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-brand-600">
                  <CountUp to={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLÈME */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <Reveal>
            <span className="badge bg-red-50 text-red-600 mb-3">Le problème</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Faire un devis à la main vous coûte des chantiers
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              Chaque devis approximatif, c'est un client qui hésite et une marge
              qui s'envole.
            </p>
          </Reveal>
          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
            {[
              ["😓", "Du temps perdu", "Des heures de calculs le soir au lieu de vous reposer ou de travailler."],
              ["❌", "Des erreurs coûteuses", "Un matériau oublié, un total faux — et c'est votre marge qui paie."],
              ["📃", "Peu crédible", "Un devis griffonné n'inspire pas confiance face à un concurrent soigné."],
            ].map(([i, t, d], idx) => (
              <Reveal key={t} delay={(idx + 1) as 1 | 2 | 3} className="card p-6 hover:shadow-md transition">
                <div className="text-3xl">{i}</div>
                <div className="font-semibold mt-3 text-slate-900">{t}</div>
                <div className="text-sm text-slate-500 mt-1.5">{d}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section id="solution" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <ArtisanWoman className="w-full max-w-sm mx-auto drop-shadow-lg" />
          </Reveal>
          <Reveal delay={1}>
            <span className="badge bg-accent-500/10 text-accent-600 mb-3">La solution</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Pro Devis fait les calculs à votre place
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              Vous entrez les mesures, l'application s'occupe des matériaux, des
              quantités, de la main-d'œuvre et du total. Vous obtenez un devis
              professionnel en PDF, imprimable et partageable en un instant.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Calcul automatique adapté à chaque métier",
                "Prix locaux modifiables selon votre ville",
                "Devis prêt pour WhatsApp et l'impression",
                "Acceptation en ligne par vos clients",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-accent-500 text-white text-sm flex items-center justify-center">✓</span>
                  <span className="text-slate-700">{f}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="etapes" className="relative gradient-brand text-white py-20 overflow-hidden">
        <div className="mx-auto max-w-5xl px-5 relative">
          <Reveal className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">Trois étapes, un devis prêt</h2>
            <p className="mt-3 text-white/85 text-lg">Aussi simple que d'envoyer un message.</p>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.t} delay={(i + 1) as 1 | 2 | 3} className="glass !bg-white/10 rounded-2xl p-6 border border-white/15">
                <div className="h-12 w-12 rounded-2xl bg-white text-brand-600 flex items-center justify-center text-xl font-extrabold shadow-lg">
                  {i + 1}
                </div>
                <div className="font-bold text-lg mt-4">{s.t}</div>
                <div className="text-white/80 mt-2 text-sm leading-relaxed">{s.d}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MÉTIERS — bandeau défilant */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Tous les métiers du bâtiment</h2>
            <p className="mt-3 text-slate-600">
              Chaque métier a ses matériaux, ses unités et ses formules de calcul.
            </p>
          </Reveal>
        </div>
        {/* Marquee */}
        <div className="mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div className="flex gap-4 w-max animate-marquee">
            {[...TRADES, ...TRADES].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="card px-6 py-4 flex items-center gap-3 whitespace-nowrap shrink-0"
              >
                <span className="text-3xl">{t.icon}</span>
                <span className="font-semibold text-sm text-slate-700">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODÈLES PREMIUM */}
      <section id="exemples" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <span className="badge bg-brand-50 text-brand-700 mb-3">Modèles premium</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Un devis qui vous ressemble</h2>
            <p className="mt-3 text-slate-600">
              Choisissez parmi 8 modèles élégants, en format A4 ou A5.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TEMPLATES.map((t, i) => (
              <Reveal key={t.id} delay={(i % 4) as 0 | 1 | 2 | 3} className="card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition">
                <div
                  className="h-24 flex items-end p-3"
                  style={{
                    background: `linear-gradient(120deg, ${t.swatch[0]}, ${t.swatch[1]})`,
                  }}
                >
                  <div className="h-2 w-16 bg-white/80 rounded" />
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold flex items-center gap-1 text-slate-900">
                    {t.name}
                    {t.badge && (
                      <span className="badge bg-amber-100 text-amber-700 text-[9px] !px-1.5 !py-0">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t.description}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Pourquoi les artisans adorent Pro Devis
            </h2>
          </Reveal>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(([i, t, d], idx) => (
              <Reveal key={t} delay={(idx % 4) as 0 | 1 | 2 | 3} className="card p-5 flex gap-4 hover:shadow-md transition">
                <div className="text-2xl">{i}</div>
                <div>
                  <div className="font-semibold text-slate-900">{t}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Ils ont gagné du temps — et des chantiers
            </h2>
          </Reveal>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={(i + 1) as 1 | 2 | 3} className="card p-6 flex flex-col">
                <div className="text-amber-400 text-lg">★★★★★</div>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed flex-1">« {t.text} »</p>
                <div className="mt-5 flex items-center gap-3">
                  <TradeAvatar tone={t.tone} className="h-11 w-11" label={`${t.name}, ${t.job}`} />
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.job}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="py-20">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Des prix simples et honnêtes</h2>
            <p className="mt-3 text-slate-600">Commencez gratuitement, passez au Pro quand vous êtes prêt.</p>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-3 gap-6 items-start">
            {PLANS.map((p, i) => (
              <Reveal
                key={p.name}
                delay={(i + 1) as 1 | 2 | 3}
                className={`card p-6 ${
                  p.highlight ? "ring-2 ring-brand-500 shadow-xl relative sm:-mt-2 sm:mb-2" : ""
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-brand-600 text-white">
                    Le plus populaire
                  </span>
                )}
                <div className="font-bold text-lg text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{p.tagline}</div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">{p.price}</span>
                  <span className="text-slate-400">{p.period}</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-accent-500 mt-0.5">✓</span>
                      <span className="text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 w-full ${p.highlight ? "btn-primary" : "btn-ghost"}`}
                >
                  {p.cta}
                </Link>
              </Reveal>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">
            Paiement par Mobile Money, Flooz, T-Money ou carte — bientôt disponible.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Questions fréquentes</h2>
            <p className="mt-3 text-slate-600">Tout ce qu'il faut savoir avant de commencer.</p>
          </Reveal>
          <div className="mt-10 space-y-3">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={(i % 3) as 0 | 1 | 2}>
                <details className="card p-5 group">
                  <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-brand-600 text-xl transition-transform group-open:rotate-45 shrink-0">+</span>
                  </summary>
                  <p className="mt-3 text-slate-600 text-sm leading-relaxed">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative gradient-brand text-white py-20 overflow-hidden">
        <div className="mx-auto max-w-3xl px-5 text-center relative">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Prêt à faire vos devis comme un pro ?
            </h2>
            <p className="mt-4 text-white/90 text-lg">
              Rejoignez les artisans africains qui gagnent du temps, rassurent
              leurs clients et remportent plus de chantiers.
            </p>
            <Link href="/register" className="btn bg-white text-brand-700 hover:bg-slate-100 text-lg mt-8 inline-flex shadow-xl">
              Créer mon premier devis gratuitement
            </Link>
            <p className="mt-4 text-sm text-white/70">Sans carte bancaire · Prêt en 2 minutes</p>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="mx-auto max-w-6xl px-5 flex flex-col sm:flex-row justify-between gap-6">
          <div className="max-w-sm">
            <div className="text-xl font-extrabold text-white">
              Pro<span className="text-accent-500">Devis</span>
            </div>
            <p className="text-sm mt-2 leading-relaxed">
              Le générateur de devis professionnels pensé pour les artisans du
              bâtiment en Afrique de l'Ouest.
            </p>
          </div>
          <div className="flex gap-8 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-white font-semibold">Produit</span>
              <a href="#solution" className="hover:text-white transition">Solution</a>
              <a href="#exemples" className="hover:text-white transition">Modèles</a>
              <a href="#tarifs" className="hover:text-white transition">Tarifs</a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-white font-semibold">Compte</span>
              <Link href="/login" className="hover:text-white transition">Connexion</Link>
              <Link href="/register" className="hover:text-white transition">Inscription</Link>
            </div>
          </div>
        </div>
        <div className="text-center text-xs mt-10 border-t border-slate-800 pt-6">
          © {new Date().getFullYear()} Pro Devis · Fait avec ❤️ pour les artisans · Lomé, Togo
        </div>
      </footer>
    </div>
  );
}
