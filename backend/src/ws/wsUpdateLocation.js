const dispositivoService = require('../servicios/dispositivo.service');
const navegacionService = require('../servicios/navegacion.service');

module.exports = function (ws, wss) {
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
            const guiaService = require('../servicios/guia.service');
            const guia = await guiaService.obtenerGuiaPorRobot(data.payload.id);
            
            if (guia && !guia.estaCompletada()) {
                // Continuar navegación automática
                await navegacionService.ejecutarNavegacionAutomatica(guia.id);
            }
            
            ws.send(JSON.stringify({
                type: "ACTUALIZADO",
                payload: actualizado
            }));
            
        } catch (err) {
            console.error("Error en WebSocket:", err);
            ws.send(JSON.stringify({
                type: "ERROR",
                message: "Error procesando la solicitud"
            }));
        }
    });
};