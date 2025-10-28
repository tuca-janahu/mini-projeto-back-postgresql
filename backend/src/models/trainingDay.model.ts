import { Schema, model, Document, Types } from "mongoose";

export interface ITrainingDay extends Document {
  userId: Types.ObjectId;
  label: string;
  exercises: { exerciseId: Types.ObjectId }[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const trainingDaySchema = new Schema<ITrainingDay>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    exercises: [
      {
        exerciseId: { type: Schema.Types.ObjectId, ref: "Exercise", required: true },
      },
    ],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

trainingDaySchema.index({ userId: 1, label: 1 }, { unique: true });

// Validação extra antes de salvar: evitar duplicados
trainingDaySchema.pre("validate", function (next) {
  const ids = this.exercises.map(e => e.exerciseId.toString());
  const set = new Set(ids);
  if (ids.length !== set.size) {
    return next(new Error("Exercício duplicado no dia"));
  }
  next();
});

export const TrainingDay = model<ITrainingDay>("TrainingDay", trainingDaySchema);
