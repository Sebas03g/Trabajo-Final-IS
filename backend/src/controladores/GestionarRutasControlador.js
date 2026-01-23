import RutaService from '../servicios/ruta.service.js';
import MapaService from '../servicios/mapa.service.js';
import Ruta from '../modelos/Ruta.js';
import Mapa from '../modelos/Mapa.js';

export default class GestionarRutasControlador {
    /**
     * POST /rutas
     * Crear una nueva ruta
     * Si no se envía id_mapa, crea automáticamente un mapa con nombre y puntos
     */
    static async crearRuta(req, res) {
        try {
            console.log('🛣️ Creando nueva ruta...');
            console.log('Datos recibidos:', req.body);
            
            const { 
                name, 
                points, 
                beginning, 
                ending, 
                id_mapa,
                nombreMapa,
                urlMapa
            } = req.body;

            // Validar datos requeridos
            if (!name || !points || !beginning || !ending) {
                return res.status(400).json({
                    success: false,
                    error: 'Los campos name, points, beginning y ending son obligatorios'
                });
            }

            let mapaId = parseInt(id_mapa);
            let mapaCreado = null;

            // Si no se envió id_mapa, crear automáticamente un mapa
            if (!mapaId) {
                console.log('🌍 No se envió id_mapa, creando mapa automáticamente...');
                
                try {
                    // Crear nombre del mapa si no se proporciona
                    const nombreDelMapa = nombreMapa || 
                        `Mapa para ruta ${name} - ${beginning} a ${ending}`;
                    
                    // Crear URL del mapa si no se proporciona
                    const urlDelMapa = urlMapa || 
                        'https://ejemplo.com/mapa-campus-default.jpg';
                    
                    // Extraer puntos del mapa desde los puntos de la ruta
                    const puntosMapa = GestionarRutasControlador.extraerPuntosParaMapa(points);
                    
                    // Crear el mapa
                    const nuevoMapa = await MapaService.crearMapa({
                        name: nombreDelMapa,
                        url: urlDelMapa,
                        points: puntosMapa,
                        esPrincipal: false,
                        activo: true
                    });
                    
                    mapaId = nuevoMapa.id;
                    mapaCreado = nuevoMapa;
                    
                    console.log(`✅ Mapa creado automáticamente ID: ${mapaId} - "${nombreDelMapa}"`);
                    
                } catch (error) {
                    console.error('❌ Error creando mapa automático:', error);
                    return res.status(500).json({
                        success: false,
                        error: `Error al crear mapa automático: ${error.message}`
                    });
                }
            } else {
                // Verificar que el mapa exista
                try {
                    const mapaExistente = await MapaService.obtenerMapaPorId(mapaId);
                    console.log(`✅ Mapa existente ID: ${mapaId} - "${mapaExistente.name}"`);
                } catch (error) {
                    return res.status(404).json({
                        success: false,
                        error: `El mapa con ID ${mapaId} no existe`
                    });
                }
            }

            // Validar que los puntos sean válidos según el nuevo formato
            const puntosValidos = GestionarRutasControlador.validarPuntosRuta(points);
            if (!puntosValidos.valido) {
                return res.status(400).json({
                    success: false,
                    error: puntosValidos.error
                });
            }

            // Crear la ruta
            const rutaData = {
                name: name.trim(),
                points: points,
                beginning: beginning.toUpperCase(),
                ending: ending.toUpperCase(),
                id_mapa: mapaId
            };

            const nuevaRuta = await RutaService.crearRuta(rutaData);

            console.log(nuevaRuta)
            
            // Preparar respuesta
            const respuesta = {
                success: true,
                message: `Ruta "${name}" creada exitosamente`,
                data: {
                    ruta: nuevaRuta,
                    mapa: mapaCreado ? mapaCreado : null,
                    mapaCreadoAutomaticamente: !!mapaCreado
                }
            };
            
            // Si se creó un mapa automáticamente, agregar mensaje adicional
            if (mapaCreado) {
                respuesta.message += ` y se creó automáticamente el mapa "${mapaCreado.name}"`;
            }
            
            res.status(201).json(respuesta);
            
            console.log(`✅ Ruta creada ID: ${nuevaRuta.id} - "${name}"`);
            
        } catch (error) {
            console.error('❌ Error creando ruta:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al crear la ruta'
            });
        }
    }

    /**
     * GET /rutas
     * Obtener todas las rutas
     */
    static async obtenerTodasRutas(req, res) {
        try {
            console.log('📋 Obteniendo todas las rutas...');
            
            const rutas = await RutaService.obtenerTodasRutas();

            return res.json({
                success: true,
                data: rutas,
                count: rutas.length
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo rutas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener las rutas'
            });
        }
    }

    /**
     * GET /rutas/:id
     * Obtener una ruta por ID
     */
    static async obtenerRutaPorId(req, res) {
        try {
            const { id } = req.params;
            console.log(`📋 Obteniendo ruta ID: ${id}...`);
            
            const ruta = await RutaService.obtenerRutaPorId(id);
            
            // Obtener información del mapa asociado
            let mapa = null;
            if (ruta.id_mapa) {
                try {
                    mapa = await MapaService.obtenerMapaPorId(ruta.id_mapa);
                } catch (error) {
                    console.warn(`⚠️ Mapa ${ruta.id_mapa} no encontrado para ruta ${id}`);
                }
            }
            
            const puntosRuta = ruta.getPuntosDeRuta();
            
            const rutaEnriquecida = {
                ...ruta.toJSON(),
                mapa: mapa ? mapa.toJSON() : null,
                esValida: ruta.esRutaValida(),
                distanciaEstimada: GestionarRutasControlador.calcularDistanciaRuta(puntosRuta),
                duracionEstimada: GestionarRutasControlador.estimarDuracionRuta(puntosRuta),
                puntosDeRuta: puntosRuta,
                formatoPuntos: 'lat, lng, orden, x_img, y_img',
                puntosValidos: puntosRuta.every(p => 
                    p.lat !== undefined && p.lng !== undefined && 
                    p.x_img !== undefined && p.y_img !== undefined
                )
            };
            
            res.json({
                success: true,
                data: rutaEnriquecida
            });
            
        } catch (error) {
            console.error(`❌ Error obteniendo ruta ${req.params.id}:`, error);
            
            if (error.message.includes('no encontrada')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error al obtener la ruta'
            });
        }
    }

    /**
     * PUT /rutas/:id
     * Actualizar una ruta existente
     */
    static async actualizarRuta(req, res) {
        try {
            const { id } = req.params;
            console.log(`✏️ Actualizando ruta ID: ${id}...`);
            console.log('Datos actualización:', req.body);
            
            const { 
                name, 
                points, 
                beginning, 
                ending, 
                id_mapa 
            } = req.body;

            // Validar que la ruta exista
            const rutaExistente = await RutaService.obtenerRutaPorId(id);
            
            // Si se van a actualizar puntos, validarlos
            if (points !== undefined) {
                const puntosValidos = GestionarRutasControlador.validarPuntosRuta(points);
                if (!puntosValidos.valido) {
                    return res.status(400).json({
                        success: false,
                        error: puntosValidos.error
                    });
                }
            }

            // Si se cambia el mapa, verificar que exista
            if (id_mapa !== undefined && parseInt(id_mapa) !== rutaExistente.id_mapa) {
                try {
                    await MapaService.obtenerMapaPorId(parseInt(id_mapa));
                } catch (error) {
                    return res.status(404).json({
                        success: false,
                        error: `El mapa con ID ${id_mapa} no existe`
                    });
                }
            }

            // Preparar datos de actualización
            const datosActualizacion = {};
            if (name !== undefined) datosActualizacion.name = name.trim();
            if (points !== undefined) datosActualizacion.points = points;
            if (beginning !== undefined) datosActualizacion.beginning = beginning.toUpperCase();
            if (ending !== undefined) datosActualizacion.ending = ending.toUpperCase();
            if (id_mapa !== undefined) datosActualizacion.id_mapa = parseInt(id_mapa);

            const rutaActualizada = await RutaService.actualizarRuta(id, datosActualizacion);
            
            res.json({
                success: true,
                message: `Ruta "${rutaActualizada.name}" actualizada exitosamente`,
                data: {
                    ruta: rutaActualizada.toJSON(),
                    cambios: Object.keys(datosActualizacion)
                }
            });
            
            console.log(`✅ Ruta ${id} actualizada: "${rutaActualizada.name}"`);
            
        } catch (error) {
            console.error(`❌ Error actualizando ruta ${req.params.id}:`, error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al actualizar la ruta'
            });
        }
    }

    /**
     * DELETE /rutas/:id
     * Eliminar una ruta
     */
    static async eliminarRuta(req, res) {
        try {
            const { id } = req.params;
            console.log(`🗑️ Eliminando ruta ID: ${id}...`);
            
            const rutaEliminada = await RutaService.eliminarRuta(id);
            
            res.json({
                success: true,
                message: `Ruta "${rutaEliminada.name}" eliminada exitosamente`,
                data: {
                    ruta: rutaEliminada.toJSON(),
                    fechaEliminacion: new Date().toISOString()
                }
            });
            
            console.log(`✅ Ruta ${id} eliminada: "${rutaEliminada.name}"`);
            
        } catch (error) {
            console.error(`❌ Error eliminando ruta ${req.params.id}:`, error);
            
            if (error.message.includes('No se puede eliminar')) {
                return res.status(409).json({
                    success: false,
                    error: error.message
                });
            }
            
            if (error.message.includes('no encontrada')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error al eliminar la ruta'
            });
        }
    }

    /**
     * GET /rutas/buscar
     * Buscar rutas por ubicaciones
     */
    static async buscarRutas(req, res) {
        try {
            console.log('🔍 Buscando rutas...');
            console.log('Query params:', req.query);
            
            const { beginning, ending } = req.query;
            
            if (!beginning && !ending) {
                return res.status(400).json({
                    success: false,
                    error: 'Debe proporcionar al menos un criterio de búsqueda (beginning o ending)'
                });
            }
            
            const rutas = await RutaService.buscarRutasPorUbicacion(beginning, ending);
            
            res.json({
                success: true,
                data: {
                    rutas: rutas.map(ruta => ({
                        ...ruta.toJSON(),
                        puntos: ruta.getPuntosDeRuta().length,
                        formatoPuntos: 'lat, lng, orden, x_img, y_img'
                    })),
                    criterios: { beginning, ending },
                    total: rutas.length
                }
            });
            
        } catch (error) {
            console.error('❌ Error buscando rutas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al buscar rutas'
            });
        }
    }

    /**
     * GET /rutas/recientes
     * Obtener rutas recientemente creadas
     */
    static async obtenerRutasRecientes(req, res) {
        try {
            const { limite = 10 } = req.query;
            console.log(`📜 Obteniendo ${limite} rutas recientes...`);
            
            const rutas = await RutaService.obtenerRutasRecientes(parseInt(limite));
            
            res.json({
                success: true,
                data: {
                    rutas: rutas.map(ruta => ({
                        ...ruta.toJSON(),
                        puntos: ruta.getPuntosDeRuta().length,
                        formato: 'lat, lng, orden, x_img, y_img'
                    })),
                    limite: parseInt(limite),
                    obtenidas: rutas.length
                }
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo rutas recientes:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener rutas recientes'
            });
        }
    }

    /**
     * GET /rutas/estadisticas
     * Obtener estadísticas de las rutas
     */
    static async obtenerEstadisticas(req, res) {
        try {
            console.log('📊 Obteniendo estadísticas de rutas...');
            
            const estadisticas = await RutaService.obtenerEstadisticasRutas();
            const mapas = await MapaService.obtenerTodosMapas();
            
            // Agregar información adicional
            const rutasPorDestino = {};
            if (estadisticas.rutasPorUbicacion) {
                estadisticas.rutasPorUbicacion.forEach(item => {
                    rutasPorDestino[item.beginning] = item._count;
                });
            }
            
            // Calcular rutas por mapa
            const rutasPorMapa = {};
            const mapasSinRutas = [];
            
            for (const mapa of mapas) {
                try {
                    // Buscar rutas que usen este mapa
                    const rutasDelMapa = await RutaService.obtenerTodasRutas();
                    const rutasFiltradas = rutasDelMapa.filter(r => r.id_mapa === mapa.id);
                    
                    rutasPorMapa[mapa.name] = rutasFiltradas.length;
                    
                    if (rutasFiltradas.length === 0) {
                        mapasSinRutas.push(mapa.name);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error procesando mapa ${mapa.name}:`, error);
                }
            }
            
            res.json({
                success: true,
                data: {
                    ...estadisticas,
                    rutasPorDestino,
                    rutasPorMapa,
                    mapasSinRutas,
                    porcentajeMapasConRutas: mapas.length > 0 ? 
                        ((mapas.length - mapasSinRutas.length) / mapas.length * 100).toFixed(2) : 0,
                    formatoPuntos: 'lat, lng, orden, x_img, y_img'
                }
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas'
            });
        }
    }

    /**
     * POST /rutas/validar
     * Validar datos de una ruta antes de crearla o actualizarla
     */
    static async validarRuta(req, res) {
        try {
            console.log('🔍 Validando datos de ruta...');
            
            const { name, points, beginning, ending } = req.body;
            
            const errores = [];
            const advertencias = [];
            
            // Validar nombre
            if (!name || name.trim().length < 2) {
                errores.push('El nombre debe tener al menos 2 caracteres');
            }
            
            // Validar puntos con el nuevo formato
            const puntosValidos = GestionarRutasControlador.validarPuntosRuta(points);
            if (!puntosValidos.valido) {
                errores.push(puntosValidos.error);
            } else {
                if (puntosValidos.puntos.length < 2) {
                    errores.push('La ruta debe tener al menos 2 puntos');
                }
                
                // Advertencia si hay muchos puntos
                if (puntosValidos.puntos.length > 50) {
                    advertencias.push('La ruta tiene muchos puntos, puede afectar el rendimiento');
                }
                
                // Verificar que todos los puntos tengan el formato completo
                const puntosCompletos = puntosValidos.puntos.filter(p => 
                    p.lat !== undefined && p.lng !== undefined && 
                    p.x_img !== undefined && p.y_img !== undefined
                ).length;
                
                if (puntosCompletos < puntosValidos.puntos.length) {
                    advertencias.push(`Solo ${puntosCompletos} de ${puntosValidos.puntos.length} puntos tienen formato completo (lat, lng, x_img, y_img)`);
                }
            }
            
            // Validar ubicaciones
            if (!beginning) {
                errores.push('El punto de inicio (beginning) es obligatorio');
            }
            
            if (!ending) {
                errores.push('El punto de destino (ending) es obligatorio');
            }
            
            if (beginning === ending) {
                advertencias.push('El inicio y destino son iguales');
            }
            
            if (errores.length > 0) {
                res.status(400).json({
                    success: false,
                    valid: false,
                    errors: errores,
                    warnings: advertencias
                });
            } else {
                res.json({
                    success: true,
                    valid: true,
                    warnings: advertencias,
                    message: 'Datos de ruta válidos',
                    resumen: {
                        nombre: name,
                        puntos: puntosValidos.puntos.length,
                        inicio: beginning,
                        destino: ending,
                        formato: 'lat, lng, orden, x_img, y_img'
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Error validando ruta:', error);
            res.status(500).json({
                success: false,
                error: 'Error al validar datos de la ruta'
            });
        }
    }

    /**
     * POST /rutas/clonar/:id
     * Clonar una ruta existente
     */
    static async clonarRuta(req, res) {
        try {
            const { id } = req.params;
            console.log(`🌀 Clonando ruta ID: ${id}...`);
            
            const { nuevoNombre, nuevoMapaId } = req.body;
            
            // Obtener ruta original
            const rutaOriginal = await RutaService.obtenerRutaPorId(id);
            
            // Generar nombre para la clonación
            const nombreClon = nuevoNombre || `${rutaOriginal.name} - Copia`;
            
            // Obtener puntos de la ruta original
            const puntosOriginal = rutaOriginal.getPuntosDeRuta();
            
            // Crear datos para la nueva ruta
            const datosRutaClon = {
                name: nombreClon,
                points: puntosOriginal,
                beginning: rutaOriginal.beginning,
                ending: rutaOriginal.ending,
                id_mapa: parseInt(nuevoMapaId) || rutaOriginal.id_mapa
            };
            
            // Crear la ruta clonada
            const rutaClonada = await RutaService.crearRuta(datosRutaClon);
            
            res.status(201).json({
                success: true,
                message: `Ruta "${rutaOriginal.name}" clonada exitosamente como "${nombreClon}"`,
                data: {
                    original: {
                        id: rutaOriginal.id,
                        name: rutaOriginal.name,
                        puntos: puntosOriginal.length,
                        formato: 'lat, lng, orden, x_img, y_img'
                    },
                    clon: {
                        ...rutaClonada.toJSON(),
                        puntos: puntosOriginal.length,
                        formato: 'lat, lng, orden, x_img, y_img'
                    }
                }
            });
            
            console.log(`✅ Ruta clonada ID: ${rutaClonada.id} - "${nombreClon}"`);
            
        } catch (error) {
            console.error(`❌ Error clonando ruta ${req.params.id}:`, error);
            res.status(500).json({
                success: false,
                error: 'Error al clonar la ruta'
            });
        }
    }

    // ===== MÉTODOS PRIVADOS DE UTILIDAD =====

    /**
     * Extraer puntos para crear un mapa a partir de los puntos de una ruta
     */
    static extraerPuntosParaMapa(puntosRuta) {
        if (!Array.isArray(puntosRuta) || puntosRuta.length === 0) {
            // Puntos por defecto si no hay puntos válidos - usando x_img, y_img como coordenadas del polígono
            return [
                { lat: 19.4326, lng: -99.1332, orden: 1, x_img: 0, y_img: 0 },
                { lat: 19.4327, lng: -99.1331, orden: 2, x_img: 100, y_img: 0 },
                { lat: 19.4328, lng: -99.1330, orden: 3, x_img: 100, y_img: 100 },
                { lat: 19.4325, lng: -99.1333, orden: 4, x_img: 0, y_img: 100 }
            ];
        }
        
        // Calcular bounding box de los puntos de la ruta usando x_img, y_img
        const xs = puntosRuta.map(p => p.x_img || 0);
        const ys = puntosRuta.map(p => p.y_img || 0);
        
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        // Agregar margen del 20% alrededor de los puntos
        const margenX = (maxX - minX) * 0.2;
        const margenY = (maxY - minY) * 0.2;
        
        // Crear rectángulo que contenga todos los puntos con margen
        // Para lat/lng, usamos valores promedio o referenciales
        const latPromedio = puntosRuta.reduce((sum, p) => sum + (p.lat || 0), 0) / puntosRuta.length;
        const lngPromedio = puntosRuta.reduce((sum, p) => sum + (p.lng || 0), 0) / puntosRuta.length;
        
        return [
            { 
                lat: latPromedio - 0.001, 
                lng: lngPromedio - 0.001, 
                orden: 1, 
                x_img: minX - margenX, 
                y_img: minY - margenY 
            },
            { 
                lat: latPromedio - 0.001, 
                lng: lngPromedio + 0.001, 
                orden: 2, 
                x_img: maxX + margenX, 
                y_img: minY - margenY 
            },
            { 
                lat: latPromedio + 0.001, 
                lng: lngPromedio + 0.001, 
                orden: 3, 
                x_img: maxX + margenX, 
                y_img: maxY + margenY 
            },
            { 
                lat: latPromedio + 0.001, 
                lng: lngPromedio - 0.001, 
                orden: 4, 
                x_img: minX - margenX, 
                y_img: maxY + margenY 
            }
        ];
    }

    /**
     * Validar puntos de una ruta según el nuevo formato
     */
    static validarPuntosRuta(points) {
        try {
            // Parsear puntos si es string
            let puntos = points;
            if (typeof puntos === 'string') {
                puntos = JSON.parse(puntos);
            }
            
            if (!Array.isArray(puntos)) {
                return { 
                    valido: false, 
                    error: 'Los puntos deben ser un array',
                    puntos: []
                };
            }
            
            if (puntos.length < 2) {
                return { 
                    valido: false, 
                    error: 'La ruta debe tener al menos 2 puntos',
                    puntos: puntos 
                };
            }
            
            // Validar cada punto según el formato: {lat, lng, orden, x_img, y_img}
            for (let i = 0; i < puntos.length; i++) {
                const punto = puntos[i];
                
                if (punto === null || typeof punto !== 'object') {
                    return { 
                        valido: false, 
                        error: `Punto ${i + 1} no es un objeto válido`,
                        puntos: puntos 
                    };
                }
                
                // Verificar campos requeridos según el nuevo formato
                if (punto.lat === undefined || punto.lng === undefined) {
                    return { 
                        valido: false, 
                        error: `Punto ${i + 1} debe tener propiedades lat y lng`,
                        puntos: puntos 
                    };
                }
                
                if (punto.x_img === undefined || punto.y_img === undefined) {
                    return { 
                        valido: false, 
                        error: `Punto ${i + 1} debe tener propiedades x_img y y_img`,
                        puntos: puntos 
                    };
                }
                
                // Validar tipos de datos
                if (isNaN(punto.lat) || isNaN(punto.lng)) {
                    return { 
                        valido: false, 
                        error: `Punto ${i + 1}: lat y lng deben ser números`,
                        puntos: puntos 
                    };
                }
                
                if (isNaN(punto.x_img) || isNaN(punto.y_img)) {
                    return { 
                        valido: false, 
                        error: `Punto ${i + 1}: x_img y y_img deben ser números`,
                        puntos: puntos 
                    };
                }
                
                // Orden es opcional, pero si existe debe ser número
                if (punto.orden !== undefined && isNaN(punto.orden)) {
                    return { 
                        valido: false, 
                        error: `Punto ${i + 1}: orden debe ser un número`,
                        puntos: puntos 
                    };
                }
            }
            
            return { 
                valido: true, 
                error: null,
                puntos: puntos 
            };
            
        } catch (error) {
            return { 
                valido: false, 
                error: `Error al validar puntos: ${error.message}`,
                puntos: [] 
            };
        }
    }

    /**
     * Calcular distancia estimada de una ruta
     */
    static calcularDistanciaRuta(puntos) {
        if (!Array.isArray(puntos) || puntos.length < 2) {
            return 0;
        }
        
        let distanciaTotal = 0;
        
        for (let i = 0; i < puntos.length - 1; i++) {
            const p1 = puntos[i];
            const p2 = puntos[i + 1];
            
            // Calcular distancia Euclidiana usando x_img, y_img (píxeles)
            const dx = p2.x_img - p1.x_img;
            const dy = p2.y_img - p1.y_img;
            distanciaTotal += Math.sqrt(dx * dx + dy * dy);
        }
        
        // Convertir a metros aproximados (asumiendo escala)
        return Math.round(distanciaTotal * 0.1); // 0.1 metros por píxel
    }

    /**
     * Estimar duración de una ruta
     */
    static estimarDuracionRuta(puntos) {
        const distancia = GestionarRutasControlador.calcularDistanciaRuta(puntos);
        // Asumiendo velocidad de 1 m/s (3.6 km/h)
        const duracionSegundos = distancia;
        const minutos = Math.floor(duracionSegundos / 60);
        const segundos = Math.round(duracionSegundos % 60);
        
        return `${minutos}:${segundos.toString().padStart(2, '0')} min`;
    }
}