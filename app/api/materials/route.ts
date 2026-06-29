import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Liste des matériaux effectifs pour l'entreprise (prix propres > catalogue).
export async function GET(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const url = new URL(req.url);
  const tradeId = url.searchParams.get("tradeId") || undefined;

  const [globals, owned] = await Promise.all([
    prisma.material.findMany({
      where: { companyId: null, ...(tradeId ? { tradeId } : {}) },
      include: { trade: true },
      orderBy: { name: "asc" },
    }),
    prisma.material.findMany({
      where: { companyId: user.companyId!, ...(tradeId ? { tradeId } : {}) },
      include: { trade: true },
    }),
  ]);

  const ownedByKey = new Map(owned.map((m) => [m.key, m]));
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
    };
  });

  return NextResponse.json({ materials });
}

// Crée/Met à jour le prix propre à l'entreprise pour un matériau (par clé).
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const companyId = user.companyId!;
  const body = await req.json().catch(() => ({}));
  const { key, unitPrice, margin } = body;
  if (!key) {
    return NextResponse.json({ error: "Clé matériau requise" }, { status: 400 });
  }

  const base = await prisma.material.findFirst({
    where: { key, companyId: null },
  });
  if (!base) {
    return NextResponse.json({ error: "Matériau inconnu" }, { status: 404 });
  }

  const existing = await prisma.material.findFirst({
    where: { key, companyId },
  });

  const data = {
    key,
    name: base.name,
    category: base.category,
    kind: base.kind,
    unit: base.unit,
    unitPrice: Number(unitPrice) || 0,
    margin: Number(margin) || 0,
    tradeId: base.tradeId,
    companyId,
  };

  const material = existing
    ? await prisma.material.update({ where: { id: existing.id }, data })
    : await prisma.material.create({ data });

  return NextResponse.json({ material });
}
