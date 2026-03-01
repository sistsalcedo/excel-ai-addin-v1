import {
  AiRequest,
  AiResponse,
  LLMProvider,
} from "../../../../shared/aiContracts";
import { EXCEL_TOOLS, toolCallToAiAction } from "../tools/excelTools";
import { buildExcelSystemPrompt } from "../prompts/excelSystemPrompt";

interface GroqMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

export function getGroqProvider(): LLMProvider {
  return {
    id: "groq",
    async call(request: AiRequest): Promise<AiResponse> {
      const apiKey = process.env.GROQ_API_KEY;
      const model =
        request.modelId && request.modelId !== "default"
          ? request.modelId
          : process.env.GROQ_MODEL;

      if (!apiKey) {
        throw new Error("Falta GROQ_API_KEY en la configuración del servidor.");
      }

      if (!model) {
        throw new Error(
          "No se ha especificado un modelo de GROQ (modelId o GROQ_MODEL).",
        );
      }

      const started = Date.now();
      const systemPrompt = buildExcelSystemPrompt(request.excelContext);

      const messages: GroqMessage[] = [
        { role: "system", content: systemPrompt },
        ...request.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

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
            messages,
            tools: EXCEL_TOOLS,
            tool_choice: "auto",
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
      const msg = choice?.message ?? {};

      let text = msg.content ?? "";

      const actions: AiResponse["actions"] = [];
      const toolCalls = msg.tool_calls ?? [];
      for (const tc of toolCalls) {
        if (tc.function?.name && tc.function?.arguments) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch (parseErr) {
            // eslint-disable-next-line no-console
            console.warn(
              "[groqProvider] tool call args parse failed:",
              tc.function.name,
              tc.function.arguments,
              parseErr instanceof Error ? parseErr.message : parseErr,
            );
            continue;
          }
          const action = toolCallToAiAction(tc.function.name, args);
          if (action) {
            actions.push(action);
          }
        }
      }

      if (actions.length > 0 && !text.trim()) {
        text =
          "He generado las acciones sugeridas. Por favor, revisa la vista previa y confirma para insertarlas en la hoja.";
      }

      const latencyMs = Date.now() - started;

      const aiResponse: AiResponse = {
        text,
        ...(actions.length > 0 && { actions }),
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
