import { NextRequest } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Você é um assistente especialista em produtividade e gestão de tarefas pessoais e profissionais.

Dado o título e a descrição de uma tarefa, analise-a e retorne EXCLUSIVAMENTE um objeto JSON válido — sem markdown, sem texto adicional, sem blocos de código — com exatamente os seguintes campos:

{
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "category": string (ex: "Trabalho", "Estudo", "Pessoal", "Saúde", "Finanças", "Outro"),
  "summary": string (resumo objetivo da tarefa em até 2 frases),
  "justification": string (justificativa clara para a prioridade e categoria escolhidas)
}

Regras:
- "priority" deve ser exatamente "LOW", "MEDIUM" ou "HIGH" (em maiúsculas).
- "category" deve ser uma string curta e descritiva em português.
- "summary" deve condensar o propósito da tarefa de forma objetiva.
- "justification" deve explicar o raciocínio por trás da prioridade e categoria atribuídas.
- Responda APENAS com o JSON. Nenhuma explicação fora do JSON.`;

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== user.userId) {
    return Response.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  const userMessage = `Título: ${task.title}\nDescrição: ${task.description ?? "Sem descrição fornecida."}`;

  const MODEL = "gpt-4o-mini";

  let rawResponse: string;
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });
    rawResponse = completion.choices[0].message.content ?? "{}";
  } catch {
    return Response.json(
      { error: "Erro ao comunicar com a API de IA." },
      { status: 502 }
    );
  }

  let parsed: {
    priority: string;
    category: string;
    summary: string;
    justification: string;
  };
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    return Response.json(
      { error: "Resposta inválida retornada pela IA." },
      { status: 502 }
    );
  }

  await prisma.ailog.create({
    data: {
      taskId: id,
      prompt: userMessage,
      response: rawResponse,
      model: MODEL,
    },
  });

  return Response.json({
    priority: parsed.priority,
    category: parsed.category,
    summary: parsed.summary,
    justification: parsed.justification,
  });
}
