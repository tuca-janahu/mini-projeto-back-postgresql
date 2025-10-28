import { TrainingDay } from "../models/trainingDay.model";
import { Exercise } from "../models/exercise.model";
import { Types } from "mongoose";

export async function createTrainingDay(userId: string, label: string, exercises: { exerciseId: string }[]) {
  // valida duplicados
  const ids = exercises.map(e => e.exerciseId);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicated exercises");

  // valida se exercícios existem e pertencem ao usuário
  const validCount = await Exercise.countDocuments({ _id: { $in: ids }, userId });
  if (validCount !== ids.length) throw new Error("Invalid exercises");

  const doc = await TrainingDay.create({ userId, label, exercises });
  return doc;
}

export async function listTrainingDays(userId: string) {
  return await TrainingDay.find({ userId, isArchived: false }).sort({ createdAt: -1 }).lean();
}

export async function getTrainingDay(userId: string, id: string) {
  return await TrainingDay.findOne({ _id: id, userId }).lean();
}

export async function updateTrainingDay(userId: string, id: string, label?: string, exercises?: { exerciseId: string }[]) {
  const update: any = {};
  if (label) update.label = label;
  if (exercises) {
    const ids = exercises.map(e => e.exerciseId);
    if (new Set(ids).size !== ids.length) throw new Error("Duplicated exercises");
    const validCount = await Exercise.countDocuments({ _id: { $in: ids }, userId });
    if (validCount !== ids.length) throw new Error("Invalid exercises");
    update.exercises = exercises;
  }
  return await TrainingDay.findOneAndUpdate({ _id: id, userId }, update, { new: true, runValidators: true });
}

export async function archiveTrainingDay(userId: string, id: string) {
  return await TrainingDay.findOneAndUpdate({ _id: id, userId }, { isArchived: true }, { new: true });
}
