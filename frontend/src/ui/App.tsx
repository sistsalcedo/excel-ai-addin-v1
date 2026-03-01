import React, { useState, useRef, useEffect } from "react";
import {
  ProviderId,
  AiResponse,
  ChatMessage,
} from "../../../shared/aiContracts";
import { sendChatRequest } from "../utils/aiGatewayClient";
import { buildExcelContext, applyActions } from "../excel/excelLayer";

type ChatRole = "user" | "assistant";

interface ChatEntry {
  role: ChatRole;
  content: string;
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  groq: "GROQ",
  openrouter: "OpenRouter",
};

const SUGGESTIONS = [
  "Explica los datos seleccionados",
  "Genera una fórmula para sumar la columna A",
  "Crea un gráfico con los datos seleccionados",
  "Sugiere mejoras para el modelo de datos",
];

export const App: React.FC = () => {
  const [providerId, setProviderId] = useState<ProviderId>("groq");
  const [modelId, setModelId] = useState<string>("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [lastResponse, setLastResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const newMessage: ChatEntry = { role: "user", content };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const chatMessages: ChatMessage[] = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const excelContext = await buildExcelContext();

      const response = await sendChatRequest({
        providerId,
        modelId: modelId || "default",
        messages: chatMessages,
        excelContext,
      });

      setLastResponse(response);

      if (response.text) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.text },
        ]);
      }

      if (response.actions && response.actions.length > 0) {
        await applyActions(response.actions);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al llamar al backend de IA");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white font-sans text-sm">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h2 className="font-semibold text-slate-900">IA en Excel</h2>
        <p className="text-xs text-slate-500">
          GROQ y OpenRouter · v1 cloud
        </p>
      </header>

      {/* Provider & model selector */}
      <section className="shrink-0 space-y-1 border-b border-slate-200 px-3 py-2">
        <div>
          <label className="text-xs text-slate-500">Proveedor</label>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value as ProviderId)}
            className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {Object.entries(PROVIDER_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Modelo (opcional)</label>
          <input
            type="text"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="Valor por defecto del servidor"
            className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm placeholder:text-slate-400"
          />
        </div>
      </section>

      {/* Chat messages */}
      <section className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2 py-4">
            <p className="text-center text-sm text-slate-500">
              Escribe tu pregunta o selecciona un rango en Excel y describe qué
              quieres hacer.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                  m.role === "user"
                    ? "max-w-[90%] rounded-lg bg-slate-800 px-3 py-2 text-white"
                    : "max-w-[90%] rounded-lg bg-slate-100 px-3 py-2 text-slate-900"
                }
                >
                  <span className="mb-0.5 block text-[10px] font-medium opacity-80">
                    {m.role === "user" ? "Tú" : "IA"}
                  </span>
                  <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                    {m.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-100 px-3 py-2">
                  <span className="text-[10px] text-slate-500">IA</span>
                  <p className="text-[13px] text-slate-500">Pensando…</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </section>

      {/* Actions preview */}
      {lastResponse?.actions && lastResponse.actions.length > 0 && (
        <section className="shrink-0 border-t border-slate-200 bg-slate-50 px-3 py-2">
          <p className="mb-1.5 text-xs font-medium text-slate-500">
            Acciones sugeridas
          </p>
          <ul className="space-y-0.5 text-xs text-slate-800">
            {lastResponse.actions.map((a, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-slate-600" />
                {a.description ?? a.type}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Error */}
      {error && (
        <div className="shrink-0 border-t border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      <footer className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Pregúntale a la IA…"
            disabled={isLoading}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "…" : "Enviar"}
          </button>
        </div>
      </footer>
    </div>
  );
};
