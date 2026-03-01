import express from "express";
import cors from "cors";
import { json } from "body-parser";
import { aiRouter } from "./routes/aiRouter";
import { providersRouter } from "./routes/providersRouter";

const app = express();

app.use(cors());
app.use(json());

app.use("/api/ai", aiRouter);
app.use("/api/providers", providersRouter);

const port = process.env.PORT ?? 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`IA en Excel backend escuchando en puerto ${port}`);
});

