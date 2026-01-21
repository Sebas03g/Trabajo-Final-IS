const { PrismaClient } = require('@prisma/client');
const rutaService = require('./ruta.service');
const mapaService = require('./mapa.service');
const navegacionService = require('./navegacion.service');

class SkillService {
    constructor() {
        this.prisma = new PrismaClient();
        this.sesionesActivas = new Map(); // Para tracking en memoria
    }

    /**
     * Procesar solicitud de guía desde el skill
     */
    async procesarSolicitudGuia({ intent, ubicacionDestino, idUsuario, contexto }) {
        try {
            // 1. Determinar ubicación actual del usuario (podría venir del contexto o asumir default)
            const ubicacionActual = await this.determinarUbicacionActual(contexto);
            
            // 2. Buscar ruta disponible
            const rutas = await this.prisma.route.findMany({
                where: {
                    beginning: ubicacionActual,
                    ending: ubicacionDestino
                },
                include: {
                    _count: {
                        select: { robots: true }
                    }
                }
            });
            
            if (rutas.length === 0) {
                throw new Error(`No se encontró ruta de ${ubicacionActual} a ${ubicacionDestino}`);
            }
            
            // 3. Seleccionar la mejor ruta (menos robots asignados)
            const rutaSeleccionada = rutas.reduce((mejor, actual) => {
                return actual._count.robots < mejor._count.robots ? actual : mejor;
            }, rutas[0]);
            
            // 4. Obtener mapa asociado (puedes tener un mapa por ruta o uno general)
            const mapa = await this.obtenerMapaParaRuta(rutaSeleccionada.id);
            
            if (!mapa) {
                throw new Error('No hay mapa disponible para esta ruta');
            }
            
            // 5. Buscar asistente y robot disponible
            const { robotLibre } = await navegacionService.buscarRutaYRobotDisponible(
                1, // ID del asistente principal
                ubicacionActual,
                ubicacionDestino
            );
            
            // 6. Crear sesión de navegación
            const sessionId = this.crearSessionId();
            
            const sesion = {
                sessionId,
                idUsuario,
                ubicacionActual,
                ubicacionDestino,
                rutaId: rutaSeleccionada.id,
                robotId: robotLibre.id,
                iniciadaEn: new Date(),
                estado: 'iniciando'
            };
            
            this.sesionesActivas.set(sessionId, sesion);
            
            // 7. Iniciar navegación en segundo plano
            this.iniciarNavegacionEnBackground(sessionId, robotLibre.id, rutaSeleccionada.id);
            
            // 8. Preparar respuesta para el skill
            return this.prepararRespuestaSkill({
                sessionId,
                ruta: rutaSeleccionada,
                mapa,
                robot: robotLibre,
                instrucciones: this.generarInstruccionesVoz(ubicacionActual, ubicacionDestino)
            });
            
        } catch (error) {
            throw new Error(`Error procesando solicitud: ${error.message}`);
        }
    }

    /**
     * Determinar ubicación actual del usuario
     */
    async determinarUbicacionActual(contexto) {
        // Aquí puedes implementar lógica basada en:
        // 1. Contexto del skill (si el usuario dijo "estoy en...")
        // 2. GPS del dispositivo (si se integra)
        // 3. Asistente más cercano
        // 4. Por ahora, usamos un default
        
        const asistentes = await this.prisma.asistentedeVoz.findMany({
            where: { estado: 'LIBRE' },
            orderBy: { id: 'asc' }
        });
        
        if (asistentes.length > 0) {
            return asistentes[0].ubicacion;
        }
        
        // Default al primer asistente
        const asistenteDefault = await this.prisma.asistentedeVoz.findFirst();
        return asistenteDefault ? asistenteDefault.ubicacion : 'PUNTO_ESPERA';
    }

    /**
     * Obtener mapa para una ruta específica
     */
    async obtenerMapaParaRuta(rutaId) {
        // Estrategia 1: Buscar mapa por nombre que coincida con la ruta
        const ruta = await this.prisma.route.findUnique({
            where: { id: rutaId }
        });
        
        if (!ruta) return null;
        
        // Buscar mapa que contenga puntos de esta ruta
        const mapas = await this.prisma.mapa.findMany({
            where: {
                name: {
                    contains: 'principal', // Ajusta según tu convención
                    mode: 'insensitive'
                }
            }
        });
        
        // Si no hay mapa específico, retornar el primero
        return mapas.length > 0 ? mapas[0] : null;
    }

