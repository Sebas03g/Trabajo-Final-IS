import express from 'express';
import dispositivoService from '../servicios/dispositivo.service.js';

const router = express.Router();

// Crear nuevo dispositivo
router.post('/', async (req, res) => {
    try {
        const { id_robot, lat, lng, cardinalDirection } = req.body;
        
        if (!id_robot || lat === undefined || lng === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan campos requeridos: id_robot, lat, lng' 
            });
        }
        
        const dispositivo = await dispositivoService.crearDispositivo(
            id_robot, 
            lat, 
            lng, 
            cardinalDirection
        );
        
        res.status(201).json({
            success: true,
            data: dispositivo,
            message: 'Dispositivo creado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener dispositivo por ID
router.get('/:id', async (req, res) => {
    try {
        const dispositivo = await dispositivoService.obtenerDispositivoPorId(req.params.id);
        res.json({
            success: true,
            data: dispositivo
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener dispositivo por robot
router.get('/robot/:robotId', async (req, res) => {
    try {
        const dispositivo = await dispositivoService.obtenerDispositivoPorRobot(req.params.robotId);
        
        if (!dispositivo) {
            return res.status(404).json({
                success: false,
                error: 'No se encontró dispositivo para este robot'
            });
        }
        
        res.json({
            success: true,
            data: dispositivo
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Actualizar ubicación del dispositivo
router.put('/:id/ubicacion', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan coordenadas: lat, lng' 
            });
        }
        
        const dispositivo = await dispositivoService.actualizarUbicacion(
            req.params.id, 
            lat, 
            lng
        );
        
        res.json({
            success: true,
            data: dispositivo,
            message: 'Ubicación actualizada'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Actualizar ubicación y dirección
router.put('/:id/ubicacion-direccion', async (req, res) => {
    try {
        const { lat, lng, cardinalDirection } = req.body;
        
        if (lat === undefined || lng === undefined || cardinalDirection === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan campos: lat, lng, cardinalDirection' 
            });
        }
        
        const dispositivo = await dispositivoService.actualizarUbicacionYDireccion(
            req.params.id, 
            lat, 
            lng, 
            cardinalDirection
        );
        
        res.json({
            success: true,
            data: dispositivo,
            message: 'Ubicación y dirección actualizadas'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Actualizar dirección
router.put('/:id/direccion', async (req, res) => {
    try {
        const { cardinalDirection } = req.body;
        
        if (cardinalDirection === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta el campo: cardinalDirection' 
            });
        }
        
        const dispositivo = await dispositivoService.actualizarDireccion(
            req.params.id, 
            cardinalDirection
        );
        
        res.json({
            success: true,
            data: dispositivo,
            message: 'Dirección actualizada'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener ubicación del dispositivo
router.get('/:id/ubicacion', async (req, res) => {
    try {
        const ubicacion = await dispositivoService.obtenerUbicacionDispositivo(req.params.id);
        res.json({
            success: true,
            data: ubicacion
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Calcular distancia entre dispositivos
router.get('/:id1/distancia/:id2', async (req, res) => {
    try {
        const distancia = await dispositivoService.calcularDistanciaEntreDispositivos(
            req.params.id1, 
            req.params.id2
        );
        
        res.json({
            success: true,
            data: {
                dispositivo1: req.params.id1,
                dispositivo2: req.params.id2,
                distanciaMetros: distancia,
                distanciaKm: distancia / 1000
            }
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener dispositivos activos
router.get('/activos/todos', async (req, res) => {
    try {
        const dispositivos = await dispositivoService.obtenerDispositivosActivos();
        res.json({
            success: true,
            count: dispositivos.length,
            data: dispositivos
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Eliminar dispositivo
router.delete('/:id', async (req, res) => {
    try {
        const dispositivo = await dispositivoService.eliminarDispositivo(req.params.id);
        res.json({
            success: true,
            data: dispositivo,
            message: 'Dispositivo eliminado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

export default router;