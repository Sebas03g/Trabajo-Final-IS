const express = require('express');
const router = express.Router();
const navegacionService = require('../servicios/navegacion.service');
const SolicitarGuiaControlador = require('../controladores/SolicitarGuiaControlador');


// Calcular ruta óptima
router.post('/calcular-ruta', async (req, res) => {
    try {
        const { origen, destino } = req.body;
        
        if (!origen || !destino) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan campos requeridos: origen, destino' 
            });
        }
        
        const resultado = await navegacionService.calcularRutaOptima(origen, destino);
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

// Iniciar navegación
router.post('/iniciar', async (req, res) => {
    try {
        const { id_robot, id_ruta } = req.body;
        
        if (!id_robot || !id_ruta) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan campos requeridos: id_robot, id_ruta' 
            });
        }
        
        const resultado = await navegacionService.iniciarNavegacion(id_robot, id_ruta);
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

// Actualizar posición del robot
router.put('/robot/:id/posicion', async (req, res) => {
    try {
        const { lat, lng, direccion } = req.body;
        
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan coordenadas: lat, lng' 
            });
        }
        
        const robot = await navegacionService.actualizarPosicionRobot(
            req.params.id, 
            lat, 
            lng, 
            direccion
        );
        
        res.json({
            success: true,
            data: robot,
            message: 'Posición actualizada'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener posición del robot
router.get('/robot/:id/posicion', async (req, res) => {
    try {
        const posicion = await navegacionService.obtenerPosicionRobot(req.params.id);
        res.json({
            success: true,
            data: posicion
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Verificar proximidad a destino
router.get('/robot/:id/proximidad-destino', async (req, res) => {
    try {
        const { margen } = req.query;
        const margenMetros = margen ? parseInt(margen) : 5;
        
        const resultado = await navegacionService.verificarProximidadADestino(
            req.params.id, 
            margenMetros
        );
        
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

// Detener navegación
router.post('/robot/:id/detener', async (req, res) => {
    try {
        const resultado = await navegacionService.detenerNavegacion(req.params.id);
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

// Obtener rutas disponibles
router.get('/rutas/disponibles', async (req, res) => {
    try {
        const { origen, destino } = req.query;
        
        const rutas = await navegacionService.obtenerRutasDisponibles(origen, destino);
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

// Simular movimiento del robot (para testing)
router.post('/robot/:id/simular-movimiento', async (req, res) => {
    try {
        const { distancia, direccion } = req.body;
        
        if (distancia === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: distancia' 
            });
        }
        
        const robotService = require('../servicios/robot.service');
        const dispositivoService = require('../servicios/dispositivo.service');
        
        // Obtener robot y su dispositivo
        const robot = await robotService.obtenerRobotPorId(req.params.id);
        
        if (!robot.dispositivo) {
            return res.status(400).json({
                success: false,
                error: 'El robot no tiene dispositivo asociado'
            });
        }
        
        // Simular movimiento
        const dispositivo = await dispositivoService.obtenerDispositivoPorId(robot.id_dispositivo);
        const nuevaPosicion = dispositivo.mover(distancia, direccion);
        
        // Actualizar en base de datos
        await dispositivoService.actualizarUbicacionYDireccion(
            dispositivo.id,
            nuevaPosicion.lat,
            nuevaPosicion.lng,
            dispositivo.cardinalDirection
        );
        
        // Consumir batería
        await robotService.consumirBateriaRobot(robot.id, distancia * 0.1); // 0.1% por metro
        
        res.json({
            success: true,
            data: {
                robotId: robot.id,
                nuevaPosicion,
                direccionActual: dispositivo.getDireccionCardinal(),
                bateriaRestante: robot.batteryLevel - (distancia * 0.1)
            },
            message: 'Movimiento simulado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
}); // ← AQUÍ FALTABA CERRAR ESTA RUTA

// Nueva ruta para solicitar guía (tu lógica original)
router.post('/solicitar-guia', SolicitarGuiaControlador.solicitarGuia);

// Ruta para actualizar ubicación y continuar navegación
router.post('/actualizar-ubicacion', SolicitarGuiaControlador.actualizarUbicacionRobot);

// Ruta para ejecutar navegación automática de una guía
router.post('/guia/:id/ejecutar-navegacion', async (req, res) => {
    try {
        const resultado = await navegacionService.ejecutarNavegacionAutomatica(req.params.id);
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

// Ruta para mover robot hacia un destino específico
router.post('/robot/:id/mover-hacia', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Faltan parámetros: lat, lng'
            });
        }
        
        const resultado = await navegacionService.moverHaciaDestino(
            req.params.id,
            lat,
            lng
        );
        
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

module.exports = router;