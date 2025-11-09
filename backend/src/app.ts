import express from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser"; 
import userRoutes from "./routes/user.routes";
import exerciseRoutes from "./routes/exercise.routes";
import trainingDayRoutes from "./routes/trainingDay.routes";
import trainingSessionRoutes from "./routes/trainingSession.routes";
import healthRoutes from "./routes/health.routes";
import { ensureDb } from "./models";


const app = express();

/* ===== CORS (produção + local) ===== */
const ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin || ORIGINS.includes(origin)) return cb(null, true);
    console.warn("[CORS] Origin NÃO permitida:", origin, "Permitidas:", ORIGINS);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true, // permite cookies se você usar httpOnly
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use((_, res, next) => { res.setHeader("Vary", "Origin"); next(); });

// Preflight universal (não use "*" com path-to-regexp)
app.options(/.*/, cors(corsOptions));

/* ===== Body/ Cookies ===== */
app.use(express.json());
app.use(cookieParser());

app.use(async (_req, res, next) => {
  try { await ensureDb(); next(); }
  catch (e) { console.error(e); res.status(500).json({ error: "DB not ready" }); }
});


app.get("/", (_req, res) => res.send("✅ API online"));

// rotas públicas (sem token)
app.use("/auth", userRoutes);
app.use("/health", healthRoutes);

// rotas protegidas
app.use("/exercises", exerciseRoutes);
app.use("/training-days", trainingDayRoutes);
app.use("/training-sessions", trainingSessionRoutes);

export default app;
