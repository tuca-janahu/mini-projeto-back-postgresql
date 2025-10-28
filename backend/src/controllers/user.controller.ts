import { Request, Response } from "express";
import {
  isEmailAvailable,
  registerUser,
  loginUser,
} from "../services/user.service";

export async function checkEmail(req: Request, res: Response) {
  const email = String(req.query.email || "")
    .trim()
    .toLowerCase();
  if (!email) return res.status(400).json({ error: "Email obrigatório" });
  const available = await isEmailAvailable(email);
  return res.json({ available });
}

export async function register(req: Request, res: Response) {
  if (
    !req.body ||
    !!req.body.email === false ||
    !!req.body.password === false
  ) {
    return res.status(400).json({ error: "Dados obrigatórios" });
  }

  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const rawName = req.body?.name; // pode vir string, undefined, etc.
  const password = String(req.body?.password ?? "");


  if (password.length < 6) {
    console.warn("⚠️ Senha muito fraca para o email:");
    return res
      .status(400)
      .json({ error: "Senha deve ter ao menos 6 caracteres" });
  }
  

  try {
    // controllers/user.controller.ts - dentro de register()
    console.log("[/auth/register] body keys:", Object.keys(req.body || {}));
    console.log("[/auth/register] email:", email, "| hasName:", rawName != null);

    const out = await registerUser(email, password, rawName);
    console.log("✅ Usuário registrado:", out.email);
    return res.status(201).json(out);
  } catch (e: any) {
   const code = e?.message;

    // mapeamento de erros do service
    if (code === "invalid_email") {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (code === "weak_password") {
      return res.status(400).json({ error: "Senha fraca" });
    }
    if (code === "invalid_name") {
      return res.status(400).json({ error: "Nome inválido" });
    }
    if (code === "email_exists") {
      console.warn("⚠️ Tentativa de registrar email já existente:", email);
      return res.status(409).json({ error: "Email já cadastrado" });
    }
    console.error("❌ Erro ao registrar:", e?.message || e);
    return res.status(500).json({ error: "Erro ao registrar" });
  }
}

export async function login(req: Request, res: Response) {
  const email = String(req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    return res.status(400).json({ error: "Dados obrigatórios" });
  }

  try {
    const out = await loginUser(email, password); // << deve retornar { token, user }
    console.log("Login do usuário:", email);
    return res.json(out);
  } catch (e: any) {
    const code = e?.message;
    const VERBOSE = process.env.AUTH_VERBOSE_ERRORS === "true";

    if (!VERBOSE) {
      console.error("Falha no login: Credenciais inválidas");
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    if (code === "user_not_found") {
      console.warn("⚠️ Usuário não encontrado:", email);
      return res.status(401).json({ error: "Usuário não encontrado" });
    }
    if (code === "wrong_password") {
      console.warn("⚠️ Senha incorreta para o usuário:", email);
      return res.status(401).json({ error: "Senha incorreta" });
    }
    console.error("Erro inesperado no login:", e);
    return res.status(500).json({ error: "Erro ao autenticar" });
  }
}
