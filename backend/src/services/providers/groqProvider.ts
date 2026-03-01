import fetch from "node-fetch";
import {
  AiRequest,
  AiResponse,
  LLMProvider,
} from "../../../../shared/aiContracts";

export function getGroqProvider(): LLMProvider {
  return {
    id: "groq",
    async call(request: AiRequest): Promise<AiResponse> {
      const apiKey = process.env.GROQ_API_KEY;
      const model = request.modelId || process.env.GROQ_MODEL;

      if (!apiKey) {
        throw new Error("Falta GROQ_API_KEY en la configuración del servidor.");
      }

      if (!model) {
        throw new Error(
          "No se ha especificado un modelo de GROQ (modelId o GROQ_MODEL).",
        );
      }

      const started = Date.now();

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: request.messages,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Error de GROQ (${response.status}): ${response.statusText} - ${text}`,
        );
      }

      const json: any = await response.json();
      const choice = json.choices?.[0];

      const text = choice?.message?.content ?? "";

      const latencyMs = Date.now() - started;

      const aiResponse: AiResponse = {
        text,
        usage: {
          promptTokens: json.usage?.prompt_tokens,
          completionTokens: json.usage?.completion_tokens,
          totalTokens: json.usage?.total_tokens,
          latencyMs,
        },
      };

      return aiResponse;
    },
  };
}

