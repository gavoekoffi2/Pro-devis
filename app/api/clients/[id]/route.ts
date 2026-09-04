import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCompanyUser, guard, jsonError, readJson, zodMessage } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  whatsapp: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const { id } = await params;
    // Le filtre par entreprise est dans la requête : impossible de toucher
    // au client d'une autre entreprise, même en devinant son identifiant.
    const existing = await prisma.client.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) return jsonError("Introuvable", 404);

    const parsed = patchSchema.safeParse(await readJson(req));
    if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);

    const client = await prisma.client.update({
      where: { id: existing.id },
      data: parsed.data,
    });
    return NextResponse.json({ client });
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const { user, error } = await getCompanyUser();
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.client.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) return jsonError("Introuvable", 404);

    await prisma.client.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  });
}
