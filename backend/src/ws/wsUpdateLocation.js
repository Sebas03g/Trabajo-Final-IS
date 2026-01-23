// ws/locationHandler.js (archivo separado)
import dispositivoService from '../servicios/dispositivo.service.js';
import navegacionService from '../servicios/navegacion.service.js';
import guiaService from '../servicios/guia.service.js';

export default function locationHandler(ws, wss) {
    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (!data?.payload?.id || data?.payload?.lat === undefined || data?.payload?.lng === undefined) {
                return ws.send(JSON.stringify({
                    type: "ERROR",
                    message: "Faltan parámetros: id, lat, lng"
                }));
            }
            
            // Buscar dispositivo por ID del robot
            const dispositivo = await dispositivoService.obtenerDispositivoPorRobot(data.payload.id);
            
            if (!dispositivo) {
                return ws.send(JSON.stringify({
                    type: "ERROR",
                    message: "Dispositivo no encontrado para este robot"
                }));
            }
            
            // Actualizar ubicación
            const actualizado = await dispositivoService.actualizarUbicacionYDireccion(
                dispositivo.id,
                data.payload.lat,
                data.payload.lng,
                data.payload.cardinalDirection || dispositivo.cardinalDirection
            );
            
            // Verificar si el robot tiene guía activa
            const guia = await guiaService.obtenerGuiaPorRobot(data.payload.id);
            
            if (guia && !guia.estaCompletada()) {
                // Continuar navegación automática
                await navegacionService.ejecutarNavegacionAutomatica(guia.id);
            }
            
            ws.send(JSON.stringify({
                type: "ACTUALIZADO",
                payload: actualizado
            }));
            
            // Emitir a todos los clientes WebSocket
            wss.clients.forEach((client) => {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify({
                        type: "LOCATION_UPDATE",
                        robotId: data.payload.id,
                        location: {
                            lat: data.payload.lat,
                            lng: data.payload.lng,
                            direction: data.payload.cardinalDirection
                        },
                        timestamp: new Date().toISOString()
                    }));
                }
            });
            
        } catch (err) {
            console.error("Error en WebSocket:", err);
            ws.send(JSON.stringify({
                type: "ERROR",
                message: "Error procesando la solicitud"
            }));
        }
    });
    
    ws.on("close", () => {
        console.log("[WS] Cliente desconectado");
    });
    
    ws.on("error", (error) => {
        console.error("[WS] Error:", error);
    });
}