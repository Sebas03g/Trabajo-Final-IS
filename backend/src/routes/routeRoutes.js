import express from "express";
import * as controller from "../controllers/routeController.js";

const router = express.Router();

router.get("/", controller.getRoutes);
router.post("/", controller.createRoute);
router.post("/:id/execute", controller.executeRoute);

export default router;
