import api from "../../app/api";

// Obtener todas las rutas
//export const getRoutes = () => api.get("/routes");
export const getRoutes = async () => {
  const response = await api.get("/routes");
  return response.data;
};

// Crear nueva ruta
export const createRoute = (data) => api.post("/routes", data);
