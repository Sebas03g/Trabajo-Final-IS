// app.js - Configuración de Express (sin WebSocket)
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Importar servicios
import mqttService from './servicios/mqtt.service.js';

// Importar rutas usando ES6 modules
//import skillRoutes from './rutas/skill.routes.js';
import rutaRoutes from './rutas/ruta.routes.js';
import skillRoutes from './rutas/skill.routes.js';
import mapaRoutes from './rutas/mapa.routes.js';
import guiaRoutes from './rutas/guia.routes.js';
import dispositivoRoutes from './rutas/dispositivo.routes.js';
import asistenteVozRoutes from './rutas/asistenteVoz.routes.js';
import robotRoutes from './rutas/robot.routes.js';
import navegacionRoutes from './rutas/navegacion.routes.js';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar MQTT (si existe el servicio)
if (mqttService && mqttService.connect) {
    mqttService.connect({
        host: process.env.MQTT_HOST || 'broker.hivemq.com',
        port: process.env.MQTT_PORT || 1883,
    });

    // Escuchar eventos MQTT
    mqttService.on('connected', () => {
        console.log('✅ MQTT listo para enviar comandos');
    });

    mqttService.on('robotStatusUpdated', ({ robotId, status }) => {
        console.log(`🤖 Robot ${robotId} cambió a estado: ${status}`);
    });
} else {
    console.log('⚠️ MQTT Service no disponible');
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rutas API
//app.use('/api/skill', skillRoutes);
app.use('/api/rutas', rutaRoutes);
app.use('/api/mapas', mapaRoutes);
app.use('/api/guias', guiaRoutes);
app.use('/api/dispositivos', dispositivoRoutes);
app.use('/api/asistentes-voz', asistenteVozRoutes);
app.use('/api/robots', robotRoutes);
app.use('/api/navegacion', navegacionRoutes);
app.use('/api/skill', skillRoutes);

// Ruta de prueba/health check
app.get("/", (req, res) => {
    res.json({ 
        message: "API funcionando",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// Ruta de health check
app.get("/health", (req, res) => {
    const status = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "connected", // Podrías verificar conexión a DB
        mqtt: mqttService?.getStatus ? mqttService.getStatus() : { connected: false }
    };
    
    res.status(200).json(status);
});

// Ruta para estado del sistema
app.get("/api/status", (req, res) => {
    const status = {
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            platform: process.platform
        },
        services: {
            mqtt: mqttService?.getStatus ? mqttService.getStatus() : { connected: false }
        },
        timestamp: new Date().toISOString()
    };
    
    res.json(status);
});

// Manejo de errores 404
app.use((req, res, next) => {
    res.status(404).json({ 
        error: "Ruta no encontrada",
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores general
app.use((err, req, res, next) => {
    console.error("❌ Error:", err.stack);
    
    const statusCode = err.status || 500;
    const errorResponse = {
        error: "Error interno del servidor",
        timestamp: new Date().toISOString()
    };
    
    // Solo mostrar detalles en desarrollo
    if (process.env.NODE_ENV === 'development') {
        errorResponse.message = err.message;
        errorResponse.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
});

export default app;