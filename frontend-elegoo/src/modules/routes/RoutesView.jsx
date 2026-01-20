import { useEffect, useState } from "react";
import { getRoutes, executeRoute } from "../../services/routesApi";

export default function RoutesView() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState(null);

  useEffect(() => {
    getRoutes()
      .then((res) => setRoutes(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleExecute = async (routeId) => {
    try {
      setExecutingId(routeId);
      await executeRoute(routeId);
      alert("🚗 Ruta enviada al robot");
    } catch (error) {
      console.error(error);
      alert("❌ Error enviando ruta");
    } finally {
      setExecutingId(null);
    }
  };

  if (loading) return <p>Cargando rutas...</p>;

  return (
    <div className="grid gap-4">
      {routes.map((route) => (
        <div
          key={route.id}
          className="bg-white p-4 rounded-xl shadow"
        >
          <h3 className="text-lg font-semibold">
            🗺️ {route.name}
          </h3>

          <p className="text-gray-600 mb-2">
            Puntos: {route.points?.length || 0}
          </p>

          <button
            onClick={() => handleExecute(route.id)}
            disabled={executingId === route.id}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {executingId === route.id
              ? "⏳ Ejecutando..."
              : "▶ Ejecutar ruta"}
          </button>
        </div>
      ))}
    </div>
  );
}
