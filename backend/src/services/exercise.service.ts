import {Exercise, WeightUnit, MuscleGroup} from "../models/exercise.model";

export async function isExerciseNameAvailable(
  userId: string,
  name: string
) {
  const nameLower = name.trim().toLowerCase();
  const exists = await Exercise.exists({ userId, nameLower });
  return !exists;
}

export async function createExercise(
  userId: string,
  name: string,
  muscleGroup: MuscleGroup,
  weightUnit: WeightUnit
) {
  const isAvailable = await isExerciseNameAvailable(userId, name);
  if (!isAvailable) {
    throw new Error("Exercise name already exists");
  }

  const exercise = new Exercise({
    userId,
    name: name.trim(),
    muscleGroup,
    weightUnit,
  });

  try {
    await exercise.save();
    return exercise;
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new Error("E_DUPLICATE_NAME");
    }
    throw err;
  }
}

export async function listExercises(
  userId: string,
  filters?: { muscleGroup?: MuscleGroup; weightUnit?: WeightUnit; name?: string },
  page = 1,
  limit = 20
) {
  const q: any = { userId };
  if (filters?.muscleGroup) q.muscleGroup = filters.muscleGroup;
  if (filters?.weightUnit) q.weightUnit = filters.weightUnit;
  if (filters?.name) q.name = { $regex: filters.name, $options: "i" };

  const [items, total] = await Promise.all([
    Exercise.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Exercise.countDocuments(q),
  ]);
  return { items, total, page, limit };
}


export async function replaceExercise(
  userId: string,
  id: string,
  data: { name: string; muscleGroup: MuscleGroup; weightUnit: WeightUnit }
) {
  // PUT = exige todos os campos obrigatórios
  if (!data?.name || !data?.muscleGroup || !data?.weightUnit) {
    throw new Error("E_MISSING_FIELDS");
  }

  try {
    const updated = await Exercise.findOneAndUpdate(
      { _id: id, userId },
      {
        name: data.name.trim(),
        muscleGroup: data.muscleGroup,
        weightUnit: data.weightUnit,
      },
      { new: true, runValidators: true }
    );

    if (!updated) return null;
    return updated;
  } catch (err: any) {
    if (err?.code === 11000) throw new Error("E_DUPLICATE_NAME");
    throw err;
  }
}

export async function patchExercise(
  userId: string,
  id: string,
  data: Partial<{ name: string; muscleGroup: MuscleGroup; weightUnit: WeightUnit; isArchived: boolean }>
) {
  const $set: any = {};
  if (typeof data.name === "string") $set.name = data.name.trim();
  if (typeof data.muscleGroup === "string") $set.muscleGroup = data.muscleGroup;
  if (typeof data.weightUnit === "string") $set.weightUnit = data.weightUnit;
  if (typeof data.isArchived === "boolean") $set.isArchived = data.isArchived;

  // nada para atualizar → retorna o atual
  if (Object.keys($set).length === 0) {
    return await Exercise.findOne({ _id: id, userId });
  }

  try {
    const updated = await Exercise.findOneAndUpdate(
      { _id: id, userId },
      { $set },
      { new: true, runValidators: true }
    );
    if (!updated) return null;
    return updated;
  } catch (err: any) {
    if (err?.code === 11000) throw new Error("E_DUPLICATE_NAME");
    throw err;
  }
}

export async function deleteExercise(userId: string, id: string) {
  const deleted = await Exercise.findOneAndDelete({ _id: id, userId });
  return deleted; // null se não existir
}
