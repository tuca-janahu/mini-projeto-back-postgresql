import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import * as ctrl from "../controllers/trainingSession.controller";

const router = Router();
router.use(requireAuth);

router.post("/", ctrl.create);
router.get("/", ctrl.list);
router.get("/prefill/:trainingDayId", ctrl.prefill);
router.get("/:id", ctrl.getById);
router.delete("/:id", ctrl.remove);

export default router;
