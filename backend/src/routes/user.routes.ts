import { Router } from "express";
import * as ctrl from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// públicas
router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.get("/check-email", ctrl.checkEmail);

router.get("/protected", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({ message: "Acesso autorizado", user });
});

export default router;
