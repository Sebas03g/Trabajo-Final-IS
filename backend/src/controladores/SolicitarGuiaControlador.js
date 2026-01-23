// controladores/solicitarGuia.controlador.js
import navegacionService from '../servicios/navegacion.service.js';
import robotService from '../servicios/robot.service.js';
import dispositivoService from '../servicios/dispositivo.service.js';
import guiaService from '../servicios/guia.service.js';

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
            
            if (!robotLibre) {
                return res.status(404).json({
                    success: false,
                    error: 'No hay robots disponibles para esta ruta'
                });
            }
            
            if (!rutas || rutas.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No se encontraron rutas para el trayecto solicitado'
                });
            }
            
            // 2. Seleccionar la primera ruta (podrías mejorar esto con lógica de selección)
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
            console.error('Error en solicitarGuia:', error);
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
            
            // Validar coordenadas
            if (isNaN(lat) || isNaN(lng)) {
                return res.status(400).json({
                    success: false,
                    error: 'Latitud y longitud deben ser números válidos'
                });
            }
            
            if (lat < -90 || lat > 90) {
                return res.status(400).json({
                    success: false,
                    error: 'Latitud debe estar entre -90 y 90 grados'
                });
            }
            
            if (lng < -180 || lng > 180) {
                return res.status(400).json({
                    success: false,
                    error: 'Longitud debe estar entre -180 y 180 grados'
                });
            }
            
            // Verificar que el robot existe
            const robot = await robotService.obtenerRobotPorId(id_robot);
            if (!robot) {
                return res.status(404).json({
                    success: false,
                    error: `Robot con ID ${id_robot} no encontrado`
                });
            }
            
            // Buscar dispositivo asociado al robot
            let dispositivo = await dispositivoService.obtenerDispositivoPorRobot(id_robot);
            
            if (dispositivo) {
                // Actualizar dispositivo existente
                dispositivo = await dispositivoService.actualizarUbicacionYDireccion(
                    dispositivo.id,
                    lat,
                    lng,
                    cardinalDirection
                );
            } else {
                // Crear nuevo dispositivo
                dispositivo = await dispositivoService.crearDispositivo(
                    id_robot,
                    lat,
                    lng,
                    cardinalDirection
                );
            }
            
            // Actualizar estado del robot a "en movimiento" o similar
            await robotService.actualizarEstadoRobot(id_robot, 'OCUPADO');
            
            // Verificar si el robot tiene una guía activa
            const guia = await guiaService.obtenerGuiaPorRobot(id_robot);
            
            let navegacionContinuada = false;
            if (guia && !guia.estaCompletada()) {
                // Si tiene guía activa, continuar navegación automática
                navegacionContinuada = await navegacionService.ejecutarNavegacionAutomatica(guia.id);
            }
            
            res.json({
                success: true,
                data: {
                    dispositivo,
                    robot,
                    guia: guia || null,
                    navegacionContinuada
                },
                message: 'Ubicación actualizada' + (navegacionContinuada ? ' y navegación continuada' : '')
            });
            
        } catch (error) {
            console.error('Error en actualizarUbicacionRobot:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async obtenerGuiaActiva(req, res) {
        try {
            const { id_robot } = req.params;
            
            if (!id_robot) {
                return res.status(400).json({
                    success: false,
                    error: 'Falta parámetro: id_robot'
                });
            }
            
            const guia = await guiaService.obtenerGuiaPorRobot(id_robot);
            
            if (!guia) {
                return res.status(404).json({
                    success: false,
                    error: 'No se encontró una guía activa para este robot',
                    data: null
                });
            }
            
            res.json({
                success: true,
                data: guia,
                message: 'Guía activa encontrada'
            });
            
        } catch (error) {
            console.error('Error en obtenerGuiaActiva:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async cancelarGuia(req, res) {
        try {
            const { id_robot } = req.body;
            
            if (!id_robot) {
                return res.status(400).json({
                    success: false,
                    error: 'Falta parámetro: id_robot'
                });
            }
            
            const guia = await guiaService.obtenerGuiaPorRobot(id_robot);
            
            if (!guia) {
                return res.status(404).json({
                    success: false,
                    error: 'No se encontró una guía activa para este robot'
                });
            }
            
            // Cancelar la guía
            const guiaCancelada = await navegacionService.cancelarNavegacion(guia.id);
            
            // Actualizar estado del robot a LIBRE
            await robotService.actualizarEstadoRobot(id_robot, 'LIBRE');
            
            res.json({
                success: true,
                data: guiaCancelada,
                message: 'Guía cancelada exitosamente'
            });
            
        } catch (error) {
            console.error('Error en cancelarGuia:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async obtenerProgresoGuia(req, res) {
        try {
            const { id_robot } = req.params;
            
            if (!id_robot) {
                return res.status(400).json({
                    success: false,
                    error: 'Falta parámetro: id_robot'
                });
            }
            
            const guia = await guiaService.obtenerGuiaPorRobot(id_robot);
            
            if (!guia) {
                return res.status(404).json({
                    success: false,
                    error: 'No se encontró una guía activa para este robot'
                });
            }
            
            const progreso = await navegacionService.obtenerProgresoGuia(guia.id);
            
            res.json({
                success: true,
                data: {
                    guia,
                    progreso
                },
                message: 'Progreso de la guía obtenido exitosamente'
            });
            
        } catch (error) {
            console.error('Error en obtenerProgresoGuia:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

// Exportar instancia única del controlador
const solicitarGuiaControlador = new SolicitarGuiaControlador();
export default solicitarGuiaControlador;