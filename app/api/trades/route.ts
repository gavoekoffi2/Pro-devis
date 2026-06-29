import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Liste des métiers avec leurs types de travaux (pour l'assistant de devis).
export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const trades = await prisma.trade.findMany({
    orderBy: { order: "asc" },
    include: {
      workTypes: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({ trades });
}
