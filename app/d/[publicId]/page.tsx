import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildQuoteView } from "@/lib/build-view";
import { QuoteDocument, PAPER_WIDTH } from "@/components/templates";
import { PublicQuoteActions } from "@/components/PublicQuoteActions";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

// Un lien de devis partagé expose le nom, le téléphone et l'adresse du client :
// il ne doit jamais se retrouver dans un moteur de recherche.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function PublicQuote({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const quote = await prisma.quote.findUnique({
    where: { publicId },
    include: { items: { orderBy: { order: "asc" } }, company: true },
  });
  if (!quote || !quote.company) notFound();

  const view = buildQuoteView(quote, quote.company);
  const width = PAPER_WIDTH[quote.paperSize] ?? PAPER_WIDTH.A4;

  return (
    <div className="min-h-screen bg-slate-200 py-6 px-3 print:p-0 print:bg-white">
      <div className="mx-auto" style={{ maxWidth: width }}>
        <div className="print-page bg-white shadow-xl">
          <QuoteDocument
            view={view}
            templateId={quote.templateId}
            paper={quote.paperSize}
          />
        </div>

        <div className="mt-4">
          <PublicQuoteActions publicId={publicId} status={quote.status} />
        </div>
      </div>
      <PrintButton />
    </div>
  );
}
