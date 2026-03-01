import { Router } from "express";
import { handleChat } from "../services/aiGateway";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  try {
    const response = await handleChat(req.body);
    res.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    const stack = error instanceof Error ? error.stack : undefined;
    // eslint-disable-next-line no-console
    console.error("[aiRouter] /api/ai/chat failed:", { message: msg, stack });
    res.status(500).json({
      error: "Error interno en el gateway de IA",
      detail: process.env.NODE_ENV !== "production" ? msg : undefined,
    });
  }
});

