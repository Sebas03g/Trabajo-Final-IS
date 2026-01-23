import { PrismaClient } from '@prisma/client';
import Mapa from '../modelos/Mapa.js';

// Crear instancia única de Prisma
const prisma = new PrismaClient();

class MapaService {
    async crearMapa(datos) {
        try {
            // Validar campos obligatorios
            if (!datos.name || !datos.url) {
                throw new Error('Faltan campos requeridos: name, url, points');
            }
            
            // Validar nombre (mínimo 3 caracteres)
            if (datos.name.trim().length < 3) {
                throw new Error('El nombre del mapa debe tener al menos 3 caracteres');
            }
            
            // Validar que la URL sea válida
            try {
                new URL(datos.url);
            } catch (error) {
                throw new Error('URL no válida. Formato esperado: http://ejemplo.com/imagen.jpg');
            }
            
            // Validar que los puntos formen un polígono válido
            if (datos.points && (!Array.isArray(datos.points) || datos.points.length < 3)) {
                throw new Error('El mapa debe tener al menos 3 puntos para formar un polígono');
            }

            if(datos.points){
                // Validar que cada punto tenga coordenadas válidas según el formato requerido
                for (let i = 0; i < datos.points.length; i++) {
                    const punto = datos.points[i];

                    console.log(punto);
                    
                    // Verificar formato requerido: {lat, lng, orden, x_img, y_img}
                    if (punto.lat === undefined || punto.lng === undefined) {
                        throw new Error(`Punto ${i + 1} inválido: debe tener propiedades lat y lng`);
                    }
                    
                    if (punto.x_img === undefined || punto.y_img === undefined) {
                        throw new Error(`Punto ${i + 1} inválido: debe tener propiedades x_img y y_img`);
                    }
                    
                    // Validar tipos de datos
                    if (isNaN(punto.lat) || isNaN(punto.lng)) {
                        throw new Error(`Punto ${i + 1} inválido: lat y lng deben ser números`);
                    }
                    
                    if (isNaN(punto.x_img) || isNaN(punto.y_img)) {
                        throw new Error(`Punto ${i + 1} inválido: x_img y y_img deben ser números`);
                    }
                    
                    // Orden es opcional, pero si existe debe ser número
                    if (punto.orden !== undefined && isNaN(punto.orden)) {
                        throw new Error(`Punto ${i + 1} inválido: orden debe ser un número`);
                    }
                }
            }
            
            
            const mapaData = await prisma.mapa.create({
                data: {
                    name: datos.name.trim(),
                    url: datos.url,
                    points: datos.points
                }
            });
            
            console.log(`🗺️ Mapa "${datos.name}" creado con ID: ${mapaData.id}`);
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            console.error('Error al crear mapa:', error);
            throw new Error(`Error al crear mapa: ${error.message}`);
        }
    }

    async obtenerMapaPorId(id) {
        try {
            const mapaData = await prisma.mapa.findUnique({
                where: { id: parseInt(id) }
            });
            
            if (!mapaData) {
                throw new Error(`Mapa con ID ${id} no encontrado`);
            }
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            console.error(`Error al obtener mapa ${id}:`, error);
            throw new Error(`Error al obtener mapa: ${error.message}`);
        }
    }

    async obtenerMapaPrincipal() {
        try {
            // Buscar mapa marcado como principal, o el primero
            const mapaData = await prisma.mapa.findFirst({
                where: { esPrincipal: true },
                orderBy: { id: 'asc' }
            }) || await prisma.mapa.findFirst({
                orderBy: { id: 'asc' }
            });
            
            if (!mapaData) {
                throw new Error('No hay mapas configurados en el sistema');
            }
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            console.error('Error al obtener mapa principal:', error);
            throw new Error(`Error al obtener mapa principal: ${error.message}`);
        }
    }

    async obtenerTodosMapas() {
        try {
            const mapasData = await prisma.mapa.findMany({
                orderBy: {
                    name: 'asc' 
                }
            });
            
            // Si tienes un método toJSON en el modelo
            return mapasData.map(mapa => mapa.toJSON ? mapa.toJSON() : mapa);
            
        } catch (error) {
            console.error('Error al obtener todos los mapas:', error);
            throw new Error(`Error al obtener mapas: ${error.message}`);
        }
    }

