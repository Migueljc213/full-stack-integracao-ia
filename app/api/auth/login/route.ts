import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return Response.json(
      { error: "E-mail e senha são obrigatórios." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const token = signToken({ userId: user.id, email: user.email });

  return Response.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
