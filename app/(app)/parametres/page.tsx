import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const c = user!.company!;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <Link
        href="/equipe"
        className="card p-4 flex items-center justify-between hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧑‍🤝‍🧑</span>
          <div>
            <div className="font-semibold">Équipe</div>
            <div className="text-sm text-slate-500">
              Invitez vos collaborateurs à gérer les devis avec vous.
            </div>
          </div>
        </div>
        <span className="text-slate-400">→</span>
      </Link>
      <SettingsForm
        email={user!.email}
        plan={c.plan}
        company={{
          name: c.name,
          phone: c.phone,
          whatsapp: c.whatsapp,
          email: c.email,
          address: c.address,
          city: c.city,
          logoUrl: c.logoUrl,
          headerImageUrl: c.headerImageUrl,
          activity: c.activity,
          slogan: c.slogan,
          brandColor: c.brandColor,
          headerStyle: c.headerStyle,
          isRegistered: c.isRegistered,
          nif: c.nif,
          rccm: c.rccm,
          bankInfo: c.bankInfo,
          signatureUrl: c.signatureUrl,
          paymentTerms: c.paymentTerms,
          validityDays: c.validityDays,
          taxRate: c.taxRate,
          currency: c.currency,
          footerNote: c.footerNote,
        }}
      />
    </div>
  );
}
