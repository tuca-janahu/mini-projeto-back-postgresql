import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  dialect: "postgres",
  pool: {
    max: 2,
    min: 0,
    acquire: 3000,
    idle: 0,
    evict: 10000,
  },
};

export default dbConfig;