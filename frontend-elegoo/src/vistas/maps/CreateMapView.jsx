import { useState } from "react";
import { createMap } from "../../services/mapsApi"; // Cambiado a createMap

export default function CreateMapView() {
  const [mapName, setMapName] = useState(""); // Nombre del mapa
  const [mapUrl, setMapUrl] = useState(""); // URL de la imagen

  // Manejar cambio de nombre del mapa
  const handleMapNameChange = (e) => {
    setMapName(e.target.value);
  };

  // Manejar cambio de URL
  const handleMapUrlChange = (e) => {
    setMapUrl(e.target.value);
  };

  // Preparar el payload simple con solo nombre y URL
  const payload = {
    name: mapName.trim(), // Asegurar que no tenga espacios extra
    url: mapUrl      // Asegurar que no tenga espacios extra
  };

  const handleCreateMap = async () => {
    // Validaciones básicas
    if (!mapName.trim()) {
      alert("❌ Por favor ingresa un nombre para el mapa");
      return;
    }
    
    if (!mapUrl.trim()) {
      alert("❌ Por favor ingresa una URL para la imagen del mapa");
      return;
    }

    try {
      console.log("Enviando payload:", payload);
      await createMap(payload); // Llamar a createMap en lugar de saveMap
      alert("🗺️ Mapa creado correctamente");
      
      // Limpiar formulario después de crear
      setMapName("");
      setMapUrl("");
    } catch (error) {
      console.error("Error completo:", error);
      alert(`❌ Error: ${error.message || "No se pudo crear el mapa"}`);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">🗺️ Crear Nuevo Mapa</h2>

      <div className="max-w-2xl mx-auto">
        {/* Formulario simple */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Campo para nombre del mapa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del mapa: *
              </label>
              <input
                type="text"
                value={mapName}
                onChange={handleMapNameChange}
                placeholder="Ej: Mapa Campus Principal"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre descriptivo para identificar el mapa
              </p>
            </div>

            {/* Campo para URL de la imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de la imagen del mapa: *
              </label>
              <input
                type="url"
                value={mapUrl}
                onChange={handleMapUrlChange}
                placeholder="https://imgur.com/NSReF5e"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL completa de la imagen (debe comenzar con http:// o https://)
              </p>
              
              {/* Vista previa de la imagen */}
              {mapUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={mapUrl} 
                      alt="Vista previa del mapa" 
                      className="w-full h-auto max-h-64 object-contain"
                      onError={(e) => {
                        e.target.src = "https://imgur.com/NSReF5e";
                        e.target.className = "w-full h-64 object-cover";
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Si no ves la imagen, verifica que la URL sea correcta y pública
                  </p>
                </div>
              )}
            </div>

            {/* Información del payload */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">🧾 JSON que se enviará:</h3>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>

            {/* Botón para crear mapa */}
            <div className="pt-4">
              <button
                onClick={handleCreateMap}
                disabled={!mapName.trim() || !mapUrl.trim()}
                className={`w-full py-3 px-4 rounded-lg font-medium ${
                  !mapName.trim() || !mapUrl.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                🗺️ Crear Nuevo Mapa
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}