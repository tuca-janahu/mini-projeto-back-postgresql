import { db } from "../models";
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
  const ids = (exercises ?? []).map((e) => toId(e.exerciseId));
  if (new Set(ids).size !== ids.length) throw new Error("Duplicated exercises");

  // valida existência/pertencimento
  if (ids.length) {
    const valid = await db.exercises.count({
      where: { id: { [Op.in]: ids }, userId: uid },
    });
    if (valid !== ids.length) throw new Error("Invalid exercises");
  }

  return await db.sequelize.transaction(async (tx: Transaction) => {
    // criar o dia
    const day = await db.trainingDays.create(
      { userId: uid, label: String(label).trim() },
      { transaction: tx }
    );

    // vincula exercícios (join), evitando duplicado via índice único
    if (ids.length) {
      await db.trainingDayExercises.bulkCreate(
        ids.map((exerciseId: number) => ({
          trainingDayId: day.get("id") as number,
          exerciseId,
        })),
        {
          transaction: tx,
          ignoreDuplicates: true, // requer índice único (trainingDayId, exerciseId)
        }
      );
    }

    // retornar com include
    const full = await db.trainingDays.findByPk(day.get("id") as number, {
      include: [
        {
          model: db.trainingDayExercises,
          as: "items",
          include: [{ model: db.exercises, as: "exercise" }],
        },
      ],
      transaction: tx,
    });
    return full!;
  });
}

export async function listTrainingDays(userId: string | number) {
  const uid = toId(userId);
  return await db.trainingDays.findAll({
    where: { userId: uid, isArchived: false },
    order: [["createdAt", "DESC"]],
  });
}

// GET: um dia do usuário (com exercises)
export async function getTrainingDay(
  userId: string | number,
  id: string | number
) {
  const uid = toId(userId);
  const tid = toId(id);

  return await db.trainingDays.findOne({
    where: { id: tid, userId: uid },
    include: [
      {
        model: db.trainingDayExercises,
        as: "items",
        include: [{ model: db.exercises, as: "exercise" }],
      },
    ],
    order: [[{ model: db.trainingDayExercises, as: "items" }, "id", "ASC"]],
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
    const day = await db.trainingDays.findOne({
      where: { id: tid, userId: uid },
      transaction: tx,
      lock: tx.LOCK.UPDATE, // evita write skew sob concorrência
    });
    if (!day) return null;

    // 1) label (opcional)
    if (typeof label === "string" && label.trim()) {
      day.set({ label: label.trim() });
      await day.save({ transaction: tx });
    }

    // 2) exercises (opcional) — replace-all na tabela de junção
    if (Array.isArray(exercises)) {
      const ids = exercises.map((e) => toId(e.exerciseId));

      // valida duplicados
      if (new Set(ids).size !== ids.length)
        throw new Error("Duplicated exercises");

      // valida existência/pertencimento ao usuário
      if (ids.length) {
        const valid = await db.exercises.count({
          where: { id: { [Op.in]: ids }, userId: uid },
          transaction: tx,
        });
        if (valid !== ids.length) throw new Error("Invalid exercises");
      }

      // apaga todas as linhas antigas do dia
      await db.trainingDayExercises.destroy({
        where: { trainingDayId: tid },
        transaction: tx,
      });

      // recria (se houver novas)
      if (ids.length) {
        await db.trainingDayExercises.bulkCreate(
          ids.map((exerciseId: number) => ({
            trainingDayId: tid,
            exerciseId,
          })),
          {
            transaction: tx,
            ignoreDuplicates: true, // exige índice único (trainingDayId, exerciseId)
          }
        );
      }
    }

    // 3) retorna com include consistente
    const full = await db.trainingDays.findByPk(tid, {
      include: [
        {
          model: db.trainingDayExercises,
          as: "items",
          include: [{ model: db.exercises, as: "exercise" }],
        },
      ],
      order: [[{ model: db.trainingDayExercises, as: "items" }, "id", "ASC"]],
      transaction: tx,
    });

    return full!;
  });
}

export async function archiveTrainingDay(
  userId: string | number,
  id: string | number
) {
  const uid = toId(userId);
  const tid = toId(id);
  const day = await db.trainingDays.findOne({
    where: { id: tid, userId: uid },
  });
  if (!day) return null;
  day.set({ isArchived: true });
  await day.save();
  return day;
}
