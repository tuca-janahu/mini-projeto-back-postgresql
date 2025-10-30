import { Sequelize, DataTypes, Model, Optional, ModelCtor } from "sequelize";

export interface TrainingSessionAttributes {
  id: number;
  userId: number;
  trainingDayId: number;
  performedAt: Date;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TrainingSessionCreationAttributes = Optional<
  TrainingSessionAttributes,
  "id" | "notes" | "createdAt" | "updatedAt"
>;

export default function trainingSessionFactory(
  sequelize: Sequelize
): ModelCtor<Model<TrainingSessionAttributes, TrainingSessionCreationAttributes>> {
  const TrainingSession =
    sequelize.define<Model<TrainingSessionAttributes, TrainingSessionCreationAttributes>>(
      "TrainingSession",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        trainingDayId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "training_days", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        performedAt: { type: DataTypes.DATE, allowNull: false },
        notes: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        tableName: "training_sessions",
        timestamps: true,
        indexes: [
          { fields: ["userId", "trainingDayId", "performedAt"] },
          { fields: ["userId", "performedAt"] },
        ],
      }
    );

  return TrainingSession;
}
