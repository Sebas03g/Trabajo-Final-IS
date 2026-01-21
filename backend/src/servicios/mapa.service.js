const { PrismaClient } = require('@prisma/client');
const Mapa = require('../modelos/Mapa');

class MapaService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async crearMapa(datos) {
        try {
            // Validar campos obligatorios
            if (!datos.name || !datos.url || !datos.points) {
                throw new Error('Faltan campos requeridos: name, url, points');
            }
            
            // Validar que la URL sea válida
            try {
                new URL(datos.url);
            } catch (error) {
                throw new Error('URL no válida');
            }
            
            // Validar que los puntos formen un polígono válido
            if (!Array.isArray(datos.points) || datos.points.length < 3) {
                throw new Error('El mapa debe tener al menos 3 puntos para formar un polígono');
            }
            
            const mapaData = await this.prisma.mapa.create({
                data: {
                    name: datos.name,
                    url: datos.url, // ← Agregar aquí
                    points: datos.points
                }
            });
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            throw new Error(`Error al crear mapa: ${error.message}`);
        }
    }

    async obtenerMapaPorId(id) {
        try {
            const mapaData = await this.prisma.mapa.findUnique({
                where: { id: parseInt(id) }
            });
            
            if (!mapaData) {
                throw new Error('Mapa no encontrado');
            }
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            throw new Error(`Error al obtener mapa: ${error.message}`);
        }
    }

    async obtenerMapaPrincipal() {
        try {
            // Suponemos que el primer mapa es el principal
            const mapaData = await this.prisma.mapa.findFirst({
                orderBy: { id: 'asc' }
            });
            
            if (!mapaData) {
                throw new Error('No hay mapas configurados');
            }
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            throw new Error(`Error al obtener mapa principal: ${error.message}`);
        }
    }

    async obtenerTodosMapas() {
        try {
            const mapasData = await this.prisma.mapa.findMany({
                orderBy: { name: 'asc' }
            });
            
            return mapasData.map(mapa => Mapa.fromPrisma(mapa));
        } catch (error) {
            throw new Error(`Error al obtener mapas: ${error.message}`);
        }
    }

    async actualizarMapa(id, datos) {
        try {
            // Si se incluye URL, validarla
            if (datos.url) {
                try {
                    new URL(datos.url);
                } catch (error) {
                    throw new Error('URL no válida');
                }
            }
            
            const mapaData = await this.prisma.mapa.update({
                where: { id: parseInt(id) },
                data: {
                    name: datos.name,
                    url: datos.url, // ← Agregar aquí si se proporciona
                    points: datos.points
                }
            });
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            throw new Error(`Error al actualizar mapa: ${error.message}`);
        }
    }

    async eliminarMapa(id) {
        try {
            const mapaData = await this.prisma.mapa.delete({
                where: { id: parseInt(id) }
            });
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            throw new Error(`Error al eliminar mapa: ${error.message}`);
        }
    }

    async validarUbicacionEnMapa(idMapa, lat, lng) {
        try {
            const mapa = await this.obtenerMapaPorId(idMapa);
            return mapa.esPuntoValido(lng, lat); // Nota: x=lng, y=lat
        } catch (error) {
            throw new Error(`Error al validar ubicación: ${error.message}`);
        }
    }

    async obtenerCentroMapa(idMapa) {
        try {
            const mapa = await this.obtenerMapaPorId(idMapa);
            return mapa.getCentro();
        } catch (error) {
            throw new Error(`Error al obtener centro del mapa: ${error.message}`);
        }
    }

    async obtenerAreaMapa(idMapa) {
        try {
            const mapa = await this.obtenerMapaPorId(idMapa);
            return mapa.getArea();
        } catch (error) {
            throw new Error(`Error al obtener área del mapa: ${error.message}`);
        }
    }
}

module.exports = new MapaService();