import { Request, Response } from "express";
import * as service from "../services/trainingDay.service";
import { trainingDayCreateSchema, trainingDayUpdateSchema } from "../validators/trainingDay.zod";

export async function createDay(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const parsed = trainingDayCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const day = await service.createTrainingDay(userId, parsed.data.label, parsed.data.exercises);
    res.status(201).json(day);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function listDays(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const days = await service.listTrainingDays(userId);
  res.json(days);
}

export async function getDay(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const day = await service.getTrainingDay(userId, req.params.id);
  if (!day) return res.status(404).json({ error: "Not found" });
  res.json(day);
}

export async function patchDay(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const parsed = trainingDayUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const updated = await service.updateTrainingDay(userId, req.params.id, parsed.data.label, parsed.data.exercises);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteDay(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const updated = await service.archiveTrainingDay(userId, req.params.id);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
}
