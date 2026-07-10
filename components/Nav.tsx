"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Liens de la navigation mobile (barre du bas, 5 colonnes).
const LINKS = [
  { href: "/dashboard", label: "Accueil", icon: "🏠" },
  { href: "/devis", label: "Devis", icon: "📄" },
  { href: "/clients", label: "Clients", icon: "👥" },
  { href: "/materiaux", label: "Prix", icon: "🏷️" },
  { href: "/parametres", label: "Profil", icon: "⚙️" },
];

// Liens supplémentaires affichés uniquement sur le menu latéral (desktop).
const SIDE_ONLY_LINKS = [{ href: "/equipe", label: "Équipe", icon: "🧑‍🤝‍🧑" }];

export function TopBar({ companyName }: { companyName: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <header className="no-print sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-extrabold text-brand-600">
          Pro<span className="text-accent-500">Devis</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-slate-500 max-w-[180px] truncate">
            {companyName}
          </span>
          <button onClick={logout} className="btn-ghost btn-sm">
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="no-print fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 sm:hidden">
      <div className="grid grid-cols-5">
        {LINKS.map((l) => {
          const active = path === l.href || path.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center py-2 text-[11px] ${
                active ? "text-brand-600" : "text-slate-500"
              }`}
            >
              <span className="text-lg">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="no-print hidden sm:flex flex-col gap-1 w-48 shrink-0">
      {[...LINKS, ...SIDE_ONLY_LINKS].map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium ${
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
