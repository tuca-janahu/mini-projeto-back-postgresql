import { Sequelize, DataTypes, Model, Optional, ModelCtor } from "sequelize";

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

export interface ExerciseAttributes {
  id: number;
  userId: number;          // FK -> users.id (inteiro, coerente com seu User)
  name: string;
  nameLower: string;       // auxiliar p/ unicidade case-insensitive
  muscleGroup: MuscleGroup;
  weightUnit: WeightUnit;
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ExerciseCreationAttributes = Optional<
  ExerciseAttributes,
  "id" | "nameLower" | "isArchived" | "createdAt" | "updatedAt"
>;

export default function exerciseFactory(
  sequelize: Sequelize
): ModelCtor<Model<ExerciseAttributes, ExerciseCreationAttributes>> {
  const Exercise = sequelize.define<Model<ExerciseAttributes, ExerciseCreationAttributes>>(
    "Exercise",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // Se quiser reforçar FK no nível do DB:
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { len: [2, 100] },
        set(this: Model, value: string) {
          const trimmed = (value ?? "").trim();
          this.setDataValue("name", trimmed);
          this.setDataValue("nameLower", trimmed.toLowerCase());
        },
      },

      nameLower: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      muscleGroup: {
        type: DataTypes.ENUM(
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
          "antebraço"
        ),
        allowNull: false,
      },

      weightUnit: {
        type: DataTypes.ENUM("kg", "stack", "bodyweight"),
        allowNull: false,
      },

      isArchived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "exercises",
      timestamps: true,
      defaultScope: {
        // não expor o campo auxiliar
        attributes: { exclude: ["nameLower"] },
      },
      indexes: [
        // unicidade por usuário + nome (case-insensitive via nameLower)
        { unique: true, fields: ["userId", "nameLower"] },
        // busca/filtragem por grupos musculares
        { fields: ["muscleGroup"] },
        { fields: ["userId"] },
      ],
    }
  );

  // fallback: se alguém tentar salvar sem passar por setter
  Exercise.beforeValidate((exercise: any) => {
    if (exercise.name && !exercise.nameLower) {
      exercise.nameLower = String(exercise.name).trim().toLowerCase();
    }
  });

  return Exercise;
}
