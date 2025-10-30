  import { Sequelize } from "sequelize";
  import userFactory from "./user.model";
  import exerciseFactory from "./exercise.model";
  import trainingDayFactory from "./trainingDay.model";
  import trainingDayExerciseFactory from "./trainingDayExercise.model";

  import trainingSessionFactory from "./trainingSession.model";
  import trainingSessionSetFactory from "./trainingSessionSet.model";
  import trainingSessionExerciseFactory from "./trainingSessionExercise.model";
  import dbConfig from "../config/configdb"; 
  import pg from "pg";

  const sequelize = new Sequelize(
    dbConfig.database as string,
    dbConfig.username as string,
    dbConfig.password as string,
    {
      host: dbConfig.host,
      port: dbConfig.port as number,
      dialect: dbConfig.dialect as any,   // postgres
      dialectModule: pg,
      dialectOptions: {
        ssl:{
          require: true,
          rejectUnauthorized: false,
        },
      },
      pool: {
          max: dbConfig.pool?.max || 2,
          min: dbConfig.pool?.min || 0,
          acquire: dbConfig.pool?.acquire || 3000,
          idle: dbConfig.pool?.idle || 0,
          evict: dbConfig.pool?.evict || 10000,
      }
    }
  );

  const users = userFactory(sequelize);
  const exercise = exerciseFactory(sequelize);

  const trainingDay = trainingDayFactory(sequelize);
  const trainingDayExercise = trainingDayExerciseFactory(sequelize);

  const trainingSession = trainingSessionFactory(sequelize);
  const trainingSessionExercise = trainingSessionExerciseFactory(sequelize);
  const trainingSessionSet = trainingSessionSetFactory(sequelize);



// 2) ASSOCIE aqui (use os mesmos nomes que exporta)
trainingSession.belongsTo(users, { foreignKey: "userId", as: "user" });
users.hasMany(trainingSession, { foreignKey: "userId", as: "trainingSessions" });

trainingSession.belongsTo(trainingDay, { foreignKey: "trainingDayId", as: "trainingDay" });
trainingDay.hasMany(trainingSession, { foreignKey: "trainingDayId", as: "sessions" });

trainingDayExercise.belongsTo(trainingDay, { foreignKey: "trainingDayId", as: "day" });
trainingDay.hasMany(trainingDayExercise, { foreignKey: "trainingDayId", as: "items" });

trainingDayExercise.belongsTo(exercise, { foreignKey: "exerciseId", as: "exercise" });
exercise.hasMany(trainingDayExercise, { foreignKey: "exerciseId", as: "inDays" });

trainingSessionExercise.belongsTo(trainingSession, { foreignKey: "trainingSessionId", as: "session" });
trainingSession.hasMany(trainingSessionExercise, { foreignKey: "trainingSessionId", as: "items" });

trainingSessionExercise.belongsTo(exercise, { foreignKey: "exerciseId", as: "exercise" });
exercise.hasMany(trainingSessionExercise, { foreignKey: "exerciseId", as: "sessionItems" });

trainingSessionSet.belongsTo(trainingSessionExercise, { foreignKey: "trainingSessionExerciseId", as: "sessionExercise" });
trainingSessionExercise.hasMany(trainingSessionSet, { foreignKey: "trainingSessionExerciseId", as: "sets" });

  export const db = {
    Sequelize,
    sequelize,
    users,
    exercise,
    trainingDay,
    trainingDayExercise,
    trainingSession,
    trainingSessionExercise,
    trainingSessionSet,
  };

  export type DB = typeof db;
  export default db;

  export async function syncDb() {
  console.info("⏳ Syncing DB…");
  await sequelize.authenticate();
  // use { alter:true } só durante desenvolvimento; em produção prefira migrations
  await sequelize.sync({ alter: true });
  console.info("✅ DB synced.");
}