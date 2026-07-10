import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sanitizeText, sanitizeString } from "@/lib/sanitize";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing || existing.companyId !== user.companyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const client = await prisma.client.update({
    where: { id },
    data: {
      name: body.name != null ? sanitizeText(body.name) : existing.name,
      phone: body.phone != null ? sanitizeString(body.phone, 20) : existing.phone,
      whatsapp:
        body.whatsapp != null ? sanitizeString(body.whatsapp, 20) : existing.whatsapp,
      address: body.address != null ? sanitizeText(body.address) : existing.address,
      notes: body.notes != null ? sanitizeText(body.notes) : existing.notes,
    },
  });
  return NextResponse.json({ client });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing || existing.companyId !== user.companyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
