import { Router } from "express";
import db from "../models";

const router = Router();

router.get("/", (_req, res) => {
  const cfg = db.sequelize.config || {};
  const dialect = db.sequelize.getDialect ? db.sequelize.getDialect() : "unknown";
  res.json({
    ok: true,
    envJwt: Boolean(process.env.JWT_SECRET),
    envDbUrl: Boolean(process.env.DATABASE_URL),
    dialect,
    database: cfg.database ?? null,
    host: cfg.host ?? null,
  });
});

router.get("/db", async (_req, res) => {
  try {
    await db.sequelize.authenticate();
    // opcional: sanity query
    await db.sequelize.query("SELECT 1");
    const cfg = (db.sequelize.getDialect && db.sequelize.getDialect()) || "unknown";
    // @ts-ignore
    const database = (db.sequelize.config?.database as string) || null;
    res.json({ ok: true, dialect: cfg, database });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message });
  }
});

router.get("/schema", async (_req, res) => {
  const [rows] = await db.sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY 1
  `);
  res.json({ tables: rows });
});

export default router;
