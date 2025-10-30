import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import db from "../src/models"; // <- exporta { sequelize, Sequelize, ... }

let bootstrapped = false;

async function ensureBoot() {
  if (bootstrapped) return;
  console.log("[API] ensureBoot: connecting to DB...");
  await db.sequelize.authenticate();
  // Em dev/local você poderia usar sync; em produção use migrations.
  // if (process.env.NODE_ENV !== "production") { await db.sequelize.sync(); }
  bootstrapped = true;
  console.log("[API] ensureBoot: connected.");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureBoot();
  return (app as any)(req, res); // delega para o Express
}