    async obtenerMapasActivos() {
        try {
            const mapasData = await prisma.mapa.findMany({
                where: { activo: true },
                orderBy: { name: 'asc' }
            });
            
            return mapasData.map(mapa => Mapa.fromPrisma(mapa));
        } catch (error) {
            console.error('Error al obtener mapas activos:', error);
            throw new Error(`Error al obtener mapas activos: ${error.message}`);
        }
    }

    async actualizarMapa(id, datos) {
        try {
            // Verificar que el mapa existe
            const mapaExistente = await prisma.mapa.findUnique({
                where: { id: parseInt(id) }
            });
            
            if (!mapaExistente) {
                throw new Error(`Mapa con ID ${id} no encontrado`);
            }
            
            const updateData = {};
            
            // Actualizar nombre si se proporciona
            if (datos.name !== undefined) {
                if (datos.name.trim().length < 3) {
                    throw new Error('El nombre del mapa debe tener al menos 3 caracteres');
                }
                updateData.name = datos.name.trim();
            }
            
            // Validar y actualizar URL si se proporciona
            if (datos.url !== undefined) {
                try {
                    new URL(datos.url);
                    updateData.url = datos.url;
                } catch (error) {
                    throw new Error('URL no válida. Formato esperado: http://ejemplo.com/imagen.jpg');
                }
            }
            
            // Validar y actualizar puntos si se proporcionan
            if (datos.points !== undefined) {
                if (!Array.isArray(datos.points) || datos.points.length < 3) {
                    throw new Error('El mapa debe tener al menos 3 puntos para formar un polígono');
                }
                
                // Validar puntos individualmente con el formato requerido
                for (let i = 0; i < datos.points.length; i++) {
                    const punto = datos.points[i];
                    
                    // Verificar formato requerido: {lat, lng, orden, x_img, y_img}
                    if (punto.lat === undefined || punto.lng === undefined) {
                        throw new Error(`Punto ${i + 1} inválido: debe tener propiedades lat y lng`);
                    }
                    
                    if (punto.x_img === undefined || punto.y_img === undefined) {
                        throw new Error(`Punto ${i + 1} inválido: debe tener propiedades x_img y y_img`);
                    }
                    
                    // Validar tipos de datos
                    if (isNaN(punto.lat) || isNaN(punto.lng)) {
                        throw new Error(`Punto ${i + 1} inválido: lat y lng deben ser números`);
                    }
                    
                    if (isNaN(punto.x_img) || isNaN(punto.y_img)) {
                        throw new Error(`Punto ${i + 1} inválido: x_img y y_img deben ser números`);
                    }
                    
                    // Orden es opcional, pero si existe debe ser número
                    if (punto.orden !== undefined && isNaN(punto.orden)) {
                        throw new Error(`Punto ${i + 1} inválido: orden debe ser un número`);
                    }
                }
                
                updateData.points = datos.points;
            }
            
            
            if (datos.activo !== undefined) {
                updateData.activo = Boolean(datos.activo);
            }
            
            if (datos.esPrincipal !== undefined) {
                updateData.esPrincipal = Boolean(datos.esPrincipal);
                
                // Si se marca como principal, quitar principal de otros
                if (datos.esPrincipal) {
                    await prisma.mapa.updateMany({
                        where: { 
                            id: { not: parseInt(id) },
                            esPrincipal: true 
                        },
                        data: { esPrincipal: false }
                    });
                }
            }
            
            const mapaData = await prisma.mapa.update({
                where: { id: parseInt(id) },
                data: updateData
            });
            
            console.log(`✏️ Mapa ${id} actualizado: "${mapaData.name}"`);
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            console.error(`Error al actualizar mapa ${id}:`, error);
            throw new Error(`Error al actualizar mapa: ${error.message}`);
        }
    }

    async eliminarMapa(id) {
        try {
            const mapaData = await prisma.mapa.delete({
                where: { id: parseInt(id) }
            });
            
            console.log(`🗑️ Mapa ${id} eliminado: "${mapaData.name}"`);
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            console.error(`Error al eliminar mapa ${id}:`, error);
            
            // Verificar si el error es por referencias
            if (error.code === 'P2003') {
                throw new Error('No se puede eliminar el mapa porque está siendo utilizado por otros registros');
            }
            
            throw new Error(`Error al eliminar mapa: ${error.message}`);
        }
    }

