// En tu routes/locationRoutes.js
import express from 'express';
const router = express.Router();

// Array para almacenar ubicaciones (en producción usarías una DB)
let locations = [];

// Endpoint para recibir ubicación
router.post('/location', (req, res) => {
    try {
        const locationData = req.body;
        const timestamp = new Date().toISOString();
        
        // Validar datos mínimos
        if (!locationData.latitude || !locationData.longitude) {
            return res.status(400).json({ 
                error: 'Datos inválidos', 
                message: 'Se requieren latitude y longitude' 
            });
        }

        // Agregar timestamp del servidor
        locationData.serverReceived = timestamp;
        locationData.id = Date.now(); // ID único simple

        // Guardar en memoria (en producción usarías DB)
        locations.push(locationData);
        
        // Mantener solo las últimas 100 ubicaciones
        if (locations.length > 100) {
            locations = locations.slice(-100);
        }

        console.log(`📍 Ubicación recibida: ${locationData.deviceId || 'unknown'} - ${locationData.latitude}, ${locationData.longitude}`);

        // Emitir por WebSocket si está disponible
        if (req.app.get('wss')) {
            req.app.get('wss').clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'LOCATION_UPDATE',
                        data: locationData
                    }));
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Ubicación recibida',
            receivedAt: timestamp,
            locationId: locationData.id
        });

    } catch (error) {
        console.error('Error procesando ubicación:', error);
        res.status(500).json({ 
            error: 'Error interno',
            message: error.message 
        });
    }
});

// Endpoint para obtener todas las ubicaciones
router.get('/locations', (req, res) => {
    res.json({
        count: locations.length,
        locations: locations
    });
});

// Endpoint para obtener ubicaciones de un dispositivo específico
router.get('/locations/:deviceId', (req, res) => {
    const deviceLocations = locations.filter(loc => loc.deviceId === req.params.deviceId);
    res.json({
        deviceId: req.params.deviceId,
        count: deviceLocations.length,
        locations: deviceLocations
    });
});

export default router;