import MapaService from '../servicios/mapa.service.js';
import RutaService from '../servicios/ruta.service.js';
import Mapa from '../modelos/Mapa.js';
import Ruta from '../modelos/Ruta.js';

export default class ActualizarMapaDelCampusControlador {
    /**
     * GET /mapa
     * Obtener información del mapa actual del campus
     */
    static async obtenerMapaActual(req, res) {
        try {
            console.log('📋 Obteniendo mapa actual del campus...');
            
            const mapaPrincipal = await MapaService.obtenerMapaPrincipal();
            
            res.json({
                success: true,
                data: {
                    mapa: mapaPrincipal.toJSON(),
                    fecha: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo mapa actual:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al obtener el mapa del campus'
            });
        }
    }

        /**
     * POST /mapa/crear
     * Crear un nuevo mapa con el formato específico
     */
    static async crearMapa(req, res) {
        try {
            console.log('➕ Creando nuevo mapa...');
            console.log('Datos recibidos:', req.body);
            
            const { 
                name, 
                puntos, 
                url 
            } = req.body;

            // Validar datos requeridos usando los nombres correctos del JSON

            console.log(name);
            console.log(url);

            if (!name || !url) {
                return res.status(400).json({
                    success: false,
                    error: 'Los campos name y url son obligatorios'
                });
            }

            // Validar nombre (mínimo 3 caracteres)
            if (name.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre del mapa debe tener al menos 3 caracteres'
                });
            }

            // Validar que puntos sea un array
            if(puntos){
                if (!Array.isArray(puntos)) {
                    return res.status(400).json({
                        success: false,
                        error: 'El campo puntos debe ser un array'
                    });
                }

                // Validar que haya al menos 3 puntos para formar un polígono
                if (puntos.length < 3) {
                    return res.status(400).json({
                        success: false,
                        error: 'Se requieren al menos 3 puntos para formar un polígono'
                    });
                }

                // Validar cada punto según el formato: {lat, lng, orden, x_img, y_img}
                for (let i = 0; i < puntos.length; i++) {
                    const punto = puntos[i];
                    
                    // Verificar que sea un objeto
                    if (!punto || typeof punto !== 'object') {
                        return res.status(400).json({
                            success: false,
                            error: `Punto ${i + 1} no es un objeto válido`
                        });
                    }

                    // Verificar campos requeridos
                    if (punto.lat === undefined || punto.lng === undefined) {
                        return res.status(400).json({
                            success: false,
                            error: `Punto ${i + 1}: faltan propiedades lat y lng`
                        });
                    }
                    
                    if (punto.x_img === undefined || punto.y_img === undefined) {
                        return res.status(400).json({
                            success: false,
                            error: `Punto ${i + 1}: faltan propiedades x_img y y_img`
                        });
                    }

                    // Validar tipos de datos numéricos
                    if (isNaN(punto.lat) || isNaN(punto.lng)) {
                        return res.status(400).json({
                            success: false,
                            error: `Punto ${i + 1}: lat y lng deben ser números`
                        });
                    }
                    
                    if (isNaN(punto.x_img) || isNaN(punto.y_img)) {
                        return res.status(400).json({
                            success: false,
                            error: `Punto ${i + 1}: x_img y y_img deben ser números`
                        });
                    }

                    // Orden es opcional, pero si existe debe ser número
                    if (punto.orden !== undefined && isNaN(punto.orden)) {
                        return res.status(400).json({
                            success: false,
                            error: `Punto ${i + 1}: orden debe ser un número`
                        });
                    }
                }
            }
            

            // Verificar si ya existe un mapa con ese nombre
            const mapasExistentes = await MapaService.buscarMapaPorNombre(name);
            if (mapasExistentes.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: `Ya existe un mapa con el nombre "${name}"`,
                    mapaExistente: {
                        id: mapasExistentes[0].id,
                        name: mapasExistentes[0].name
                    }
                });
            }

            // Preparar datos para crear el mapa
            const datosMapa = {
                name: name.trim(),
                url: url,
                points: puntos,  // Usamos el array de puntos directamente
            };

            console.log(datosMapa);

            // Crear el mapa usando el servicio
            const nuevoMapa = await MapaService.crearMapa(datosMapa);

            // Convertir a JSON si es necesario
            const mapaJSON = typeof nuevoMapa.toJSON === 'function' ? 
                nuevoMapa.toJSON() : {
                    id: nuevoMapa.id,
                    name: nuevoMapa.name,
                    url: nuevoMapa.url,
                    points: nuevoMapa.points,
                    createdAt: nuevoMapa.createdAt
                };


            res.status(201).json({
                success: true,
                message: `Mapa "${name}" creado exitosamente`,
                data: {
                    mapa: mapaJSON,
                    detalles: {
                        formatoAceptado: true,
                        camposRecibidos: Object.keys(req.body),
                        puntosRecibidos: puntos ? puntos.length : 0
                    }
                }
            });

            console.log(`✅ Mapa creado ID: ${mapaJSON.id} - "${name}" con ${puntos.length} puntos`);

        } catch (error) {
            console.error('❌ Error creando mapa:', error);
            
            // Manejar errores específicos
            let statusCode = 500;
            let errorMessage = error.message || 'Error al crear el mapa';
            
            if (error.message.includes('ya existe') || error.message.includes('Ya existe')) {
                statusCode = 409;
            } else if (error.message.includes('URL no válida') || error.message.includes('nombre del mapa')) {
                statusCode = 400;
            }
            
            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }

        /**
     * GET /mapa/todos
     * Obtener todos los mapas disponibles
     */
    static async obtenerTodosMapas(req, res) {
        try {
            console.log('🗺️ Obteniendo todos los mapas...');
            
            const todosMapas = await MapaService.obtenerTodosMapas();
            
            console.log(`✅ Se encontraron ${todosMapas.length} mapas`);
            
            // ENVIAR la respuesta con res.json()
            return res.json({
                success: true,
                data: todosMapas,
                count: todosMapas.length
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo todos los mapas:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al obtener los mapas'
            });
        }
    }

    /**
     * GET /mapa/:id/detalle
     * Obtener detalles completos de un mapa específico
     */
    static async obtenerDetalleMapa(req, res) {
        try {
            const { id } = req.params;
            console.log(`📋 Obteniendo detalle del mapa ID: ${id}...`);
            
            const mapa = await MapaService.obtenerMapaPorId(id);
            
            // Convertir mapa a JSON si es necesario
            const mapaJSON = typeof mapa.toJSON === 'function' ? mapa.toJSON() : {
                id: mapa.id,
                name: mapa.name,
                url: mapa.url,
                points: mapa.points,
                esPrincipal: mapa.esPrincipal || false,
                activo: mapa.activo !== undefined ? mapa.activo : true,
                descripcion: mapa.descripcion || null,
                createdAt: mapa.createdAt,
                updatedAt: mapa.updatedAt
            };
            
            // Obtener rutas asociadas a este mapa
            let rutasAsociadas = [];
            try {
                const todasRutas = await RutaService.obtenerTodasRutas();
                rutasAsociadas = todasRutas
                    .filter(ruta => {
                        const rutaJSON = typeof ruta.toJSON === 'function' ? ruta.toJSON() : ruta;
                        return rutaJSON.id_mapa === parseInt(id);
                    })
                    .map(ruta => {
                        const rutaJSON = typeof ruta.toJSON === 'function' ? ruta.toJSON() : ruta;
                        const puntos = Array.isArray(rutaJSON.points) ? rutaJSON.points : 
                                     (typeof rutaJSON.points === 'string' ? JSON.parse(rutaJSON.points) : []);
                        
                        return {
                            id: rutaJSON.id,
                            name: rutaJSON.name,
                            beginning: rutaJSON.beginning,
                            ending: rutaJSON.ending,
                            puntos: puntos.length,
                            createdAt: rutaJSON.createdAt
                        };
                    });
            } catch (error) {
                console.warn('⚠️ Error obteniendo rutas asociadas:', error.message);
            }
            
            // Calcular estadísticas detalladas
            const puntos = Array.isArray(mapaJSON.points) ? mapaJSON.points : 
                          (typeof mapaJSON.points === 'string' ? JSON.parse(mapaJSON.points) : []);
            
            const puntosAnalizados = puntos.map((punto, index) => ({
                numero: index + 1,
                tieneLatLng: !!(punto.lat && punto.lng),
                tieneImgCoords: !!(punto.x_img && punto.y_img),
                tieneOrden: punto.orden !== undefined,
                lat: punto.lat || 'No definido',
                lng: punto.lng || 'No definido',
                x_img: punto.x_img || 'No definido',
                y_img: punto.y_img || 'No definido',
                orden: punto.orden || 'No definido'
            }));
            
            // Calcular centro y área
            let centro = { x_img: 0, y_img: 0, lat: 0, lng: 0 };
            let area = 0;
            
            if (puntos.length >= 3) {
                // Centro
                const sumXImg = puntos.reduce((sum, p) => sum + (p.x_img || 0), 0);
                const sumYImg = puntos.reduce((sum, p) => sum + (p.y_img || 0), 0);
                const sumLat = puntos.reduce((sum, p) => sum + (p.lat || 0), 0);
                const sumLng = puntos.reduce((sum, p) => sum + (p.lng || 0), 0);
                
                centro = {
                    x_img: sumXImg / puntos.length,
                    y_img: sumYImg / puntos.length,
                    lat: sumLat / puntos.length,
                    lng: sumLng / puntos.length
                };
                
                // Área (solo si hay coordenadas de imagen)
                const puntosConImg = puntos.filter(p => p.x_img !== undefined && p.y_img !== undefined);
                if (puntosConImg.length >= 3) {
                    let areaTemp = 0;
                    for (let i = 0; i < puntosConImg.length; i++) {
                        const p1 = puntosConImg[i];
                        const p2 = puntosConImg[(i + 1) % puntosConImg.length];
                        areaTemp += (p1.x_img * p2.y_img - p2.x_img * p1.y_img);
                    }
                    area = Math.abs(areaTemp) / 2;
                }
            }
            
            // Información del polígono
            const infoPoligono = {
                esValido: puntos.length >= 3,
                tipo: puntos.length === 3 ? 'Triángulo' : 
                      puntos.length === 4 ? 'Cuadrilátero' : 
                      `Polígono de ${puntos.length} lados`,
                vertices: puntos.length,
                perimetro: 0 // Se podría calcular si es necesario
            };
            
            // Validar puntos
            const puntosValidos = puntos.filter(p => 
                p.lat !== undefined && p.lng !== undefined && 
                p.x_img !== undefined && p.y_img !== undefined
            );
            
            const respuesta = {
                success: true,
                data: {
                    mapa: mapaJSON,
                    estadisticas: {
                        general: {
                            totalPuntos: puntos.length,
                            puntosValidosCompletos: puntosValidos.length,
                            porcentajeValidez: puntos.length > 0 ? 
                                Math.round((puntosValidos.length / puntos.length) * 100) : 0,
                            rutasAsociadas: rutasAsociadas.length
                        },
                        coordenadas: {
                            conLatLng: puntos.filter(p => p.lat !== undefined && p.lng !== undefined).length,
                            conImgCoords: puntos.filter(p => p.x_img !== undefined && p.y_img !== undefined).length,
                            conOrden: puntos.filter(p => p.orden !== undefined).length
                        },
                        geometria: {
                            areaPixeles: area.toFixed(2),
                            centro: centro,
                            infoPoligono: infoPoligono
                        }
                    },
                    rutas: rutasAsociadas,
                    puntosAnalizados: puntosAnalizados,
                    formatoEsperado: {
                        descripcion: 'Cada punto debe tener: lat, lng, orden, x_img, y_img',
                        ejemplo: {
                            lat: 19.432608,
                            lng: -99.133209,
                            orden: 1,
                            x_img: 150,
                            y_img: 200
                        }
                    }
                }
            };
            
            res.json(respuesta);
            
        } catch (error) {
            console.error(`❌ Error obteniendo detalle del mapa ${req.params.id}:`, error);
            
            if (error.message.includes('no encontrado')) {
                return res.status(404).json({
                    success: false,
                    error: `Mapa con ID ${req.params.id} no encontrado`
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error al obtener detalle del mapa'
            });
        }
    }

    /**
     * POST /mapa/actualizar
     * Actualizar el mapa principal del campus
     */
    static async actualizarMapaPrincipal(req, res) {
        try {
            console.log('🔄 Actualizando mapa principal del campus...');
            console.log('Datos recibidos:', req.body);
            
            const { 
                nombre, 
                url, 
                puntos, 
                escala,
                descripcion,
                referenciaLat,
                referenciaLng,
                establecerComoPrincipal = true
            } = req.body;

            // Validar datos requeridos
            if (!nombre || !url || !puntos) {
                return res.status(400).json({
                    success: false,
                    error: 'Los campos nombre, url y puntos son obligatorios'
                });
            }

            // Verificar si ya existe un mapa con ese nombre
            const mapasExistentes = await MapaService.buscarMapaPorNombre(nombre);
            let mapaId = null;

            if (mapasExistentes.length > 0) {
                // Actualizar mapa existente
                const mapaExistente = mapasExistentes[0];
                console.log(`🔄 Actualizando mapa existente ID: ${mapaExistente.id}`);
                
                const datosActualizacion = {
                    name: nombre,
                    url: url,
                    points: puntos
                };
                
                if (escala !== undefined) datosActualizacion.escala = escala;
                if (descripcion !== undefined) datosActualizacion.descripcion = descripcion;
                if (referenciaLat !== undefined) datosActualizacion.referenciaLat = referenciaLat;
                if (referenciaLng !== undefined) datosActualizacion.referenciaLng = referenciaLng;
                
                const mapaActualizado = await MapaService.actualizarMapa(
                    mapaExistente.id, 
                    datosActualizacion
                );
                
                mapaId = mapaExistente.id;
                
                if (establecerComoPrincipal) {
                    await MapaService.establecerComoPrincipal(mapaExistente.id);
                }
                
                res.json({
                    success: true,
                    message: `Mapa "${nombre}" actualizado exitosamente`,
                    data: {
                        mapa: mapaActualizado.toJSON(),
                        accion: 'actualizado',
                        id: mapaId
                    }
                });
                
            } else {
                // Crear nuevo mapa
                console.log('➕ Creando nuevo mapa...');
                
                const datosCreacion = {
                    name: nombre,
                    url: url,
                    points: puntos,
                    activo: true,
                };
                
                const nuevoMapa = await MapaService.crearMapa(datosCreacion);
                mapaId = nuevoMapa.id;
                
                res.status(201).json({
                    success: true,
                    message: `Nuevo mapa "${nombre}" creado exitosamente`,
                    data: {
                        mapa: nuevoMapa.toJSON(),
                        accion: 'creado',
                        id: mapaId
                    }
                });
            }
            
            // Registrar en logs
            console.log(`✅ Mapa ${mapaId} procesado: ${nombre}`);
            
        } catch (error) {
            console.error('❌ Error actualizando mapa:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al actualizar el mapa del campus'
            });
        }
    }

    /**
     * POST /mapa/validar
     * Validar datos del mapa antes de actualizar
     */
    static async validarMapa(req, res) {
        try {
            console.log('🔍 Validando datos del mapa...');
            
            const { nombre, url, puntos } = req.body;

            const errores = [];

            // Validar nombre
            if (!nombre || nombre.trim().length < 3) {
                errores.push('El nombre debe tener al menos 3 caracteres');
            }

            // Validar URL
            try {
                new URL(url);
            } catch {
                errores.push('URL no válida. Formato: http://ejemplo.com/imagen.jpg');
            }

            // Validar puntos
            if (!Array.isArray(puntos) || puntos.length < 3) {
                errores.push('Se requieren al menos 3 puntos para formar un polígono');
            } else {
                puntos.forEach((punto, index) => {
                    if (punto.x === undefined || punto.y === undefined) {
                        errores.push(`Punto ${index + 1}: faltan coordenadas x o y`);
                    }
                    if (isNaN(punto.x) || isNaN(punto.y)) {
                        errores.push(`Punto ${index + 1}: x e y deben ser números`);
                    }
                });
            }

            if (errores.length > 0) {
                res.status(400).json({
                    success: false,
                    valid: false,
                    errors: errores
                });
            } else {
                res.json({
                    success: true,
                    valid: true,
                    message: 'Datos del mapa válidos'
                });
            }
            
        } catch (error) {
            console.error('❌ Error validando mapa:', error);
            res.status(500).json({
                success: false,
                error: 'Error al validar datos del mapa'
            });
        }
    }

    /**
     * POST /mapa/cargar-desde-archivo
     * Cargar mapa desde un archivo JSON
     */
    static async cargarMapaDesdeArchivo(req, res) {
        try {
            console.log('📁 Cargando mapa desde archivo...');
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No se proporcionó ningún archivo'
                });
            }

            const archivoBuffer = req.file.buffer;
            const archivoTexto = archivoBuffer.toString('utf8');
            const datosMapa = JSON.parse(archivoTexto);

            // Validar estructura del archivo
            const estructuraValida = this.validarEstructuraArchivoMapa(datosMapa);
            
            if (!estructuraValida.valid) {
                return res.status(400).json({
                    success: false,
                    error: `Estructura de archivo inválida: ${estructuraValida.error}`
                });
            }

            // Procesar el mapa
            const resultado = await this.procesarCargaMapa(datosMapa);
            
            res.json({
                success: true,
                message: 'Mapa cargado exitosamente desde archivo',
                data: resultado
            });
            
        } catch (error) {
            console.error('❌ Error cargando mapa desde archivo:', error);
            
            if (error instanceof SyntaxError) {
                return res.status(400).json({
                    success: false,
                    error: 'Archivo JSON inválido'
                });
            }
            
            res.status(500).json({
                success: false,
                error: error.message || 'Error al cargar mapa desde archivo'
            });
        }
    }

    /**
     * GET /mapa/estadisticas
     * Obtener estadísticas del sistema de mapas
     */
    static async obtenerEstadisticas(req, res) {
        try {
            console.log('📊 Obteniendo estadísticas del sistema de mapas...');
            
            const estadisticasMapas = await MapaService.obtenerEstadisticas();
            const estadisticasRutas = await RutaService.obtenerEstadisticasRutas();
            
            res.json({
                success: true,
                data: {
                    mapas: estadisticasMapas,
                    rutas: estadisticasRutas,
                    fecha: new Date().toISOString(),
                    version: '1.0.0'
                }
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas del sistema'
            });
        }
    }

    /**
     * POST /mapa/georeferenciar
     * Agregar georeferenciación al mapa
     */
    static async georeferenciarMapa(req, res) {
        try {
            console.log('🌍 Georeferenciando mapa...');
            
            const { idMapa, referenciaLat, referenciaLng, escala } = req.body;

            if (!idMapa || referenciaLat === undefined || referenciaLng === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Los campos idMapa, referenciaLat y referenciaLng son obligatorios'
                });
            }

            const datosActualizacion = {
                referenciaLat: parseFloat(referenciaLat),
                referenciaLng: parseFloat(referenciaLng)
            };

            if (escala !== undefined) {
                datosActualizacion.escala = parseFloat(escala);
            }

            const mapaActualizado = await MapaService.actualizarMapa(idMapa, datosActualizacion);
            
            res.json({
                success: true,
                message: 'Mapa georeferenciado exitosamente',
                data: {
                    mapa: mapaActualizado.toJSON(),
                    coordenadasReferencia: {
                        lat: referenciaLat,
                        lng: referenciaLng,
                        escala: escala || 'usando escala existente'
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ Error georeferenciando mapa:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al georeferenciar el mapa'
            });
        }
    }

    /**
     * POST /mapa/convertir-coordenadas
     * Convertir coordenadas GPS a coordenadas del mapa y viceversa
     */
    static async convertirCoordenadas(req, res) {
        try {
            console.log('📍 Convirtiendo coordenadas...');
            
            const { idMapa, tipo, lat, lng, x, y } = req.body;

            if (!idMapa) {
                return res.status(400).json({
                    success: false,
                    error: 'El campo idMapa es obligatorio'
                });
            }

            let resultado;

            if (tipo === 'gps_a_mapa') {
                if (lat === undefined || lng === undefined) {
                    return res.status(400).json({
                        success: false,
                        error: 'Para convertir GPS a mapa, se requieren lat y lng'
                    });
                }
                
                resultado = await MapaService.convertirCoordenadasMapa(
                    idMapa, 
                    parseFloat(lat), 
                    parseFloat(lng)
                );
                
            } else if (tipo === 'mapa_a_gps') {
                if (x === undefined || y === undefined) {
                    return res.status(400).json({
                        success: false,
                        error: 'Para convertir mapa a GPS, se requieren x e y'
                    });
                }
                
                resultado = await MapaService.convertirCoordenadasAGPS(
                    idMapa, 
                    parseFloat(x), 
                    parseFloat(y)
                );
                
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de conversión no válido. Usar "gps_a_mapa" o "mapa_a_gps"'
                });
            }

            res.json({
                success: true,
                data: resultado
            });
            
        } catch (error) {
            console.error('❌ Error convirtiendo coordenadas:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al convertir coordenadas'
            });
        }
    }

    /**
     * DELETE /mapa/:id
     * Eliminar un mapa del sistema
     */
    static async eliminarMapa(req, res) {
        try {
            const { id } = req.params;
            console.log(`🗑️ Eliminando mapa ID: ${id}...`);
            
            const mapaEliminado = await MapaService.eliminarMapa(id);
            
            res.json({
                success: true,
                message: `Mapa "${mapaEliminado.name}" eliminado exitosamente`,
                data: {
                    mapa: mapaEliminado.toJSON()
                }
            });
            
        } catch (error) {
            console.error(`❌ Error eliminando mapa ${req.params.id}:`, error);
            
            let statusCode = 500;
            let errorMessage = error.message;
            
            if (error.message.includes('No se puede eliminar')) {
                statusCode = 409; // Conflict
            }
            
            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }

    /**
     * GET /mapa/historial
     * Obtener historial de cambios en los mapas
     */
    static async obtenerHistorialCambios(req, res) {
        try {
            console.log('📜 Obteniendo historial de cambios...');
            
            const { limite = 20 } = req.query;
            
            // En un sistema real, tendrías una tabla de logs
            const todosMapas = await MapaService.obtenerTodosMapas();
            
            const historial = todosMapas.map(mapa => ({
                id: mapa.id,
                nombre: mapa.name,
                url: mapa.url,
                puntos: mapa.points.length,
                esPrincipal: mapa.esPrincipal || false,
                activo: mapa.activo || true,
                ultimaActualizacion: mapa.updatedAt || 'No disponible',
                area: mapa.getArea().toFixed(2)
            })).sort((a, b) => new Date(b.ultimaActualizacion) - new Date(a.ultimaActualizacion))
              .slice(0, parseInt(limite));
            
            res.json({
                success: true,
                data: {
                    total: todosMapas.length,
                    historial: historial,
                    fechaConsulta: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener historial de cambios'
            });
        }
    }

    /**
     * POST /mapa/restaurar
     * Restaurar un mapa desde backup o versión anterior
     */
    static async restaurarMapa(req, res) {
        try {
            console.log('🔄 Restaurando mapa desde versión anterior...');
            
            const { idMapa, datosMapa } = req.body;

            if (!idMapa || !datosMapa) {
                return res.status(400).json({
                    success: false,
                    error: 'Los campos idMapa y datosMapa son obligatorios'
                });
            }

            // Verificar que el mapa existe
            const mapaExistente = await MapaService.obtenerMapaPorId(idMapa);
            
            // Crear backup del mapa actual
            const backup = {
                nombre: mapaExistente.name,
                puntos: mapaExistente.points,
                url: mapaExistente.url,
                fechaBackup: new Date().toISOString()
            };

            // Actualizar con los datos de restauración
            const mapaRestaurado = await MapaService.actualizarMapa(idMapa, {
                name: datosMapa.nombre || mapaExistente.name,
                url: datosMapa.url || mapaExistente.url,
                points: datosMapa.puntos || mapaExistente.points
            });
            
            res.json({
                success: true,
                message: 'Mapa restaurado exitosamente',
                data: {
                    mapa: mapaRestaurado.toJSON(),
                    backup: backup,
                    accion: 'restaurado'
                }
            });
            
        } catch (error) {
            console.error('❌ Error restaurando mapa:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al restaurar el mapa'
            });
        }
    }

    // ===== MÉTODOS PRIVADOS DE UTILIDAD =====

    /**
     * Validar estructura del archivo JSON de mapa
     */
    static validarEstructuraArchivoMapa(datos) {
        if (!datos.nombre || !datos.url || !datos.puntos) {
            return { 
                valid: false, 
                error: 'Faltan campos requeridos: nombre, url o puntos' 
            };
        }

        if (!Array.isArray(datos.puntos)) {
            return { 
                valid: false, 
                error: 'El campo puntos debe ser un array' 
            };
        }

        if (datos.puntos.length < 3) {
            return { 
                valid: false, 
                error: 'Se requieren al menos 3 puntos' 
            };
        }

        for (let i = 0; i < datos.puntos.length; i++) {
            const punto = datos.puntos[i];
            if (typeof punto !== 'object' || punto === null) {
                return { 
                    valid: false, 
                    error: `Punto ${i + 1} no es un objeto válido` 
                };
            }
            if (punto.x === undefined || punto.y === undefined) {
                return { 
                    valid: false, 
                    error: `Punto ${i + 1} falta coordenada x o y` 
                };
            }
            if (isNaN(punto.x) || isNaN(punto.y)) {
                return { 
                    valid: false, 
                    error: `Punto ${i + 1} tiene coordenadas no numéricas` 
                };
            }
        }

        return { valid: true };
    }

    /**
     * Procesar carga de mapa desde archivo
     */
    static async procesarCargaMapa(datosMapa) {
        const { nombre, url, puntos, escala, descripcion } = datosMapa;
        
        // Verificar si el mapa ya existe
        const mapasExistentes = await MapaService.buscarMapaPorNombre(nombre);
        
        if (mapasExistentes.length > 0) {
            // Actualizar existente
            const mapaExistente = mapasExistentes[0];
            const mapaActualizado = await MapaService.actualizarMapa(mapaExistente.id, {
                name: nombre,
                url: url,
                points: puntos,
                escala: escala || 1.0,
                descripcion: descripcion || null
            });
            
            return {
                accion: 'actualizado',
                mapa: mapaActualizado.toJSON(),
                mensaje: `Mapa "${nombre}" actualizado desde archivo`
            };
            
        } else {
            // Crear nuevo
            const nuevoMapa = await MapaService.crearMapa({
                name: nombre,
                url: url,
                points: puntos,
            });
            
            return {
                accion: 'creado',
                mapa: nuevoMapa.toJSON(),
                mensaje: `Nuevo mapa "${nombre}" creado desde archivo`
            };
        }
    }
}