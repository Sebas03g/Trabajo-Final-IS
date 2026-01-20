// server.js - Archivo principal con WebSocket
import http from "http";
import { WebSocketServer } from 'ws';
import app from "./app.js"; // Importar la app configurada
import locationHandler from "./ws/wsUpdateLocation.js";

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Configurar WebSocket Server
const wss = new WebSocketServer({ 
  server,
  clientTracking: true,
  perMessageDeflate: false // Opcional: desactivar compresión
});

// Manejar conexiones WebSocket
wss.on("connection", (ws, req) => {
  console.log(`[WS] Nueva conexión desde: ${req.socket.remoteAddress}`);
  console.log(`[WS] Clientes conectados: ${wss.clients.size}`);
  
  // Pasar el WebSocket al handler
  locationHandler(ws, wss);
  
  // Heartbeat para mantener conexión activa
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    }
  }, 30000); // Cada 30 segundos
  
  ws.on("pong", () => {
    console.log("[WS] Pong recibido - Conexión activa");
  });
  
  ws.on("error", (err) => {
    console.error("[WS ERROR]", err);
    clearInterval(heartbeatInterval);
  });
  
  ws.on("close", () => {
    console.log("[WS] Conexión cerrada");
    console.log(`[WS] Clientes restantes: ${wss.clients.size}`);
    clearInterval(heartbeatInterval);
  });
});

// Manejar errores del servidor WebSocket
wss.on("error", (err) => {
  console.error("[WSS ERROR]", err);
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP corriendo en http://localhost:${PORT}`);
  console.log(`📡 WebSocket disponible en ws://localhost:${PORT}`);
  console.log(`🔄 Health check: http://localhost:${PORT}/health`);
});

// Manejo de cierre graceful
process.on("SIGINT", () => {
  console.log("Recibido SIGINT, cerrando servidor...");
  
  // Cerrar todas las conexiones WebSocket
  wss.clients.forEach((client) => {
    client.close();
  });
  
  wss.close(() => {
    server.close(() => {
      console.log("Servidor cerrado exitosamente");
      process.exit(0);
    });
  });
});

// Manejo de errores no capturados
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});