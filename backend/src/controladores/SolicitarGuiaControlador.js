const navegacionService = require('../servicios/navegacion.service');
const robotService = require('../servicios/robot.service');

class SolicitarGuiaControlador {
    async solicitarGuia(req, res) {
        try {
            const { id_asistente, beginning, ending } = req.body;
            
            if (!id_asistente || !beginning || !ending) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan parámetros: id_asistente, beginning, ending'
                });
            }
            
            // 1. Buscar ruta y robot disponible
            const { robotLibre, rutas } = await navegacionService.buscarRutaYRobotDisponible(
                id_asistente, beginning, ending
            );
            
            // 2. Seleccionar la primera ruta (podrías mejorar esto)
            const rutaSeleccionada = rutas[0];
            
            // 3. Inicializar guía
            const guia = await navegacionService.inicializarGuia(
                robotLibre.id,
                id_asistente,
                rutaSeleccionada.id
            );
            
            // 4. Iniciar navegación automática
            const navegacionIniciada = await navegacionService.iniciarDireccion(
                robotLibre.id,
                id_asistente,
                rutaSeleccionada.id
            );
            
            res.json({
                success: true,
                data: {
                    guia,
                    robot: robotLibre,
                    ruta: rutaSeleccionada,
                    navegacionIniciada
                },
                message: 'Guía solicitada y navegación iniciada exitosamente'
            });
            
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async actualizarUbicacionRobot(req, res) {
        try {
            const { id_robot, lat, lng, cardinalDirection } = req.body;
            
            if (!id_robot || lat === undefined || lng === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan parámetros: id_robot, lat, lng'
                });
            }
            
            // Actualizar dispositivo
            const dispositivoService = require('../servicios/dispositivo.service');
            const dispositivo = await dispositivoService.obtenerDispositivoPorRobot(id_robot);
            
            if (dispositivo) {
                await dispositivoService.actualizarUbicacionYDireccion(
                    dispositivo.id,
                    lat,
                    lng,
                    cardinalDirection
                );
            } else {
                await dispositivoService.crearDispositivo(
                    id_robot,
                    lat,
                    lng,
                    cardinalDirection
                );
            }
            
            // Verificar si el robot tiene una guía activa
            const guiaService = require('../servicios/guia.service');
            const guia = await guiaService.obtenerGuiaPorRobot(id_robot);
            
            if (guia && !guia.estaCompletada()) {
                // Si tiene guía activa, continuar navegación automática
                await navegacionService.ejecutarNavegacionAutomatica(guia.id);
            }
            
            res.json({
                success: true,
                message: 'Ubicación actualizada y navegación continuada'
            });
            
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new SolicitarGuiaControlador();