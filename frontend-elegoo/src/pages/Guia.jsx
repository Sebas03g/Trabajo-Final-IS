export default function Guia() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">🧭 Guía activa</h2>

      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <p className="text-lg">
          📢 Instrucción actual:
        </p>

        <p className="text-blue-600 font-semibold text-xl">
          “Avance 5 metros y gire a la derecha”
        </p>

        <div className="flex gap-4 mt-4">
          <button className="px-4 py-2 bg-red-600 text-white rounded">
            Detener
          </button>
          <button className="px-4 py-2 bg-yellow-500 text-white rounded">
            Pausar
          </button>
        </div>
      </div>
    </div>
  );
}
