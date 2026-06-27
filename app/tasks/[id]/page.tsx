"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
};

type AiSuggestion = {
  priority: string;
  category: string;
  summary: string;
  justification: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em Andamento",
  DONE: "Concluído",
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-red-100 text-red-800 border-red-200",
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

export default function TaskDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [taskError, setTaskError] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    category: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleting, setDeleting] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  async function fetchTask() {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    const res = await fetch(`/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      setTaskError(data.error ?? "Tarefa não encontrada.");
    } else {
      setTask(data);
      setEditForm({
        title: data.title,
        description: data.description ?? "",
        status: data.status,
        priority: data.priority,
        category: data.category,
      });
    }
    setLoadingTask(false);
  }

  useEffect(() => { fetchTask(); }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description || null,
        status: editForm.status,
        priority: editForm.priority,
        category: editForm.category,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error ?? "Erro ao salvar.");
    } else {
      setTask(data);
      setShowEdit(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    setDeleting(true);
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    const res = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok || res.status === 204) {
      router.push("/tasks");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erro ao excluir.");
      setDeleting(false);
    }
  }

  async function handleAiSuggest() {
    setAiError("");
    setAiSuggestion(null);
    setAiLoading(true);
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    try {
      const res = await fetch(`/api/tasks/${id}/ai-suggest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? "Erro ao obter sugestão da IA.");
      } else {
        setAiSuggestion(data);
      }
    } catch {
      setAiError("Erro de conexão. Tente novamente.");
    } finally {
      setAiLoading(false);
    }
  }

  if (loadingTask) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </main>
    );
  }

  if (taskError || !task) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-red-600 text-sm">{taskError || "Tarefa não encontrada."}</p>
        <Link href="/tasks" className="text-blue-600 text-sm hover:underline">
          Voltar para tarefas
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/tasks"
            className="text-sm text-gray-700 hover:text-black transition-colors shrink-0"
          >
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold text-gray-900 truncate">{task.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setShowEdit((v) => !v); setSaveError(""); }}
            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            {showEdit ? "Cancelar" : "Editar"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Edit form */}
        {showEdit && (
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
          >
            <h2 className="text-sm font-semibold text-gray-700">Editar Tarefa</h2>

            <input
              type="text"
              required
              placeholder="Título *"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              placeholder="Descrição (opcional)"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="flex gap-2 flex-wrap">
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
              >
                <option value="PENDING">Pendente</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="DONE">Concluído</option>
              </select>

              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>

              <input
                type="text"
                required
                placeholder="Categoria *"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="flex-1 min-w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </form>
        )}

        {/* Task details */}
        {!showEdit && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PRIORITY_BADGE[task.priority] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
              >
                {PRIORITY_LABEL[task.priority] ?? task.priority}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                {STATUS_LABELS[task.status] ?? task.status}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                {task.category}
              </span>
            </div>

            {task.description ? (
              <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Sem descrição.</p>
            )}

            <p className="text-xs text-gray-400">
              Criada em{" "}
              {new Date(task.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        {/* AI Suggest */}
        <div className="space-y-3">
          <button
            onClick={handleAiSuggest}
            disabled={aiLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
          >
            {aiLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Consultando IA...
              </>
            ) : (
              "Sugerir com IA"
            )}
          </button>

          {aiError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {aiError}
            </p>
          )}

          {aiSuggestion && (
            <div className="bg-white rounded-xl border border-indigo-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
                Sugestão da IA
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PRIORITY_BADGE[aiSuggestion.priority] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                >
                  Prioridade: {PRIORITY_LABEL[aiSuggestion.priority] ?? aiSuggestion.priority}
                </span>
                <span className="text-xs text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1 border border-indigo-200">
                  {aiSuggestion.category}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Resumo</p>
                <p className="text-sm text-gray-700">{aiSuggestion.summary}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Justificativa</p>
                <p className="text-sm text-gray-700">{aiSuggestion.justification}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
