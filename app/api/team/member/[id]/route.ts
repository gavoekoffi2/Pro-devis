import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, canManageTeam } from "@/lib/auth";

// Retire un membre de l'entreprise (le compte est détaché, pas supprimé).
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

  // On ne peut pas se retirer soi-même via cette route.
  if (id === user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous retirer vous-même." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.companyId !== user.companyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Le propriétaire (OWNER) ne peut pas être retiré.
  if (target.companyRole === "OWNER") {
    return NextResponse.json(
      { error: "Le propriétaire ne peut pas être retiré." },
      { status: 400 }
    );
  }

  // Seul un OWNER peut retirer un ADMIN.
  if (target.companyRole === "ADMIN" && user.companyRole !== "OWNER") {
    return NextResponse.json(
      { error: "Seul le propriétaire peut retirer un administrateur." },
      { status: 403 }
    );
  }

  // Détache l'utilisateur de l'entreprise (son compte reste, sans entreprise).
  await prisma.user.update({
    where: { id },
    data: { companyId: null, companyRole: "OWNER" },
  });

  return NextResponse.json({ ok: true });
}
