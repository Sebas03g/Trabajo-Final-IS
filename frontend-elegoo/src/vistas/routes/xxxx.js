import { Router } from "express";
import {
  actualizarMapaDelCampus,
  obtenerMapas,
} from "../../controladores/ActualizarMapaDelCampusControlador.js";

const router = Router();

router.post("/", actualizarMapaDelCampus);
router.get("/", obtenerMapas);

export default router;

