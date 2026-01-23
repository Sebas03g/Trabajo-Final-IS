// servicios/guia.service.js
import { PrismaClient } from '@prisma/client';
import Guia from '../modelos/Guia.js';
import Ruta from '../modelos/Ruta.js';
import RobotAutomatico from '../modelos/RobotAutomatico.js';
import mqttService from './mqtt.service.js';
import dispositivoService from './dispositivo.service.js';
import navegacionService from './navegacion.service.js';

// Crear instancia única de Prisma
const prisma = new PrismaClient();

class GuiaService {
    async crearGuia(idRuta, idRobot) {
        try {
            // Verificar que el robot existe y está disponible
            const robot = await prisma.robotAutomatico.findUnique({
                where: { id: parseInt(idRobot) },
                include: {
                    dispositivo: true,
                    asistentes: true
                }
            });
            
            if (!robot) {
                throw new Error(`Robot con ID ${idRobot} no encontrado`);
            }
            
            if (robot.estado !== 'LIBRE') {
                throw new Error(`Robot ${idRobot} no está disponible (estado: ${robot.estado})`);
            }
            
            if (robot.batteryLevel < 20) {
                throw new Error(`Robot ${idRobot} tiene batería baja: ${robot.batteryLevel}%`);
            }
            
            // Verificar que la ruta existe
            const ruta = await prisma.route.findUnique({
                where: { id: parseInt(idRuta) }
            });
            
            if (!ruta) {
                throw new Error(`Ruta con ID ${idRuta} no encontrada`);
            }
            
            // Crear la guía
            const guiaData = await prisma.guia.create({
                data: {
                    id_ruta: parseInt(idRuta),
                    puntoActual: 0,
                    id_robot: parseInt(idRobot),
                    estado: 'ACTIVA',
                    iniciadaEn: new Date()
                },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true,
                            asistentes: true
                        }
                    }
                }
            });
            
            // Actualizar el robot para que apunte a esta ruta y cambie estado
            await prisma.robotAutomatico.update({
                where: { id: parseInt(idRobot) },
                data: { 
                    id_rutaActual: parseInt(idRuta),
                    estado: 'OCUPADO'
                }
            });
            
            console.log(`🗺️ Guía ${guiaData.id} creada: Robot ${idRobot} en ruta ${idRuta}`);
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            console.error('Error al crear guía:', error);
            throw new Error(`Error al crear guía: ${error.message}`);
        }
    }

    async obtenerGuiaPorId(id) {
        try {
            const guiaData = await prisma.guia.findUnique({
                where: { id: parseInt(id) },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true,
                            asistentes: true,
                            rutaActual: true
                        }
                    }
                }
            });
            
            if (!guiaData) {
                throw new Error(`Guía con ID ${id} no encontrada`);
            }
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            console.error(`Error al obtener guía ${id}:`, error);
            throw new Error(`Error al obtener guía: ${error.message}`);
        }
    }

    async obtenerGuiaPorRobot(idRobot) {
        try {
            const guiaData = await prisma.guia.findFirst({
                where: { 
                    id_robot: parseInt(idRobot),
                    estado: 'ACTIVA'
                },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true,
                            asistentes: true,
                            rutaActual: true
                        }
                    }
                },
                orderBy: { id: 'desc' }
            });
            
            if (!guiaData) {
                return null;
            }
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            console.error(`Error al obtener guía para robot ${idRobot}:`, error);
            throw new Error(`Error al obtener guía por robot: ${error.message}`);
        }
    }

    async avanzarEnGuia(idGuia) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (!guia) {
                throw new Error('Guía no encontrada');
            }
            
            if (guia.estaCompletada()) {
                throw new Error('La guía ya está completada');
            }
            
            // Usar método del modelo para avanzar
            const avanzado = guia.avanzar();
            
            if (avanzado) {
                // Actualizar en base de datos
                const guiaData = await prisma.guia.update({
                    where: { id: parseInt(idGuia) },
                    data: { 
                        puntoActual: guia.puntoActual,
                        ultimoAvance: new Date()
                    },
                    include: {
                        ruta: true,
                        robot: true
                    }
                });
                
                console.log(`➡️ Guía ${idGuia} avanzó al punto ${guia.puntoActual}`);
                
                // Verificar si se completó
                if (guia.estaCompletada()) {
                    await this.finalizarGuia(idGuia);
                }
                
                return Guia.fromPrisma(guiaData);
            }
            
            return guia;
        } catch (error) {
            console.error(`Error al avanzar en guía ${idGuia}:`, error);
            throw new Error(`Error al avanzar en guía: ${error.message}`);
        }
    }

    async actualizarPuntoActual(idGuia, puntoActual) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (!guia) {
                throw new Error('Guía no encontrada');
            }
            
            // Validar punto
            const puntos = guia.ruta.getPuntosDeRuta();
            if (puntoActual < 0 || puntoActual >= puntos.length) {
                throw new Error(`Punto ${puntoActual} fuera de rango. La ruta tiene ${puntos.length} puntos`);
            }
            
            const guiaData = await prisma.guia.update({
                where: { id: parseInt(idGuia) },
                data: { 
                    puntoActual: parseInt(puntoActual),
                    ultimoAvance: new Date()
                },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true
                        }
                    }
                }
            });
            
            console.log(`📍 Guía ${idGuia} actualizada al punto ${puntoActual}`);
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            console.error(`Error al actualizar punto actual de guía ${idGuia}:`, error);
            throw new Error(`Error al actualizar punto actual: ${error.message}`);
        }
    }

    async finalizarGuia(idGuia) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (!guia) {
                throw new Error('Guía no encontrada');
            }
            
            // Mover al último punto y marcar como completada
            const puntos = guia.ruta.getPuntosDeRuta();
            const ultimoPunto = puntos.length - 1;
            
            const guiaData = await prisma.guia.update({
                where: { id: parseInt(idGuia) },
                data: { 
                    puntoActual: ultimoPunto,
                    estado: 'COMPLETADA',
                    completadaEn: new Date()
                },
                include: {
                    ruta: true,
                    robot: true
                }
            });
            
            // Liberar al robot
            if (guiaData.id_robot) {
                await prisma.robotAutomatico.update({
                    where: { id: guiaData.id_robot },
                    data: { 
                        id_rutaActual: null,
                        estado: 'LIBRE'
                    }
                });
                
                // Detener robot
                if (mqttService && mqttService.stop) {
                    await mqttService.stop(guiaData.id_robot.toString());
                }
            }
            
            console.log(`✅ Guía ${idGuia} completada. Robot ${guiaData.id_robot} liberado`);
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            console.error(`Error al finalizar guía ${idGuia}:`, error);
            throw new Error(`Error al finalizar guía: ${error.message}`);
        }
    }

    async cancelarGuia(idGuia) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (!guia) {
                throw new Error('Guía no encontrada');
            }
            
            const guiaData = await prisma.guia.update({
                where: { id: parseInt(idGuia) },
                data: { 
                    estado: 'CANCELADA',
                    canceladaEn: new Date()
                },
                include: {
                    ruta: true,
                    robot: true
                }
            });
            
            // Liberar al robot
            if (guiaData.id_robot) {
                await prisma.robotAutomatico.update({
                    where: { id: guiaData.id_robot },
                    data: { 
                        id_rutaActual: null,
                        estado: 'LIBRE'
                    }
                });
                
                // Detener robot
                if (mqttService && mqttService.stop) {
                    await mqttService.stop(guiaData.id_robot.toString());
                }
            }
            
            console.log(`❌ Guía ${idGuia} cancelada. Robot ${guiaData.id_robot} liberado`);
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            console.error(`Error al cancelar guía ${idGuia}:`, error);
            throw new Error(`Error al cancelar guía: ${error.message}`);
        }
    }

    async obtenerGuiasActivas() {
        try {
            const guiasData = await prisma.guia.findMany({
                where: {
                    estado: 'ACTIVA'
                },
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true,
                            asistentes: true
                        }
                    }
                },
                orderBy: { iniciadaEn: 'desc' }
            });
            
            return guiasData.map(guia => Guia.fromPrisma(guia));
        } catch (error) {
            console.error('Error al obtener guías activas:', error);
            throw new Error(`Error al obtener guías activas: ${error.message}`);
        }
    }

    async obtenerProgresoGuia(idGuia) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            const puntos = guia.ruta.getPuntosDeRuta();
            const progreso = guia.getProgreso();
            const completada = guia.estaCompletada();
            
            let distanciaRecorrida = 0;
            let distanciaTotal = 0;
            
            // Calcular distancias
            for (let i = 0; i < puntos.length - 1; i++) {
                const distanciaSegmento = guia.calcularDistancia(puntos[i], puntos[i + 1]);
                distanciaTotal += distanciaSegmento;
                
                if (i < guia.puntoActual) {
                    distanciaRecorrida += distanciaSegmento;
                }
            }
            
            // Distancia al siguiente punto
            let distanciaSiguiente = 0;
            if (!completada && guia.puntoActual < puntos.length - 1) {
                distanciaSiguiente = guia.calcularDistancia(
                    puntos[guia.puntoActual],
                    puntos[guia.puntoActual + 1]
                );
            }
            
            return {
                guiaId: guia.id,
                robotId: guia.id_robot,
                rutaId: guia.id_ruta,
                puntoActual: guia.puntoActual,
                totalPuntos: puntos.length,
                progreso: Math.round(progreso),
                completada: completada,
                estado: guia.estado,
                distanciaRecorrida: distanciaRecorrida.toFixed(2),
                distanciaTotal: distanciaTotal.toFixed(2),
                distanciaSiguiente: distanciaSiguiente.toFixed(2),
                distanciaRestante: guia.getDistanciaRestante().toFixed(2),
                tiempoEstimado: this.calcularTiempoEstimado(distanciaRestante),
                siguientePunto: completada ? null : puntos[guia.puntoActual + 1]
            };
        } catch (error) {
            console.error(`Error al obtener progreso de guía ${idGuia}:`, error);
            throw new Error(`Error al obtener progreso: ${error.message}`);
        }
    }

    calcularTiempoEstimado(distanciaKm) {
        // Suponer velocidad promedio de 3 km/h para robots
        const velocidadKmH = 3;
        const horas = distanciaKm / velocidadKmH;
        const minutos = Math.round(horas * 60);
        
        if (minutos < 60) {
            return `${minutos} minutos`;
        } else {
            const horasEnteras = Math.floor(minutos / 60);
            const minutosRestantes = minutos % 60;
            return `${horasEnteras}h ${minutosRestantes}m`;
        }
    }

    async obtenerHistorialGuias(robotId = null, limite = 50) {
        try {
            const whereClause = robotId 
                ? { id_robot: parseInt(robotId) }
                : {};
            
            const guiasData = await prisma.guia.findMany({
                where: whereClause,
                include: {
                    ruta: true,
                    robot: {
                        include: {
                            dispositivo: true
                        }
                    }
                },
                orderBy: { iniciadaEn: 'desc' },
                take: limite
            });
            
            return guiasData.map(guia => Guia.fromPrisma(guia));
        } catch (error) {
            console.error('Error al obtener historial de guías:', error);
            throw new Error(`Error al obtener historial: ${error.message}`);
        }
    }

    async eliminarGuia(id) {
        try {
            const guia = await this.obtenerGuiaPorId(id);
            
            // Verificar que no esté activa
            if (guia.estado === 'ACTIVA') {
                throw new Error('No se puede eliminar una guía activa. Cancélala primero.');
            }
            
            const guiaData = await prisma.guia.delete({
                where: { id: parseInt(id) },
                include: {
                    ruta: true,
                    robot: true
                }
            });
            
            console.log(`🗑️ Guía ${id} eliminada`);
            
            return Guia.fromPrisma(guiaData);
        } catch (error) {
            console.error(`Error al eliminar guía ${id}:`, error);
            throw new Error(`Error al eliminar guía: ${error.message}`);
        }
    }

    async iniciarNavegacionAutomatica(idGuia) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (!guia) {
                throw new Error('Guía no encontrada');
            }
            
            if (guia.estaCompletada()) {
                throw new Error('La guía ya está completada');
            }
            
            if (guia.estado !== 'ACTIVA') {
                throw new Error(`La guía no está activa (estado: ${guia.estado})`);
            }
            
            // Obtener punto actual y siguiente
            const puntoActual = guia.getPuntoActualCoords();
            const siguientePunto = guia.getSiguientePunto();
            
            if (!siguientePunto) {
                // No hay más puntos, finalizar
                await this.finalizarGuia(idGuia);
                
                return {
                    completada: true,
                    mensaje: 'Ruta completada'
                };
            }
            
            // Obtener ubicación actual del dispositivo del robot
            const dispositivo = await dispositivoService.obtenerDispositivoPorRobot(guia.id_robot);
            
            if (!dispositivo) {
                throw new Error('Robot no tiene dispositivo de ubicación');
            }
            
            // Calcular dirección necesaria
            const direccion = this.calcularDireccionHaciaPunto(
                dispositivo,
                siguientePunto
            );
            
            // Enviar comando MQTT si está disponible
            if (mqttService && mqttService.sendBasicMovement) {
                if (direccion !== 'forward') {
                    // Si necesita girar, enviar comando de giro
                    await mqttService.sendBasicMovement(
                        guia.id_robot.toString(), 
                        direccion,
                        { speed: 30 }
                    );
                    
                    // Esperar un momento para que el robot gire
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                // Avanzar hacia adelante
                const distancia = this.calcularDistancia(dispositivo, siguientePunto);
                await mqttService.sendBasicMovement(
                    guia.id_robot.toString(), 
                    'forward', 
                    {
                        speed: 50,
                        distance: distancia,
                        duration: Math.round((distancia / 0.5) * 1000) // Estimación tiempo
                    }
                );
                
                console.log(`🚀 Robot ${guia.id_robot} moviéndose ${direccion} hacia punto ${guia.puntoActual + 1}`);
            } else {
                console.warn('MQTT Service no disponible, simulando movimiento');
                // Simular movimiento si MQTT no está disponible
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            // Actualizar punto actual en la guía
            await this.avanzarEnGuia(idGuia);
            
            return {
                guiaId: idGuia,
                puntoActual: guia.puntoActual,
                siguientePunto,
                direccion,
                distanciaSiguiente: this.calcularDistancia(dispositivo, siguientePunto),
                progreso: guia.getProgreso()
            };
            
        } catch (error) {
            console.error(`Error en navegación automática de guía ${idGuia}:`, error);
            throw new Error(`Error en navegación automática: ${error.message}`);
        }
    }

    calcularDireccionHaciaPunto(dispositivo, puntoDestino) {
        // Calcular ángulo entre posición actual y destino
        const dx = puntoDestino.lng - dispositivo.lng;
        const dy = puntoDestino.lat - dispositivo.lat;
        const anguloDestino = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Normalizar ángulos
        const anguloActual = dispositivo.cardinalDirection || 0;
        const diferencia = ((anguloDestino - anguloActual + 180) % 360) - 180;
        
        // Determinar dirección basada en la diferencia
        if (Math.abs(diferencia) < 30) {
            return 'forward'; // Ir recto
        } else if (diferencia > 0) {
            return 'right'; // Girar derecha
        } else {
            return 'left'; // Girar izquierda
        }
    }

    calcularDistancia(dispositivo, puntoDestino) {
        // Fórmula Haversine simplificada
        const R = 6371; // Radio de la Tierra en km
        const dLat = (puntoDestino.lat - dispositivo.lat) * Math.PI / 180;
        const dLng = (puntoDestino.lng - dispositivo.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(dispositivo.lat * Math.PI / 180) * Math.cos(puntoDestino.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    async procesarNavegacionContinua(idGuia, intervaloMs = 10000) {
        try {
            const guia = await this.obtenerGuiaPorId(idGuia);
            
            if (guia.estaCompletada()) {
                return { 
                    completada: true,
                    mensaje: 'La guía ya está completada'
                };
            }
            
            console.log(`🔄 Iniciando navegación continua para guía ${idGuia} cada ${intervaloMs}ms`);
            
            let intervaloId = null;
            let ejecutando = false;
            
            const ejecutarCiclo = async () => {
                if (ejecutando) return;
                ejecutando = true;
                
                try {
                    const resultado = await this.iniciarNavegacionAutomatica(idGuia);
                    
                    if (resultado.completada) {
                        clearInterval(intervaloId);
                        console.log(`✅ Navegación continua completada para guía ${idGuia}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error en ciclo de navegación: ${error.message}`);
                    // No detenemos el intervalo, continuamos intentando
                } finally {
                    ejecutando = false;
                }
            };
            
            // Ejecutar inmediatamente y luego en intervalos
            await ejecutarCiclo();
            intervaloId = setInterval(ejecutarCiclo, intervaloMs);
            
            return {
                iniciado: true,
                guiaId: idGuia,
                intervaloMs,
                intervaloId
            };
            
        } catch (error) {
            console.error(`Error al iniciar navegación continua para guía ${idGuia}:`, error);
            throw new Error(`Error al iniciar navegación continua: ${error.message}`);
        }
    }

    async detenerNavegacionContinua(intervaloId) {
        try {
            if (intervaloId) {
                clearInterval(intervaloId);
                console.log(`⏹️ Navegación continua detenida`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deteniendo navegación continua:', error);
            throw error;
        }
    }

    async obtenerEstadisticas() {
        try {
            const totalGuias = await prisma.guia.count();
            const activas = await prisma.guia.count({ where: { estado: 'ACTIVA' } });
            const completadas = await prisma.guia.count({ where: { estado: 'COMPLETADA' } });
            const canceladas = await prisma.guia.count({ where: { estado: 'CANCELADA' } });
            
            // Tiempo promedio de guía
            const guiasCompletadas = await prisma.guia.findMany({
                where: { estado: 'COMPLETADA' },
                select: {
                    iniciadaEn: true,
                    completadaEn: true
                }
            });
            
            let tiempoTotalMs = 0;
            let guiasConTiempo = 0;
            
            guiasCompletadas.forEach(guia => {
                if (guia.iniciadaEn && guia.completadaEn) {
                    const tiempoMs = new Date(guia.completadaEn) - new Date(guia.iniciadaEn);
                    tiempoTotalMs += tiempoMs;
                    guiasConTiempo++;
                }
            });
            
            const tiempoPromedioMinutos = guiasConTiempo > 0 
                ? Math.round((tiempoTotalMs / guiasConTiempo) / (1000 * 60))
                : 0;
            
            return {
                total: totalGuias,
                activas,
                completadas,
                canceladas,
                porcentajeExito: totalGuias > 0 ? (completadas / totalGuias) * 100 : 0,
                tiempoPromedioMinutos,
                ultimaActualizacion: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas de guías:', error);
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        }
    }

    // Cerrar conexión Prisma
    async disconnect() {
        await prisma.$disconnect();
    }
}

// Exportar instancia única del servicio
const guiaService = new GuiaService();
export default guiaService;