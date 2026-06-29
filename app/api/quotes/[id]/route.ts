import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

async function ownedQuote(id: string, companyId: string) {
  const q = await prisma.quote.findUnique({ where: { id } });
  if (!q || q.companyId !== companyId) return null;
  return q;
}

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
  const quote = await ownedQuote(params.id, user.companyId!);
  if (!quote) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (
    body.status &&
    ["DRAFT", "SENT", "ACCEPTED", "REFUSED"].includes(body.status)
  ) {
    data.status = body.status;
  }
  if (body.isInvoice === true) data.isInvoice = true;

  const updated = await prisma.quote.update({
    where: { id: quote.id },
    data,
  });
  return NextResponse.json({ ok: true, quote: updated });
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
  const quote = await ownedQuote(params.id, user.companyId!);
  if (!quote) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await prisma.quote.delete({ where: { id: quote.id } });
  return NextResponse.json({ ok: true });
}
