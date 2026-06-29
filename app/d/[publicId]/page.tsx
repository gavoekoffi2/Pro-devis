import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildQuoteView } from "@/lib/build-view";
import { QuoteDocument, PAPER_WIDTH } from "@/components/templates";
import { PublicQuoteActions } from "@/components/PublicQuoteActions";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function PublicQuote({
  params,
}: {
  params: { publicId: string };
}) {
  const quote = await prisma.quote.findUnique({
    where: { publicId: params.publicId },
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
          <PublicQuoteActions publicId={params.publicId} status={quote.status} />
        </div>
      </div>
      <PrintButton />
    </div>
  );
}
