import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
  const skip = (page - 1) * limit;

  const where = {
    userId: user.userId,
    ...(status && { status }),
    ...(priority && { priority }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.count({ where }),
  ]);

  return Response.json({
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { title, description, status, priority, category } = await req.json();

  if (!title || !status || !priority || !category) {
    return Response.json(
      { error: "Campos obrigatórios: title, status, priority, category." },
      { status: 400 }
    );
  }

  const validStatuses = ["PENDING", "IN_PROGRESS", "DONE"];
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];

  if (!validStatuses.includes(status)) {
    return Response.json(
      { error: `Status inválido. Use: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  if (!validPriorities.includes(priority)) {
    return Response.json(
      { error: `Prioridade inválida. Use: ${validPriorities.join(", ")}` },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      status,
      priority,
      category,
      userId: user.userId,
    },
  });

  return Response.json(task, { status: 201 });
}