    async validarUbicacionEnMapa(idMapa, lat, lng) {
        try {
            const mapa = await this.obtenerMapaPorId(idMapa);
            const puntos = mapa.points || [];
            
            if (puntos.length < 3) {
                throw new Error('El mapa no tiene suficientes puntos para formar un polígono');
            }
            
            // Convertir lat/lng a x_img/y_img usando los puntos del mapa como referencia
            const x_img = this.convertirLatLngAXImg(lat, lng, puntos);
            const y_img = this.convertirLatLngAYImg(lat, lng, puntos);
            
            // Verificar si el punto (x_img, y_img) está dentro del polígono definido por los puntos del mapa
            return this.esPuntoEnPoligono(x_img, y_img, puntos);
        } catch (error) {
            console.error(`Error al validar ubicación en mapa ${idMapa}:`, error);
            throw new Error(`Error al validar ubicación: ${error.message}`);
        }
    }

    async obtenerCentroMapa(idMapa) {
        try {
            const mapa = await this.obtenerMapaPorId(idMapa);
            const puntos = mapa.points || [];
            
            if (puntos.length === 0) {
                return { lat: 0, lng: 0, x_img: 0, y_img: 0 };
            }
            
            // Calcular promedios de lat/lng y x_img/y_img
            const sumLat = puntos.reduce((sum, p) => sum + (p.lat || 0), 0);
            const sumLng = puntos.reduce((sum, p) => sum + (p.lng || 0), 0);
            const sumXImg = puntos.reduce((sum, p) => sum + (p.x_img || 0), 0);
            const sumYImg = puntos.reduce((sum, p) => sum + (p.y_img || 0), 0);
            
            return {
                lat: sumLat / puntos.length,
                lng: sumLng / puntos.length,
                x_img: sumXImg / puntos.length,
                y_img: sumYImg / puntos.length
            };
        } catch (error) {
            console.error(`Error al obtener centro del mapa ${idMapa}:`, error);
            throw new Error(`Error al obtener centro del mapa: ${error.message}`);
        }
    }

    async obtenerAreaMapa(idMapa) {
        try {
            const mapa = await this.obtenerMapaPorId(idMapa);
            const puntos = mapa.points || [];
            
            if (puntos.length < 3) {
                return {
                    area: 0,
                    mensaje: 'El mapa necesita al menos 3 puntos para calcular área'
                };
            }
            
            // Calcular área usando las coordenadas de imagen (x_img, y_img)
            let area = 0;
            for (let i = 0; i < puntos.length; i++) {
                const p1 = puntos[i];
                const p2 = puntos[(i + 1) % puntos.length];
                area += (p1.x_img * p2.y_img - p2.x_img * p1.y_img);
            }
            
            const areaAbsoluta = Math.abs(area) / 2;
            
            return {
                areaPixeles: areaAbsoluta.toFixed(2),
                mensaje: 'Área en píxeles cuadrados basada en coordenadas de imagen (x_img, y_img)'
            };
        } catch (error) {
            console.error(`Error al obtener área del mapa ${idMapa}:`, error);
            throw new Error(`Error al obtener área del mapa: ${error.message}`);
        }
    }

    async convertirCoordenadasMapa(idMapa, lat, lng) {
        try {
            const mapa = await this.obtenerMapaPorId(idMapa);
            const puntos = mapa.points || [];
            
            if (puntos.length === 0) {
                throw new Error('El mapa no tiene puntos de referencia');
            }
            
            // Encontrar los puntos más cercanos para interpolación
            const puntosCercanos = this.encontrarPuntosCercanos(lat, lng, puntos);
            
            // Interpolar para obtener x_img, y_img
            const x_img = this.interpolar(lat, lng, puntosCercanos, 'x_img');
            const y_img = this.interpolar(lat, lng, puntosCercanos, 'y_img');
            
            // Verificar si el punto está dentro del área del mapa
            const enMapa = this.esPuntoEnPoligono(x_img, y_img, puntos);
            
            return {
                x_img: x_img.toFixed(2),
                y_img: y_img.toFixed(2),
                lat: lat,
                lng: lng,
                enMapa: enMapa,
                puntosUsados: puntosCercanos.length
            };
        } catch (error) {
            console.error(`Error convirtiendo coordenadas para mapa ${idMapa}:`, error);
            throw new Error(`Error convirtiendo coordenadas: ${error.message}`);
        }
    }

