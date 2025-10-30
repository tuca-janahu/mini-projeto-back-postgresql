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

const sequelize = new Sequelize(
  dbConfig.database as string,
  dbConfig.username as string,
  dbConfig.password as string,
  {
    host: dbConfig.host,
    port: dbConfig.port as number,
    dialect: "postgres",
    dialectModule: pg as any,
    dialectOptions: 
    { ssl: { require: true, rejectUnauthorized: false } },
     
    pool: {
      max: dbConfig.pool?.max ?? 2,
      min: dbConfig.pool?.min ?? 0,
      acquire: dbConfig.pool?.acquire ?? 30000,
      idle: dbConfig.pool?.idle ?? 10000,
      evict: dbConfig.pool?.evict ?? 10000,
    },
    logging: false,
  }
);

// — Definição dos models —
const users = userFactory(sequelize);
const exercises = exerciseFactory(sequelize);
const trainingDays = trainingDayFactory(sequelize);
const trainingDayExercises = trainingDayExerciseFactory(sequelize);
const trainingSessions = trainingSessionFactory(sequelize);
const trainingSessionExercises = trainingSessionExerciseFactory(sequelize);
const trainingSessionSets = trainingSessionSetFactory(sequelize);

// — Associações — (use SEMPRE os nomes acima)
trainingSessions.belongsTo(users, { foreignKey: "userId", as: "user" });
users.hasMany(trainingSessions, { foreignKey: "userId", as: "trainingSessions" });

trainingSessions.belongsTo(trainingDays, { foreignKey: "trainingDayId", as: "trainingDay" });
trainingDays.hasMany(trainingSessions, { foreignKey: "trainingDayId", as: "sessions" });

trainingDayExercises.belongsTo(trainingDays, { foreignKey: "trainingDayId", as: "day" });
trainingDays.hasMany(trainingDayExercises, { foreignKey: "trainingDayId", as: "items" });

trainingDayExercises.belongsTo(exercises, { foreignKey: "exerciseId", as: "exercise" });
exercises.hasMany(trainingDayExercises, { foreignKey: "exerciseId", as: "inDays" });

trainingSessionExercises.belongsTo(trainingSessions, { foreignKey: "trainingSessionId", as: "session" });
trainingSessions.hasMany(trainingSessionExercises, { foreignKey: "trainingSessionId", as: "items" });

trainingSessionExercises.belongsTo(exercises, { foreignKey: "exerciseId", as: "exercise" });
exercises.hasMany(trainingSessionExercises, { foreignKey: "exerciseId", as: "sessionItems" });

trainingSessionSets.belongsTo(trainingSessionExercises, { foreignKey: "trainingSessionExerciseId", as: "sessionExercise" });
trainingSessionExercises.hasMany(trainingSessionSets, { foreignKey: "trainingSessionExerciseId", as: "sets" });

export const db = {
  sequelize,
  users,
  exercises,
  trainingDays,
  trainingDayExercises,
  trainingSessions,
  trainingSessionExercises,
  trainingSessionSets,
};
export type DB = typeof db;

// — Bootstrap com cache global (funciona no Vercel) —
declare global {
  // eslint-disable-next-line no-var
  var __dbReady: Promise<void> | undefined;
}

export async function ensureDb() {
  console.info("⏳ ensureDb: authenticating…");
  await sequelize.authenticate();
  console.info("⏳ ensureDb: syncing…");
  await sequelize.sync({ alter: true }); // em produção, troque por migrations
  console.info("✅ ensureDb: done.");
}

export default db;
