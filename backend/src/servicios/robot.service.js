import { PrismaClient } from '@prisma/client';
import EstadoRobot from '../enums/EstadoRobot.js';
import RobotAutomatico from '../modelos/RobotAutomatico.js';

class RobotService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async crearRobot(clienteID, batteryLevel = 100, idDispositivo = null, idRutaActual = null) {
        try {
            const robotData = await this.prisma.robotAutomatico.create({
                data: {
                    clienteID: clienteID,
                    batteryLevel: parseInt(batteryLevel),
                    estado: EstadoRobot.LIBRE,
                    id_dispositivo: idDispositivo ? parseInt(idDispositivo) : null,
                    id_rutaActual: idRutaActual ? parseInt(idRutaActual) : null
                },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                }
            });
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al crear robot: ${error.message}`);
        }
    }

    async obtenerRobotPorId(id) {
        try {
            const robotData = await this.prisma.robotAutomatico.findUnique({
                where: { id: parseInt(id) },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: {
                        include: {
                            rutaActual: true
                        }
                    }
                }
            });
            
            if (!robotData) {
                throw new Error('Robot no encontrado');
            }
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al obtener robot: ${error.message}`);
        }
    }

    async obtenerRobotPorClienteID(clienteID) {
        try {
            const robotData = await this.prisma.robotAutomatico.findFirst({
                where: { clienteID: clienteID },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                }
            });
            
            if (!robotData) {
                return null;
            }
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al obtener robot por clienteID: ${error.message}`);
        }
    }

    async obtenerTodosRobots() {
        try {
            const robotsData = await this.prisma.robotAutomatico.findMany({
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                },
                orderBy: { id: 'asc' }
            });
            
            return robotsData.map(robot => RobotAutomatico.fromPrisma(robot));
        } catch (error) {
            throw new Error(`Error al obtener todos los robots: ${error.message}`);
        }
    }

    async obtenerRobotsDisponibles() {
        try {
            const robotsData = await this.prisma.robotAutomatico.findMany({
                where: { estado: EstadoRobot.LIBRE },
                include: {
                    dispositivo: true,
                    rutaActual: true
                }
            });
            
            return robotsData.map(robot => RobotAutomatico.fromPrisma(robot));
        } catch (error) {
            throw new Error(`Error al obtener robots disponibles: ${error.message}`);
        }
    }

    async actualizarEstadoRobot(id, nuevoEstado) {
        try {
            if (!Object.values(EstadoRobot).includes(nuevoEstado)) {
                throw new Error('Estado no válido');
            }
            
            const robotData = await this.prisma.robotAutomatico.update({
                where: { id: parseInt(id) },
                data: { estado: nuevoEstado },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                }
            });
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al actualizar estado del robot: ${error.message}`);
        }
    }

    async actualizarBateriaRobot(id, batteryLevel) {
        try {
            const nivel = parseInt(batteryLevel);
            
            if (nivel < 0 || nivel > 100) {
                throw new Error('Nivel de batería debe estar entre 0 y 100');
            }
            
            const robotData = await this.prisma.robotAutomatico.update({
                where: { id: parseInt(id) },
                data: { batteryLevel: nivel },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                }
            });
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al actualizar batería del robot: ${error.message}`);
        }
    }

    async asignarRutaARobot(idRobot, idRuta) {
        try {
            // Verificar que el robot existe y está disponible
            const robot = await this.obtenerRobotPorId(idRobot);
            
            if (!robot.puedeAsignarRuta()) {
                throw new Error('Robot no disponible para asignar ruta');
            }
            
            // Verificar que la ruta existe
            const ruta = await this.prisma.route.findUnique({
                where: { id: parseInt(idRuta) }
            });
            
            if (!ruta) {
                throw new Error('Ruta no encontrada');
            }
            
            const robotData = await this.prisma.robotAutomatico.update({
                where: { id: parseInt(idRobot) },
                data: { 
                    id_rutaActual: parseInt(idRuta),
                    estado: EstadoRobot.OCUPADO
                },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                }
            });
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al asignar ruta a robot: ${error.message}`);
        }
    }

    async liberarRobot(idRobot) {
        try {
            const robotData = await this.prisma.robotAutomatico.update({
                where: { id: parseInt(idRobot) },
                data: { 
                    id_rutaActual: null,
                    estado: EstadoRobot.LIBRE
                },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                }
            });
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al liberar robot: ${error.message}`);
        }
    }

    async obtenerRobotsNecesitanCarga() {
        try {
            const robotsData = await this.prisma.robotAutomatico.findMany({
                where: {
                    batteryLevel: { lt: 30 }
                },
                include: {
                    dispositivo: true,
                    rutaActual: true
                }
            });
            
            return robotsData.map(robot => RobotAutomatico.fromPrisma(robot));
        } catch (error) {
            throw new Error(`Error al obtener robots que necesitan carga: ${error.message}`);
        }
    }

    async consumirBateriaRobot(idRobot, porcentaje) {
        try {
            const robot = await this.obtenerRobotPorId(idRobot);
            robot.consumirBateria(parseFloat(porcentaje));
            
            // Actualizar en base de datos
            const robotData = await this.prisma.robotAutomatico.update({
                where: { id: parseInt(idRobot) },
                data: { 
                    batteryLevel: robot.batteryLevel,
                    estado: robot.estado
                },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                }
            });
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al consumir batería: ${error.message}`);
        }
    }

    async cargarBateriaRobot(idRobot, porcentaje) {
        try {
            const robot = await this.obtenerRobotPorId(idRobot);
            robot.cargarBateria(parseFloat(porcentaje));
            
            // Actualizar en base de datos
            const robotData = await this.prisma.robotAutomatico.update({
                where: { id: parseInt(idRobot) },
                data: { 
                    batteryLevel: robot.batteryLevel,
                    estado: robot.estado
                },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                }
            });
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al cargar batería: ${error.message}`);
        }
    }

    async eliminarRobot(id) {
        try {
            // Verificar si el robot tiene dispositivos o guías asociadas
            const robot = await this.obtenerRobotPorId(id);
            
            if (robot.estado === EstadoRobot.OCUPADO) {
                throw new Error('No se puede eliminar un robot que está ocupado');
            }
            
            const robotData = await this.prisma.robotAutomatico.delete({
                where: { id: parseInt(id) },
                include: {
                    dispositivo: true,
                    rutaActual: true,
                    asistentes: true
                }
            });
            
            return RobotAutomatico.fromPrisma(robotData);
        } catch (error) {
            throw new Error(`Error al eliminar robot: ${error.message}`);
        }
    }

    async obtenerEstadisticasRobots() {
        try {
            const totalRobots = await this.prisma.robotAutomatico.count();
            const robotsPorEstado = await this.prisma.robotAutomatico.groupBy({
                by: ['estado'],
                _count: true
            });
            
            const promedioBateria = await this.prisma.robotAutomatico.aggregate({
                _avg: {
                    batteryLevel: true
                }
            });
            
            return {
                totalRobots,
                robotsPorEstado,
                promedioBateria: promedioBateria._avg.batteryLevel,
                fechaConsulta: new Date()
            };
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
}

const robotService = new RobotService();
export default robotService;