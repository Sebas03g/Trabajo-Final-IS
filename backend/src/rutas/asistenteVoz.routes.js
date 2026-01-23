// rutas/asistenteVoz.routes.js
import express from 'express';
import asistenteVozService from '../servicios/asistenteVoz.service.js';

const router = express.Router();

// Crear nuevo asistente de voz
router.post('/', async (req, res) => {
    try {
        const { ubicacion, id_rutaActual } = req.body;
        
        if (!ubicacion) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: ubicacion' 
            });
        }
        
        const asistente = await asistenteVozService.crearAsistente(
            ubicacion, 
            id_rutaActual
        );
        
        res.status(201).json({
            success: true,
            data: asistente,
            message: 'Asistente de voz creado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener todos los asistentes
router.get('/', async (req, res) => {
    try {
        const asistentes = await asistenteVozService.obtenerTodosAsistentes();
        res.json({
            success: true,
            count: asistentes.length,
            data: asistentes
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener asistente por ID
router.get('/:id', async (req, res) => {
    try {
        const asistente = await asistenteVozService.obtenerAsistentePorId(req.params.id);
        res.json({
            success: true,
            data: asistente
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener asistentes disponibles
router.get('/disponibles/todos', async (req, res) => {
    try {
        const asistentes = await asistenteVozService.obtenerAsistentesDisponibles();
        res.json({
            success: true,
            count: asistentes.length,
            data: asistentes
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener asistentes por ubicación
router.get('/ubicacion/:ubicacion', async (req, res) => {
    try {
        const asistentes = await asistenteVozService.obtenerAsistentesPorUbicacion(
            req.params.ubicacion
        );
        
        res.json({
            success: true,
            count: asistentes.length,
            data: asistentes
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Asignar robot a asistente
router.post('/:id/asignar-robot', async (req, res) => {
    try {
        const { id_robot } = req.body;
        
        if (!id_robot) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: id_robot' 
            });
        }
        
        const asistente = await asistenteVozService.asignarRobotAAsistente(
            req.params.id, 
            id_robot
        );
        
        res.json({
            success: true,
            data: asistente,
            message: 'Robot asignado al asistente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Liberar asistente
router.post('/:id/liberar', async (req, res) => {
    try {
        const asistente = await asistenteVozService.liberarAsistente(req.params.id);
        res.json({
            success: true,
            data: asistente,
            message: 'Asistente liberado'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Cambiar ubicación del asistente
router.put('/:id/ubicacion', async (req, res) => {
    try {
        const { ubicacion } = req.body;
        
        if (!ubicacion) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: ubicacion' 
            });
        }
        
        const asistente = await asistenteVozService.cambiarUbicacionAsistente(
            req.params.id, 
            ubicacion
        );
        
        res.json({
            success: true,
            data: asistente,
            message: 'Ubicación actualizada'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Actualizar ruta actual del asistente
router.put('/:id/ruta-actual', async (req, res) => {
    try {
        const { id_rutaActual } = req.body;
        
        const asistente = await asistenteVozService.actualizarRutaActual(
            req.params.id, 
            id_rutaActual
        );
        
        res.json({
            success: true,
            data: asistente,
            message: 'Ruta actual actualizada'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener asistentes que necesitan mantenimiento
router.get('/necesitan-mantenimiento/todos', async (req, res) => {
    try {
        const asistentes = await asistenteVozService.obtenerAsistentesNecesitanMantenimiento();
        res.json({
            success: true,
            count: asistentes.length,
            data: asistentes
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Eliminar asistente
router.delete('/:id', async (req, res) => {
    try {
        const asistente = await asistenteVozService.eliminarAsistente(req.params.id);
        res.json({
            success: true,
            data: asistente,
            message: 'Asistente eliminado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

export default router;