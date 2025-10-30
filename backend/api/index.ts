import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import db from "../src/models";

let bootstrapped = false;

async function ensureBoot() {
  if (bootstrapped) return;

  console.log("[BOOT] authenticate...");
  await db.sequelize.authenticate();

  // ⚠️ Só pra criar (primeira vez): set DB_SYNC=true no Vercel
  if (process.env.DB_SYNC === "true") {
    console.log("[BOOT] syncing (alter)...");
    await db.sequelize.sync({ alter: true });
    console.log("[BOOT] sync done.");
  }

  // debug: liste as models carregadas
  console.log(
    "[BOOT] models:",
    db.sequelize.modelManager.models.map(m => m.tableName)
  );

  bootstrapped = true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureBoot();
  return (app as any)(req, res);
}
