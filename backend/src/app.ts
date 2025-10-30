// src/app.ts
import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes";
import exerciseRoutes from "./routes/exercise.routes";
import trainingDayRoutes from "./routes/trainingDay.routes";
import trainingSessionRoutes from "./routes/trainingSession.routes";
import healthRoutes from "./routes/health.routes";


const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (_req, res) => res.send("✅ API online"));

// rotas públicas (sem token)
app.use("/auth", userRoutes);
app.use("/health", healthRoutes);

// rotas protegidas
app.use("/exercises", exerciseRoutes);
app.use("/training-days", trainingDayRoutes);
app.use("/training-sessions", trainingSessionRoutes);

export default app;
