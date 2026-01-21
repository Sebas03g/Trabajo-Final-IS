const { PrismaClient } = require('@prisma/client');
const Guia = require('../models/Guia');
const Ruta = require('../models/Ruta');
const RobotAutomatico = require('../models/RobotAutomatico');

class GuiaService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async crearGuia(idRuta, idRobot) {
        try {
            // Verificar que el robot existe y está disponible
            const robot = await this.prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) }
            });
            
            if (!robot) {
                throw new Error('Robot no encontrado');
            }
            
            // Verificar que la ruta existe
            const ruta = await this.prisma.route.findUnique({
                where: { id: parseInt(idRuta) }
            });
            
            if (!ruta) {
                throw new Error('Ruta no encontrada');
            }
            
            // Crear la guía
            const guiaData = await this.prisma.guia.create({
                data: {
                    id_ruta: parseInt(idRuta),
                    puntoActual: 0,
                    id_robot: parseInt(idRobot)
                },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true
                        }
                    }
                }
            });
            
            // Actualizar el robot para que apunte a esta ruta
            await this.prisma.robotAutomatico.update({
                where: { id: parseInt(idRobot) },
                data: { id_rutaActual: parseInt(idRuta) }
            });
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            throw new Error(`Error al crear guía: ${error.message}`);
        }
    }

    async obtenerGuiaPorId(id) {
        try {
            const guiaData = await this.prisma.guia.findUnique({
                where: { id: parseInt(id) },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true
                        }
                    }
                }
            });
            
            if (!guiaData) {
                throw new Error('Guía no encontrada');
            }
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            throw new Error(`Error al obtener guía: ${error.message}`);
        }
    }

    async obtenerGuiaPorRobot(idRobot) {
        try {
            const guiaData = await this.prisma.guia.findFirst({
                where: { id_robot: parseInt(idRobot) },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true
                        }
                    }
                },
                orderBy: { id: 'desc' }
            });
            
            if (!guiaData) {
                return null;
            }
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            throw new Error(`Error al obtener guía por robot: ${error.message}`);
        }
    }

    async avanzarEnGuia(idGuia) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (!guia) {
                throw new Error('Guía no encontrada');
            }
            
            if (guia.estaCompletada()) {
                throw new Error('La guía ya está completada');
            }
            
            const avanzado = guia.avanzar();
            
            if (avanzado) {
                // Actualizar en base de datos
                const guiaData = await this.prisma.guia.update({
                    where: { id: parseInt(idGuia) },
                    data: { puntoActual: guia.puntoActual },
                    include: {
                        ruta: true,
                        robot: true
                    }
                });
                
                return Guia.fromPrisma(guiaData);
            }
            
            return guia;
        } catch (error) {
            throw new Error(`Error al avanzar en guía: ${error.message}`);
        }
    }

    async actualizarPuntoActual(idGuia, puntoActual) {
        try {
            const guiaData = await this.prisma.guia.update({
                where: { id: parseInt(idGuia) },
                data: { puntoActual: parseInt(puntoActual) },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true
                        }
                    }
                }
            });
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            throw new Error(`Error al actualizar punto actual: ${error.message}`);
        }
    }

    async finalizarGuia(idGuia) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (!guia) {
                throw new Error('Guía no encontrada');
            }
            
            // Mover al último punto
            const guiaData = await this.prisma.guia.update({
                where: { id: parseInt(idGuia) },
                data: { 
                    puntoActual: guia.ruta.points.length - 1 
                },
                include: {
                    ruta: true,
                    robot: true
                }
            });
            
            // Liberar al robot
            if (guiaData.id_robot) {
                await this.prisma.robotAutomatico.update({
                    where: { id: guiaData.id_robot },
                    data: { 
                        id_rutaActual: null,
                        estado: 'LIBRE'
                    }
                });
            }
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            throw new Error(`Error al finalizar guía: ${error.message}`);
        }
    }

    async obtenerGuiasActivas() {
        try {
            const guiasData = await this.prisma.guia.findMany({
                where: {
                    ruta: {
                        isNot: null
                    }
                },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true
                        }
                    }
                },
                orderBy: { id: 'desc' }
            });
            
            return guiasData.map(guia => Guia.fromPrisma(guia));
        } catch (error) {
            throw new Error(`Error al obtener guías activas: ${error.message}`);
        }
    }

    async obtenerProgresoGuia(idGuia) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            return {
                guiaId: guia.id,
                progreso: guia.getProgreso(),
                puntoActual: guia.puntoActual,
                totalPuntos: guia.ruta.points.length,
                completada: guia.estaCompletada(),
                distanciaRestante: guia.getDistanciaRestante()
            };
        } catch (error) {
            throw new Error(`Error al obtener progreso: ${error.message}`);
        }
    }

    async eliminarGuia(id) {
        try {
            const guiaData = await this.prisma.guia.delete({
                where: { id: parseInt(id) },
                include: {
                    ruta: true,
                    robot: true
                }
            });
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            throw new Error(`Error al eliminar guía: ${error.message}`);
        }
    }
    async iniciarNavegacionAutomatica(idGuia) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (!guia) {
                throw new Error('Guía no encontrada');
            }
            
            if (guia.estaCompletada()) {
                throw new Error('La guía ya está completada');
            }
            
            // Obtener punto actual y siguiente
            const puntoActual = guia.getPuntoActualCoords();
            const siguientePunto = guia.getSiguientePunto();
            
            if (!siguientePunto) {
                // No hay más puntos, detener robot
                const mqttService = require('./mqtt.service');
                await mqttService.stop(guia.id_robot);
                
                // Finalizar guía
                await this.finalizarGuia(idGuia);
                
                return {
                    completada: true,
                    mensaje: 'Ruta completada'
                };
            }
            
            // Obtener ubicación actual del dispositivo del robot
            const dispositivoService = require('./dispositivo.service');
            const dispositivo = await dispositivoService.obtenerDispositivoPorRobot(guia.id_robot);
            
            if (!dispositivo) {
                throw new Error('Robot no tiene dispositivo de ubicación');
            }
            
            // Calcular dirección necesaria
            const direccion = this.calcularDireccionHaciaPunto(
                dispositivo,
                siguientePunto
            );
            
            // Enviar comando MQTT
            const mqttService = require('./mqtt.service');
            
            if (direccion !== 'forward') {
                // Si necesita girar, enviar comando de giro
                await mqttService.sendBasicMovement(guia.id_robot, direccion);
                
                // Esperar un momento para que el robot gire
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Avanzar hacia adelante
            await mqttService.sendBasicMovement(guia.id_robot, 'forward', {
                speed: 50,
                distance: this.calcularDistancia(dispositivo, siguientePunto)
            });
            
            // Actualizar punto actual en la guía
            await this.avanzarEnGuia(idGuia);
            
            return {
                puntoActual: guia.puntoActual,
                siguientePunto,
                direccion,
                distanciaRestante: guia.getDistanciaRestante()
            };
            
        } catch (error) {
            throw new Error(`Error en navegación automática: ${error.message}`);
        }
    }

    calcularDireccionHaciaPunto(dispositivo, puntoDestino) {
        const navegacionService = require('./navegacion.service');
        return navegacionService.calcularDireccion(
            dispositivo.lat,
            dispositivo.lng,
            dispositivo.cardinalDirection,
            puntoDestino.lat,
            puntoDestino.lng
        );
    }

    calcularDistancia(dispositivo, puntoDestino) {
        const navegacionService = require('./navegacion.service');
        return navegacionService.calcularDistancia(
            dispositivo.lat,
            dispositivo.lng,
            puntoDestino.lat,
            puntoDestino.lng
        );
    }

    async procesarNavegacionContinua(idGuia, intervaloMs = 5000) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (guia.estaCompletada()) {
                return { completada: true };
            }
            
            // Iniciar intervalo para procesamiento continuo
            const intervalo = setInterval(async () => {
                try {
                    const resultado = await this.iniciarNavegacionAutomatica(idGuia);
                    
                    if (resultado.completada) {
                        clearInterval(intervalo);
                        console.log(`Guía ${idGuia} completada`);
                    }
                    
                } catch (error) {
                    console.error(`Error en procesamiento continuo: ${error.message}`);
                    clearInterval(intervalo);
                }
            }, intervaloMs);
            
            return {
                iniciado: true,
                guiaId: idGuia,
                intervaloMs
            };
            
        } catch (error) {
            throw new Error(`Error al iniciar navegación continua: ${error.message}`);
        }
    }
}

module.exports = new GuiaService();