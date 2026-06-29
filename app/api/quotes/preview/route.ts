import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { resolveMaterials } from "@/lib/materials";
import {
  computeLines,
  computeTotals,
  type RecipeComponent,
} from "@/lib/calc";

// Calcule les lignes + totaux d'un type de travail (sans enregistrer le devis).
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { workTypeKey, values, discount, taxRate } = body ?? {};

  const workType = await prisma.workType.findUnique({
    where: { key: workTypeKey },
    include: { trade: true },
  });
  if (!workType) {
    return NextResponse.json(
      { error: "Type de travail introuvable" },
      { status: 404 }
    );
  }

  const materials = await resolveMaterials(
    user.companyId ?? null,
    workType.tradeId
  );

  const lines = computeLines(
    workType.recipe as unknown as RecipeComponent[],
    values ?? {},
    materials
  );

  const company = user.company;
  const totals = computeTotals(lines, {
    discount: Number(discount) || 0,
    taxRate: taxRate != null ? Number(taxRate) : company?.taxRate ?? 0,
  });

  return NextResponse.json({
    lines,
    totals,
    tradeKey: workType.trade.key,
    workLabel: workType.name,
    workTypeId: workType.id,
  });
}
