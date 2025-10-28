import { Router } from "express";
import db from "../database/configdb";
import { connection } from "mongoose";

const r = Router();

r.get("/db", async (_req, res) => {
  try {
    const conn = await db.connect();
    const admin = conn?.connection?.db?.admin?.();
    const ping = admin ? await admin.ping() : null;
    res.json({ ok: true, db: conn?.connection?.name ?? null, mongo: ping });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message });
  }
});

r.get("/", (_req, res) =>
  res.json({
    ok: true,
    envJwt: Boolean(process.env.JWT_SECRET),
    envMongo: Boolean(process.env.MONGODB_URI),
    mongoState: connection?.readyState ?? -1, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  })
);

export default r;
