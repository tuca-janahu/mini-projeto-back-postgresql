import { Sequelize, DataTypes, Model, Optional, ModelCtor } from "sequelize";

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<UserAttributes, "id" | "createdAt" | "updatedAt">;

export default function userFactory(sequelize: Sequelize): ModelCtor<Model<UserAttributes, UserCreationAttributes>> {
  const User = sequelize.define<Model<UserAttributes, UserCreationAttributes>>(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(this: Model, value: string) {
          this.setDataValue("email", value.toLowerCase().trim());
        },
      },
      password: {
        type: DataTypes.STRING(72),
        allowNull: false,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      indexes: [{ unique: true, fields: ["email"] }],
    }
  );

  return User;
}
