import { Schema, model, Document, Types } from "mongoose";

export interface ITrainingSession extends Document {
  userId: Types.ObjectId;
  trainingDayId: Types.ObjectId;
  performedAt: Date; // data/hora do treino
  exercises: Array<{
    exerciseId: Types.ObjectId;
    sets: Array<{
      reps: number | null;
      weight: number | null; // kg (float) | stack (int) | null (bodyweight)
    }>;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const setSchema = new Schema(
  {
    reps: { type: Number, min: 0, default: null },   // 0 se quiser marcar falha; null no prefill
    weight: { type: Number, default: null },         // coerência por unidade será validada no service
  },
  { _id: false }
);

const exerciseSnapSchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: "Exercise", required: true },
    sets: { type: [setSchema], default: [] },
  },
  { _id: false }
);

const trainingSessionSchema = new Schema<ITrainingSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    trainingDayId: { type: Schema.Types.ObjectId, ref: "TrainingDay", required: true, index: true },
    performedAt: { type: Date, required: true, index: true },
    exercises: { type: [exerciseSnapSchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

trainingSessionSchema.index({ userId: 1, trainingDayId: 1, performedAt: -1 });
trainingSessionSchema.index({ userId: 1, "exercises.exerciseId": 1, performedAt: -1 });

trainingSessionSchema.pre("validate", function (next) {
  const ids = (this.exercises || []).map(e => String(e.exerciseId));
  if (ids.length !== new Set(ids).size) {
    return next(new Error("Exercício duplicado na snapshot da sessão"));
  }
  next();
});

export const TrainingSession = model<ITrainingSession>("TrainingSession", trainingSessionSchema);
