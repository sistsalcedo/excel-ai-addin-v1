import { Router } from "express";
import { handleChat } from "../services/aiGateway";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  try {
    const response = await handleChat(req.body);
    res.json(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error en /api/ai/chat", error);
    res.status(500).json({ error: "Error interno en el gateway de IA" });
  }
});

