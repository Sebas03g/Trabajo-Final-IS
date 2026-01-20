import { useEffect, useState } from "react";
import { getRoutes } from "./routesService";

export function useRoutesController() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRoutes()
      .then(res => {
        setRoutes(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Error cargando rutas");
        setLoading(false);
      });
  }, []);

  return { routes, loading, error };
}
