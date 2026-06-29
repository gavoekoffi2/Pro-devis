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
  const companyName = user.company?.name ?? "Mon entreprise";

  return (
    <div className="min-h-screen">
      <TopBar companyName={companyName} />
      <div className="mx-auto max-w-5xl px-4 py-5 flex gap-6 pb-24 sm:pb-10">
        <SideNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
