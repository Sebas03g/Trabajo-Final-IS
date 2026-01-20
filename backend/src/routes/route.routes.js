import express from "express";
import { executeRoute } from "../controllers/route.controller.js";

const router = express.Router();

router.post("/:id/execute", executeRoute);

export default router;