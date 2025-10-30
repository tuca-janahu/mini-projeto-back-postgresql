import app from "./app";
import db from "./models/index";

(async () => {
  try {
    const port = process.env.PORT || 3000;
    await db.sequelize.authenticate();
    console.log("✅ Conexão com o banco estabelecida com sucesso.");

    app.listen(port, () => {
      console.log(`🚀 Servidor no ar: http://localhost:${port}`);
    });
  } catch (e) {
    console.error("Failed to start:", e);
    process.exit(1);
  }
})();
