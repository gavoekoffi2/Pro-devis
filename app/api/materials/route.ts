import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCompanyUser, guard, jsonError, readJson, zodMessage } from "@/lib/api";
import { KINDS } from "@/lib/quote-input";

// Liste des matériaux effectifs pour l'entreprise (prix propres > catalogue),
// y compris les matériaux personnalisés créés par l'entreprise.
export async function GET(req: Request) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const url = new URL(req.url);
    const tradeId = url.searchParams.get("tradeId") || undefined;

    const [globals, owned] = await Promise.all([
      prisma.material.findMany({
        where: { companyId: null, ...(tradeId ? { tradeId } : {}) },
        include: { trade: true },
        orderBy: { name: "asc" },
      }),
      prisma.material.findMany({
        where: { companyId: user.companyId, ...(tradeId ? { tradeId } : {}) },
        include: { trade: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const ownedByKey = new Map(owned.map((m) => [m.key, m]));
    const globalKeys = new Set(globals.map((g) => g.key));

    // Le prix propre à l'entreprise écrase celui du catalogue.
    const materials = globals.map((g) => {
      const o = ownedByKey.get(g.key);
      return {
        id: o?.id ?? g.id,
        key: g.key,
        name: g.name,
        category: g.category,
        kind: g.kind,
        unit: o?.unit ?? g.unit,
        unitPrice: o?.unitPrice ?? g.unitPrice,
        margin: o?.margin ?? g.margin,
        tradeId: g.tradeId,
        tradeName: g.trade?.name,
        custom: !!o, // true si surchargé par l'entreprise
        ownedOnly: false,
      };
    });

    // Matériaux créés par l'entreprise (absents du catalogue global).
    for (const o of owned) {
      if (globalKeys.has(o.key)) continue;
      materials.push({
        id: o.id,
        key: o.key,
        name: o.name,
        category: o.category,
        kind: o.kind,
        unit: o.unit,
        unitPrice: o.unitPrice,
        margin: o.margin,
        tradeId: o.tradeId,
        tradeName: o.trade?.name,
        custom: true,
        ownedOnly: true,
      });
    }

    return NextResponse.json({ materials });
  });
}

const price = z.coerce
  .number()
  .refine(Number.isFinite, "Prix invalide")
  .transform((n) => Math.max(0, n))
  .catch(0);

const postSchema = z.object({
  key: z.string().trim().max(80).optional().nullable(),
  name: z.string().trim().max(120).optional().nullable(),
  unit: z.string().trim().max(30).optional().nullable(),
  kind: z.enum(KINDS).optional(),
  unitPrice: price.optional(),
  // Marge plafonnée : au-delà, c'est une saisie erronée, pas une intention.
  margin: price.pipe(z.number().max(1000)).catch(0).optional(),
});

/** Clé logique dérivée d'un nom saisi ("Fer plat 30" → "perso-fer-plat-30"). */
function customKeyFrom(name: string): string {
  return `perso-${name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)}`;
}

// Crée/Met à jour le prix propre à l'entreprise pour un matériau (par clé),
// ou crée un matériau personnalisé si la clé n'existe pas au catalogue.
export async function POST(req: Request) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;
    const companyId = user.companyId;

    const parsed = postSchema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
    const { key, name, unit, kind } = parsed.data;
    const unitPriceNum = parsed.data.unitPrice ?? 0;
    const marginNum = parsed.data.margin ?? 0;

    // ── Création d'un matériau personnalisé ──
    if (!key && name) {
      if (name.length < 2) return jsonError("Nom trop court", 400);
      const customKey = customKeyFrom(name);
      if (customKey === "perso-") {
        return jsonError("Nom invalide : utilisez des lettres ou des chiffres.", 400);
      }
      const duplicate = await prisma.material.findFirst({
        where: { key: customKey, OR: [{ companyId }, { companyId: null }] },
      });
      if (duplicate) {
        return jsonError("Un matériau avec ce nom existe déjà.", 409);
      }
      const material = await prisma.material.create({
        data: {
          key: customKey,
          name,
          kind: kind ?? "MATERIAL",
          unit: unit || "pièce",
          unitPrice: unitPriceNum,
          margin: marginNum,
          companyId,
        },
      });
      return NextResponse.json({ material });
    }

    if (!key) return jsonError("Clé matériau requise", 400);

    const existing = await prisma.material.findFirst({
      where: { key, companyId },
    });

    // Mise à jour d'un matériau personnalisé existant.
    if (existing) {
      const material = await prisma.material.update({
        where: { id: existing.id },
        data: { unitPrice: unitPriceNum, margin: marginNum },
      });
      return NextResponse.json({ material });
    }

    // Surcharge d'un matériau du catalogue global.
    const base = await prisma.material.findFirst({
      where: { key, companyId: null },
    });
    if (!base) return jsonError("Matériau inconnu", 404);

    const material = await prisma.material.create({
      data: {
        key,
        name: base.name,
        category: base.category,
        kind: base.kind,
        unit: base.unit,
        unitPrice: unitPriceNum,
        margin: marginNum,
        tradeId: base.tradeId,
        companyId,
      },
    });

    return NextResponse.json({ material });
  });
}

// Supprime un matériau personnalisé (ou une surcharge de prix → retour au
// prix catalogue).
export async function DELETE(req: Request) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (!key) return jsonError("Clé requise", 400);

    // `companyId` est ici garanti non nul : avec l'ancien `user.companyId!`,
    // un compte sans entreprise supprimait les lignes du catalogue global.
    const { count } = await prisma.material.deleteMany({
      where: { key, companyId: user.companyId },
    });
    return NextResponse.json({ ok: true, deleted: count });
  });
}
