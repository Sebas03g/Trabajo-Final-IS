import { useEffect, useState } from "react";
import { getRoutes } from "../../services/mapsApi";

export default function RoutesView() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("HOLA")
      const data = await getRoutes();
      console.log(data);
      // Asumiendo que la respuesta viene como { data: [...] } o directamente el array
      const routesData = data.data || data;
      setRoutes(Array.isArray(routesData) ? routesData : []);
    } catch (err) {
      console.error("Error cargando rutas:", err);
      setError("No se pudieron cargar las rutas. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatUbicacion = (ubicacion) => {
    // Convertir de formato "BLOQUE_C" a "Bloque C"
    return ubicacion
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando rutas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadRoutes}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500 text-lg">No hay rutas creadas aún</p>
        <p className="text-gray-400 mt-2">Crea tu primera ruta para comenzar</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🗺️ Rutas Configuradas</h1>
        <button
          onClick={loadRoutes}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Final
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Mapa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600">🗺️</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{route.name}</div>
                        <div className="text-sm text-gray-500">
                          {route.points?.length || 0} puntos • Creada:{" "}
                          {new Date(route.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {formatUbicacion(route.beginning)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      {formatUbicacion(route.ending)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      #{route.id_mapa || "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información resumen */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          Mostrando <span className="font-semibold">{routes.length}</span>{" "}
          ruta{routes.length !== 1 ? "s" : ""} configurada{routes.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Versión alternativa: Cards para dispositivos móviles */}
      <div className="mt-8 md:hidden">
        <h3 className="text-lg font-semibold mb-4">Vista móvil</h3>
        <div className="space-y-4">
          {routes.map((route) => (
            <div key={route.id} className="bg-white p-4 rounded-xl shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">🗺️ {route.name}</h3>
                <span className="text-xs text-gray-500">
                  ID: {route.id}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Inicio</p>
                  <p className="font-medium">{formatUbicacion(route.beginning)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Final</p>
                  <p className="font-medium">{formatUbicacion(route.ending)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Mapa</p>
                  <p className="font-medium">#{route.id_mapa || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Puntos</p>
                  <p className="font-medium">{route.points?.length || 0}</p>
                </div>
              </div>

              <button
                onClick={() => handleExecute(route.id)}
                disabled={executingId === route.id}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {executingId === route.id ? "⏳ Ejecutando..." : "▶ Ejecutar ruta"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}