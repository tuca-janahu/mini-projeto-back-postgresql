import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import { ensureDb } from "../src/models";

let booted = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!booted) {
    await ensureDb();     // <— GARANTE MODELS + SYNC antes do 1º request
    booted = true;
  }
  return (app as any)(req, res);
}
