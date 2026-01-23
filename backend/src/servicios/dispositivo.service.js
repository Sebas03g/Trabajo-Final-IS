// servicios/dispositivo.service.js
import { PrismaClient } from '@prisma/client';
import Dispositivo from '../modelos/Dispositivo.js';

// Crear instancia única de Prisma
const prisma = new PrismaClient();

class DispositivoService {
    async crearDispositivo(idRobot, lat, lng, direccion = 0) {
        try {
            // Validar coordenadas
            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Latitud y longitud deben ser números válidos');
            }
            
            if (lat < -90 || lat > 90) {
                throw new Error('Latitud debe estar entre -90 y 90 grados');
            }
            
            if (lng < -180 || lng > 180) {
                throw new Error('Longitud debe estar entre -180 y 180 grados');
            }
            
            // Validar dirección
            if (direccion < 0 || direccion > 360) {
                throw new Error('Dirección debe estar entre 0 y 360 grados');
            }
            
            // Verificar que el robot existe
            const robot = await prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) }
            });
            
            if (!robot) {
                throw new Error(`Robot con ID ${idRobot} no encontrado`);
            }
            
            // Verificar si el robot ya tiene un dispositivo
            if (robot.id_dispositivo) {
                throw new Error(`El robot ${idRobot} ya tiene un dispositivo asignado`);
            }
            
            const dispositivoData = await prisma.dispositivo.create({
                data: {
                    id_robot: parseInt(idRobot),
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    cardinalDirection: parseFloat(direccion)
                }
            });
            
            // Actualizar el robot con el ID del dispositivo
            await prisma.robotAutomatico.update({
                where: { id: parseInt(idRobot) },
                data: { id_dispositivo: dispositivoData.id }
            });
            
            console.log(`📱 Dispositivo ${dispositivoData.id} creado para robot ${idRobot}`);
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            console.error('Error al crear dispositivo:', error);
            throw new Error(`Error al crear dispositivo: ${error.message}`);
        }
    }

    async obtenerDispositivoPorId(id) {
        try {
            const dispositivoData = await prisma.dispositivo.findUnique({
                where: { id: parseInt(id) },
                include: {
                    robot: {
                        include: {
                            asistentes: true,
                            rutaActual: true
                        }
                    }
                }
            });
            
            if (!dispositivoData) {
                throw new Error(`Dispositivo con ID ${id} no encontrado`);
            }
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            console.error(`Error al obtener dispositivo ${id}:`, error);
            throw new Error(`Error al obtener dispositivo: ${error.message}`);
        }
    }

    async obtenerDispositivoPorRobot(idRobot) {
        try {
            const dispositivoData = await prisma.dispositivo.findFirst({
                where: { id_robot: parseInt(idRobot) },
                include: {
                    robot: {
                        include: {
                            asistentes: true,
                            rutaActual: true
                        }
                    }
                }
            });
            
            if (!dispositivoData) {
                return null;
            }
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            console.error(`Error al obtener dispositivo para robot ${idRobot}:`, error);
            throw new Error(`Error al obtener dispositivo por robot: ${error.message}`);
        }
    }

    async actualizarUbicacion(idDispositivo, lat, lng) {
        try {
            // Validar coordenadas
            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Latitud y longitud deben ser números válidos');
            }
            
            if (lat < -90 || lat > 90) {
                throw new Error('Latitud debe estar entre -90 y 90 grados');
            }
            
            if (lng < -180 || lng > 180) {
                throw new Error('Longitud debe estar entre -180 y 180 grados');
            }
            
            const dispositivoData = await prisma.dispositivo.update({
                where: { id: parseInt(idDispositivo) },
                data: {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng)
                },
                include: {
                    robot: true
                }
            });
            
            console.log(`📍 Dispositivo ${idDispositivo} ubicación actualizada: ${lat}, ${lng}`);
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            console.error(`Error al actualizar ubicación del dispositivo ${idDispositivo}:`, error);
            throw new Error(`Error al actualizar ubicación: ${error.message}`);
        }
    }

    async actualizarUbicacionYDireccion(idDispositivo, lat, lng, direccion) {
        try {
            // Validar coordenadas
            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Latitud y longitud deben ser números válidos');
            }
            
            if (lat < -90 || lat > 90) {
                throw new Error('Latitud debe estar entre -90 y 90 grados');
            }
            
            if (lng < -180 || lng > 180) {
                throw new Error('Longitud debe estar entre -180 y 180 grados');
            }
            
            // Validar dirección
            if (direccion !== null && direccion !== undefined) {
                if (direccion < 0 || direccion > 360) {
                    throw new Error('Dirección debe estar entre 0 y 360 grados');
                }
            }
            
            const updateData = {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            };
            
            if (direccion !== null && direccion !== undefined) {
                updateData.cardinalDirection = parseFloat(direccion);
            }
            
            const dispositivoData = await prisma.dispositivo.update({
                where: { id: parseInt(idDispositivo) },
                data: updateData,
                include: {
                    robot: true
                }
            });
            
            const direccionTexto = direccion !== null && direccion !== undefined ? 
                `, dirección: ${direccion}°` : '';
            
            console.log(`📍 Dispositivo ${idDispositivo} actualizado: ${lat}, ${lng}${direccionTexto}`);
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            console.error(`Error al actualizar dispositivo ${idDispositivo}:`, error);
            throw new Error(`Error al actualizar ubicación y dirección: ${error.message}`);
        }
    }

    async actualizarDireccion(idDispositivo, direccion) {
        try {
            // Validar dirección
            if (direccion < 0 || direccion > 360) {
                throw new Error('Dirección debe estar entre 0 y 360 grados');
            }
            
            const dispositivoData = await prisma.dispositivo.update({
                where: { id: parseInt(idDispositivo) },
                data: {
                    cardinalDirection: parseFloat(direccion)
                },
                include: {
                    robot: true
                }
            });
            
            console.log(`🧭 Dispositivo ${idDispositivo} dirección actualizada: ${direccion}°`);
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            console.error(`Error al actualizar dirección del dispositivo ${idDispositivo}:`, error);
            throw new Error(`Error al actualizar dirección: ${error.message}`);
        }
    }

    async obtenerUbicacionDispositivo(idDispositivo) {
        try {
            const dispositivo = await this.obtenerDispositivoPorId(idDispositivo);
            return dispositivo.getUbicacion();
        } catch (error) {
            console.error(`Error al obtener ubicación del dispositivo ${idDispositivo}:`, error);
            throw new Error(`Error al obtener ubicación: ${error.message}`);
        }
    }

    async obtenerUbicacionRobot(idRobot) {
        try {
            const dispositivo = await this.obtenerDispositivoPorRobot(idRobot);
            
            if (!dispositivo) {
                throw new Error(`Robot ${idRobot} no tiene dispositivo asignado`);
            }
            
            return {
                dispositivo: dispositivo.toJSON(),
                ubicacion: dispositivo.getUbicacion(),
                direccionCardinal: dispositivo.getDireccionCardinal()
            };
        } catch (error) {
            console.error(`Error al obtener ubicación del robot ${idRobot}:`, error);
            throw new Error(`Error al obtener ubicación del robot: ${error.message}`);
        }
    }

    async calcularDistanciaEntreDispositivos(idDispositivo1, idDispositivo2) {
        try {
            const dispositivo1 = await this.obtenerDispositivoPorId(idDispositivo1);
            const dispositivo2 = await this.obtenerDispositivoPorId(idDispositivo2);
            
            const distancia = dispositivo1.distanciaA(dispositivo2.lat, dispositivo2.lng);
            
            return {
                dispositivo1: dispositivo1.toJSON(),
                dispositivo2: dispositivo2.toJSON(),
                distanciaKm: distancia,
                distanciaMetros: distancia * 1000
            };
        } catch (error) {
            console.error(`Error calculando distancia entre dispositivos ${idDispositivo1} y ${idDispositivo2}:`, error);
            throw new Error(`Error al calcular distancia: ${error.message}`);
        }
    }

    async calcularDistanciaEntreRobots(idRobot1, idRobot2) {
        try {
            const dispositivo1 = await this.obtenerDispositivoPorRobot(idRobot1);
            const dispositivo2 = await this.obtenerDispositivoPorRobot(idRobot2);
            
            if (!dispositivo1) {
                throw new Error(`Robot ${idRobot1} no tiene dispositivo`);
            }
            
            if (!dispositivo2) {
                throw new Error(`Robot ${idRobot2} no tiene dispositivo`);
            }
            
            const distancia = dispositivo1.distanciaA(dispositivo2.lat, dispositivo2.lng);
            
            return {
                robot1: idRobot1,
                robot2: idRobot2,
                distanciaKm: distancia,
                distanciaMetros: distancia * 1000,
                dispositivo1: dispositivo1.toJSON(),
                dispositivo2: dispositivo2.toJSON()
            };
        } catch (error) {
            console.error(`Error calculando distancia entre robots ${idRobot1} y ${idRobot2}:`, error);
            throw new Error(`Error al calcular distancia entre robots: ${error.message}`);
        }
    }

    async obtenerDispositivosActivos() {
        try {
            const dispositivosData = await prisma.dispositivo.findMany({
                include: {
                    robot: true
                }
            });
            
            const dispositivos = dispositivosData.map(d => Dispositivo.fromPrisma(d));
            
            // Filtrar dispositivos que están "activos" (tienen un robot asociado y no están en mantenimiento)
            return dispositivos.filter(d => {
                const dispositivo = d.toJSON();
                return dispositivo.robot && dispositivo.robot.estado !== 'MANTENIMIENTO';
            });
        } catch (error) {
            console.error('Error al obtener dispositivos activos:', error);
            throw new Error(`Error al obtener dispositivos activos: ${error.message}`);
        }
    }

    async obtenerDispositivosConRobots() {
        try {
            const dispositivosData = await prisma.dispositivo.findMany({
                include: {
                    robot: {
                        include: {
                            asistentes: true,
                            rutaActual: true
                        }
                    }
                }
            });
            
            return dispositivosData.map(d => Dispositivo.fromPrisma(d));
        } catch (error) {
            console.error('Error al obtener dispositivos con robots:', error);
            throw new Error(`Error al obtener dispositivos: ${error.message}`);
        }
    }

    async eliminarDispositivo(id) {
        try {
            // Verificar si está asociado a un robot
            const robot = await prisma.robotAutomatico.findFirst({
                where: { id_dispositivo: parseInt(id) }
            });
            
            if (robot) {
                // Desasociar el robot del dispositivo
                await prisma.robotAutomatico.update({
                    where: { id: robot.id },
                    data: { id_dispositivo: null }
                });
            }
            
            const dispositivoData = await prisma.dispositivo.delete({
                where: { id: parseInt(id) }
            });
            
            console.log(`🗑️ Dispositivo ${id} eliminado`);
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            console.error(`Error al eliminar dispositivo ${id}:`, error);
            throw new Error(`Error al eliminar dispositivo: ${error.message}`);
        }
    }

    // Métodos adicionales
    async obtenerEstadisticas() {
        try {
            const totalDispositivos = await prisma.dispositivo.count();
            const dispositivosConRobot = await prisma.dispositivo.count({
                where: {
                    robot: {
                        isNot: null
                    }
                }
            });
            
            return {
                total: totalDispositivos,
                conRobot: dispositivosConRobot,
                sinRobot: totalDispositivos - dispositivosConRobot,
                porcentajeConRobot: totalDispositivos > 0 ? (dispositivosConRobot / totalDispositivos) * 100 : 0
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas de dispositivos:', error);
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        }
    }

    async buscarDispositivosCercanos(lat, lng, radioKm = 1) {
        try {
            const dispositivosData = await prisma.dispositivo.findMany({
                include: {
                    robot: true
                }
            });
            
            const dispositivos = dispositivosData.map(d => Dispositivo.fromPrisma(d));
            
            return dispositivos.filter(dispositivo => {
                const distancia = dispositivo.distanciaA(lat, lng);
                return distancia <= radioKm;
            });
        } catch (error) {
            console.error(`Error buscando dispositivos cercanos a ${lat}, ${lng}:`, error);
            throw new Error(`Error buscando dispositivos cercanos: ${error.message}`);
        }
    }

    // Cerrar conexión Prisma
    async disconnect() {
        await prisma.$disconnect();
    }
}

// Exportar instancia única del servicio
const dispositivoService = new DispositivoService();
export default dispositivoService;