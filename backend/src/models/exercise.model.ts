import mongoose, {
  Schema,
  Document,
  Model,
  Types,
  HydratedDocument,
} from "mongoose";

export type MuscleGroup =
  | "peito"
  | "costas"
  | "bíceps"
  | "tríceps"
  | "ombros"
  | "quadríceps"
  | "posteriores"
  | "glúteos"
  | "panturrilhas"
  | "core"
  | "trapézio"
  | "antebraço";

export type WeightUnit = "kg" | "stack" | "bodyweight";

export interface IExercise extends Document {
  userId: Types.ObjectId; // dono do exercício
  name: string; // nome exibido
  nameLower: string; // auxiliar p/ unicidade case-insensitive
  muscleGroup: MuscleGroup;
  weightUnit: WeightUnit;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // campo auxiliar para unicidade case-insensitive por usuário
    nameLower: { type: String, required: true, lowercase: true, select: false },

    muscleGroup: {
      type: String,
      required: true,
      enum: [
        "peito",
        "costas",
        "bíceps",
        "tríceps",
        "ombros",
        "quadríceps",
        "posteriores",
        "glúteos",
        "panturrilhas",
        "core",
        "trapézio",
        "antebraço",
      ],
      index: true,
    },

    weightUnit: {
      type: String,
      required: true,
      enum: ["kg", "stack", "bodyweight"],
    },

    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).nameLower; // não expor campo auxiliar
        return ret;
      },
    },
  }
);

exerciseSchema.pre("validate", function (next) {
  if (this.name) {
    this.nameLower = this.name.trim().toLowerCase();
  }
  next();
});

exerciseSchema.index({ userId: 1, nameLower: 1 }, { unique: true });

export type ExerciseDoc = HydratedDocument<IExercise>;
export const Exercise: Model<IExercise> =
  mongoose.models.Exercise ||
  mongoose.model<IExercise>("Exercise", exerciseSchema);
