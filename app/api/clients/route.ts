import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCompanyUser, guard, jsonError, readJson, zodMessage } from "@/lib/api";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function GET() {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;
    const companyId = user.companyId;

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

    const statsByClient = new Map(stats.map((s) => [s.clientId as string, s]));

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
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const parsed = clientSchema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
    const body = parsed.data;

    const client = await prisma.client.create({
      data: {
        companyId: user.companyId,
        name: body.name,
        phone: body.phone || null,
        whatsapp: body.whatsapp || body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json({ client });
  });
}
