// src/services/trainingSession.service.ts
import db from "../models";
import { Op, Transaction, UniqueConstraintError, ValidationError } from "sequelize";

const TrainingDay = db.trainingDay;
const Exercise = db.exercise;
const TrainingSession = db.trainingSession;
const TrainingSessionExercise = db.trainingSessionExercise;
const TrainingSessionSet = db.trainingSessionSet;

/* ===== Types equivalentes ===== */
export type SetItem = { reps: number | null; weight: number | null };
export type SessionExerciseInput = { exerciseId: string | number; sets: SetItem[] };

/* ===== Helpers ===== */
function toId(v: string | number) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new Error("E_INVALID_ID");
  return n;
}

async function assertTrainingDayOwnership(userId: string | number, trainingDayId: string | number) {
  const uid = toId(userId);
  const tid = toId(trainingDayId);
  const exists = await TrainingDay.count({ where: { id: tid, userId: uid } });
  if (exists === 0) throw new Error("E_TRAINING_DAY_NOT_FOUND");
}

async function getExercisesUnitsMap(userId: string | number, exerciseIds: Array<string | number>) {
  const uid = toId(userId);
  const ids = exerciseIds.map(toId);
  const docs = await Exercise.findAll({
    where: { id: { [Op.in]: ids }, userId: uid },
    attributes: ["id", "weightUnit"],
  });
  if (docs.length !== ids.length) throw new Error("E_EXERCISE_NOT_FOUND");
  const map = new Map<number, "kg" | "stack" | "bodyweight">();
  docs.forEach((d: any) => map.set(Number(d.id), d.weightUnit));
  return map;
}

function validateSets(sets: SetItem[], unit: "kg" | "stack" | "bodyweight") {
  for (const s of sets) {
    if (s.reps != null && (!Number.isInteger(s.reps) || s.reps < 0)) {
      throw new Error("E_INVALID_REPS");
    }
    if (unit === "bodyweight") {
      if (s.weight != null) throw new Error("E_WEIGHT_NOT_ALLOWED_FOR_BODYWEIGHT");
    } else if (unit === "kg") {
      if (s.weight != null && typeof s.weight !== "number") throw new Error("E_WEIGHT_KG_NUMBER");
    } else if (unit === "stack") {
      if (s.weight != null && (!Number.isInteger(s.weight) || s.weight < 1)) {
        throw new Error("E_WEIGHT_STACK_INTEGER");
      }
    }
  }
}

function ensureUniqueExercises(exercises: SessionExerciseInput[]) {
  const ids = exercises.map((e) => String(e.exerciseId));
  if (new Set(ids).size !== ids.length) throw new Error("E_DUPLICATED_EXERCISES_IN_SESSION");
}

/* ===== CREATE ===== */
export async function createTrainingSession(
  userId: string | number,
  trainingDayId: string | number,
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
  // valida sets conforme a unidade
  for (const ex of exercises) {
    const unit = units.get(toId(ex.exerciseId))!;
    validateSets(ex.sets, unit);
  }

  const uid = toId(userId);
  const tid = toId(trainingDayId);

  try {
    return await db.sequelize.transaction(async (tx: Transaction) => {
      const session = await TrainingSession.create(
        { userId: uid, trainingDayId: tid, performedAt, notes },
        { transaction: tx }
      );

      // cria os itens (exercícios da sessão)
      for (const item of exercises) {
        const tse = await TrainingSessionExercise.create(
          { trainingSessionId: Number(session.get("id")), exerciseId: toId(item.exerciseId) },
          { transaction: tx }
        );

        if (item.sets?.length) {
          const rows = item.sets.map((s, idx) => ({
            trainingSessionExerciseId: Number(tse.get("id")),
            order: idx, // 0-based
            reps: s.reps,
            weight: s.weight, // DECIMAL(10,2) no model
          }));
          await TrainingSessionSet.bulkCreate(rows, { transaction: tx });
        }
      }

      // retorna expandido
      const full = await TrainingSession.findByPk(Number(session.get("id")), {
        include: [
          { model: TrainingDay, as: "trainingDay" },
          {
            model: TrainingSessionExercise,
            as: "items",
            include: [
              { model: Exercise, as: "exercise" },
              { model: TrainingSessionSet, as: "sets" },
            ],
          },
        ],
        transaction: tx,
      });
      return full!;
    });
  } catch (err: any) {
    if (err instanceof UniqueConstraintError) throw new Error("E_DUPLICATED_EXERCISES_IN_SESSION");
    if (err instanceof ValidationError) {
      const msg = err.errors.map((e) => e.message).join("; ");
      const e = new Error(msg || "validation_error");
      // @ts-ignore
      e.status = 400;
      throw e;
    }
    throw err;
  }
}

