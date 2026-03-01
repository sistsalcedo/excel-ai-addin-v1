import type { AiRequest, AiResponse } from "../../../shared/aiContracts";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "";

export async function sendChatRequest(
  partialRequest: Omit<AiRequest, "excelContext" | "capabilities">,
): Promise<AiResponse> {
  const base = API_BASE_URL.replace(/\/$/, "");

  const response = await fetch(`${base}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(partialRequest),
  });

  if (!response.ok) {
    const text = await response.text();
    let msg = `Error al llamar al backend de IA (${response.status})`;
    try {
      const body = JSON.parse(text) as { error?: string; detail?: string };
      if (body.detail) msg = `${body.error ?? msg}: ${body.detail}`;
      else if (body.error) msg = body.error;
    } catch {
      if (text) msg += `: ${text}`;
    }
    throw new Error(msg);
  }

  const json = (await response.json()) as AiResponse;
  return json;
}

