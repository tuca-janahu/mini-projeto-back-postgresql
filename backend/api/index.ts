import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import { syncDb } from "../src/models";

let booted = false;
async function ensureBoot() {
  if (!booted) {
    await syncDb();
    booted = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureBoot();
  return (app as any)(req, res);
}
