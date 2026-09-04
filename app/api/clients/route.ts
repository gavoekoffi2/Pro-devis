import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const companyId = user.companyId!;

  const [clients, stats] = await Promise.all([
    prisma.client.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    }),
    // Historique par client : nombre de devis et montant cumulé.
    prisma.quote.groupBy({
      by: ["clientId"],
      where: { companyId, clientId: { not: null } },
      _count: true,
      _sum: { total: true },
    }),
  ]);

  const statsByClient = new Map(
    stats.map((s) => [s.clientId as string, s])
  );

  return NextResponse.json({
    clients: clients.map((c) => {
      const s = statsByClient.get(c.id);
      return {
        ...c,
        quoteCount: s?._count ?? 0,
        quoteTotal: s?._sum.total ?? 0,
      };
    }),
  });
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  const client = await prisma.client.create({
    data: {
      companyId: user.companyId!,
      name: name.slice(0, 120),
      phone: body.phone || null,
      whatsapp: body.whatsapp || body.phone || null,
      address: body.address || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json({ client });
}
