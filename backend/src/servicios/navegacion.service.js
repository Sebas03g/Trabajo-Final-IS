import Ruta from '../modelos/Ruta.js';
import Dispositivo from '../modelos/Dispositivo.js';
import RobotAutomatico from '../modelos/RobotAutomatico.js';
import { PrismaClient } from '@prisma/client';


class NavegacionService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async calcularRutaOptima(origen, destino) {
        try {
            // Buscar rutas que conecten el origen y destino
            const rutas = await this.prisma.route.findMany({
                where: {
                    beginning: origen,
                    ending: destino
                }
            });
            
            if (rutas.length === 0) {
                throw new Error(`No se encontraron rutas de ${origen} a ${destino}`);
            }
            
            // Convertir a modelos y encontrar la ruta más corta
            const rutasModelos = rutas.map(r => Ruta.fromPrisma(r));
            const rutaOptima = rutasModelos.reduce((corta, actual) => {
                return actual.getDistanciaTotal() < corta.getDistanciaTotal() ? actual : corta;
            }, rutasModelos[0]);
            
            return {
                ruta: rutaOptima,
                distanciaTotal: rutaOptima.getDistanciaTotal(),
                tiempoEstimado: rutaOptima.getTiempoEstimado(),
                alternativas: rutasModelos.length - 1
            };
        } catch (error) {
            throw new Error(`Error al calcular ruta óptima: ${error.message}`);
        }
    }

    async iniciarNavegacion(idRobot, idRuta) {
        try {
            const robotService = require('./robot.service');
            const guiaService = require('./guia.service');
            
            // Asignar ruta al robot
            await robotService.asignarRutaARobot(idRobot, idRuta);
            
            // Crear guía de navegación
            const guia = await guiaService.crearGuia(idRuta, idRobot);
            
            return {
                success: true,
                robotId: idRobot,
                rutaId: idRuta,
                guiaId: guia.id,
                mensaje: 'Navegación iniciada'
            };
        } catch (error) {
            throw new Error(`Error al iniciar navegación: ${error.message}`);
        }
    }

    async actualizarPosicionRobot(idRobot, lat, lng, direccion) {
        try {
            const robot = await this.prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) },
                include: { dispositivo: true }
            });
            
            if (!robot) {
                throw new Error('Robot no encontrado');
            }
            
            const dispositivoService = require('./dispositivo.service');
            
            if (robot.dispositivo) {
                // Actualizar dispositivo existente
                await dispositivoService.actualizarUbicacionYDireccion(
                    robot.dispositivo.id,
                    lat,
                    lng,
                    direccion
                );
            } else {
                // Crear nuevo dispositivo
                await dispositivoService.crearDispositivo(
                    idRobot,
                    lat,
                    lng,
                    direccion
                );
            }
            
            // Obtener robot actualizado
            return await this.prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) },
                include: {
                    dispositivo: true,
                    rutaActual: true
                }
            });
        } catch (error) {
            throw new Error(`Error al actualizar posición: ${error.message}`);
        }
    }

    async obtenerPosicionRobot(idRobot) {
        try {
            const robot = await this.prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) },
                include: { dispositivo: true }
            });
            
            if (!robot) {
                throw new Error('Robot no encontrado');
            }
            
            if (!robot.dispositivo) {
                return {
                    robotId: robot.id,
                    tieneDispositivo: false,
                    ubicacion: null
                };
            }
            
            const dispositivo = Dispositivo.fromPrisma(robot.dispositivo);
            
            return {
                robotId: robot.id,
                tieneDispositivo: true,
                ubicacion: dispositivo.getUbicacion(),
                direccion: dispositivo.getDireccionCardinal(),
                ultimaActualizacion: dispositivo.ultimaActualizacion
            };
        } catch (error) {
            throw new Error(`Error al obtener posición: ${error.message}`);
        }
    }

    async verificarProximidadADestino(idRobot, margenMetros = 5) {
        try {
            const robot = await this.prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) },
                include: {
                    dispositivo: true,
                    rutaActual: true
                }
            });
            
            if (!robot) {
                throw new Error('Robot no encontrado');
            }
            
            if (!robot.rutaActual) {
                return {
                    enRuta: false,
                    mensaje: 'El robot no tiene una ruta asignada'
                };
            }
            
            if (!robot.dispositivo) {
                return {
                    enRuta: true,
                    tienePosicion: false,
                    mensaje: 'Robot sin dispositivo de ubicación'
                };
            }
            
            const ruta = Ruta.fromPrisma(robot.rutaActual);
            const dispositivo = Dispositivo.fromPrisma(robot.dispositivo);
            
            // Obtener punto final de la ruta (simplificado)
            const puntoFinal = ruta.getPuntoFin();
            
            // Calcular distancia al punto final
            // Nota: Aquí necesitarías convertir coordenadas del mapa a lat/lng
            // Por ahora, usamos una simplificación
            const distancia = Math.sqrt(
                Math.pow(puntoFinal.x - dispositivo.lng, 2) + 
                Math.pow(puntoFinal.y - dispositivo.lat, 2)
            ) * 111000; // Conversión aproximada a metros
            
            const enDestino = distancia <= margenMetros;
            
            return {
                enRuta: true,
                enDestino: enDestino,
                distanciaAlDestino: distancia,
                margen: margenMetros,
                proximidad: enDestino ? 'EN_DESTINO' : 'EN_CAMINO'
            };
        } catch (error) {
            throw new Error(`Error al verificar proximidad: ${error.message}`);
        }
    }

    async detenerNavegacion(idRobot) {
        try {
            const robotService = require('./robot.service');
            const guiaService = require('./guia.service');
            
            // Obtener guía activa del robot
            const guia = await guiaService.obtenerGuiaPorRobot(idRobot);
            
            if (guia) {
                // Finalizar guía
                await guiaService.finalizarGuia(guia.id);
            }
            
            // Liberar robot
            await robotService.liberarRobot(idRobot);
            
            return {
                success: true,
                robotId: idRobot,
                mensaje: 'Navegación detenida'
            };
        } catch (error) {
            throw new Error(`Error al detener navegación: ${error.message}`);
        }
    }

    async obtenerRutasDisponibles(origen = null, destino = null) {
        try {
            const whereClause = {};
            
            if (origen) {
                whereClause.beginning = origen;
            }
            
            if (destino) {
                whereClause.ending = destino;
            }
            
            const rutasData = await this.prisma.route.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: {
                            robots: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            });
            
            return rutasData.map(ruta => ({
                ...Ruta.fromPrisma(ruta).toJSON(),
                robotsAsignados: ruta._count.robots
            }));
        } catch (error) {
            throw new Error(`Error al obtener rutas disponibles: ${error.message}`);
        }
    }
    async calcularDireccion(latActual, lngActual, direccionActual, latDestino, lngDestino) {
        const headingActual = navegacionUtils.cardinalToAngle(direccionActual);
        const bearingDestino = navegacionUtils.calculateBearing(
            latActual, lngActual, latDestino, lngDestino
        );
        
        return navegacionUtils.determinarGiro(headingActual, bearingDestino);
    }

    /**
     * Tu función findRouteByDestination (renombrada y adaptada)
     */
    async buscarRutaYRobotDisponible(idAsistente, beginning, ending) {
        // 1️⃣ Obtener asistente con robots
        const asistente = await this.prisma.asistentedeVoz.findUnique({
            where: { id: Number(idAsistente) },
            include: { robots: true }
        });

        if (!asistente) {
            throw new Error("Asistente no encontrado");
        }

        // 2️⃣ Buscar robots libres
        const robotLibre = asistente.robots.find(
            (r) => r.estado === "LIBRE"
        );

        if (!robotLibre) {
            throw new Error("No hay robots disponibles");
        }

        // 3️⃣ Buscar rutas
        const rutas = await this.prisma.route.findMany({
            where: {
                beginning,
                ending
            }
        });

        if (rutas.length === 0) {
            throw new Error("No existen rutas para ese destino");
        }

        return { robotLibre, rutas };
    }

    /**
     * Tu función inicializeGuide (renombrada y adaptada)
     */
    async inicializarGuia(idRobot, idAsistente, idRoute) {
        // Actualizar robot
        await this.prisma.robotAutomatico.update({
            where: { id: Number(idRobot) },
            data: {
                estado: "OCUPADO",
                id_rutaActual: idRoute
            }
        });

        // Actualizar asistente
        await this.prisma.asistentedeVoz.update({
            where: { id: Number(idAsistente) },
            data: {
                estado: "OCUPADO"
            }
        });

        // Crear guía
        const guiaService = require('./guia.service');
        const guia = await guiaService.crearGuia(idRoute, idRobot);
        
        return guia;
    }

    /**
     * Tu función startDirection (renombrada y adaptada)
     */
    async iniciarDireccion(idRobot, idAsistente, idRoute) {
        const guiaService = require('./guia.service');
        
        // Buscar guía activa para este robot
        const guia = await guiaService.obtenerGuiaPorRobot(idRobot);
        
        if (!guia) {
            throw new Error("No hay guía activa para este robot");
        }
        
        // Iniciar navegación automática
        return await guiaService.procesarNavegacionContinua(guia.id);
    }

    /**
     * Tu función makeMovement (renombrada y adaptada)
     */
    async realizarMovimiento(idRobot, direction) {
        const mqttService = require('./mqtt.service');
        const result = await mqttService.sendBasicMovement(idRobot, direction, {
            speed: 50,
        });
        return result;
    }

    /**
     * Función principal de navegación automática
     */
    async ejecutarNavegacionAutomatica(idGuia) {
        const guiaService = require('./guia.service');
        return await guiaService.iniciarNavegacionAutomatica(idGuia);
    }

    /**
     * Mover robot basado en ubicación actual y destino
     */
    async moverHaciaDestino(idRobot, latDestino, lngDestino) {
        // Obtener dispositivo del robot
        const dispositivoService = require('./dispositivo.service');
        const dispositivo = await dispositivoService.obtenerDispositivoPorRobot(idRobot);
        
        if (!dispositivo) {
            throw new Error('Robot no tiene dispositivo de ubicación');
        }
        
        // Calcular dirección
        const direccion = await this.calcularDireccion(
            dispositivo.lat,
            dispositivo.lng,
            dispositivo.getDireccionCardinal(),
            latDestino,
            lngDestino
        );
        
        // Realizar movimiento
        return await this.realizarMovimiento(idRobot, direccion);
    }
}

const navegacionService = new NavegacionService();
export default navegacionService; 