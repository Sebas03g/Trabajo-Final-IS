import * as service from "../services/skillService.js";
import { publishRoute } from "../mqtt/mqttClient.js";

export const getRoute = async (req, res) => {
  try {
    const routes = await service.getAllRoutes();
    res.json(routes);
  } catch (error) {
    next(error);
  }
};



