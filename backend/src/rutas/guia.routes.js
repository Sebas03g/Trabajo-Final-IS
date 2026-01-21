const express = require('express');
const router = express.Router();
const guiaService = require('../servicios/guia.service');

// Crear nueva guía
router.post('/', async (req, res) => {
    try {
        const { id_ruta, id_robot } = req.body;
        
        if (!id_ruta || !id_robot) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan campos requeridos: id_ruta, id_robot' 
            });
        }
        
        const guia = await guiaService.crearGuia(id_ruta, id_robot);
        res.status(201).json({
            success: true,
            data: guia,
            message: 'Guía creada exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener todas las guías activas
router.get('/activas', async (req, res) => {
    try {
        const guias = await guiaService.obtenerGuiasActivas();
        res.json({
            success: true,
            count: guias.length,
            data: guias
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener guía por ID
router.get('/:id', async (req, res) => {
    try {
        const guia = await guiaService.obtenerGuiaPorId(req.params.id);
        res.json({
            success: true,
            data: guia
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener guía por robot
router.get('/robot/:robotId', async (req, res) => {
    try {
        const guia = await guiaService.obtenerGuiaPorRobot(req.params.robotId);
        
        if (!guia) {
            return res.status(404).json({
                success: false,
                error: 'No se encontró guía para este robot'
            });
        }
        
        res.json({
            success: true,
            data: guia
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Avanzar en la guía
router.post('/:id/avanzar', async (req, res) => {
    try {
        const guia = await guiaService.avanzarEnGuia(req.params.id);
        res.json({
            success: true,
            data: guia,
            message: 'Punto avanzado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Actualizar punto actual
router.put('/:id/punto-actual', async (req, res) => {
    try {
        const { puntoActual } = req.body;
        
        if (puntoActual === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta el campo: puntoActual' 
            });
        }
        
        const guia = await guiaService.actualizarPuntoActual(
            req.params.id, 
            puntoActual
        );
        
        res.json({
            success: true,
            data: guia,
            message: 'Punto actual actualizado'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Finalizar guía
router.post('/:id/finalizar', async (req, res) => {
    try {
        const guia = await guiaService.finalizarGuia(req.params.id);
        res.json({
            success: true,
            data: guia,
            message: 'Guía finalizada exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener progreso de la guía
router.get('/:id/progreso', async (req, res) => {
    try {
        const progreso = await guiaService.obtenerProgresoGuia(req.params.id);
        res.json({
            success: true,
            data: progreso
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Eliminar guía
router.delete('/:id', async (req, res) => {
    try {
        const guia = await guiaService.eliminarGuia(req.params.id);
        res.json({
            success: true,
            data: guia,
            message: 'Guía eliminada exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Reanudar guía (ir a un punto específico)
router.post('/:id/reanudar/:punto', async (req, res) => {
    try {
        const guia = await guiaService.actualizarPuntoActual(
            req.params.id, 
            req.params.punto
        );
        
        res.json({
            success: true,
            data: guia,
            message: 'Guía reanudada en el punto especificado'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;