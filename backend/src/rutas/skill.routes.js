const express = require('express');
const router = express.Router();
const skillService = require('../servicios/skill.service');

// Middleware para validar peticiones del skill
const validarSkillRequest = (req, res, next) => {
    const { intent, ubicacionDestino, idUsuario } = req.body;
    
    if (!intent || !ubicacionDestino) {
        return res.status(400).json({
            success: false,
            error: 'Faltan parámetros: intent, ubicacionDestino'
        });
    }
    
    // Validar que la ubicación sea válida
    const ubicacionesValidas = ['BLOQUE_C', 'BLOQUE_B', 'PUERTA_1', 'PUNTO_ESPERA', 'SALIDA'];
    if (!ubicacionesValidas.includes(ubicacionDestino.toUpperCase())) {
        return res.status(400).json({
            success: false,
            error: `Ubicación no válida. Use: ${ubicacionesValidas.join(', ')}`
        });
    }
    
    next();
};

// Endpoint principal para el skill
router.post('/guiar', validarSkillRequest, async (req, res) => {
    try {
        const { intent, ubicacionDestino, idUsuario, contexto } = req.body;
        
        // Procesar la solicitud del skill
        const respuesta = await skillService.procesarSolicitudGuia({
            intent,
            ubicacionDestino: ubicacionDestino.toUpperCase(),
            idUsuario,
            contexto
        });
        
        res.json({
            success: true,
            data: respuesta
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para obtener estado de navegación
router.get('/estado/:sessionId', async (req, res) => {
    try {
        const estado = await skillService.obtenerEstadoNavegacion(req.params.sessionId);
        res.json({
            success: true,
            data: estado
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para cancelar navegación
router.post('/cancelar', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Falta parámetro: sessionId'
            });
        }
        
        const resultado = await skillService.cancelarNavegacion(sessionId);
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook para actualizaciones en tiempo real (opcional para pantalla)
router.post('/webhook/actualizacion', async (req, res) => {
    try {
        const { sessionId, tipo, datos } = req.body;
        
        // Aquí podrías enviar notificaciones push al skill
        console.log(`Webhook recibido para sesión ${sessionId}:`, tipo, datos);
        
        // Guardar actualización para que el skill la consulte
        await skillService.registrarActualizacion(sessionId, tipo, datos);
        
        res.json({
            success: true,
            message: 'Actualización registrada'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;