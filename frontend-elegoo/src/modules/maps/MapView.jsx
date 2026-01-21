import { useState } from "react";
import { saveMap } from "../../services/mapsApi";

const MAP_URL = "https://i.imgur.com/NSReF5e.png";

export default function MapView() {
  const [points, setPoints] = useState([]);

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lat = prompt("Latitud:");
    const lng = prompt("Longitud:");

    if (!lat || !lng) return;

    setPoints((prev) => [
      ...prev,
      {
        x,
        y,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        orden: prev.length + 1,
      },
    ]);
  };

  const payload = {
    name: "Mapa Campus",
    puntos: points.map(({ lat, lng, orden }) => ({
      lat,
      lng,
      orden,
    })),
  };

  const handleSaveMap = async () => {
    await saveMap(payload);
    alert("🗺️ Mapa guardado correctamente");
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* MAPA */}
      <div>
        <h2 className="text-xl font-semibold mb-4">🗺️ Gestionar Mapas</h2>

        <div
          className="relative inline-block border rounded shadow cursor-crosshair"
          onClick={handleMapClick}
        >
          <img src={MAP_URL} alt="Mapa" />

          {/* Líneas (ruta visual) */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {points.map((p, i) =>
              i > 0 ? (
                <line
                  key={i}
                  x1={points[i - 1].x}
                  y1={points[i - 1].y}
                  x2={p.x}
                  y2={p.y}
                  stroke="blue"
                  strokeWidth="2"
                />
              ) : null
            )}
          </svg>

          {/* Puntos */}
          {points.map((p, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-red-600 rounded-full"
              style={{ left: p.x - 6, top: p.y - 6 }}
              title={`Orden ${p.orden}`}
            />
          ))}
        </div>

        <button
          onClick={handleSaveMap}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          💾 Guardar mapa
        </button>
      </div>

      {/* INFO / JSON */}
      <div>
        <h3 className="text-lg font-semibold mb-2">📌 Puntos ingresados</h3>

        {points.length === 0 ? (
          <p className="text-gray-500">No hay puntos aún</p>
        ) : (
          <table className="w-full text-sm border mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2">Orden</th>
                <th className="border px-2">Lat</th>
                <th className="border px-2">Lng</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.orden}>
                  <td className="border px-2 text-center">{p.orden}</td>
                  <td className="border px-2">{p.lat}</td>
                  <td className="border px-2">{p.lng}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3 className="text-lg font-semibold mb-2">🧾 JSON a enviar</h3>
        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-80">
{JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}
