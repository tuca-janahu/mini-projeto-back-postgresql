import { z } from "zod";

export const trainingDayCreateSchema = z.object({
  label: z.string().min(2).max(100),
  exercises: z.array(z.object({ exerciseId: z.string().min(1) })).default([]),
});

export const trainingDayUpdateSchema = z.object({
  label: z.string().min(2).max(100).optional(),
  exercises: z.array(z.object({ exerciseId: z.string().min(1) })).optional(),
});
