import { Request, Response, NextFunction } from "express";
import jwt, {JwtPayload} from "jsonwebtoken";


function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET missing");
  return s;
}
const SECRET = getJwtSecret(); //  string

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: "Token faltando" });

  const token = m[1].trim();
  if (!token) return res.status(401).json({ error: "Token faltando" });

  try {
    const payload = jwt.verify(token, SECRET) as JwtPayload;
    (req as any).user = { sub: String(payload.sub), email: (payload as any).email };
    return next();
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
}
