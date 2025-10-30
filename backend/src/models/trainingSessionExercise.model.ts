import { Sequelize, DataTypes, Model, Optional, ModelCtor } from "sequelize";

export interface TrainingSessionExerciseAttributes {
  id: number;
  trainingSessionId: number;
  exerciseId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TrainingSessionExerciseCreationAttributes = Optional<
  TrainingSessionExerciseAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export default function trainingSessionExerciseFactory(
  sequelize: Sequelize
): ModelCtor<Model<TrainingSessionExerciseAttributes, TrainingSessionExerciseCreationAttributes>> {
  const TrainingSessionExercise =
    sequelize.define<Model<TrainingSessionExerciseAttributes, TrainingSessionExerciseCreationAttributes>>(
      "TrainingSessionExercise",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        trainingSessionId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "training_sessions", key: "id" },
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
        tableName: "training_session_exercises",
        timestamps: true,
        indexes: [
          // impede exercício duplicado na mesma sessão
          { unique: true, fields: ["trainingSessionId", "exerciseId"] },
          { fields: ["trainingSessionId"] },
          { fields: ["exerciseId"] },
        ],
      }
    );

  return TrainingSessionExercise;
}