    async convertirCoordenadasAGPS(idMapa, x_img, y_img) {
        try {
            const mapa = await this.obtenerMapaPorId(idMapa);
            const puntos = mapa.points || [];
            
            if (puntos.length === 0) {
                throw new Error('El mapa no tiene puntos de referencia');
            }
            
            // Encontrar los puntos más cercanos en espacio de imagen para interpolación
            const puntosCercanos = puntos.filter(p => 
                Math.abs(p.x_img - x_img) < 50 && Math.abs(p.y_img - y_img) < 50
            );
            
            if (puntosCercanos.length < 2) {
                // Si no hay puntos cercanos, usar el punto más cercano
                const puntoCercano = puntos.reduce((cercano, actual) => {
                    const distCercano = this.distanciaEuclidiana(x_img, y_img, cercano.x_img, cercano.y_img);
                    const distActual = this.distanciaEuclidiana(x_img, y_img, actual.x_img, actual.y_img);
                    return distActual < distCercano ? actual : cercano;
                });
                
                return {
                    lat: puntoCercano.lat,
                    lng: puntoCercano.lng,
                    x_img: x_img,
                    y_img: y_img,
                    metodo: 'punto_cercano_directo'
                };
            }
            
            // Interpolar para obtener lat, lng
            const lat = this.interpolarInversa(x_img, y_img, puntosCercanos, 'lat');
            const lng = this.interpolarInversa(x_img, y_img, puntosCercanos, 'lng');
            
            return {
                lat: lat.toFixed(6),
                lng: lng.toFixed(6),
                x_img: x_img,
                y_img: y_img,
                metodo: 'interpolacion_multiple',
                puntosUsados: puntosCercanos.length
            };
        } catch (error) {
            console.error(`Error convirtiendo coordenadas a GPS para mapa ${idMapa}:`, error);
            throw new Error(`Error convirtiendo coordenadas a GPS: ${error.message}`);
        }
    }

    async buscarMapaPorNombre(nombre) {
        try {
            const mapasData = await prisma.mapa.findMany({
                where: {
                    name: {
                        contains: nombre,
                        mode: 'insensitive'
                    }
                },
                orderBy: { name: 'asc' }
            });
            
            return mapasData.map(mapa => Mapa.fromPrisma(mapa));
        } catch (error) {
            console.error(`Error buscando mapas por nombre "${nombre}":`, error);
            throw new Error(`Error buscando mapas: ${error.message}`);
        }
    }

    async establecerComoPrincipal(idMapa) {
        try {
            // Quitar principal de todos los mapas
            await prisma.mapa.updateMany({
                where: { esPrincipal: true },
                data: { esPrincipal: false }
            });
            
            // Establecer el nuevo mapa como principal
            const mapaData = await prisma.mapa.update({
                where: { id: parseInt(idMapa) },
                data: { esPrincipal: true }
            });
            
            console.log(`🏆 Mapa "${mapaData.name}" establecido como principal`);
            
            return Mapa.fromPrisma(mapaData);
        } catch (error) {
            console.error(`Error estableciendo mapa ${idMapa} como principal:`, error);
            throw new Error(`Error estableciendo mapa como principal: ${error.message}`);
        }
    }

