import express from "express"
import cors from "cors";
import userRoutes from "./routes/user.routes";
import exerciseRoutes from "./routes/exercise.routes";
import trainingDayRoutes from "./routes/trainingDay.routes";
import trainingSessionRoutes from "./routes/trainingSession.routes";
import healthRoutes from "./routes/health.routes";
import { connection } from "mongoose";
import db from "./database/configdb"; // ajuste o caminho se preciso

const app = express();

app.use(express.json());
app.use(cors());

// app.ts, ANTES das rotas (temporário pra debug)
app.use(async (req, res, next) => {
  if (connection.readyState !== 1) {
    try {
      console.log("[DB-GUARD] connecting on-demand for", req.method, req.path);
      await db.connect(); // idempotente (usa cache)
      console.log("[DB-GUARD] connected. state =", connection.readyState);
    } catch (err) {
      console.error("[DB-GUARD] connect failed:", err);
      return res.status(503).json({ error: "DB unavailable" });
    }
  }
  next();
});

app.use((req, _res, next) => {
  if (req.path === "/auth/register" && req.method === "POST") {
    console.log("[MIDDLEWARE] register content-type:", req.headers["content-type"]);
  }
  next();
});

app.get("/", (_req, res) => {
  res.send("✅ API online");
});

app.use("/auth", userRoutes);
app.use("/health", healthRoutes);
app.use("/exercises", exerciseRoutes);
app.use("/training-days", trainingDayRoutes);
app.use("/training-sessions", trainingSessionRoutes);

export default app;
