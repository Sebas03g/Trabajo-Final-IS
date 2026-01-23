import express from 'express';
import GestionarRutasControlador from '../controladores/GestionarRutasControlador.js';

const router = express.Router();

// Rutas para gestión de rutas
router.post('/', GestionarRutasControlador.crearRuta);
router.get('/', GestionarRutasControlador.obtenerTodasRutas);
router.get('/buscar', GestionarRutasControlador.buscarRutas);
router.get('/recientes', GestionarRutasControlador.obtenerRutasRecientes);
router.get('/estadisticas', GestionarRutasControlador.obtenerEstadisticas);
router.get('/:id', GestionarRutasControlador.obtenerRutaPorId);
router.put('/:id', GestionarRutasControlador.actualizarRuta);
router.delete('/:id', GestionarRutasControlador.eliminarRuta);
router.post('/validar', GestionarRutasControlador.validarRuta);
router.post('/clonar/:id', GestionarRutasControlador.clonarRuta);

export default router;