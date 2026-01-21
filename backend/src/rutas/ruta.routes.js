const express = require('express');
const router = express.Router();
const rutaService = require('../servicios/ruta.service');

// Middleware de validación
const validarCrearRuta = (req, res, next) => {
    const { name, points, beginning, ending } = req.body;
    
    if (!name || !points || !beginning || !ending) {
        return res.status(400).json({ 
            error: 'Faltan campos requeridos: name, points, beginning, ending' 
        });
    }
    
    if (!Array.isArray(points) || points.length < 2) {
        return res.status(400).json({ 
            error: 'points debe ser un array con al menos 2 puntos' 
        });
    }
    
    next();
};

// Crear nueva ruta
router.post('/', validarCrearRuta, async (req, res) => {
    try {
        const ruta = await rutaService.crearRuta(req.body);
        res.status(201).json({
            success: true,
            data: ruta,
            message: 'Ruta creada exitosamente'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener todas las rutas
router.get('/', async (req, res) => {
    try {
        const rutas = await rutaService.obtenerTodasRutas();
        res.json({
            success: true,
            count: rutas.length,
            data: rutas
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener ruta por ID
router.get('/:id', async (req, res) => {
    try {
        const ruta = await rutaService.obtenerRutaPorId(req.params.id);
        res.json({
            success: true,
            data: ruta
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Actualizar ruta
router.put('/:id', async (req, res) => {
    try {
        const ruta = await rutaService.actualizarRuta(req.params.id, req.body);
        res.json({
            success: true,
            data: ruta,
            message: 'Ruta actualizada exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Eliminar ruta
router.delete('/:id', async (req, res) => {
    try {
        const ruta = await rutaService.eliminarRuta(req.params.id);
        res.json({
            success: true,
            data: ruta,
            message: 'Ruta eliminada exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Buscar rutas por ubicación
router.get('/buscar/ubicacion', async (req, res) => {
    try {
        const { inicio, fin } = req.query;
        const rutas = await rutaService.buscarRutasPorUbicacion(inicio, fin);
        res.json({
            success: true,
            count: rutas.length,
            data: rutas
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener rutas recientes
router.get('/recientes/:limite?', async (req, res) => {
    try {
        const limite = req.params.limite || 10;
        const rutas = await rutaService.obtenerRutasRecientes(limite);
        res.json({
            success: true,
            count: rutas.length,
            data: rutas
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener estadísticas de rutas
router.get('/estadisticas/totales', async (req, res) => {
    try {
        const estadisticas = await rutaService.obtenerEstadisticasRutas();
        res.json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Verificar si una ruta es válida
router.get('/:id/validar', async (req, res) => {
    try {
        const ruta = await rutaService.obtenerRutaPorId(req.params.id);
        const esValida = ruta.esValida();
        const distancia = ruta.getDistanciaTotal();
        
        res.json({
            success: true,
            data: {
                rutaId: ruta.id,
                esValida,
                distanciaTotal: distancia,
                tiempoEstimado: ruta.getTiempoEstimado(),
                puntos: ruta.points.length
            }
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;