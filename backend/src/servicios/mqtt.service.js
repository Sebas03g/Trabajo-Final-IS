// services/mqttService.js
import prisma from "../config/prisma.js";
import mqtt from 'mqtt';
import { EventEmitter } from 'events';

class MQTTService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connectedRobots = new Map();
  }

  /**
   * Conectar al broker MQTT
   */
  connect(config = {}) {
    const defaultConfig = {
      host: process.env.MQTT_HOST || 'localhost',
      port: process.env.MQTT_PORT || 1883,
      username: process.env.MQTT_USERNAME || '',
      password: process.env.MQTT_PASSWORD || '',
      clientId: `server-${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    };

    const mqttConfig = { ...defaultConfig, ...config };
    const mqttUrl = `mqtt://${mqttConfig.host}:${mqttConfig.port}`;

    console.log(`[MQTT] Conectando a: ${mqttUrl}`);

    try {
      this.client = mqtt.connect(mqttUrl, {
        clientId: mqttConfig.clientId,
        username: mqttConfig.username,
        password: mqttConfig.password,
        clean: mqttConfig.clean,
        reconnectPeriod: mqttConfig.reconnectPeriod,
        connectTimeout: mqttConfig.connectTimeout,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('[MQTT] Error al conectar:', error);
    }
  }

  /**
   * Configurar listeners de eventos
   */
  setupEventListeners() {
    if (!this.client) return;

    this.client.on('connect', () => {
      console.log('[MQTT] ✅ Conectado al broker');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // Suscribirse a topics importantes
      this.subscribe('robots/+/status');
      this.subscribe('robots/+/location');
      this.subscribe('robots/+/battery');
      this.subscribe('robots/+/response');
    });

    this.client.on('error', (error) => {
      console.error('[MQTT] ❌ Error:', error.message);
      this.isConnected = false;
      this.emit('error', error);
    });

    this.client.on('close', () => {
      console.log('[MQTT] 🔌 Desconectado');
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`[MQTT] 🔄 Reintentando conexión (${this.reconnectAttempts})`);
      this.emit('reconnecting');
    });

    this.client.on('message', (topic, message) => {
      const payload = message.toString();
      console.log(`[MQTT] 📨 Mensaje recibido [${topic}]: ${payload}`);
      
      const robotId = this.extractRobotIdFromTopic(topic);
      
      this.emit('message', { topic, payload, robotId });
      this.emit(`message:${topic}`, payload);
      
      this.handleRobotMessage(robotId, topic, payload);
    });
  }

  /**
   * Extraer robotId del topic MQTT
   */
  extractRobotIdFromTopic(topic) {
    const parts = topic.split('/');
    if (parts[0] === 'robots' && parts.length > 1) {
      return parts[1];
    }
    return null;
  }

  /**
   * Manejar mensajes de robots
   */
  async handleRobotMessage(robotId, topic, payload) {
    try {
      const data = JSON.parse(payload);
      
      if (topic.includes('/status')) {
        await this.updateRobotStatus(robotId, data);
      } else if (topic.includes('/location')) {
        await this.updateRobotLocation(robotId, data);
      } else if (topic.includes('/battery')) {
        await this.updateRobotBattery(robotId, data);
      }
    } catch (error) {
      console.error(`[MQTT] Error procesando mensaje de robot ${robotId}:`, error);
    }
  }

  /**
   * Actualizar estado del robot en la base de datos
   */
  async updateRobotStatus(robotId, statusData) {
    try {
      await prisma.robotAutomatico.update({
        where: { id: parseInt(robotId) },
        data: {
          estado: statusData.estado || 'LIBRE',
          batteryLevel: statusData.batteryLevel,
        },
      });
      
      console.log(`[MQTT] Estado actualizado para robot ${robotId}: ${statusData.estado}`);
      this.emit('robotStatusUpdated', { robotId, status: statusData.estado });
    } catch (error) {
      console.error(`[MQTT] Error actualizando estado del robot ${robotId}:`, error);
    }
  }

  /**
   * Actualizar ubicación del robot
   */
  async updateRobotLocation(robotId, locationData) {
    try {
      const robot = await prisma.robotAutomatico.findUnique({
        where: { id: parseInt(robotId) },
        include: { dispositivo: true },
      });

      if (robot && robot.dispositivo) {
        await prisma.dispositivo.update({
          where: { id: robot.dispositivo.id },
          data: {
            lat: locationData.lat,
            lng: locationData.lng,
          },
        });
        
        console.log(`[MQTT] Ubicación actualizada para robot ${robotId}: ${locationData.lat}, ${locationData.lng}`);
        this.emit('robotLocationUpdated', { robotId, location: locationData });
      }
    } catch (error) {
      console.error(`[MQTT] Error actualizando ubicación del robot ${robotId}:`, error);
    }
  }

  /**
   * Actualizar batería del robot
   */
  async updateRobotBattery(robotId, batteryData) {
    try {
      await prisma.robotAutomatico.update({
        where: { id: parseInt(robotId) },
        data: {
          batteryLevel: batteryData.level,
        },
      });
      
      console.log(`[MQTT] Batería actualizada para robot ${robotId}: ${batteryData.level}%`);
      this.emit('robotBatteryUpdated', { robotId, batteryLevel: batteryData.level });
    } catch (error) {
      console.error(`[MQTT] Error actualizando batería del robot ${robotId}:`, error);
    }
  }

  /**
   * Suscribirse a un tópico
   */
  subscribe(topic, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        return reject(new Error('MQTT no conectado'));
      }

      const subscribeOptions = { qos: options.qos || 1 };

      this.client.subscribe(topic, subscribeOptions, (error, granted) => {
        if (error) {
          console.error(`[MQTT] ❌ Error suscribiendo a ${topic}:`, error);
          reject(error);
        } else {
          console.log(`[MQTT] ✅ Suscrito a: ${topic}`);
          resolve(granted);
        }
      });
    });
  }

  /**
   * ===========================================
   * MÉTODOS PARA ENVIAR COMANDOS DE MOVIMIENTO
   * ===========================================
   */

  /**
   * Mover robot hacia ADELANTE
   */
  async moveForward(robotId, options = {}) {
    const defaultOptions = {
      distance: null,
      speed: 50,
      duration: null,
    };

    const moveOptions = { ...defaultOptions, ...options };

    const message = {
      type: 'MOVEMENT_COMMAND',
      command: 'MOVE_FORWARD',
      params: moveOptions,
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'movement', message);
  }

  /**
   * Mover robot hacia ATRÁS
   */
  async moveBackward(robotId, options = {}) {
    const defaultOptions = {
      distance: null,
      speed: 50,
      duration: null,
    };

    const moveOptions = { ...defaultOptions, ...options };

    const message = {
      type: 'MOVEMENT_COMMAND',
      command: 'MOVE_BACKWARD',
      params: moveOptions,
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'movement', message);
  }

  /**
   * Girar a la IZQUIERDA
   */
  async turnLeft(robotId, angle = 90, speed = 30) {
    const message = {
      type: 'MOVEMENT_COMMAND',
      command: 'TURN_LEFT',
      params: {
        angle: angle,
        speed: speed,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'movement', message);
  }

  /**
   * Girar a la DERECHA
   */
  async turnRight(robotId, angle = 90, speed = 30) {
    const message = {
      type: 'MOVEMENT_COMMAND',
      command: 'TURN_RIGHT',
      params: {
        angle: angle,
        speed: speed,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'movement', message);
  }

  /**
   * DETENER movimiento
   */
  async stop(robotId) {
    const message = {
      type: 'MOVEMENT_COMMAND',
      command: 'STOP',
      params: {
        emergency: false,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'movement', message);
  }

  /**
   * PARADA DE EMERGENCIA
   */
  async emergencyStop(robotId) {
    const message = {
      type: 'MOVEMENT_COMMAND',
      command: 'EMERGENCY_STOP',
      params: {
        emergency: true,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'movement', message);
  }

  /**
   * AJUSTAR VELOCIDAD
   */
  async setSpeed(robotId, speed) {
    const clampedSpeed = Math.max(0, Math.min(100, speed));

    const message = {
      type: 'CONFIG_COMMAND',
      command: 'SET_SPEED',
      params: {
        speed: clampedSpeed,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'config', message);
  }

  /**
   * ESPERAR / PAUSA
   */
  async wait(robotId, milliseconds) {
    const message = {
      type: 'CONTROL_COMMAND',
      command: 'WAIT',
      params: {
        duration: milliseconds,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'control', message);
  }

  /**
   * Enviar comando de movimiento básico
   */
  async sendBasicMovement(robotId, direction, params = {}) {
    const validDirections = ['forward', 'backward', 'left', 'right', 'stop'];
    
    if (!validDirections.includes(direction)) {
      throw new Error(`Dirección no válida. Use: ${validDirections.join(', ')}`);
    }
    
    const message = {
      type: 'BASIC_MOVEMENT',
      direction: direction,
      params: {
        speed: params.speed || 50,
        distance: params.distance || null,
        duration: params.duration || null,
      },
      timestamp: new Date().toISOString(),
    };
    
    return this.sendCommandToRobot(robotId, 'basic_movement', message);
  }

  /**
   * ===========================================
   * MÉTODOS PARA RUTAS Y UBICACIONES
   * ===========================================
   */

  /**
   * Enviar comando para seguir una ruta completa
   */
  async executeRoute(robotId, routeId) {
    try {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
      });

      if (!route) {
        throw new Error(`Ruta ${routeId} no encontrada`);
      }

      const message = {
        type: 'ROUTE_COMMAND',
        command: 'FOLLOW_ROUTE',
        params: {
          routeId: routeId,
          routeName: route.name,
          points: route.points,
          start: route.beginning,
          end: route.ending,
        },
        timestamp: new Date().toISOString(),
      };

      return this.sendCommandToRobot(robotId, 'route', message);
    } catch (error) {
      console.error(`Error ejecutando ruta ${routeId} en robot ${robotId}:`, error);
      throw error;
    }
  }

  /**
   * Enviar comando para mover a una ubicación específica
   */
  async moveToLocation(robotId, ubicacion) {
    const message = {
      type: 'NAVIGATION_COMMAND',
      command: 'MOVE_TO_LOCATION',
      params: {
        location: ubicacion,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'navigation', message);
  }

  /**
   * Enviar comando para ir a coordenadas específicas
   */
  async goToCoordinates(robotId, lat, lng) {
    const message = {
      type: 'NAVIGATION_COMMAND',
      command: 'GO_TO_COORDINATES',
      params: {
        lat: lat,
        lng: lng,
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendCommandToRobot(robotId, 'navigation', message);
  }

  /**
   * ===========================================
   * MÉTODO PRINCIPAL PARA ENVIAR COMANDOS
   * ===========================================
   */

  /**
   * Enviar comando a un robot específico
   * Este es el ÚNICO método que envía comandos a robots
   */
  async sendCommandToRobot(robotId, commandType, message) {
    const topic = `robots/${robotId}/${commandType}`;
    
    // Validar robot
    await this.validateRobot(robotId, commandType);
    
    // Enviar comando MQTT
    return this.publish(topic, message);
  }

  /**
   * Validar robot antes de enviar comando
   */
  async validateRobot(robotId, commandType) {
    try {
      const robot = await prisma.robotAutomatico.findUnique({
        where: { id: parseInt(robotId) },
      });
      
      if (!robot) {
        throw new Error(`Robot ${robotId} no encontrado`);
      }
      
      // Si el robot está en mantenimiento, no enviar comandos
      if (robot.estado === 'MANTENIMIENTO') {
        throw new Error(`Robot ${robotId} está en mantenimiento`);
      }
      
      // Actualizar estado a OCUPADO si es un comando de movimiento
      if (['movement', 'basic_movement', 'navigation', 'route'].includes(commandType)) {
        await prisma.robotAutomatico.update({
          where: { id: parseInt(robotId) },
          data: { estado: 'OCUPADO' },
        });
        
        console.log(`🤖 Robot ${robotId} cambió a estado: OCUPADO`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error validando robot ${robotId}:`, error);
      throw error;
    }
  }

  /**
   * ===========================================
   * MÉTODOS AUXILIARES
   * ===========================================
   */

  /**
   * Ejecutar secuencia de comandos
   */
  async executeSequence(robotId, commands) {
    const results = [];
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      
      try {
        console.log(`▶️ Ejecutando comando ${i + 1}/${commands.length}: ${cmd.action}`);
        
        let result;
        
        switch (cmd.action) {
          case 'move_forward':
            result = await this.moveForward(robotId, cmd.params);
            break;
          case 'move_backward':
            result = await this.moveBackward(robotId, cmd.params);
            break;
          case 'turn_left':
            result = await this.turnLeft(robotId, cmd.params?.angle, cmd.params?.speed);
            break;
          case 'turn_right':
            result = await this.turnRight(robotId, cmd.params?.angle, cmd.params?.speed);
            break;
          case 'stop':
            result = await this.stop(robotId);
            break;
          case 'wait':
            result = await this.wait(robotId, cmd.params?.duration);
            break;
          case 'set_speed':
            result = await this.setSpeed(robotId, cmd.params?.speed);
            break;
          default:
            throw new Error(`Comando no reconocido: ${cmd.action}`);
        }
        
        results.push({
          index: i,
          action: cmd.action,
          success: true,
          result: result,
        });
        
        // Esperar entre comandos
        if (cmd.delayAfter && i < commands.length - 1) {
          await new Promise(resolve => setTimeout(resolve, cmd.delayAfter));
        }
        
      } catch (error) {
        console.error(`❌ Error en comando ${i + 1} (${cmd.action}):`, error);
        results.push({
          index: i,
          action: cmd.action,
          success: false,
          error: error.message,
        });
        
        if (cmd.stopOnError) {
          break;
        }
      }
    }
    
    return results;
  }

  /**
   * Publicar un mensaje MQTT
   */
  publish(topic, command, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        return reject(new Error('MQTT no conectado'));
      }

      const defaultOptions = {
        qos: 1,
        retain: false,
      };

      const publishOptions = { ...defaultOptions, ...options };
      
      let payload;
      if (typeof command === 'object') {
        payload = JSON.stringify(command);
      } else {
        payload = command.toString();
      }

      console.log(`[MQTT] 📤 Publicando en [${topic}]:`, payload.substring(0, 200) + (payload.length > 200 ? '...' : ''));

      this.client.publish(topic, payload, publishOptions, (error) => {
        if (error) {
          console.error('[MQTT] ❌ Error publicando:', error);
          reject(error);
        } else {
          console.log(`[MQTT] ✅ Publicación exitosa en: ${topic}`);
          resolve({
            success: true,
            topic,
            message: command,
            sentAt: new Date().toISOString(),
          });
        }
      });
    });
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      console.log('[MQTT] 👋 Desconectado del broker');
    }
  }

  /**
   * Obtener estado de conexión
   */
  getStatus() {
    return {
      connected: this.isConnected,
      clientId: this.client?.options?.clientId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton para usar en toda la app
const mqttService = new MQTTService();
export default mqttService;