    async obtenerEstadisticas() {
        try {
            const totalMapas = await prisma.mapa.count();
            const mapasActivos = await prisma.mapa.count({ where: { activo: true } });
            
            // Obtener todos los mapas activos para análisis
            const todosMapas = await prisma.mapa.findMany({
                where: { activo: true }
            });
            
            let puntosTotales = 0;
            let mapasConPuntosCompletos = 0;
            
            todosMapas.forEach(mapaData => {
                const mapa = Mapa.fromPrisma(mapaData);
                const puntos = mapa.points || [];
                puntosTotales += puntos.length;
                
                // Verificar si todos los puntos tienen el formato completo
                const puntosCompletos = puntos.filter(p => 
                    p.lat !== undefined && p.lng !== undefined && 
                    p.x_img !== undefined && p.y_img !== undefined
                ).length;
                
                if (puntosCompletos === puntos.length && puntos.length > 0) {
                    mapasConPuntosCompletos++;
                }
            });
            
            return {
                total: totalMapas,
                activos: mapasActivos,
                mapasConPuntosCompletos: mapasConPuntosCompletos,
                porcentajeActivos: totalMapas > 0 ? (mapasActivos / totalMapas) * 100 : 0,
                puntosTotales: puntosTotales,
                promedioPuntosPorMapa: todosMapas.length > 0 ? (puntosTotales / todosMapas.length).toFixed(2) : 0,
                ultimaActualizacion: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas de mapas:', error);
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        }
    }

    // ===== MÉTODOS AUXILIARES =====

    convertirLatLngAXImg(lat, lng, puntosReferencia) {
        // Interpolación lineal simple basada en los puntos más cercanos
        const puntosCercanos = this.encontrarPuntosCercanos(lat, lng, puntosReferencia, 3);
        return this.interpolar(lat, lng, puntosCercanos, 'x_img');
    }

    convertirLatLngAYImg(lat, lng, puntosReferencia) {
        const puntosCercanos = this.encontrarPuntosCercanos(lat, lng, puntosReferencia, 3);
        return this.interpolar(lat, lng, puntosCercanos, 'y_img');
    }

    encontrarPuntosCercanos(lat, lng, puntos, limite = 3) {
        // Calcular distancias a todos los puntos
        const puntosConDistancia = puntos.map(punto => ({
            ...punto,
            distancia: this.calcularDistancia(lat, lng, punto.lat, punto.lng)
        }));
        
        // Ordenar por distancia y tomar los más cercanos
        return puntosConDistancia
            .sort((a, b) => a.distancia - b.distancia)
            .slice(0, Math.min(limite, puntos.length));
    }

    interpolar(lat, lng, puntosCercanos, propiedad) {
        if (puntosCercanos.length === 0) return 0;
        if (puntosCercanos.length === 1) return puntosCercanos[0][propiedad];
        
        // Interpolación ponderada por distancia inversa (IDW)
        let numerador = 0;
        let denominador = 0;
        
        for (const punto of puntosCercanos) {
            const peso = 1 / (punto.distancia + 0.0001); // Evitar división por cero
            numerador += peso * punto[propiedad];
            denominador += peso;
        }
        
        return denominador > 0 ? numerador / denominador : 0;
    }

    interpolarInversa(x_img, y_img, puntosCercanos, propiedad) {
        if (puntosCercanos.length === 0) return 0;
        if (puntosCercanos.length === 1) return puntosCercanos[0][propiedad];
        
        // Interpolación ponderada por distancia en espacio de imagen
        let numerador = 0;
        let denominador = 0;
        
        for (const punto of puntosCercanos) {
            const distancia = this.distanciaEuclidiana(x_img, y_img, punto.x_img, punto.y_img);
            const peso = 1 / (distancia + 0.0001); // Evitar división por cero
            numerador += peso * punto[propiedad];
            denominador += peso;
        }
        
        return denominador > 0 ? numerador / denominador : 0;
    }

    esPuntoEnPoligono(x_img, y_img, puntos) {
        // Algoritmo point-in-polygon (ray casting) usando coordenadas de imagen
        if (puntos.length < 3) return false;
        
        let dentro = false;
        for (let i = 0, j = puntos.length - 1; i < puntos.length; j = i++) {
            const xi = puntos[i].x_img;
            const yi = puntos[i].y_img;
            const xj = puntos[j].x_img;
            const yj = puntos[j].y_img;
            
            const intersecta = ((yi > y_img) !== (yj > y_img)) &&
                (x_img < (xj - xi) * (y_img - yi) / (yj - yi) + xi);
            
            if (intersecta) dentro = !dentro;
        }
        
        return dentro;
    }

    calcularDistancia(lat1, lon1, lat2, lon2) {
        // Fórmula de Haversine para distancia en metros
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    distanciaEuclidiana(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // Cerrar conexión Prisma
    async disconnect() {
        await prisma.$disconnect();
    }
}

// Exportar instancia única del servicio
const mapaService = new MapaService();
export default mapaService;