import { Request, Response } from "express";
import * as trainingSessionService from "../services/trainingSession.service";

function getUserId(req: Request): string {
  const sub = (req as any)?.user?.sub;
  if (!sub) throw new Error("Usuário não autenticado.");
  return String(sub);
}

// POST /training-sessions
export async function create(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const {
      trainingDayId,
      performedAt,
      exercises,
      notes,
    } = req.body as {
      trainingDayId: string;
      performedAt?: string | Date;
      exercises: { exerciseId: string; sets: { reps: number | null; weight: number | null }[] }[];
      notes?: string;
    };

    if (!trainingDayId) return res.status(400).json({ error: "trainingDayId é obrigatório" });
    if (!Array.isArray(exercises) || exercises.length === 0)
      return res.status(400).json({ error: "exercises é obrigatório e não pode ser vazio" });

    const created = await trainingSessionService.createTrainingSession(
      userId,
      trainingDayId,
      performedAt ? new Date(performedAt) : new Date(),
      exercises,
      notes
    );

    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.message === "E_TRAINING_DAY_NOT_FOUND") return res.status(404).json({ error: "TrainingDay não encontrado" });
    if (err?.message === "E_EXERCISE_NOT_FOUND") return res.status(404).json({ error: "Exercise inexistente para este usuário" });
    if (err?.message === "E_DUPLICATED_EXERCISES_IN_SESSION") return res.status(400).json({ error: "Exercício duplicado na sessão" });
    if (err?.message?.startsWith?.("E_INVALID_") || err?.message?.startsWith?.("E_WEIGHT_"))
      return res.status(400).json({ error: err.message });

    return res.status(500).json({ error: "Não foi possível criar a sessão", details: err?.message });
  }
}

// GET /training-sessions
// query: trainingDayId, exerciseId, from, to, page, limit, sort ("asc" | "desc")
export async function list(req: Request, res: Response) {
  try {
    const userId = getUserId(req);

    const {
      trainingDayId,
      exerciseId,
      from,
      to,
      page = "1",
      limit = "20",
      sort = "desc",
    } = req.query as Record<string, string>;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const s = sort === "asc" ? "asc" : "desc";

    const result = await trainingSessionService.listTrainingSessions(
      userId,
      { trainingDayId, exerciseId, from, to },
      p,
      l,
      s
    );

    return res.json(result); // { items, total, page, limit }
  } catch (err: any) {
    return res.status(500).json({ error: "Falha ao listar sessões", details: err?.message });
  }
}

// GET /training-sessions/:id
export async function getById(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const found = await trainingSessionService.getTrainingSession(userId, id);
    if (!found) return res.status(404).json({ error: "Sessão não encontrada" });
    return res.json(found);
  } catch (err: any) {
    return res.status(500).json({ error: "Falha ao buscar sessão", details: err?.message });
  }
}

// DELETE /training-sessions/:id
export async function remove(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const ok = await trainingSessionService.deleteTrainingSession(userId, id);
    if (!ok) return res.status(404).json({ error: "Sessão não encontrada" });
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ error: "Falha ao excluir sessão", details: err?.message });
  }
}

// GET /training-sessions/prefill/:trainingDayId
export async function prefill(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const { trainingDayId } = req.params;

    const data = await trainingSessionService.getPrefillForTrainingDay(userId, trainingDayId);
    return res.json(data);
  } catch (err: any) {
    if (err?.message === "E_TRAINING_DAY_NOT_FOUND") return res.status(404).json({ error: "TrainingDay não encontrado" });
    return res.status(500).json({ error: "Falha ao obter prefill", details: err?.message });
  }
}
