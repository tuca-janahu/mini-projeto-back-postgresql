// api/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';                  // ajuste o caminho se seu app.ts está em src/ ou backend/src/
import { ensureDb } from '../src/models'; // caminho para o seu /models/index.ts

let bootstrapped = false;

async function boot() {
  if (bootstrapped) return;
  await ensureDb(); // faz authenticate + sync({alter:true}) de forma segura e idempotente
  bootstrapped = true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await boot();
  // @ts-ignore — express handler compatível
  return app(req, res);
}
