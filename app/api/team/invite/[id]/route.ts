import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, canManageTeam } from "@/lib/auth";

// Révoque une invitation en attente.
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
  if (!canManageTeam(user.companyRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation || invitation.companyId !== user.companyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.invitation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
