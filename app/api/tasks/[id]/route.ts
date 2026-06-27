import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });

  if (!task || task.userId !== user.userId) {
    return Response.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  return Response.json(task);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { id } = await params;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.userId) {
    return Response.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  const { title, description, status, priority, category } = await req.json();

  const validStatuses = ["PENDING", "IN_PROGRESS", "DONE"];
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];

  if (status && !validStatuses.includes(status)) {
    return Response.json(
      { error: `Status inválido. Use: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  if (priority && !validPriorities.includes(priority)) {
    return Response.json(
      { error: `Prioridade inválida. Use: ${validPriorities.join(", ")}` },
      { status: 400 }
    );
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(category !== undefined && { category }),
    },
  });

  return Response.json(task);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { id } = await params;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.userId) {
    return Response.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  await prisma.ailog.deleteMany({ where: { taskId: id } });
  await prisma.task.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
