import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildQuoteView } from "@/lib/build-view";
import { QuoteDocument, PAPER_WIDTH } from "@/components/templates";
import { PrintButton } from "@/components/PrintButton";

export default async function PrintQuote({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!quote || quote.companyId !== user.companyId) notFound();

  const view = buildQuoteView(quote, user.company!);
  const width = PAPER_WIDTH[quote.paperSize] ?? PAPER_WIDTH.A4;

  return (
    <div className="min-h-screen bg-slate-200 py-6 px-3 print:p-0 print:bg-white flex justify-center">
      <div
        className="print-page bg-white shadow-xl"
        style={{ width, maxWidth: "100%" }}
      >
        <QuoteDocument
          view={view}
          templateId={quote.templateId}
          paper={quote.paperSize}
        />
      </div>
      <PrintButton />
    </div>
  );
}
