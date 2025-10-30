  import { Sequelize } from "sequelize";
  import userFactory from "./user.model";
  import exerciseFactory from "./exercise.model";
  import trainingDayFactory from "./trainingDay.model";
  import trainingDayExerciseFactory from "./trainingDay.model";

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

  // Sessão pertence a Usuário e a um TrainingDay (snapshot do plano do dia)
  db.trainingSession.belongsTo(db.users, { foreignKey: "userId", as: "user" });
  db.users.hasMany(db.trainingSession, { foreignKey: "userId", as: "trainingSessions" });

  db.trainingSession.belongsTo(db.trainingDay, { foreignKey: "trainingDayId", as: "trainingDay" });
  db.trainingDay.hasMany(db.trainingSession, { foreignKey: "trainingDayId", as: "sessions" });

  // Em cada sessão: exercícios (1:N via tabela de sessão-exercício)
  db.trainingSessionExercise.belongsTo(db.trainingSession, { foreignKey: "trainingSessionId", as: "session" });
  db.trainingSession.hasMany(db.trainingSessionExercise, { foreignKey: "trainingSessionId", as: "items" });

  db.trainingSessionExercise.belongsTo(db.exercise, { foreignKey: "exerciseId", as: "exercise" });
  db.exercise.hasMany(db.trainingSessionExercise, { foreignKey: "exerciseId", as: "sessionItems" });

  // Séries de cada exercício da sessão
  db.trainingSessionSet.belongsTo(db.trainingSessionExercise, { foreignKey: "trainingSessionExerciseId", as: "sessionExercise" });
  db.trainingSessionExercise.hasMany(db.trainingSessionSet, { foreignKey: "trainingSessionExerciseId", as: "sets" });

  export type DB = typeof db;
  export default db;