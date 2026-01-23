import { useState, useEffect } from "react";
import { getMaps } from "../../services/mapsApi";

export default function MapView() {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async () => {
    try {
      const mapsData = await getMaps();
      console.log("Datos recibidos:", mapsData);
      setMaps(mapsData.data);
    } catch (error) {
      console.error("Error cargando mapas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Cargando mapas...</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">🗺️ Lista de Mapas</h2>
      
      {maps.length === 0 ? (
        <p>No hay mapas registrados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map) => (
            <div key={map.id} className="border rounded-lg overflow-hidden shadow-sm">
              {/* Imagen del mapa */}
              <div className="h-48 overflow-hidden bg-gray-100">
                <img 
                  src={map.url} 
                  alt={map.name}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+no+disponible";
                    e.target.className = "w-full h-full object-cover";
                  }}
                />
              </div>
              
              {/* Información del mapa */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{map.name}</h3>
                
                {/* URL con opción para copiar */}
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-1">URL de la imagen:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 p-2 rounded flex-1 overflow-x-auto">
                      {map.url}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(map.url);
                        alert("URL copiada al portapapeles");
                      }}
                      className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                {/* ID del mapa (opcional) */}
                <p className="text-xs text-gray-500 mt-3">
                  ID: {map.id} • Puntos: {map.points?.length || 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}