    /**
     * Crear ID de sesión único
     */
    crearSessionId() {
        return `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Iniciar navegación en background
     */
    async iniciarNavegacionEnBackground(sessionId, robotId, rutaId) {
        try {
            // Iniciar navegación asíncrona
            setTimeout(async () => {
                try {
                    await navegacionService.iniciarNavegacion(robotId, rutaId);
                    
                    // Actualizar estado de la sesión
                    const sesion = this.sesionesActivas.get(sessionId);
                    if (sesion) {
                        sesion.estado = 'en_progreso';
                        sesion.navegacionIniciada = new Date();
                        this.sesionesActivas.set(sessionId, sesion);
                    }
                    
                } catch (error) {
                    console.error(`Error en navegación background para sesión ${sessionId}:`, error);
                }
            }, 1000); // Pequeño delay para que el skill responda primero
        } catch (error) {
            console.error('Error iniciando navegación en background:', error);
        }
    }

    /**
     * Preparar respuesta para el skill
     */
    prepararRespuestaSkill({ sessionId, ruta, mapa, robot, instrucciones }) {
        // Formatear puntos para el skill
        const puntosFormateados = Array.isArray(ruta.points) 
            ? ruta.points 
            : JSON.parse(ruta.points || '[]');
        
        return {
            sessionId,
            respuestaVoz: {
                texto: `Te guiaré al ${ruta.ending}. He asignado el robot ${robot.clienteID}. ${instrucciones}`,
                ssml: `<speak>Te guiaré al ${ruta.ending}. He asignado el robot <say-as interpret-as="characters">${robot.clienteID}</say-as>. ${instrucciones}</speak>`
            },
            visual: {
                tipo: 'mapa_con_ruta',
                titulo: `Ruta a ${ruta.ending}`,
                imagenMapa: mapa.url, // URL del mapa
                puntosRuta: puntosFormateados.map((punto, index) => ({
                    id: index + 1,
                    x: punto.x || punto.lat || 0,
                    y: punto.y || punto.lng || 0,
                    esDestino: index === puntosFormateados.length - 1
                })),
                puntoInicio: {
                    nombre: ruta.beginning,
                    coordenadas: puntosFormateados[0] || { x: 0, y: 0 }
                },
                puntoDestino: {
                    nombre: ruta.ending,
                    coordenadas: puntosFormateados[puntosFormateados.length - 1] || { x: 0, y: 0 }
                },
                robot: {
                    id: robot.id,
                    nombre: robot.clienteID,
                    bateria: robot.batteryLevel
                }
            },
            metadata: {
                rutaId: ruta.id,
                robotId: robot.id,
                duracionEstimada: this.estimarDuracionRuta(puntosFormateados),
                distanciaEstimada: this.calcularDistanciaRuta(puntosFormateados)
            }
        };
    }

    /**
     * Generar instrucciones de voz
     */
    generarInstruccionesVoz(origen, destino) {
        const instrucciones = {
            'BLOQUE_C': {
                'BLOQUE_B': 'Dirígete al pasillo principal y gira a la izquierda.',
                'PUERTA_1': 'Sigue recto hacia el vestíbulo principal.',
                'SALIDA': 'Toma el ascensor a planta baja y sigue las señales de salida.'
            },
            'BLOQUE_B': {
                'BLOQUE_C': 'Cruza el puente peatonal hacia el edificio C.',
                'PUNTO_ESPERA': 'Baja por las escaleras centrales.'
            }
        };
        
        return instrucciones[origen]?.[destino] 
            || `Sigue la ruta marcada en el mapa hacia ${destino.replace('_', ' ')}.`;
    }

    /**
     * Estimar duración de la ruta
     */
    estimarDuracionRuta(puntos) {
        if (!puntos || puntos.length < 2) return '2 minutos';
        
        const distancia = this.calcularDistanciaRuta(puntos);
        const minutos = Math.ceil(distancia / 50); // Asumiendo 50 unidades por minuto
        
        return minutos <= 1 ? '1 minuto' : `${minutos} minutos`;
    }

    /**
     * Calcular distancia aproximada
     */
    calcularDistanciaRuta(puntos) {
        if (!puntos || puntos.length < 2) return 0;
        
        let distancia = 0;
        for (let i = 1; i < puntos.length; i++) {
            const p1 = puntos[i-1];
            const p2 = puntos[i];
            const dx = (p2.x || p2.lat || 0) - (p1.x || p1.lat || 0);
            const dy = (p2.y || p2.lng || 0) - (p1.y || p1.lng || 0);
            distancia += Math.sqrt(dx*dx + dy*dy);
        }
        
        return Math.round(distancia * 100) / 100; // Redondear a 2 decimales
    }

    /**
     * Obtener estado de navegación
     */
    async obtenerEstadoNavegacion(sessionId) {
        const sesion = this.sesionesActivas.get(sessionId);
        
        if (!sesion) {
            throw new Error('Sesión no encontrada');
        }
        
        // Obtener información actual del robot
        const robot = await this.prisma.robotAutomatico.findUnique({
            where: { id: sesion.robotId },
            include: {
                dispositivo: true,
                rutaActual: true
            }
        });
        
        // Calcular progreso
        const progreso = await this.calcularProgresoRuta(robot);
        
        return {
            sessionId,
            estado: sesion.estado,
            progreso,
            robot: {
                id: robot.id,
                nombre: robot.clienteID,
                bateria: robot.batteryLevel,
                ubicacionActual: robot.dispositivo 
                    ? { lat: robot.dispositivo.lat, lng: robot.dispositivo.lng }
                    : null
            },
            tiempoTranscurrido: Math.floor((new Date() - sesion.iniciadaEn) / 1000), // segundos
            tiempoRestante: this.estimarTiempoRestante(progreso)
        };
    }

    /**
     * Calcular progreso de la ruta
     */
    async calcularProgresoRuta(robot) {
        if (!robot.rutaActual) return 0;
        
        const guia = await this.prisma.guia.findFirst({
            where: { id_robot: robot.id },
            orderBy: { id: 'desc' }
        });
        
        if (!guia || !robot.rutaActual.points) return 0;
        
        const puntos = Array.isArray(robot.rutaActual.points) 
            ? robot.rutaActual.points 
            : JSON.parse(robot.rutaActual.points || '[]');
        
        const totalPuntos = puntos.length;
        const puntoActual = guia.puntoActual || 0;
        
        return totalPuntos > 0 ? (puntoActual / totalPuntos) * 100 : 0;
    }

    /**
     * Estimar tiempo restante
     */
    estimarTiempoRestante(progreso) {
        if (progreso >= 100) return '0 minutos';
        
        const tiempoTotalEstimado = 5; // 5 minutos estimados total
        const tiempoRestante = Math.ceil((100 - progreso) / 100 * tiempoTotalEstimado);
        
        return tiempoRestante <= 1 ? '1 minuto' : `${tiempoRestante} minutos`;
    }

    /**
     * Cancelar navegación
     */
    async cancelarNavegacion(sessionId) {
        const sesion = this.sesionesActivas.get(sessionId);
        
        if (!sesion) {
            throw new Error('Sesión no encontrada');
        }
        
        try {
            // Detener navegación del robot
            await navegacionService.detenerNavegacion(sesion.robotId);
            
            // Actualizar estado de la sesión
            sesion.estado = 'cancelada';
            sesion.finalizadaEn = new Date();
            this.sesionesActivas.set(sessionId, sesion);
            
            return {
                success: true,
                sessionId,
                mensaje: 'Navegación cancelada exitosamente',
                horaCancelacion: new Date().toISOString()
            };
            
        } catch (error) {
            throw new Error(`Error cancelando navegación: ${error.message}`);
        }
    }

    /**
     * Registrar actualización para webhook
     */
    async registrarActualizacion(sessionId, tipo, datos) {
        // Aquí podrías guardar en base de datos o enviar notificaciones push
        console.log(`Actualización para ${sessionId}: ${tipo}`, datos);
        
        // Ejemplo: guardar en base de datos
        await this.prisma.skillNotificacion.create({
            data: {
                sessionId,
                tipo,
                datos: JSON.stringify(datos),
                timestamp: new Date()
            }
        });
    }

    /**
     * Limpiar sesiones antiguas
     */
    limpiarSesionesAntiguas() {
        const unaHoraAtras = Date.now() - (60 * 60 * 1000);
        
        for (const [sessionId, sesion] of this.sesionesActivas.entries()) {
            if (sesion.iniciadaEn.getTime() < unaHoraAtras) {
                this.sesionesActivas.delete(sessionId);
            }
        }
    }
}

module.exports = new SkillService();