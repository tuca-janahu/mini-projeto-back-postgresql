import { Sequelize, DataTypes, Model, Optional, ModelCtor } from "sequelize";

export interface TrainingDayExerciseAttributes {
  id: number;
  trainingDayId: number;  // FK -> training_days.id
  exerciseId: number;     // FK -> exercises.id
  createdAt?: Date;
  updatedAt?: Date;
}

export type TrainingDayExerciseCreationAttributes = Optional<
  TrainingDayExerciseAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export default function trainingDayExerciseFactory(
  sequelize: Sequelize
): ModelCtor<Model<TrainingDayExerciseAttributes, TrainingDayExerciseCreationAttributes>> {
  const TrainingDayExercise =
    sequelize.define<Model<TrainingDayExerciseAttributes, TrainingDayExerciseCreationAttributes>>(
      "TrainingDayExercise",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        trainingDayId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "training_days", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        exerciseId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "exercises", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
      },
      {
        tableName: "training_day_exercises",
        timestamps: true,
        indexes: [
          // evita duplicado: mesmo exercício repetido no mesmo dia
          { unique: true, fields: ["trainingDayId", "exerciseId"] },
          { fields: ["trainingDayId"] },
          { fields: ["exerciseId"] },
        ],
      }
    );

  // (Opcional) proteção adicional semelhante ao pre('validate') do Mongoose
  // Aqui a unicidade já é garantida pelo índice único acima.

  return TrainingDayExercise;
}
