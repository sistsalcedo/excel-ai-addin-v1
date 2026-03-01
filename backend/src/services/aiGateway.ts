import { AiRequest, AiResponse } from "../../../shared/aiContracts";
import { getGroqProvider } from "../services/providers/groqProvider";
import { getOpenRouterProvider } from "../services/providers/openRouterProvider";

export async function handleChat(request: AiRequest): Promise<AiResponse> {
  const { providerId } = request;

  if (providerId === "groq") {
    const provider = getGroqProvider();
    return provider.call(request);
  }

  if (providerId === "openrouter") {
    const provider = getOpenRouterProvider();
    return provider.call(request);
  }

  throw new Error(`Proveedor de IA no soportado: ${providerId}`);
}

