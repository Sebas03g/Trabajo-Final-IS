import express from 'express';
import multer from 'multer';
import ActualizarMapaDelCampusControlador from '../controladores/ActualizarMapaDelCampusControlador.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB límite
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos JSON'), false);
        }
    }
});

// Rutas para actualización del mapa del campus
router.get('/todos', ActualizarMapaDelCampusControlador.obtenerTodosMapas);
router.get('/:id/detalle', ActualizarMapaDelCampusControlador.obtenerDetalleMapa);
router.get('/', ActualizarMapaDelCampusControlador.obtenerMapaActual);
router.post('/crear', ActualizarMapaDelCampusControlador.crearMapa);
router.post('/actualizar', ActualizarMapaDelCampusControlador.actualizarMapaPrincipal);
router.post('/validar', ActualizarMapaDelCampusControlador.validarMapa);
router.post('/cargar-desde-archivo', upload.single('archivoMapa'), ActualizarMapaDelCampusControlador.cargarMapaDesdeArchivo);
router.get('/estadisticas', ActualizarMapaDelCampusControlador.obtenerEstadisticas);
router.post('/georeferenciar', ActualizarMapaDelCampusControlador.georeferenciarMapa);
router.post('/convertir-coordenadas', ActualizarMapaDelCampusControlador.convertirCoordenadas);
router.delete('/:id', ActualizarMapaDelCampusControlador.eliminarMapa);
router.get('/historial', ActualizarMapaDelCampusControlador.obtenerHistorialCambios);
router.post('/restaurar', ActualizarMapaDelCampusControlador.restaurarMapa);

export default router;