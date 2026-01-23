import { useState, useEffect } from "react";
import { saveMap, getMaps } from "../../services/mapsApi"; // Importar getMaps

const Ubicaciones = {
    BLOQUE_C: 'BLOQUE_C',
    BLOQUE_B: 'BLOQUE_B',
    PUERTA_1: 'PUERTA_1',
    PUNTO_ESPERA: 'PUNTO_ESPERA',
    SALIDA: 'SALIDA'
};

export default function CreateRoutesView() {
  const [points, setPoints] = useState([]);
  const [beginning, setBeginning] = useState("PUERTA_1");
  const [ending, setEnding] = useState("SALIDA");
  const [maps, setMaps] = useState([]); // Estado para almacenar mapas
  const [selectedMap, setSelectedMap] = useState(""); // ID del mapa seleccionado
  const [mapUrl, setMapUrl] = useState(""); // URL ingresada manualmente
  const [mapName, setMapName] = useState(""); // Nombre del mapa
  const [isLoadingMaps, setIsLoadingMaps] = useState(false);
  const [useCustomMap, setUseCustomMap] = useState(false); // Si usa mapa personalizado

  // Cargar mapas al iniciar
  useEffect(() => {
    loadMaps();
  }, []);

  // Cargar mapas existentes
  // Cargar mapas existentes
  const loadMaps = async () => {
    console.log("Iniciando carga de mapas...");
    setIsLoadingMaps(true);
    try {
      console.log("Llamando a getMaps()...");
      const response = await getMaps();
      console.log("Respuesta completa recibida:", response);
      
      // Manejar diferentes formatos de respuesta
      let mapsData;
      
      if (response.data) {
        // Formato: { success: true, data: [], count: X }
        mapsData = response.data;
        console.log("Formato con 'data':", mapsData);
      } else if (Array.isArray(response)) {
        // Formato: [] (array directo)
        mapsData = response;
        console.log("Formato array directo:", mapsData);
      } else {
        // Otro formato
        console.warn("Formato de respuesta desconocido:", response);
        mapsData = [];
      }
      
      console.log("mapsData procesado:", mapsData);
      
      if (!mapsData || !Array.isArray(mapsData)) {
        console.error("mapsData no es un array válido:", mapsData);
        alert("❌ Error: Los datos recibidos no tienen el formato esperado");
        setMaps([]);
        return;
      }
      
      setMaps(mapsData);
      console.log(`Se cargaron ${mapsData.length} mapas`);
      
      // Si hay mapas, seleccionar el primero por defecto
      if (mapsData.length > 0) {
        console.log("Seleccionando primer mapa:", mapsData[0]);
        setSelectedMap(mapsData[0].id);
        setMapName(mapsData[0].name);
      } else {
        console.log("No hay mapas disponibles");
        setSelectedMap("");
        setMapName("");
      }
    } catch (error) {
      console.error("Error completo al cargar mapas:", error);
      console.error("Stack trace:", error.stack);
      alert(`❌ Error al cargar mapas: ${error.message || "Error desconocido"}`);
      setMaps([]);
    } finally {
      console.log("Finalizando carga de mapas");
      setIsLoadingMaps(false);
    }
  };

  // Manejar cambio de mapa seleccionado
  const handleMapChange = (e) => {
    const mapId = e.target.value;
    setSelectedMap(mapId);
    
    if (mapId === "custom") {
      setUseCustomMap(true);
      setMapName("Mapa Personalizado");
      return;
    }
    
    setUseCustomMap(false);
    
    // Buscar el mapa seleccionado y actualizar datos
    const selected = maps.find(map => map.id === mapId);
    if (selected) {
      setMapName(selected.name);
      setPoints(selected.points || []); // Cargar puntos del mapa existente
    }
  };

  // Manejar cambio de URL personalizada
  const handleCustomUrlChange = (e) => {
    const url = e.target.value;
    setMapUrl(url);
  };

  // Manejar cambio de nombre del mapa
  const handleMapNameChange = (e) => {
    setMapName(e.target.value);
  };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x_img = e.clientX - rect.left;
    const y_img = e.clientY - rect.top;

    const lat = prompt("Latitud:");
    const lng = prompt("Longitud:");

    if (!lat || !lng) return;

    setPoints((prev) => [
      ...prev,
      {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        orden: prev.length + 1,
        x_img,
        y_img,
      },
    ]);
  };

  // Preparar el payload con o sin id_mapa
  const payload = {
    name: mapName || "Mapa Campus",
    points: points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      orden: p.orden,
      x_img: p.x_img,
      y_img: p.y_img,
    })),
    url: mapUrl,
    beginning,
    ending,
  };

  // Si no es mapa personalizado, agregar id_mapa
  if (!useCustomMap && selectedMap) {
    payload.id_mapa = selectedMap;
  }

  const handleSaveMap = async () => {
    // Validaciones
    if (!mapName.trim()) {
      alert("❌ Por favor ingresa un nombre para el mapa");
      return;
    }
    
    if (useCustomMap && !mapUrl.trim()) {
      alert("❌ Por favor ingresa una URL para el mapa");
      return;
    }

    try {
      await saveMap(payload);
      alert("🗺️ Ruta guardada correctamente");
      
      // Recargar mapas después de guardar
      loadMaps();
      setPoints([]);
      
      // Limpiar URL si era personalizada
      if (useCustomMap) {
        setMapUrl("");
      }
    } catch (error) {
      console.error("Error completo:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Obtener URL actual para mostrar
  const getCurrentMapUrl = () => {
    if (useCustomMap) {
      return mapUrl;
    } else if (selectedMap) {
      const selected = maps.find(map => map.id === selectedMap);
      return selected ? selected.url : "https://i.imgur.com/NSReF5e.png";
    }
    return "https://i.imgur.com/NSReF5e.png";
  };

  // Opciones para los selects de ubicaciones
  const ubicacionOptions = Object.entries(Ubicaciones).map(([key, value]) => (
    <option key={key} value={value}>
      {key.replace('_', ' ')}
    </option>
  ));

  // Opciones para select de mapas
  const mapOptions = [
    <option key="default" value="" disabled>
      {isLoadingMaps ? "Cargando mapas..." : "Selecciona un mapa"}
    </option>,
    ...maps.map((map) => (
      <option key={map.id} value={map.id}>
        {map.name} (ID: {map.id})
      </option>
    )),
    <option key="custom" value="custom">
      + Ingresar mapa personalizado
    </option>
  ];

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* MAPA */}
      <div>
        <h2 className="text-xl font-semibold mb-4">🗺️ Gestionar Rutas</h2>

        {/* Selección de mapa */}
        <div className="mb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Seleccionar mapa existente:
            </label>
            <select
              value={selectedMap}
              onChange={handleMapChange}
              className="w-full p-2 border rounded"
              disabled={isLoadingMaps}
            >
              {mapOptions}
            </select>
          </div>

          {/* Campo para nombre del mapa */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre del mapa:
            </label>
            <input
              type="text"
              value={mapName}
              onChange={handleMapNameChange}
              placeholder="Ej: Mapa Campus Principal"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Campo para URL personalizada (solo si seleccionó custom) */}
          {useCustomMap && (
            <div>
              <label className="block text-sm font-medium mb-1">
                URL de la imagen del mapa:
              </label>
              <input
                type="url"
                value={mapUrl}
                onChange={handleCustomUrlChange}
                placeholder="https://ejemplo.com/mapa.jpg"
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingresa la URL completa de la imagen del mapa
              </p>
            </div>
          )}

          {/* Botón para recargar mapas */}
          <button
            onClick={loadMaps}
            disabled={isLoadingMaps}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            {isLoadingMaps ? "🔄 Cargando..." : "🔄 Actualizar lista de mapas"}
          </button>
        </div>

        {/* Selects para beginning y ending */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Punto de inicio:
            </label>
            <select
              value={beginning}
              onChange={(e) => setBeginning(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {ubicacionOptions}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Punto de fin:
            </label>
            <select
              value={ending}
              onChange={(e) => setEnding(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {ubicacionOptions}
            </select>
          </div>
        </div>

        {/* Visualización del mapa */}
        <div
          className="relative inline-block border rounded shadow cursor-crosshair"
          onClick={handleMapClick}
        >
          <img 
            src={getCurrentMapUrl()} 
            alt="Mapa" 
            className="max-w-full"
            onError={(e) => {
              e.target.src = "https://i.imgur.com/NSReF5e.png";
            }}
          />

          {/* Líneas */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {points.map((p, i) =>
              i > 0 ? (
                <line
                  key={i}
                  x1={points[i - 1].x_img}
                  y1={points[i - 1].y_img}
                  x2={p.x_img}
                  y2={p.y_img}
                  stroke="blue"
                  strokeWidth="2"
                />
              ) : null
            )}
          </svg>

          {/* Puntos */}
          {points.map((p) => (
            <div
              key={p.orden}
              className="absolute w-3 h-3 bg-red-600 rounded-full"
              style={{
                left: p.x_img - 6,
                top: p.y_img - 6,
              }}
              title={`Orden ${p.orden}`}
            />
          ))}
        </div>

        <button
          onClick={handleSaveMap}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          💾 {useCustomMap ? "Guardar nuevo mapa" : "Guardar ruta en mapa existente"}
        </button>
      </div>

      {/* INFO */}
      <div>
        <h3 className="text-lg font-semibold mb-2">📌 Puntos ingresados ({points.length})</h3>

        {points.length === 0 ? (
          <p className="text-gray-500">No hay puntos aún. Haz clic en el mapa para agregar puntos.</p>
        ) : (
          <>
            <table className="w-full text-sm border mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2">Orden</th>
                  <th className="border px-2">Lat</th>
                  <th className="border px-2">Lng</th>
                  <th className="border px-2">X Img</th>
                  <th className="border px-2">Y Img</th>
                  <th className="border px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.orden}>
                    <td className="border px-2 text-center">{p.orden}</td>
                    <td className="border px-2">{p.lat}</td>
                    <td className="border px-2">{p.lng}</td>
                    <td className="border px-2">{p.x_img}</td>
                    <td className="border px-2">{p.y_img}</td>
                    <td className="border px-2 text-center">
                      <button
                        onClick={() => {
                          setPoints(points.filter(point => point.orden !== p.orden));
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button
              onClick={() => setPoints([])}
              className="mb-4 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              ❌ Eliminar todos los puntos
            </button>
          </>
        )}

        <h3 className="text-lg font-semibold mb-2">🧾 JSON a enviar</h3>
        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-80">
          {JSON.stringify(payload, null, 2)}
        </pre>
        
        {/* Información del mapa seleccionado */}
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h4 className="font-semibold mb-1">ℹ️ Información del mapa:</h4>
          <p className="text-sm">
            <strong>ID Mapa:</strong> {useCustomMap ? "(Nuevo - sin ID)" : selectedMap || "No seleccionado"}<br/>
            <strong>Nombre:</strong> {mapName || "No asignado"}<br/>
            <strong>Tipo:</strong> {useCustomMap ? "Mapa personalizado" : "Mapa existente"}<br/>
            <strong>Puntos:</strong> {points.length} puntos configurados
          </p>
        </div>
      </div>
    </div>
  );
}