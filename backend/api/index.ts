import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import db, { syncDb } from "../src/models";

let bootstrapped = false;
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!bootstrapped) {
    await db.sequelize.authenticate();
    await syncDb(); // <- cria/atualiza as tabelas (usar alter:true somente no dev!)
    console.info("[bootstrap] models:", Object.keys(db.sequelize.models));
    bootstrapped = true;
  }
  return (app as any)(req, res);
}