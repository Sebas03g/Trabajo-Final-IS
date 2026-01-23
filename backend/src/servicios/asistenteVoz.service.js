// servicios/asistenteVoz.service.js
import { PrismaClient } from '@prisma/client';
import AsistenteVoz from '../modelos/AsistenteVoz.js';
import EstadoRobot from '../enums/EstadoRobot.js';
import Ubicaciones from '../enums/Ubicaciones.js';

// Crear instancia única de Prisma
const prisma = new PrismaClient();

class AsistenteVozService {
    async crearAsistente(ubicacion, idRutaActual = null) {
        try {
            // Validar ubicación
            if (!Object.values(Ubicaciones).includes(ubicacion)) {
                throw new Error(`Ubicación no válida. Opciones: ${Object.values(Ubicaciones).join(', ')}`);
            }
            
            const asistenteData = await prisma.asistentedeVoz.create({
                data: {
                    ubicacion: ubicacion,
                    estado: EstadoRobot.LIBRE,
                    id_rutaActual: idRutaActual ? parseInt(idRutaActual) : null
                },
                include: {
                    rutaActual: true,
                    robots: {
                        include: {
                            dispositivo: true,
                            rutaActual: true
                        }
                    }
                }
            });
            
            // Crear instancia del modelo AsistenteVoz
            return AsistenteVoz.fromPrisma(asistenteData);
        } catch (error) {
            console.error('Error al crear asistente:', error);
            throw new Error(`Error al crear asistente: ${error.message}`);
        }
    }

    async obtenerTodosAsistentes() {
        try {
            const asistentesData = await prisma.asistentedeVoz.findMany({
                include: {
                    rutaActual: true,
                    robots: {
                        include: {
                            dispositivo: true,
                            rutaActual: true
                        }
                    }
                },
                orderBy: {
                    id: 'asc'
                }
            });
            
            // Convertir cada dato de Prisma a modelo AsistenteVoz
            return asistentesData.map(data => AsistenteVoz.fromPrisma(data));
        } catch (error) {
            console.error('Error al obtener todos los asistentes:', error);
            throw new Error(`Error al obtener asistentes: ${error.message}`);
        }
    }

    async obtenerAsistentePorId(id) {
        try {
            const asistenteData = await prisma.asistentedeVoz.findUnique({
                where: { id: parseInt(id) },
                include: {
                    rutaActual: true,
                    robots: {
                        include: {
                            dispositivo: true,
                            rutaActual: true,
                            asistentes: true
                        }
                    }
                }
            });
            
            if (!asistenteData) {
                throw new Error(`Asistente con ID ${id} no encontrado`);
            }
            
            // Crear instancia del modelo
            return AsistenteVoz.fromPrisma(asistenteData);
        } catch (error) {
            console.error(`Error al obtener asistente ${id}:`, error);
            throw new Error(`Error al obtener asistente: ${error.message}`);
        }
    }

    async obtenerAsistentesDisponibles() {
        try {
            const asistentesData = await prisma.asistentedeVoz.findMany({
                where: { estado: EstadoRobot.LIBRE },
                include: {
                    rutaActual: true,
                    robots: {
                        include: {
                            dispositivo: true
                        }
                    }
                },
                orderBy: {
                    ubicacion: 'asc'
                }
            });
            
            // Usar el método del modelo para verificar disponibilidad
            const asistentes = asistentesData.map(data => AsistenteVoz.fromPrisma(data));
            return asistentes.filter(asistente => asistente.puedeAtender());
        } catch (error) {
            console.error('Error al obtener asistentes disponibles:', error);
            throw new Error(`Error al obtener asistentes disponibles: ${error.message}`);
        }
    }

    async obtenerAsistentesPorUbicacion(ubicacion) {
        try {
            // Validar ubicación usando el enum
            if (!Object.values(Ubicaciones).includes(ubicacion)) {
                throw new Error(`Ubicación no válida. Opciones: ${Object.values(Ubicaciones).join(', ')}`);
            }
            
            const asistentesData = await prisma.asistentedeVoz.findMany({
                where: { ubicacion: ubicacion },
                include: {
                    rutaActual: true,
                    robots: {
                        include: {
                            dispositivo: true
                        }
                    }
                },
                orderBy: {
                    estado: 'asc'
                }
            });
            
            return asistentesData.map(data => AsistenteVoz.fromPrisma(data));
        } catch (error) {
            console.error(`Error al obtener asistentes por ubicación ${ubicacion}:`, error);
            throw new Error(`Error al obtener asistentes: ${error.message}`);
        }
    }