/* ===== LIST ===== */
export async function listTrainingSessions(
  userId: string | number,
  filters: {
    trainingDayId?: string | number;
    exerciseId?: string | number;
    from?: string; // ISO
    to?: string;   // ISO
  },
  page = 1,
  limit = 20,
  sort: "asc" | "desc" = "desc"
) {
  const uid = toId(userId);
  const where: any = { userId: uid };

  if (filters?.trainingDayId) where.trainingDayId = toId(filters.trainingDayId);
  if (filters?.from || filters?.to) {
    where.performedAt = {};
    if (filters.from) where.performedAt[Op.gte] = new Date(filters.from);
    if (filters.to) where.performedAt[Op.lte] = new Date(filters.to);
  }

  const order = [["performedAt", sort === "asc" ? "ASC" : "DESC"]];
  const offset = (page - 1) * limit;

  // filtro por exercício exige join
  const include: any[] = [];
  if (filters?.exerciseId) {
    include.push({
      model: TrainingSessionExercise,
      as: "items",
      required: true,
      where: { exerciseId: toId(filters.exerciseId) },
      attributes: [], // não precisa trazer itens na listagem
    });
  }

  const { rows, count } = await TrainingSession.findAndCountAll({
    where,
    include,
    limit,
    offset,
    distinct: true, // conta por sessão, não por join
  });

  return { items: rows, total: count, page, limit };
}

/* ===== GET ===== */
export async function getTrainingSession(userId: string | number, id: string | number) {
  const uid = toId(userId);
  const sid = toId(id);
  return await TrainingSession.findOne({
    where: { id: sid, userId: uid },
    include: [
      { model: TrainingDay, as: "trainingDay" },
      {
        model: TrainingSessionExercise,
        as: "items",
        include: [
          { model: Exercise, as: "exercise" },
          { model: TrainingSessionSet, as: "sets" },
        ],
      },
    ],
  });
}

/* ===== DELETE ===== */
export async function deleteTrainingSession(userId: string | number, id: string | number) {
  const uid = toId(userId);
  const sid = toId(id);
  const n = await TrainingSession.destroy({ where: { id: sid, userId: uid } });
  return n === 1;
}

/*  PREFILL (sem cache) 
   Para cada exercício do dia:
   1) tenta último set do MESMO dia;
   2) senão, último GLOBAL do usuário;
   3) senão, fallback 3 sets vazios.
*/
export async function getPrefillForTrainingDay(
  userId: string | number,
  trainingDayId: string | number
) {
  const uid = toId(userId);
  const tid = toId(trainingDayId);

  // 1) obter o dia + exercícios do dia
  const day = await TrainingDay.findOne({
    where: { id: tid, userId: uid },
    include: [{ model: Exercise, as: "exercises", attributes: ["id"] }],
  });
  if (!day) throw new Error("E_TRAINING_DAY_NOT_FOUND");

  const exerciseIds = (day as any).exercises.map((e: any) => Number(e.id)) as number[];

  async function findLastWithExercise(whereExtra: any) {
    return await TrainingSession.findOne({
      where: { userId: uid, ...whereExtra },
      order: [["performedAt", "DESC"]],
      include: [
        {
          model: TrainingSessionExercise,
          as: "items",
          required: true,
          where: { exerciseId: { [Op.in]: exerciseIds } },
          include: [{ model: TrainingSessionSet, as: "sets" }],
        },
      ],
    });
  }

  const prefill = [] as Array<{ exerciseId: number; sets: SetItem[] }>;

  for (const exId of exerciseIds) {
    const lastSameDay = await TrainingSession.findOne({
      where: { userId: uid, trainingDayId: tid },
      order: [["performedAt", "DESC"]],
      include: [
        {
          model: TrainingSessionExercise,
          as: "items",
          required: true,
          where: { exerciseId: exId },
          include: [{ model: TrainingSessionSet, as: "sets" }],
        },
      ],
    });

    if (lastSameDay) {
      const item = (lastSameDay as any).items[0];
      if (item?.sets?.length) {
        prefill.push({
          exerciseId: exId,
          sets: item.sets
            .sort((a: any, b: any) => a.order - b.order)
            .map((s: any) => ({ reps: s.reps, weight: s.weight })),
        });
        continue;
      }
    }

    // 3) último global
    const lastGlobal = await TrainingSession.findOne({
      where: { userId: uid },
      order: [["performedAt", "DESC"]],
      include: [
        {
          model: TrainingSessionExercise,
          as: "items",
          required: true,
          where: { exerciseId: exId },
          include: [{ model: TrainingSessionSet, as: "sets" }],
        },
      ],
    });

    if (lastGlobal) {
      const item = (lastGlobal as any).items[0];
      if (item?.sets?.length) {
        prefill.push({
          exerciseId: exId,
          sets: item.sets
            .sort((a: any, b: any) => a.order - b.order)
            .map((s: any) => ({ reps: s.reps, weight: s.weight })),
        });
        continue;
      }
    }

    // 4) fallback: 3 vazias
    prefill.push({
      exerciseId: exId,
      sets: [
        { reps: null, weight: null },
        { reps: null, weight: null },
        { reps: null, weight: null },
      ],
    });
  }

  return { trainingDayId: tid, performedAt: new Date(), exercises: prefill };
}
