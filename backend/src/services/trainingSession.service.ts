import { TrainingSession } from "../models/trainingSession.model";
import { TrainingDay } from "../models/trainingDay.model";
import { Exercise } from "../models/exercise.model";
import { Types } from "mongoose";

type SetItem = { reps: number | null; weight: number | null };
type SessionExerciseInput = { exerciseId: string; sets: SetItem[] };

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

async function assertTrainingDayOwnership(
  userId: string,
  trainingDayId: string
) {
  const exists = await TrainingDay.exists({ _id: trainingDayId, userId });
  if (!exists) throw new Error("E_TRAINING_DAY_NOT_FOUND");
}

async function getExercisesUnitsMap(userId: string, exerciseIds: string[]) {
  const docs = await Exercise.find({
    _id: { $in: exerciseIds },
    userId,
  }).lean();
  if (docs.length !== exerciseIds.length)
    throw new Error("E_EXERCISE_NOT_FOUND");
  const map = new Map<string, "kg" | "stack" | "bodyweight">();
  docs.forEach((d) => map.set(String(d._id), d.weightUnit as any));
  return map;
}

function validateSets(
  sets: SetItem[],
  unit: "kg" | "stack" | "bodyweight"
) {
  for (const s of sets) {
    // reps: permitir null no prefill, mas na criação de sessão real, você decide se aceita null
    if (s.reps != null && (!Number.isInteger(s.reps) || s.reps < 0)) {
      throw new Error("E_INVALID_REPS");
    }
    if (unit === "bodyweight") {
      if (s.weight != null)
        throw new Error("E_WEIGHT_NOT_ALLOWED_FOR_BODYWEIGHT");
    } else if (unit === "kg") {
      if (s.weight != null && !(typeof s.weight === "number"))
        throw new Error("E_WEIGHT_KG_NUMBER");
    } else if (unit === "stack") {
      if (s.weight != null && (!Number.isInteger(s.weight) || s.weight < 1)) {
        throw new Error("E_WEIGHT_STACK_INTEGER");
      }
    }
  }
}

async function ensureUniqueExercises(exercises: SessionExerciseInput[]) {
  const ids = exercises.map((e) => e.exerciseId);
  if (new Set(ids).size !== ids.length)
    throw new Error("E_DUPLICATED_EXERCISES_IN_SESSION");
}



export async function createTrainingSession(
  userId: string,
  trainingDayId: string,
  performedAt: Date,
  exercises: SessionExerciseInput[],
  notes?: string
) {
  await assertTrainingDayOwnership(userId, trainingDayId);
  ensureUniqueExercises(exercises);

  const units = await getExercisesUnitsMap(
    userId,
    exercises.map((e) => e.exerciseId)
  );
  for (const ex of exercises) {
    const unit = units.get(ex.exerciseId)!;
    validateSets(ex.sets, unit);
  }

  // monta doc
  const doc = await TrainingSession.create({
    userId: toObjectId(userId),
    trainingDayId: toObjectId(trainingDayId),
    performedAt,
    exercises: exercises.map((ex) => ({
      exerciseId: toObjectId(ex.exerciseId),
      sets: ex.sets,
    })),
    notes,
  });

  return doc;
}

export async function listTrainingSessions(
  userId: string,
  filters: {
    trainingDayId?: string;
    exerciseId?: string;
    from?: string; // ISO
    to?: string; // ISO
  },
  page = 1,
  limit = 20,
  sort: "asc" | "desc" = "desc"
) {
  const q: any = { userId };
  if (filters.trainingDayId) q.trainingDayId = filters.trainingDayId;
  if (filters.exerciseId) q["exercises.exerciseId"] = filters.exerciseId;

  if (filters.from || filters.to) {
    q.performedAt = {};
    if (filters.from) q.performedAt.$gte = new Date(filters.from);
    if (filters.to) q.performedAt.$lte = new Date(filters.to);
  }

  const s = sort === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    TrainingSession.find(q)
      .sort({ performedAt: s })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TrainingSession.countDocuments(q),
  ]);

  return { items, total, page, limit };
}

/* -------- obter -------- */

export async function getTrainingSession(userId: string, id: string) {
  return TrainingSession.findOne({ _id: id, userId }).lean();
}

/* -------- deletar -------- */

export async function deleteTrainingSession(userId: string, id: string) {
  const res = await TrainingSession.deleteOne({ _id: id, userId });
  return res.deletedCount === 1;
}

/* -------- PREFILL SEM CACHE -------- */

export async function getPrefillForTrainingDay(userId: string, trainingDayId: string) {
  // 1) obter o dia e a lista de exercícios
  const day = await TrainingDay.findOne({ _id: trainingDayId, userId }).lean();
  if (!day) throw new Error("E_TRAINING_DAY_NOT_FOUND");

  // 2) para cada exercício do dia, achar último do mesmo dia; senão, último global; senão 3 vazias
  const exercisesPrefill = await Promise.all(
    day.exercises.map(async (item: any) => {
      const exerciseId = String(item.exerciseId);

      // último do mesmo dia
      const lastSameDay = await TrainingSession
        .findOne({ userId, trainingDayId, "exercises.exerciseId": exerciseId })
        .sort({ performedAt: -1 })
        .lean();

      if (lastSameDay) {
        const ex = lastSameDay.exercises.find(e => String(e.exerciseId) === exerciseId);
        if (ex && ex.sets?.length) {
          return { exerciseId, sets: ex.sets };
        }
      }

      // último global (qualquer dia)
      const lastGlobal = await TrainingSession
        .findOne({ userId, "exercises.exerciseId": exerciseId })
        .sort({ performedAt: -1 })
        .lean();

      if (lastGlobal) {
        const ex = lastGlobal.exercises.find(e => String(e.exerciseId) === exerciseId);
        if (ex && ex.sets?.length) {
          return { exerciseId, sets: ex.sets };
        }
      }

      // fallback: 3 séries vazias
      return {
        exerciseId,
        sets: [
          { reps: null, weight: null },
          { reps: null, weight: null },
          { reps: null, weight: null },
        ]
      };
    })
  );

  return { trainingDayId, performedAt: new Date(), exercises: exercisesPrefill };
}