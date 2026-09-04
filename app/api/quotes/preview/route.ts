import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCompanyUser, guard, jsonError, readJson, zodMessage } from "@/lib/api";
import { resolveMaterials } from "@/lib/materials";
import { computeLines, computeTotals, type RecipeComponent } from "@/lib/calc";

const schema = z.object({
  // Sans validation, une clé absente arrivait telle quelle dans Prisma
  // (`findUnique({ where: { key: undefined } })`) et provoquait un 500.
  workTypeKey: z.string().trim().min(1, "Type de travail requis").max(80),
  values: z.record(z.unknown()).default({}),
  discount: z.coerce.number().catch(0),
  taxRate: z.coerce.number().optional(),
});

// Calcule les lignes + totaux d'un type de travail (sans enregistrer le devis).
export async function POST(req: Request) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
    const { workTypeKey, values, discount, taxRate } = parsed.data;

    const workType = await prisma.workType.findUnique({
      where: { key: workTypeKey },
      include: { trade: true },
    });
    if (!workType) return jsonError("Type de travail introuvable", 404);

    const materials = await resolveMaterials(user.companyId, workType.tradeId);

    const recipe = Array.isArray(workType.recipe)
      ? (workType.recipe as unknown as RecipeComponent[])
      : [];
    const lines = computeLines(recipe, values, materials);

    const totals = computeTotals(lines, {
      discount: Number.isFinite(discount) ? Math.max(0, discount) : 0,
      taxRate: taxRate != null && Number.isFinite(taxRate) ? Math.max(0, taxRate) : user.company.taxRate,
    });

    return NextResponse.json({
      lines,
      totals,
      tradeKey: workType.trade.key,
      workLabel: workType.name,
      workTypeId: workType.id,
    });
  });
}
