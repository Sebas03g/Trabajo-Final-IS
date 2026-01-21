// app.js - Configuración de Express (sin WebSocket)
import express from "express";
import cors from "cors";
import routeRoutes from "./rutas/routeRoutes.js";
import statusRoutes from "./rutas/statusRoutes.js";
import "./jobs/scheduler.js";
import mqttService from './services/mqttService.js';

const rutaRoutes = require('./src/rutas/ruta.routes');
const skillRoutes = require('./src/rutas/skill.routes');
const mapaRoutes = require('./src/rutas/mapa.routes');
const guiaRoutes = require('./src/rutas/guia.routes');
const dispositivoRoutes = require('./src/rutas/dispositivo.routes');
const asistenteVozRoutes = require('./src/rutas/asistenteVoz.routes');
const robotRoutes = require('./src/rutas/robot.routes');
const navegacionRoutes = require('./src/rutas/navegacion.routes');

// Conectar al broker MQTT (una sola vez al iniciar)
mqttService.connect({
  host: process.env.MQTT_HOST || 'broker.hivemq.com',
  port: process.env.MQTT_PORT || 1883,
});

// Escuchar eventos
mqttService.on('connected', () => {
  console.log('MQTT listo para enviar comandos');
});

mqttService.on('robotStatusUpdated', ({ robotId, status }) => {
  console.log(`Robot ${robotId} cambió a estado: ${status}`);
});
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/skill', skillRoutes)
app.use('/api/rutas', rutaRoutes);
app.use('/api/mapas', mapaRoutes);
app.use('/api/guias', guiaRoutes);
app.use('/api/dispositivos', dispositivoRoutes);
app.use('/api/asistentes-voz', asistenteVozRoutes);
app.use('/api/robots', robotRoutes);
app.use('/api/navegacion', navegacionRoutes);

// Ruta de prueba/health check
app.get("/", (req, res) => {
  res.json({ 
    message: "API funcionando",
    timestamp: new Date().toISOString()
  });
});

// Ruta de health check para WebSocket (si es necesario)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Manejo de errores 404
app.use((req, res, next) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Manejo de errores general
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

export default app; // Exportar solo la app