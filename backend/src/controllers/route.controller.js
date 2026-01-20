import { getRouteById } from "../services/routeService.js";
import { publishRoute } from "../mqtt/mqttClient.js";

export const executeRoute = async (req, res) => {
  try {
    const route = await getRouteById(req.params.id);

    if (!route) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    await publishRoute(route);

    res.json({ message: "Ruta enviada al robot" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error ejecutando ruta" });
  }
};