    async asignarRobotAAsistente(idAsistente, idRobot) {
        try {
            // Obtener el asistente como instancia del modelo
            const asistente = await this.obtenerAsistentePorId(idAsistente);
            
            // Verificar disponibilidad usando método del modelo
            if (!asistente.puedeAtender()) {
                throw new Error(`El asistente ${idAsistente} no está disponible (estado: ${asistente.estado})`);
            }
            
            // Verificar que el robot existe
            const robot = await prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) },
                include: {
                    asistentes: true
                }
            });
            
            if (!robot) {
                throw new Error(`Robot con ID ${idRobot} no encontrado`);
            }
            
            // Verificar que el robot no tenga ya un asistente
            if (robot.asistentes && robot.asistentes.length > 0) {
                throw new Error(`El robot ${idRobot} ya tiene un asistente asignado`);
            }
            
            // Crear la relación Many-to-Many usando el método del modelo
            const asistenteActualizadoData = await prisma.asistentedeVoz.update({
                where: { id: parseInt(idAsistente) },
                data: {
                    estado: EstadoRobot.OCUPADO,
                    robots: {
                        connect: { id: parseInt(idRobot) }
                    }
                },
                include: {
                    rutaActual: true,
                    robots: {
                        include: {
                            dispositivo: true,
                            rutaActual: true
                        }
                    }
                }
            });
            
            // Actualizar estado del robot
            await prisma.robotAutomatico.update({
                where: { id: parseInt(idRobot) },
                data: { estado: EstadoRobot.OCUPADO }
            });
            
            console.log(`🤖 Robot ${idRobot} asignado al asistente ${idAsistente}`);
            
            // Crear nueva instancia del modelo con los datos actualizados
            const asistenteActualizado = AsistenteVoz.fromPrisma(asistenteActualizadoData);
            
            // Usar método del modelo para atender robot
            asistenteActualizado.atenderRobot(robot);
            
            return asistenteActualizado;
        } catch (error) {
            console.error(`Error al asignar robot ${idRobot} a asistente ${idAsistente}:`, error);
            throw new Error(`Error al asignar robot: ${error.message}`);
        }
    }

    async liberarAsistente(idAsistente) {
        try {
            const asistente = await this.obtenerAsistentePorId(idAsistente);
            
            // Usar método del modelo para liberar
            asistente.liberar();
            
            // Actualizar en base de datos
            const asistenteActualizadoData = await prisma.asistentedeVoz.update({
                where: { id: parseInt(idAsistente) },
                data: {
                    estado: EstadoRobot.LIBRE
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
            
            // Si tenía robots asignados, liberarlos también
            if (asistente.tieneRobotsAsignados()) {
                const robotIds = asistente.getRobotsAsignadosIds();
                
                for (const robotId of robotIds) {
                    await prisma.robotAutomatico.update({
                        where: { id: robotId },
                        data: { estado: EstadoRobot.LIBRE }
                    });
                }
                
                // Desconectar la relación con robots
                await prisma.asistentedeVoz.update({
                    where: { id: parseInt(idAsistente) },
                    data: {
                        robots: {
                            disconnect: robotIds.map(id => ({ id }))
                        }
                    }
                });
            }
            
            console.log(`✅ Asistente ${idAsistente} liberado`);
            
            return AsistenteVoz.fromPrisma(asistenteActualizadoData);
        } catch (error) {
            console.error(`Error al liberar asistente ${idAsistente}:`, error);
            throw new Error(`Error al liberar asistente: ${error.message}`);
        }
    }

    async cambiarUbicacionAsistente(idAsistente, nuevaUbicacion) {
        try {
            const asistente = await this.obtenerAsistentePorId(idAsistente);
            
            // Usar método del modelo para cambiar ubicación
            if (!asistente.cambiarUbicacion(nuevaUbicacion)) {
                throw new Error(`Ubicación no válida. Opciones: ${Object.values(Ubicaciones).join(', ')}`);
            }
            
            // Actualizar en base de datos
            const asistenteActualizadoData = await prisma.asistentedeVoz.update({
                where: { id: parseInt(idAsistente) },
                data: { ubicacion: nuevaUbicacion },
                include: {
                    rutaActual: true,
                    robots: {
                        include: {
                            dispositivo: true
                        }
                    }
                }
            });
            
            console.log(`📍 Asistente ${idAsistente} movido a ${nuevaUbicacion}`);
            
            return AsistenteVoz.fromPrisma(asistenteActualizadoData);
        } catch (error) {
            console.error(`Error al cambiar ubicación del asistente ${idAsistente}:`, error);
            throw new Error(`Error al cambiar ubicación: ${error.message}`);
        }
    }

    async actualizarRutaActual(idAsistente, idRuta) {
        try {
            if (idRuta !== null && idRuta !== undefined) {
                // Verificar que la ruta existe
                const ruta = await prisma.route.findUnique({
                    where: { id: parseInt(idRuta) }
                });
                
                if (!ruta) {
                    throw new Error(`Ruta con ID ${idRuta} no encontrada`);
                }
            }
            
            const asistenteData = await prisma.asistentedeVoz.update({
                where: { id: parseInt(idAsistente) },
                data: { 
                    id_rutaActual: idRuta ? parseInt(idRuta) : null 
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
            console.error(`Error al actualizar ruta del asistente ${idAsistente}:`, error);
            throw new Error(`Error al actualizar ruta: ${error.message}`);
        }
    }

    async obtenerAsistentesNecesitanMantenimiento() {
        try {
            const asistentesData = await prisma.asistentedeVoz.findMany({
                where: {
                    OR: [
                        { estado: EstadoRobot.MANTENIMIENTO },
                        {
                            robots: {
                                some: {
                                    estado: EstadoRobot.MANTENIMIENTO
                                }
                            }
                        }
                    ]
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
            
            // Usar método del modelo para verificar mantenimiento
            const asistentes = asistentesData.map(data => AsistenteVoz.fromPrisma(data));
            return asistentes.filter(asistente => asistente.necesitaMantenimiento());
        } catch (error) {
            console.error('Error al obtener asistentes en mantenimiento:', error);
            throw new Error(`Error al obtener asistentes: ${error.message}`);
        }
    }

    async eliminarAsistente(id) {
        try {
            const asistente = await this.obtenerAsistentePorId(id);
            
            // Verificar que no tenga robots asignados usando método del modelo
            if (asistente.tieneRobotsAsignados()) {
                throw new Error('No se puede eliminar un asistente con robots asignados');
            }
            
            // Verificar que no esté ocupado
            if (!asistente.puedeAtender()) {
                throw new Error('No se puede eliminar un asistente ocupado');
            }
            
            const asistenteEliminadoData = await prisma.asistentedeVoz.delete({
                where: { id: parseInt(id) },
                include: {
                    rutaActual: true,
                    robots: true
                }
            });
            
            console.log(`🗑️ Asistente ${id} eliminado`);
            
            return AsistenteVoz.fromPrisma(asistenteEliminadoData);
        } catch (error) {
            console.error(`Error al eliminar asistente ${id}:`, error);
            throw new Error(`Error al eliminar asistente: ${error.message}`);
        }
    }

    // Métodos adicionales que podrían ser útiles
    async buscarAsistenteDisponibleEnUbicacion(ubicacion) {
        try {
            const asistentes = await this.obtenerAsistentesPorUbicacion(ubicacion);
            return asistentes.find(asistente => asistente.puedeAtender());
        } catch (error) {
            console.error(`Error buscando asistente en ${ubicacion}:`, error);
            throw error;
        }
    }

    async actualizarUltimaInteraccion(idAsistente) {
        try {
            const asistente = await this.obtenerAsistentePorId(idAsistente);
            asistente.ultimaInteraccion = new Date();
            
            // Podrías guardar esta fecha en la base de datos si lo necesitas
            return asistente;
        } catch (error) {
            console.error(`Error actualizando interacción del asistente ${idAsistente}:`, error);
            throw error;
        }
    }

    // Método para obtener estadísticas
    async obtenerEstadisticas() {
        try {
            const totalAsistentes = await prisma.asistentedeVoz.count();
            const disponibles = await prisma.asistentedeVoz.count({
                where: { estado: EstadoRobot.LIBRE }
            });
            const ocupados = await prisma.asistentedeVoz.count({
                where: { estado: EstadoRobot.OCUPADO }
            });
            const enMantenimiento = await prisma.asistentedeVoz.count({
                where: { estado: EstadoRobot.MANTENIMIENTO }
            });
            
            return {
                total: totalAsistentes,
                disponibles,
                ocupados,
                enMantenimiento,
                porcentajeDisponibilidad: totalAsistentes > 0 ? (disponibles / totalAsistentes) * 100 : 0
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        }
    }

    // Cerrar conexión Prisma
    async disconnect() {
        await prisma.$disconnect();
    }
}

// Exportar instancia única del servicio
const asistenteVozService = new AsistenteVozService();
export default asistenteVozService;