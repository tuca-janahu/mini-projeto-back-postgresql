import app from "./app";


(async () => {
  try {
    const port = process.env.PORT || 3000;
    // await ensureDb(); // <-- garante TODAS as tabelas criadas
    // console.log("✅ Conexão com o banco estabelecida com sucesso. (SERVER)");

    app.listen(port, () => {
      console.log(`🚀 Servidor no ar: http://localhost:${port}`);
    });
  } catch (e) {
    console.error("Failed to start:", e);
    process.exit(1);
  }
})();
