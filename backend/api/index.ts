// api/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import db from "../src/models";

let bootstrapped = false;

async function ensureBoot() {
  if (bootstrapped) return;

  await db.sequelize.authenticate();

  if (process.env.DB_SYNC === "true") {
    console.log("⏳ Syncing DB (alter)...");
    await db.sequelize.sync({ alter: true }); // cria/ajusta tabelas
    console.log("✅ DB synced.");
  }

  bootstrapped = true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureBoot();
  return (app as any)(req, res);
}
