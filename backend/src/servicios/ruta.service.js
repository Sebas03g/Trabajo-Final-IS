import { PrismaClient } from '@prisma/client';
import Ruta from '../modelos/Ruta.js';

class RutaService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async crearRuta(datos) {
        try {
            const rutaData = await this.prisma.route.create({
                data: {
                    name: datos.name,
                    points: datos.points,
                    beginning: datos.beginning,
                    ending: datos.ending,
                    id_mapa: datos.id_mapa
                }
            });
            
            return Ruta.fromPrisma(rutaData);
        } catch (error) {
            throw new Error(`Error al crear ruta: ${error.message}`);
        }
    }

    async obtenerRutaPorId(id) {
        try {
            const rutaData = await this.prisma.route.findUnique({
                where: { id: parseInt(id) }
            });
            
            if (!rutaData) {
                throw new Error('Ruta no encontrada');
            }
            
            return Ruta.fromPrisma(rutaData);
        } catch (error) {
            throw new Error(`Error al obtener ruta: ${error.message}`);
        }
    }

    async obtenerTodasRutas() {
        try {
            const rutasData = await this.prisma.route.findMany({
                orderBy: { createdAt: 'desc' }
            });
            
            return rutasData.map(ruta => ruta.toJSON ? ruta.toJSON() : ruta);
        } catch (error) {
            throw new Error(`Error al obtener rutas: ${error.message}`);
        }
    }

    async actualizarRuta(id, datos) {
        try {
            const rutaData = await this.prisma.route.update({
                where: { id: parseInt(id) },
                data: {
                    name: datos.name,
                    points: datos.points,
                    beginning: datos.beginning,
                    ending: datos.ending,
                    id_mapa: datos.id_mapa
                }
            });
            
            return Ruta.fromPrisma(rutaData);
        } catch (error) {
            throw new Error(`Error al actualizar ruta: ${error.message}`);
        }
    }

    async eliminarRuta(id) {
        try {
            // Verificar si la ruta está siendo usada por algún robot
            const robotsUsandoRuta = await this.prisma.robotAutomatico.count({
                where: { id_rutaActual: parseInt(id) }
            });
            
            if (robotsUsandoRuta > 0) {
                throw new Error('No se puede eliminar la ruta porque está asignada a robots');
            }
            
            const rutaData = await this.prisma.route.delete({
                where: { id: parseInt(id) }
            });
            
            return Ruta.fromPrisma(rutaData);
        } catch (error) {
            throw new Error(`Error al eliminar ruta: ${error.message}`);
        }
    }

    async buscarRutasPorUbicacion(ubicacionInicio, ubicacionFin) {
        try {
            const whereClause = {};
            
            if (ubicacionInicio) {
                whereClause.beginning = ubicacionInicio;
            }
            
            if (ubicacionFin) {
                whereClause.ending = ubicacionFin;
            }
            
            const rutasData = await this.prisma.route.findMany({
                where: whereClause,
                orderBy: { name: 'asc' }
            });
            
            return rutasData.map(ruta => Ruta.fromPrisma(ruta));
        } catch (error) {
            throw new Error(`Error al buscar rutas: ${error.message}`);
        }
    }

    async obtenerRutasRecientes(limite = 10) {
        try {
            const rutasData = await this.prisma.route.findMany({
                take: limite,
                orderBy: { createdAt: 'desc' }
            });
            
            return rutasData.map(ruta => Ruta.fromPrisma(ruta));
        } catch (error) {
            throw new Error(`Error al obtener rutas recientes: ${error.message}`);
        }
    }

    async obtenerEstadisticasRutas() {
        try {
            const totalRutas = await this.prisma.route.count();
            const rutasPorUbicacion = await this.prisma.route.groupBy({
                by: ['beginning'],
                _count: true
            });
            
            return {
                totalRutas,
                rutasPorUbicacion,
                fechaConsulta: new Date()
            };
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
}

const rutaService = new RutaService();
export default rutaService;