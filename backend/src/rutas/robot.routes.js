import express from 'express';
import robotService from '../servicios/robot.service.js';
const router = express.Router();

// Crear nuevo robot
router.post('/', async (req, res) => {
    try {
        const { clienteID, batteryLevel, id_dispositivo, id_rutaActual } = req.body;
        
        if (!clienteID) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: clienteID' 
            });
        }
        
        const robot = await robotService.crearRobot(
            clienteID, 
            batteryLevel, 
            id_dispositivo, 
            id_rutaActual
        );
        
        res.status(201).json({
            success: true,
            data: robot,
            message: 'Robot creado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener todos los robots
router.get('/', async (req, res) => {
    try {
        const robots = await robotService.obtenerTodosRobots();
        res.json({
            success: true,
            count: robots.length,
            data: robots
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener robot por ID
router.get('/:id', async (req, res) => {
    try {
        const robot = await robotService.obtenerRobotPorId(req.params.id);
        res.json({
            success: true,
            data: robot
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener robot por clienteID
router.get('/cliente/:clienteID', async (req, res) => {
    try {
        const robot = await robotService.obtenerRobotPorClienteID(req.params.clienteID);
        
        if (!robot) {
            return res.status(404).json({
                success: false,
                error: 'No se encontró robot con ese clienteID'
            });
        }
        
        res.json({
            success: true,
            data: robot
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener robots disponibles
router.get('/disponibles/todos', async (req, res) => {
    try {
        const robots = await robotService.obtenerRobotsDisponibles();
        res.json({
            success: true,
            count: robots.length,
            data: robots
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Actualizar estado del robot
router.put('/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        
        if (!estado) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: estado' 
            });
        }
        
        const robot = await robotService.actualizarEstadoRobot(req.params.id, estado);
        res.json({
            success: true,
            data: robot,
            message: 'Estado actualizado'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Actualizar batería del robot
router.put('/:id/bateria', async (req, res) => {
    try {
        const { batteryLevel } = req.body;
        
        if (batteryLevel === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: batteryLevel' 
            });
        }
        
        const robot = await robotService.actualizarBateriaRobot(req.params.id, batteryLevel);
        res.json({
            success: true,
            data: robot,
            message: 'Batería actualizada'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Asignar ruta a robot
router.post('/:id/asignar-ruta', async (req, res) => {
    try {
        const { id_ruta } = req.body;
        
        if (!id_ruta) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: id_ruta' 
            });
        }
        
        const robot = await robotService.asignarRutaARobot(req.params.id, id_ruta);
        res.json({
            success: true,
            data: robot,
            message: 'Ruta asignada al robot'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Liberar robot
router.post('/:id/liberar', async (req, res) => {
    try {
        const robot = await robotService.liberarRobot(req.params.id);
        res.json({
            success: true,
            data: robot,
            message: 'Robot liberado'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener robots que necesitan carga
router.get('/necesitan-carga/todos', async (req, res) => {
    try {
        const robots = await robotService.obtenerRobotsNecesitanCarga();
        res.json({
            success: true,
            count: robots.length,
            data: robots
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Consumir batería del robot
router.post('/:id/consumir-bateria', async (req, res) => {
    try {
        const { porcentaje } = req.body;
        
        if (porcentaje === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: porcentaje' 
            });
        }
        
        const robot = await robotService.consumirBateriaRobot(req.params.id, porcentaje);
        res.json({
            success: true,
            data: robot,
            message: 'Batería consumida'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Cargar batería del robot
router.post('/:id/cargar-bateria', async (req, res) => {
    try {
        const { porcentaje } = req.body;
        
        if (porcentaje === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Falta campo requerido: porcentaje' 
            });
        }
        
        const robot = await robotService.cargarBateriaRobot(req.params.id, porcentaje);
        res.json({
            success: true,
            data: robot,
            message: 'Batería cargada'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Eliminar robot
router.delete('/:id', async (req, res) => {
    try {
        const robot = await robotService.eliminarRobot(req.params.id);
        res.json({
            success: true,
            data: robot,
            message: 'Robot eliminado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Obtener estadísticas de robots
router.get('/estadisticas/totales', async (req, res) => {
    try {
        const estadisticas = await robotService.obtenerEstadisticasRobots();
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

// Verificar si robot puede asignar ruta
router.get('/:id/puede-asignar-ruta', async (req, res) => {
    try {
        const robot = await robotService.obtenerRobotPorId(req.params.id);
        const puedeAsignar = robot.puedeAsignarRuta();
        const necesitaCarga = robot.necesitaCarga();
        
        res.json({
            success: true,
            data: {
                robotId: robot.id,
                puedeAsignarRuta: puedeAsignar,
                necesitaCarga,
                estado: robot.estado,
                batteryLevel: robot.batteryLevel
            }
        });
    } catch (error) {
        res.status(404).json({ 
            success: false,
            error: error.message 
        });
    }
});

export default router;