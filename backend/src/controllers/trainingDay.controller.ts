import { Request, Response } from "express";
import * as service from "../services/trainingDay.service";
import { trainingDayCreateSchema, trainingDayUpdateSchema } from "../validators/trainingDay.zod";

export async function createDay(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const parsed = trainingDayCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const day = await service.createTrainingDay(userId, parsed.data.label, parsed.data.exercises);
    return res.status(201).json(day);
  } catch (err: any) {
    if (err?.status) return res.status(err.status).json({ error: err.message });

    if (err?.message === "Duplicated exercises") return res.status(400).json({ error: err.message });
    if (err?.message === "Invalid exercises")   return res.status(400).json({ error: err.message });
    console.error("[createDay] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function listDays(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  try {
    const days = await service.listTrainingDays(userId);
    return res.json(days);
  } catch (err: any) {
    console.error("[listDays] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function getDay(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  try {
    const day = await service.getTrainingDay(userId, req.params.id);
    if (!day) return res.status(404).json({ error: "Not found" });
    return res.json(day);
  } catch (err: any) {
    console.error("[getDay] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function patchDay(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const parsed = trainingDayUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const updated = await service.updateTrainingDay(userId, req.params.id, parsed.data.label, parsed.data.exercises);
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err: any) {
    if (err?.status) return res.status(err.status).json({ error: err.message });
    if (err?.message === "Duplicated exercises") return res.status(400).json({ error: err.message });
    if (err?.message === "Invalid exercises")   return res.status(400).json({ error: err.message });
    console.error("[patchDay] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function deleteDay(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  try {
    const updated = await service.archiveTrainingDay(userId, req.params.id);
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.status(204).send();
  } catch (err: any) {
    console.error("[deleteDay] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
