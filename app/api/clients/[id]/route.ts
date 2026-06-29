import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const existing = await prisma.client.findUnique({ where: { id: params.id } });
  if (!existing || existing.companyId !== user.companyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: body.name ?? existing.name,
      phone: body.phone ?? existing.phone,
      whatsapp: body.whatsapp ?? existing.whatsapp,
      address: body.address ?? existing.address,
      notes: body.notes ?? existing.notes,
    },
  });
  return NextResponse.json({ client });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const existing = await prisma.client.findUnique({ where: { id: params.id } });
  if (!existing || existing.companyId !== user.companyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
