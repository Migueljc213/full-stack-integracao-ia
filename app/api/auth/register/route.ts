import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return Response.json(
      { error: "Nome, e-mail e senha são obrigatórios." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "E-mail já cadastrado." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  const token = signToken({ userId: user.id, email: user.email });

  return Response.json(
    { token, user: { id: user.id, name: user.name, email: user.email } },
    { status: 201 }
  );
}
