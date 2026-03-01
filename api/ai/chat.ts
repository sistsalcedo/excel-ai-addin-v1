import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleChat } from "../../backend/src/services/aiGateway";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const response = await handleChat(req.body as any);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error en /api/ai/chat", error);
    res.status(500).json({ error: "Error interno en el gateway de IA" });
  }
}
