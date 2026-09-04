import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildQuoteView } from "@/lib/build-view";
import { PreviewEditor } from "@/components/PreviewEditor";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePageUser();

  const quote = await prisma.quote.findFirst({
    where: { id, companyId: user.companyId },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!quote) notFound();

  const view = buildQuoteView(quote, user.company);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="no-print sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href={`/devis/${quote.id}`} className="text-sm text-slate-500">
            ← Retour au devis
          </Link>
          <div className="font-semibold">Aperçu & personnalisation</div>
          <span className="text-sm text-slate-400">{quote.number}</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">
        <PreviewEditor
          quoteId={quote.id}
          initialView={view}
          templateId={quote.templateId}
          paper={quote.paperSize}
        />
      </main>
    </div>
  );
}
