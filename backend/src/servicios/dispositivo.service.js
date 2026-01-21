const { PrismaClient } = require('@prisma/client');
const Dispositivo = require('../models/Dispositivo');

class DispositivoService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async crearDispositivo(idRobot, lat, lng, direccion = 0) {
        try {
            // Verificar que el robot existe
            const robot = await this.prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) }
            });
            
            if (!robot) {
                throw new Error('Robot no encontrado');
            }
            
            const dispositivoData = await this.prisma.dispositivo.create({
                data: {
                    id_robot: parseInt(idRobot),
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    cardinalDirection: parseFloat(direccion)
                }
            });
            
            // Actualizar el robot con el ID del dispositivo
            await this.prisma.robotAutomatico.update({
                where: { id: parseInt(idRobot) },
                data: { id_dispositivo: dispositivoData.id }
            });
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            throw new Error(`Error al crear dispositivo: ${error.message}`);
        }
    }

    async obtenerDispositivoPorId(id) {
        try {
            const dispositivoData = await this.prisma.dispositivo.findUnique({
                where: { id: parseInt(id) }
            });
            
            if (!dispositivoData) {
                throw new Error('Dispositivo no encontrado');
            }
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            throw new Error(`Error al obtener dispositivo: ${error.message}`);
        }
    }

    async obtenerDispositivoPorRobot(idRobot) {
        try {
            const dispositivoData = await this.prisma.dispositivo.findFirst({
                where: { id_robot: parseInt(idRobot) }
            });
            
            if (!dispositivoData) {
                return null;
            }
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            throw new Error(`Error al obtener dispositivo por robot: ${error.message}`);
        }
    }

    async actualizarUbicacion(idDispositivo, lat, lng) {
        try {
            const dispositivoData = await this.prisma.dispositivo.update({
                where: { id: parseInt(idDispositivo) },
                data: {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng)
                }
            });
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            throw new Error(`Error al actualizar ubicación: ${error.message}`);
        }
    }

    async actualizarUbicacionYDireccion(idDispositivo, lat, lng, direccion) {
        try {
            const dispositivoData = await this.prisma.dispositivo.update({
                where: { id: parseInt(idDispositivo) },
                data: {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    cardinalDirection: parseFloat(direccion)
                }
            });
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            throw new Error(`Error al actualizar ubicación y dirección: ${error.message}`);
        }
    }

    async actualizarDireccion(idDispositivo, direccion) {
        try {
            const dispositivoData = await this.prisma.dispositivo.update({
                where: { id: parseInt(idDispositivo) },
                data: {
                    cardinalDirection: parseFloat(direccion)
                }
            });
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            throw new Error(`Error al actualizar dirección: ${error.message}`);
        }
    }

    async obtenerUbicacionDispositivo(idDispositivo) {
        try {
            const dispositivo = await this.obtenerDispositivoPorId(idDispositivo);
            return dispositivo.getUbicacion();
        } catch (error) {
            throw new Error(`Error al obtener ubicación: ${error.message}`);
        }
    }

    async calcularDistanciaEntreDispositivos(idDispositivo1, idDispositivo2) {
        try {
            const dispositivo1 = await this.obtenerDispositivoPorId(idDispositivo1);
            const dispositivo2 = await this.obtenerDispositivoPorId(idDispositivo2);
            
            return dispositivo1.distanciaA(dispositivo2.lat, dispositivo2.lng);
        } catch (error) {
            throw new Error(`Error al calcular distancia: ${error.message}`);
        }
    }

    async obtenerDispositivosActivos() {
        try {
            // Obtener dispositivos actualizados en los últimos 5 minutos
            const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
            
            // Nota: Necesitarías agregar un campo 'updatedAt' al modelo Prisma
            // Por ahora, obtenemos todos y filtramos por el modelo
            const dispositivosData = await this.prisma.dispositivo.findMany();
            
            const dispositivos = dispositivosData.map(d => Dispositivo.fromPrisma(d));
            return dispositivos.filter(d => d.estaActivo());
        } catch (error) {
            throw new Error(`Error al obtener dispositivos activos: ${error.message}`);
        }
    }

    async eliminarDispositivo(id) {
        try {
            // Verificar si está asociado a un robot
            const robot = await this.prisma.robotAutomatico.findFirst({
                where: { id_dispositivo: parseInt(id) }
            });
            
            if (robot) {
                throw new Error('No se puede eliminar el dispositivo porque está asociado a un robot');
            }
            
            const dispositivoData = await this.prisma.dispositivo.delete({
                where: { id: parseInt(id) }
            });
            
            return Dispositivo.fromPrisma(dispositivoData);
        } catch (error) {
            throw new Error(`Error al eliminar dispositivo: ${error.message}`);
        }
    }
}

module.exports = new DispositivoService();