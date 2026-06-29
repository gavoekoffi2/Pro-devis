import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const c = user!.company!;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <SettingsForm
        email={user!.email}
        plan={user!.plan}
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
