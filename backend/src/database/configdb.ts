import mongoose from "mongoose";
import dotenv from "dotenv"; 

dotenv.config();

type GlobalWithMongooseCache = typeof global & {
  __MONGO_CONN?: Promise<typeof mongoose>;
};

const g = global as GlobalWithMongooseCache;

let cached = g.__MONGO_CONN;

mongoose.set("bufferCommands", false);   
mongoose.set("strictQuery", true);

export default {
  async connect() {
    if (cached) return cached;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("[DB] MONGODB_URI not set");
      throw new Error("MONGODB_URI missing");
    }

    // (opcional) se sua URI NÃO tiver /<db> no final, defina o nome do banco aqui:
    const dbName = process.env.MONGODB_NAME; // pode ser undefined

    // LOGS úteis (sem vazar credenciais)
    try {
      const parsed = new URL(uri);
      console.log("[DB] Connecting to", {
        host: parsed.hostname,
        hasDbInUri: !!parsed.pathname && parsed.pathname !== "/",
        dbNameFromEnv: !!dbName,
      });
    } catch {
      console.log("[DB] Connecting to a non-URL-parseable URI (SRV likely)");
    }

    cached = mongoose
      .connect(uri, {
        dbName: dbName || undefined,
        // ajustes robustos p/ serverless:
        maxPoolSize: 5,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        // keep alive
        autoIndex: process.env.NODE_ENV !== "production",
      } as any)
      .then((conn) => {
        console.log("[DB] Connected. readyState =", conn.connection.readyState); // 1 = connected
        return conn;
      })
      .catch((err) => {
        console.error("[DB] Connect error:", {
          name: err?.name,
          code: err?.code,
          message: err?.message,
          reason: err?.reason?.message,
        });
        throw err;
      });

    g.__MONGO_CONN = cached;
    return cached;
  },
};
