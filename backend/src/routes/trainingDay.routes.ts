import { Router } from "express";
import * as ctrl from "../controllers/trainingDay.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/", ctrl.createDay);
router.get("/", ctrl.listDays);
router.get("/:id", ctrl.getDay);
router.patch("/:id", ctrl.patchDay);
router.delete("/:id", ctrl.deleteDay);

export default router;


