import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const KINDS = ["MATERIAL", "LABOR", "TRANSPORT", "OTHER"] as const;

// Liste des matériaux effectifs pour l'entreprise (prix propres > catalogue),
// y compris les matériaux personnalisés créés par l'entreprise.
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
}

// Crée/Met à jour le prix propre à l'entreprise pour un matériau (par clé),
// ou crée un matériau personnalisé si la clé n'existe pas au catalogue.
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const companyId = user.companyId!;
  const body = await req.json().catch(() => ({}));
  const { key, unitPrice, margin, name, unit, kind } = body;

  const unitPriceNum = Math.max(0, Number(unitPrice) || 0);
  const marginNum = Math.max(0, Number(margin) || 0);

  // ── Création d'un matériau personnalisé ──
  if (!key && name) {
    const cleanName = String(name).trim().slice(0, 120);
    if (cleanName.length < 2) {
      return NextResponse.json({ error: "Nom trop court" }, { status: 400 });
    }
    const customKey = `perso-${cleanName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)}`;
    const duplicate = await prisma.material.findFirst({
      where: { key: customKey, OR: [{ companyId }, { companyId: null }] },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Un matériau avec ce nom existe déjà." },
        { status: 409 }
      );
    }
    const material = await prisma.material.create({
      data: {
        key: customKey,
        name: cleanName,
        kind: KINDS.includes(kind) ? kind : "MATERIAL",
        unit: String(unit || "pièce").slice(0, 30),
        unitPrice: unitPriceNum,
        margin: marginNum,
        companyId,
      },
    });
    return NextResponse.json({ material });
  }

  if (!key) {
    return NextResponse.json({ error: "Clé matériau requise" }, { status: 400 });
  }

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
  if (!base) {
    return NextResponse.json({ error: "Matériau inconnu" }, { status: 404 });
  }

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
}

// Supprime un matériau personnalisé (ou une surcharge de prix → retour au
// prix catalogue).
export async function DELETE(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Clé requise" }, { status: 400 });
  }
  await prisma.material.deleteMany({
    where: { key, companyId: user.companyId! },
  });
  return NextResponse.json({ ok: true });
}
