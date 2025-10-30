// src/models/index.ts
import { Sequelize } from "sequelize";
import pg from "pg";
import dbConfig from "../config/configdb";

// MODELS (fábricas)
import userFactory from "./user.model";
import exerciseFactory from "./exercise.model";
import trainingDayFactory from "./trainingDay.model";
import trainingDayExerciseFactory from "./trainingDayExercise.model";
import trainingSessionFactory from "./trainingSession.model";
import trainingSessionExerciseFactory from "./trainingSessionExercise.model";
import trainingSessionSetFactory from "./trainingSessionSet.model";

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectModule: pg as any,
      logging: false,
      pool: { max: 2, min: 0, idle: 10_000, acquire: 20_000 },
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      password: dbConfig.password,
      dialect: "postgres",
      dialectModule: pg as any,
      logging: false,
      pool: { max: 2, min: 0, idle: 10_000, acquire: 20_000 },
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    });

// — Definição dos models —
const users = userFactory(sequelize);
const exercises = exerciseFactory(sequelize);
const trainingDays = trainingDayFactory(sequelize);
const trainingSessions = trainingSessionFactory(sequelize);

const trainingDayExercises = trainingDayExerciseFactory(sequelize);
const trainingSessionExercises = trainingSessionExerciseFactory(sequelize);
const trainingSessionSets = trainingSessionSetFactory(sequelize);

// — Associações — (use SEMPRE os nomes acima)

let _associationsApplied = false;
export function applyAssociations() {
  if (_associationsApplied) return;          // <<< evita repetir
  _associationsApplied = true;

  // Usuário dono de tudo
  users.hasMany(exercises, { foreignKey: "userId", onDelete: "CASCADE" });
  exercises.belongsTo(users, { foreignKey: "userId" });

  users.hasMany(trainingDays, { foreignKey: "userId", onDelete: "CASCADE" });
  trainingDays.belongsTo(users, { foreignKey: "userId" });

  users.hasMany(trainingSessions, { foreignKey: "userId", onDelete: "CASCADE" });
  trainingSessions.belongsTo(users, { foreignKey: "userId" });

  // A) TrainingDay ↔ Exercise
  trainingDays.belongsToMany(exercises, {
    through: trainingDayExercises,
    foreignKey: "trainingDayId",
    otherKey: "exerciseId",
  });
  exercises.belongsToMany(trainingDays, {
    through: trainingDayExercises,
    foreignKey: "exerciseId",
    otherKey: "trainingDayId",
  });
  trainingDayExercises.belongsTo(trainingDays, { foreignKey: "trainingDayId", onDelete: "CASCADE" });
  trainingDays.hasMany(trainingDayExercises, { foreignKey: "trainingDayId" });
  trainingDayExercises.belongsTo(exercises, { foreignKey: "exerciseId", onDelete: "CASCADE" });
  exercises.hasMany(trainingDayExercises, { foreignKey: "exerciseId" });

  // B) TrainingSession ↔ Exercise
  trainingSessions.belongsToMany(exercises, {
    through: trainingSessionExercises,
    foreignKey: "trainingSessionId",
    otherKey: "exerciseId",
  });
  exercises.belongsToMany(trainingSessions, {
    through: trainingSessionExercises,
    foreignKey: "exerciseId",
    otherKey: "trainingSessionId",
  });
  trainingSessionExercises.belongsTo(trainingSessions, { foreignKey: "trainingSessionId", onDelete: "CASCADE" });
  trainingSessions.hasMany(trainingSessionExercises, { foreignKey: "trainingSessionId" });
  trainingSessionExercises.belongsTo(exercises, { foreignKey: "exerciseId", onDelete: "CASCADE" });
  exercises.hasMany(trainingSessionExercises, { foreignKey: "exerciseId" });

  // C) Sets
  trainingSessionExercises.hasMany(trainingSessionSets, { foreignKey: "trainingSessionExerciseId", onDelete: "CASCADE" });
  trainingSessionSets.belongsTo(trainingSessionExercises, { foreignKey: "trainingSessionExerciseId" });

  trainingSessions.hasMany(trainingSessionSets, { foreignKey: "trainingSessionId", onDelete: "CASCADE" });
  trainingSessionSets.belongsTo(trainingSessions, { foreignKey: "trainingSessionId" });

  exercises.hasMany(trainingSessionSets, { foreignKey: "exerciseId", onDelete: "SET NULL" });
  trainingSessionSets.belongsTo(exercises, { foreignKey: "exerciseId" });
}

let readyPromise: Promise<void> | null = null;

export function ensureDb(): Promise<void> {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    await sequelize.authenticate();
    applyAssociations();                      // <<< LIGAR isto antes do sync

    const shouldSync =
      process.env.SEQUELIZE_SYNC === "1" || process.env.NODE_ENV !== "production";

    if (shouldSync) {
      await sequelize.sync({ alter: true });
    }
  })().catch((e) => {
    readyPromise = null;
    throw e;
  });

  return readyPromise;
}