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

const databaseUrl = process.env.DATABASE_URL ?? "";     // Se existir, produção (Vercel)
const isProd = !!databaseUrl;

const useSSL = (process.env.DB_SSL ?? "1") !== "0";

// 2) Opções comuns (serverless friendly)
const common = {
  dialect: "postgres" as const,
  dialectModule: pg as any,
  logging: false,
  pool: {
    max: 2,         // serverless, manter baixo
    min: 0,
    acquire: 30_000,
    idle: 10_000,
    evict: 10_000,
  },
  // SSL só se habilitado
  dialectOptions: useSSL
    ? {
        ssl: { require: true, rejectUnauthorized: false },
        keepAlive: true,
      }
    : undefined,
};

// 3) Instância do Sequelize
let sequelize: Sequelize;

if (isProd) {
  // PRODUÇÃO (Vercel): usa a URL completa do provedor

  sequelize = new Sequelize(databaseUrl, common);
} else {
  // DESENVOLVIMENTO (local): usa dados discretos do config
  sequelize = new Sequelize(
    dbConfig.database as string,
    dbConfig.username as string,
    dbConfig.password as string,
    {
      ...common,
      host: dbConfig.host,
      port: dbConfig.port as number,
    }
  );
}

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

declare global {
  var __dbReady: Promise<void> | undefined;
}

export async function ensureDb() {
  if (!global.__dbReady) {
    global.__dbReady = (async () => {
      console.info("[DB] authenticate...");
      await sequelize.authenticate();
      console.info("[DB] sync alter (dev hotfix)...");
      await sequelize.sync({ alter: true }); 
      console.info("[DB] ready.");
    })();
  }
  return global.__dbReady;
}

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


export default db;
