import { Router } from "express";
import * as ctrl from "../controllers/exercise.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

router.get("/availability", ctrl.checkExercise);
router.post("/", ctrl.addExercise);
router.get("/", ctrl.exerciseList);
router.put("/:id", ctrl.replaceExercise);     
router.patch("/:id", ctrl.patchExercise);     
router.delete("/:id", ctrl.removeExercise);



export default router;