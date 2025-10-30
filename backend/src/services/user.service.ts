import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import db from "../models"; 
import { UniqueConstraintError, ValidationError } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const User = db.users;

function getJwtSecret(): Secret {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET missing");
  return s; 
}
const SECRET: Secret = getJwtSecret();
// const EXPIRES: string = (process.env.JWT_EXPIRES || "3600").trim();
//   if (!EXPIRES) throw new Error("JWT_EXPIRES missing");

const DUMMY_HASH =
  "$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36T1Zq9VHtVui1eS8aJf.eW"; // "senha" bcrypt

type Claims = { sub: string; email: string };

function issueToken(claims: Claims) {
  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: 3600, 
  };
  return jwt.sign(claims, SECRET, options);
}

// --- helpers de nome ---
function normalizeName(raw?: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const n = raw.trim();
  return n.length ? n : undefined;
}
function assertValidName(name: string) {
  if (name.length < 1 || name.length > 80) {
    throw new Error("invalid_name");
  }
  // bloquear caracteres de controle
  if (/[\p{C}]/u.test(name)) {
    throw new Error("invalid_name");
  }
}

export async function isEmailAvailable(email: string) {
  const exists = await User.count({ where: { email: email.trim().toLowerCase() } });
  return exists === 0;
}

export async function registerUser(
  email: string,
  plainPassword: string,
  rawName?: unknown
) {

const emailNorm = email.trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) throw new Error("invalid_email");
if (plainPassword.length < 6) throw new Error("weak_password");

const name = normalizeName(rawName);
if (name) assertValidName(name);

const exists = await db.users.count({ where: { email: emailNorm } });
if (exists > 0) throw new Error("email_exists");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);


  try {
    const createData: any = {
      email: emailNorm,
      password: passwordHash,
    };
    if (name) createData.name = name;

    const savedUser = await User.create(createData);

    const token = issueToken({
  sub: String(savedUser.get("id")),
  email: savedUser.get("email") as string,
});

return {
  id: savedUser.get("id"),
  email: savedUser.get("email"),
  name: (savedUser.get("name") as string) ?? null,
  token,
};

  } catch (error: any) {
    if (error instanceof UniqueConstraintError) throw new Error("email_exists");
if (error instanceof ValidationError) {
  const msg = error.errors.map(e => e.message).join("; ");
  const err = new Error(msg || "validation_error");
  // @ts-ignore
  err.status = 400;
  throw err;
}

    console.error("[registerUser] create error:", {
      code: error?.code,
      keyValue: error?.keyValue,
      msg: error?.message,
    });
    throw new Error("registration_failed");
  }
}

export async function loginUser(email: string, plainPassword: string) {
  const emailNorm = email.trim().toLowerCase();
  const user = await User.findOne({ where: { email: emailNorm } });

  if (!user) {
    // compara com hash dummy para igualar tempo de resposta
    await bcrypt.compare(plainPassword, DUMMY_HASH);
    const err: any = new Error("user_not_found");
    err.status = 401;
    throw err;
  }

const ok = await bcrypt.compare(plainPassword, (user.get("password") as string) || "");
  if (!ok) {
    const err: any = new Error("wrong_password");
    err.status = 401;
    throw err;
  }

  const token = issueToken({ sub: String(user.get("id")), email: user.get("email") as string });
return { token };

}
