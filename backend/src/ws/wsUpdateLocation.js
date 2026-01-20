export * as service from '../services/GestionarRobotService.js'

export default function (ws, wss) {
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (!data?.payload?.id || !data?.payload?.punto) {
        return ws.send(JSON.stringify({
          type: "ERROR",
          message: "Faltan parámetros en el payload (id o punto inválido)"
        }));
      }

      const dispositivo = await service.getDispositivoByID(data.payload.id);

      if (!dispositivo) {
        return ws.send(JSON.stringify({
          type: "ERROR",
          message: "Dispositivo no encontrado"
        }));
      }

      const actualizado = await prisma.dispositivo.update({
        where: {id : Number(data.payload.id)},
        data: {
            lat: data.latitude,
            lng: data.longitud,
            cardinalDirection: data.cardinalDirection,
        }
      });

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
}
