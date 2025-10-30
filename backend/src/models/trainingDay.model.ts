import { Sequelize, DataTypes, Model, Optional, ModelCtor } from "sequelize";

export interface TrainingDayAttributes {
  id: number;
  userId: number;      // FK -> users.id
  label: string;       // nome do dia (ex.: "A", "Pernas", etc.)
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TrainingDayCreationAttributes = Optional<
  TrainingDayAttributes,
  "id" | "isArchived" | "createdAt" | "updatedAt"
>;

export default function trainingDayFactory(
  sequelize: Sequelize
): ModelCtor<Model<TrainingDayAttributes, TrainingDayCreationAttributes>> {
  const TrainingDay = sequelize.define<Model<TrainingDayAttributes, TrainingDayCreationAttributes>>(
    "TrainingDay",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      label: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { len: [2, 100] },
        set(this: Model, value: string) {
          this.setDataValue("label", (value ?? "").trim());
        },
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "training_days",
      timestamps: true,
      indexes: [
        // unicidade por usuário + label (mesma ideia do índice do Mongoose)
        { unique: true, fields: ["userId", "label"] },
        { fields: ["userId"] },
      ],
    }
  );

  return TrainingDay;
}
