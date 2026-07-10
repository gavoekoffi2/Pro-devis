import { JoinForm } from "@/components/JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl font-extrabold text-brand-600">
            Pro<span className="text-accent-500">Devis</span>
          </div>
          <p className="text-slate-500 mt-2">Rejoignez votre équipe.</p>
        </div>
        <JoinForm token={token} />
      </div>
    </div>
  );
}
