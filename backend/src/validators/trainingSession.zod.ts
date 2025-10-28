import { z } from "zod";

export const TrainingDayItem = z.object({
  trainingDayId: z.string().min(1, "trainingDayId é obrigatório"),
});

export const CreateSessionSchema = z.object({
  date: z.coerce.date().optional(), // opcional: se não enviar, service pode setar default = new Date()
  trainingDay: z.array(TrainingDayItem).default([]),
});

export const UpdateSessionSchema = z.object({
  date: z.coerce.date().optional(),
  trainingDay: z.array(TrainingDayItem).optional(),
  isArchived: z.boolean().optional(),
});

export const QueryListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  archived: z.enum(["true", "false", "all"]).default("false"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(["date:asc", "date:desc", "createdAt:asc", "createdAt:desc"]).default("date:desc"),
});
