const { PrismaClient } = require('@prisma/client');
const { EstadoRobot } = require('../enums/EstadoRobot');
const { Ubicaciones } = require('../enums/Ubicaciones');
const AsistenteVoz = require('../models/AsistenteVoz');

class AsistenteVozService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async crearAsistente(ubicacion, idRutaActual = null) {
        try {
            // Validar ubicación
            if (!Object.values(Ubicaciones).includes(ubicacion)) {
                throw new Error('Ubicación no válida');
            }
            
            const asistenteData = await this.prisma.asistentedeVoz.create({
                data: {
                    ubicacion: ubicacion,
                    estado: EstadoRobot.LIBRE,
                    id_rutaActual: idRutaActual ? parseInt(idRutaActual) : null
                },
                include: {
                    rutaActual: true,
                    robots: true
                }
            });
            
            return AsistenteVoz.fromPrisma(asistenteData);
        } catch (error) {
            throw new Error(`Error al crear asistente: ${error.message}`);
        }
    }

    async obtenerAsistentePorId(id) {
        try {
            const asistenteData = await this.prisma.asistentedeVoz.findUnique({
                where: { id: parseInt(id) },
                include: {
                    rutaActual: true,
                    robots: {
                        include: {
                            dispositivo: true
                        }
                    }
                }
            });
            
            if (!asistenteData) {
                throw new Error('Asistente no encontrado');
            }
            
            return AsistenteVoz.fromPrisma(asistenteData);
        } catch (error) {
            throw new Error(`Error al obtener asistente: ${error.message}`);
        }
    }

    async obtenerAsistentesDisponibles() {
        try {
            const asistentesData = await this.prisma.asistentedeVoz.findMany({
                where: { estado: EstadoRobot.LIBRE },
                include: {
                    rutaActual: true,
                    robots: true
                }
            });
            
            return asistentesData.map(asistente => AsistenteVoz.fromPrisma(asistente));
        } catch (error) {
            throw new Error(`Error al obtener asistentes disponibles: ${error.message}`);
        }
    }

    async obtenerAsistentesPorUbicacion(ubicacion) {
        try {
            const asistentesData = await this.prisma.asistentedeVoz.findMany({
                where: { ubicacion: ubicacion },
                include: {
                    rutaActual: true,
                    robots: true
                }
            });
            
            return asistentesData.map(asistente => AsistenteVoz.fromPrisma(asistente));
        } catch (error) {
            throw new Error(`Error al obtener asistentes por ubicación: ${error.message}`);
        }
    }

    async asignarRobotAAsistente(idAsistente, idRobot) {
        try {
            // Verificar que el asistente esté disponible
            const asistente = await this.obtenerAsistentePorId(idAsistente);
            
            if (!asistente.puedeAtender()) {
                throw new Error('El asistente no está disponible');
            }
            
            // Verificar que el robot existe
            const robot = await this.prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) }
            });
            
            if (!robot) {
                throw new Error('Robot no encontrado');
            }
            
            // Actualizar el asistente para que apunte al robot
            const asistenteData = await this.prisma.asistentedeVoz.update({
                where: { id: parseInt(idAsistente) },
                data: {
                    estado: EstadoRobot.OCUPADO
                },
                include: {
                    rutaActual: true,
                    robots: {
                        include: {
                            dispositivo: true
                        }
                    }
                }
            });
            
            return AsistenteVoz.fromPrisma(asistenteData);
        } catch (error) {
            throw new Error(`Error al asignar robot a asistente: ${error.message}`);
        }
    }

    async liberarAsistente(idAsistente) {
        try {
            const asistenteData = await this.prisma.asistentedeVoz.update({
                where: { id: parseInt(idAsistente) },
                data: {
                    estado: EstadoRobot.LIBRE
                },
                include: {
                    rutaActual: true,
                    robots: true
                }
            });
            
            return AsistenteVoz.fromPrisma(asistenteData);
        } catch (error) {
            throw new Error(`Error al liberar asistente: ${error.message}`);
        }
    }

    async cambiarUbicacionAsistente(idAsistente, nuevaUbicacion) {
        try {
            if (!Object.values(Ubicaciones).includes(nuevaUbicacion)) {
                throw new Error('Ubicación no válida');
            }
            
            const asistenteData = await this.prisma.asistentedeVoz.update({
                where: { id: parseInt(idAsistente) },
                data: { ubicacion: nuevaUbicacion },
                include: {
                    rutaActual: true,
                    robots: true
                }
            });
            
            return AsistenteVoz.fromPrisma(asistenteData);
        } catch (error) {
            throw new Error(`Error al cambiar ubicación: ${error.message}`);
        }
    }

    async actualizarRutaActual(idAsistente, idRuta) {
        try {
            // Verificar que la ruta existe
            if (idRuta) {
                const ruta = await this.prisma.route.findUnique({
                    where: { id: parseInt(idRuta) }
                });
                
                if (!ruta) {
                    throw new Error('Ruta no encontrada');
                }
            }
            
            const asistenteData = await this.prisma.asistentedeVoz.update({
                where: { id: parseInt(idAsistente) },
                data: { id_rutaActual: idRuta ? parseInt(idRuta) : null },
                include: {
                    rutaActual: true,
                    robots: true
                }
            });
            
            return AsistenteVoz.fromPrisma(asistenteData);
        } catch (error) {
            throw new Error(`Error al actualizar ruta actual: ${error.message}`);
        }
    }

    async obtenerAsistentesNecesitanMantenimiento() {
        try {
            const asistentesData = await this.prisma.asistentedeVoz.findMany({
                include: {
                    rutaActual: true,
                    robots: true
                }
            });
            
            const asistentes = asistentesData.map(a => AsistenteVoz.fromPrisma(a));
            return asistentes.filter(a => a.necesitaMantenimiento());
        } catch (error) {
            throw new Error(`Error al obtener asistentes que necesitan mantenimiento: ${error.message}`);
        }
    }

    async eliminarAsistente(id) {
        try {
            // Verificar si tiene robots asignados
            const asistente = await this.obtenerAsistentePorId(id);
            
            if (asistente.tieneRobotsAsignados()) {
                throw new Error('No se puede eliminar el asistente porque tiene robots asignados');
            }
            
            const asistenteData = await this.prisma.asistentedeVoz.delete({
                where: { id: parseInt(id) },
                include: {
                    rutaActual: true,
                    robots: true
                }
            });
            
            return AsistenteVoz.fromPrisma(asistenteData);
        } catch (error) {
            throw new Error(`Error al eliminar asistente: ${error.message}`);
        }
    }
}

module.exports = new AsistenteVozService();