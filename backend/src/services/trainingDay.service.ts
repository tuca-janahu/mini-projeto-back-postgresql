// src/services/trainingDay.service.ts
import db from "../models";
import { Transaction, Op } from "sequelize";

function toId(v: string | number) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new Error("E_INVALID_ID");
  return n;
}

export async function createTrainingDay(
  userId: string | number,
  label: string,
  exercises: { exerciseId: string | number }[]
) {
  const uid = toId(userId);

  // valida duplicados
  const ids = (exercises ?? []).map(e => toId(e.exerciseId));
  if (new Set(ids).size !== ids.length) throw new Error("Duplicated exercises");

  // valida existência/pertencimento
  if (ids.length) {
    const valid = await db.exercise.count({ where: { id: { [Op.in]: ids }, userId: uid } });
    if (valid !== ids.length) throw new Error("Invalid exercises");
  }

  return await db.sequelize.transaction(async (tx: Transaction) => {
    // criar o dia
    const day = await db.trainingDay.create(
      { userId: uid, label: String(label).trim() },
      { transaction: tx }
    );

    // vincula exercícios (join), evitando duplicado via índice único
    if (ids.length) {
      await (day as any).$add("exercises", ids, { transaction: tx });
    }

    // retornar com include
    const full = await db.trainingDay.findByPk(day.get("id") as number, {
      include: [{ model: db.exercise, as: "exercises" }],
      transaction: tx,
    });
    return full!;
  });
}

export async function listTrainingDays(userId: string | number) {
  const uid = toId(userId);
  return await db.trainingDay.findAll({
    where: { userId: uid, isArchived: false },
    order: [["createdAt", "DESC"]],
  });
}

// GET: um dia do usuário (com exercises) 
export async function getTrainingDay(userId: string | number, id: string | number) {
  const uid = toId(userId);
  const tid = toId(id);
  return await db.trainingDay.findOne({
    where: { id: tid, userId: uid },
    include: [{ model: db.exercise, as: "exercises" }],
  });
}

export async function updateTrainingDay(
  userId: string | number,
  id: string | number,
  label?: string,
  exercises?: { exerciseId: string | number }[]
) {
  const uid = toId(userId);
  const tid = toId(id);

  return await db.sequelize.transaction(async (tx: Transaction) => {
    const day = await db.trainingDay.findOne({ where: { id: tid, userId: uid }, transaction: tx });
    if (!day) return null;

    // atualiza label
    if (typeof label === "string" && label.trim()) {
      day.set({ label: label.trim() });
      await day.save({ transaction: tx });
    }

    // atualiza exercises
    if (Array.isArray(exercises)) {
      const ids = exercises.map(e => toId(e.exerciseId));
      if (new Set(ids).size !== ids.length) throw new Error("Duplicated exercises");

      if (ids.length) {
        const valid = await db.exercise.count({
          where: { id: { [Op.in]: ids }, userId: uid },
          transaction: tx,
        });
        if (valid !== ids.length) throw new Error("Invalid exercises");
      }

      // substituir o conjunto
      await (day as any).$set("exercises", ids, { transaction: tx });
    }

    // retornar com include
    const full = await db.trainingDay.findByPk(tid, {
      include: [{ model: db.exercise, as: "exercises" }],
      transaction: tx,
    });
    return full!;
  });
}

export async function archiveTrainingDay(userId: string | number, id: string | number) {
  const uid = toId(userId);
  const tid = toId(id);
  const day = await db.trainingDay.findOne({ where: { id: tid, userId: uid } });
  if (!day) return null;
  day.set({ isArchived: true });
  await day.save();
  return day;
}
