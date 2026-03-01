import React, { useState } from "react";
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

export const App: React.FC = () => {
  const [providerId, setProviderId] = useState<ProviderId>("groq");
  const [modelId, setModelId] = useState<string>("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [lastResponse, setLastResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newMessage: ChatEntry = { role: "user", content: input.trim() };
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
        // De momento solo mostramos la lista; en versiones futuras
        // se añadirá una vista previa interactiva y confirmación.
        await applyActions(response.actions);
      }
    } catch (e: any) {
      setError(e?.message ?? "Error al llamar al backend de IA");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 8, fontFamily: "system-ui, sans-serif", fontSize: 12 }}>
      <header style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>IA en Excel</h2>
        <p style={{ margin: 0, fontSize: 11 }}>
          v1 cloud – GROQ y OpenRouter a través de gateway propio.
        </p>
      </header>

      <section style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 4 }}>
          Proveedor
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value as ProviderId)}
            style={{ width: "100%", marginTop: 2 }}
          >
            {Object.entries(PROVIDER_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "block" }}>
          Modelo (opcional)
          <input
            type="text"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="Usar valor por defecto del servidor si se deja vacío"
            style={{ width: "100%", marginTop: 2 }}
          />
        </label>
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 4,
          padding: 4,
          height: 220,
          overflowY: "auto",
          marginBottom: 8,
          background: "#fafafa",
        }}
      >
        {messages.length === 0 ? (
          <p style={{ fontSize: 11, color: "#666" }}>
            Escribe tu primera pregunta o selecciona un rango en Excel y
            describe qué quieres hacer.
          </p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 4,
                textAlign: m.role === "user" ? "right" : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 6px",
                  borderRadius: 4,
                  background:
                    m.role === "user" ? "#d0ebff" : "white",
                  border: "1px solid #ddd",
                  maxWidth: "90%",
                  whiteSpace: "pre-wrap",
                }}
              >
                <strong style={{ fontSize: 10, display: "block" }}>
                  {m.role === "user" ? "Tú" : "IA"}
                </strong>
                <span>{m.content}</span>
              </div>
            </div>
          ))
        )}
      </section>

      {lastResponse?.actions && lastResponse.actions.length > 0 && (
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: 4,
            marginBottom: 8,
          }}
        >
          <strong style={{ fontSize: 11 }}>Acciones sugeridas (vista previa)</strong>
          <ul style={{ paddingLeft: 16, margin: 4 }}>
            {lastResponse.actions.map((a, idx) => (
              <li key={idx} style={{ fontSize: 11 }}>
                {a.description ?? a.type}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p style={{ color: "red", fontSize: 11, marginBottom: 4 }}>{error}</p>
      )}

      <footer style={{ display: "flex", gap: 4 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Pregúntale a la IA…"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading}
          style={{ minWidth: 60 }}
        >
          {isLoading ? "Enviando…" : "Enviar"}
        </button>
      </footer>
    </div>
  );
};

