import { Sequelize, DataTypes, Model, Optional, ModelCtor } from "sequelize";

export interface TrainingSessionSetAttributes {
  id: number;
  trainingSessionExerciseId: number;
  order: number;            
  reps: number | null;      
  weight: number | null;    
  createdAt?: Date;
  updatedAt?: Date;
}

export type TrainingSessionSetCreationAttributes = Optional<
  TrainingSessionSetAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export default function trainingSessionSetFactory(
  sequelize: Sequelize
): ModelCtor<Model<TrainingSessionSetAttributes, TrainingSessionSetCreationAttributes>> {
  const TrainingSessionSet =
    sequelize.define<Model<TrainingSessionSetAttributes, TrainingSessionSetCreationAttributes>>(
      "TrainingSessionSet",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        trainingSessionExerciseId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "training_session_exercises", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        order: { type: DataTypes.INTEGER, allowNull: false }, // 0-based ou 1-based, padronize
        reps: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
        weight: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      },
      {
        tableName: "training_session_sets",
        timestamps: true,
        indexes: [
          { unique: true, fields: ["trainingSessionExerciseId", "order"] },
          { fields: ["trainingSessionExerciseId"] },
        ],
      }
    );

  return TrainingSessionSet;
}
