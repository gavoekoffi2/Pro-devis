import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TopBar, BottomNav, SideNav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Cas anormal (donnée incohérente en base) : toutes les pages de l'espace
  // travaillent sur l'entreprise. Mieux vaut un message clair qu'un plantage
  // du rendu serveur sur un `user.company!`.
  if (!user.company) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="card p-8 max-w-md text-center space-y-3">
          <div className="text-3xl">⚠️</div>
          <h1 className="text-lg font-bold">Compte incomplet</h1>
          <p className="text-sm text-slate-600">
            Aucune entreprise n'est rattachée à ce compte. Contactez le support
            pour rétablir votre profil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar companyName={user.company.name} />
      <div className="mx-auto max-w-5xl px-4 py-5 flex gap-6 pb-24 sm:pb-10">
        <SideNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
