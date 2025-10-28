import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import db from "../src/database/configdb";
import { connection } from "mongoose";

// Conecta no Mongo (cache global dentro do connect)
let bootstrapped = false;
async function ensureBoot() {
  if (!bootstrapped) {
    console.log("[API] ensureBoot: connecting...");
    await db.connect();
    bootstrapped = true;
    console.log("[API] ensureBoot: connected. state =", connection.readyState);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureBoot();
  return (app as any)(req, res);
}

// app.get("/health", (_req, res) => {
//   res.json({
//     ok: true,
//     envJwt: Boolean(process.env.JWT_SECRET),
//     envMongo: Boolean(process.env.MONGODB_URI),
//     mongoState: connection?.readyState // 1=connected
//   });
// });