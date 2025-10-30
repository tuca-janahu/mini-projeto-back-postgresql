import {db} from "../models";
import { UniqueConstraintError, Op, ValidationError } from "sequelize";
import { MuscleGroup, WeightUnit } from "../models/exercise.model";

function toUserId(userId: string | number) {
  const n = Number(userId);
  if (!Number.isFinite(n) || n <= 0) throw new Error("E_INVALID_USER_ID");
  return n;
}

export async function isExerciseNameAvailable(
  userId: string | number,
  name: string
) {
  const uid = toUserId(userId);
  const nameLower = name.trim().toLowerCase();
  const exists = await db.exercises.count({ where: { userId: uid, nameLower } });
  return exists === 0;
}

export async function createExercise(
  userId: string | number,
  name: string,
  muscleGroup: MuscleGroup,
  weightUnit: WeightUnit
) {
  const uid = toUserId(userId);

  // quick check (UniqueConstraintError still handled below)
  const available = await isExerciseNameAvailable(uid, name);
  if (!available) throw new Error("Exercise name already exists");

  try {
    const exercise = await db.exercises.create({
      userId: uid,
      name: name.trim(), // model setter handles nameLower
      muscleGroup,
      weightUnit,
    });
    return exercise;
  } catch (err: any) {
    if (err instanceof UniqueConstraintError) throw new Error("E_DUPLICATE_NAME");
    if (err instanceof ValidationError) {
      const msg = err.errors.map((e: any) => e.message).join("; ");
      const e = new Error(msg || "validation_error");
      // @ts-ignore
      e.status = 400;
      throw e;
    }
    throw err;
  }
}

export async function listExercises(
  userId: string | number,
  filters?: { muscleGroup?: MuscleGroup; weightUnit?: WeightUnit; name?: string },
  page = 1,
  limit = 20
) {
  const uid = toUserId(userId);

  const where: any = { userId: uid };
  if (filters?.muscleGroup) where.muscleGroup = filters.muscleGroup;
  if (filters?.weightUnit) where.weightUnit = filters.weightUnit;
  if (filters?.name && filters.name.trim()) {
    where.name = { [Op.iLike]: `%${filters.name.trim()}%` };
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await db.exercises.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return { items: rows, total: count, page, limit };
}

export async function replaceExercise(
  userId: string | number,
  id: number | string,
  data: { name: string; muscleGroup: MuscleGroup; weightUnit: WeightUnit }
) {
  const uid = toUserId(userId);
  const exercise = await db.exercises.findOne({ where: { id: Number(id), userId: uid } });
  if (!exercise) return null;

  try {
    exercise.set({
      name: data.name.trim(),
      muscleGroup: data.muscleGroup,
      weightUnit: data.weightUnit,
    });
    await exercise.validate();
    await exercise.save();
    return exercise;
  } catch (err: any) {
    if (err instanceof UniqueConstraintError) throw new Error("E_DUPLICATE_NAME");
    if (err instanceof ValidationError) {
      const msg = err.errors.map((e: any) => e.message).join("; ");
      const e = new Error(msg || "validation_error");
      // @ts-ignore
      e.status = 400;
      throw e;
    }
    throw err;
  }
}

export async function patchExercise(
  userId: string | number,
  id: number | string,
  data: Partial<{ name: string; muscleGroup: MuscleGroup; weightUnit: WeightUnit; isArchived: boolean }>
) {
  const uid = toUserId(userId);
  const exercise = await db.exercises.findOne({ where: { id: Number(id), userId: uid } });
  if (!exercise) return null;

  const updates: any = {};
  if (typeof data.name === "string") updates.name = data.name.trim();
  if (typeof data.muscleGroup === "string") updates.muscleGroup = data.muscleGroup;
  if (typeof data.weightUnit === "string") updates.weightUnit = data.weightUnit;
  if (typeof data.isArchived === "boolean") updates.isArchived = data.isArchived;

  if (Object.keys(updates).length === 0) {
    return exercise;
  }

  try {
    exercise.set(updates);
    await exercise.validate();
    await exercise.save();
    return exercise;
  } catch (err: any) {
    if (err instanceof UniqueConstraintError) throw new Error("E_DUPLICATE_NAME");
    if (err instanceof ValidationError) {
      const msg = err.errors.map((e: any) => e.message).join("; ");
      const e = new Error(msg || "validation_error");
      // @ts-ignore
      e.status = 400;
      throw e;
    }
    throw err;
  }
}

export async function deleteExercise(userId: string | number, id: number | string) {
  const uid = toUserId(userId);
  const exercise = await db.exercises.findOne({ where: { id: Number(id), userId: uid } });
  if (!exercise) return null;
  await exercise.destroy();
  return exercise;
}
