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
  const clients = await prisma.client.findMany({
    where: { companyId: user.companyId! },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (!body.name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  const client = await prisma.client.create({
    data: {
      companyId: user.companyId!,
      name: body.name,
      phone: body.phone || null,
      whatsapp: body.whatsapp || body.phone || null,
      address: body.address || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json({ client });
}
