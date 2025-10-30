import express from "express"
import cors from "cors";
import userRoutes from "./routes/user.routes";
import exerciseRoutes from "./routes/exercise.routes";
import trainingDayRoutes from "./routes/trainingDay.routes";
import trainingSessionRoutes from "./routes/trainingSession.routes";
import healthRoutes from "./routes/health.routes";
import db from "./models/index"; // ajuste o caminho se preciso

const app = express();

app.use(express.json());
app.use(cors());

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
