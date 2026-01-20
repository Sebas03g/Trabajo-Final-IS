export default function Home() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">
        📍 Solicitar guía
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-xl shadow">
          <h3 className="font-semibold text-lg mb-2">
            Elegoo Car
          </h3>
          <p className="text-gray-600">
            Estado: <span className="text-green-600 font-medium">Conectado</span>
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <h3 className="font-semibold text-lg mb-2">
            Amazon Echo Show
          </h3>
          <p className="text-gray-600">
            Modo: Guía por voz y pantalla
          </p>
        </div>
      </div>

      <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Iniciar Guía
      </button>
    </div>
  );
}

/*export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Elegoo Car + Echo Show</h1>
      <p className="mt-2">Sistema de guía inteligente</p>
    </div>
  );
}*/
