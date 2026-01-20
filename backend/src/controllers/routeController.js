import * as service from "../services/routeService.js";
import { publishRoute } from "../mqtt/mqttClient.js";

export const getRoutes = async (req, res) => {
  try {
    const routes = await service.getAllRoutes();
    res.json(routes);
  } catch (error) {
    next(error);
  }
};

export const createRoute = async (req, res) => {
  const route = await service.createRoute(req.body);
  res.status(201).json(route);
};

export const executeRoute = async (req, res) => {
  try {
    const route = await service.getRouteById(req.params.id);

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


