import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    providers: [
      {
        id: "groq",
        label: "GROQ",
        models: [],
      },
      {
        id: "openrouter",
        label: "OpenRouter",
        models: [],
      },
    ],
  });
});

export const providersRouter = router;

