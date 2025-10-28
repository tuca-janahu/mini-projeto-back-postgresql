import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { User } from "../models/user.model";
import dotenv from "dotenv";

dotenv.config();

function getJwtSecret(): Secret {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET missing");
  return s; 
}
const SECRET: Secret = getJwtSecret();
const EXPIRES: string = (process.env.JWT_EXPIRES || "3600").trim();
  if (!EXPIRES) throw new Error("JWT_EXPIRES missing");

const DUMMY_HASH =
  "$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36T1Zq9VHtVui1eS8aJf.eW"; // "senha" bcrypt

type Claims = { sub: string; email: string };

function issueToken(claims: Claims) {
  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: Number(EXPIRES), // use configured expiration
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
  const exists = await User.exists({ email });
  return !exists;
}

export async function registerUser(
  email: string,
  plainPassword: string,
  rawName?: unknown
) {

const emailNorm = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) throw new Error("invalid_email");
  if (plainPassword.length < 6) throw new Error("weak_password");

const exists = await User.exists({ email: emailNorm });
if (exists) throw new Error("email_exists");


  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);

  const name = normalizeName(rawName);
  if (name) assertValidName(name);

  try {
    const savedUser = await User.create({
      email: emailNorm,
      password: passwordHash,
      ...(name ? { name } : {}),
    });

    const token = issueToken({
      sub: savedUser._id.toString(),
      email: savedUser.email,
    });
    return {
      id: savedUser._id,
      email: savedUser.email,
      name: savedUser.name ?? null,
      token,
    };
  } catch (error: any) {
    if (error?.code === 11000) throw new Error("email_exists");
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
  const user = await User.findOne({ email: emailNorm }).select("+password");

  if (!user) {
    // compara com hash dummy para igualar tempo de resposta
    await bcrypt.compare(plainPassword, DUMMY_HASH);
    const err: any = new Error("user_not_found");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(plainPassword, user.password); // senha hasheada
  if (!ok) {
    const err: any = new Error("wrong_password");
    err.status = 401;
    throw err;
  }

  const token = issueToken({ sub: user._id.toString(), email: user.email });
  return { token };
}
