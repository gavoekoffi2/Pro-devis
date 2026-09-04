import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyUser, guard } from "@/lib/api";

// Liste des métiers avec leurs types de travaux (pour l'assistant de devis).
export async function GET() {
  return guard(async () => {
    const { error } = await getCompanyUser();
    if (error) return error;

    const trades = await prisma.trade.findMany({
      orderBy: { order: "asc" },
      include: {
        workTypes: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ trades });
  });
}
