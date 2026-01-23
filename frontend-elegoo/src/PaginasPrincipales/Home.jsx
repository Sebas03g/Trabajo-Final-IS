import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleCrearRuta = () => {
    navigate("/crear-rutas");
  };
  
  const handleCrearMapa = () => {
    navigate("/crear-mapas");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                🚀 Sistema de Navegación Inteligente
              </h1>
              <p className="text-gray-600 mt-2">
                Controla robots guía y gestiona rutas de manera inteligente
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Sistema activo</span>
            </div>
          </div>
        </header>

        {/* Panel principal */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Dispositivos */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-blue-600">📍</span> Estado de Dispositivos
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Tarjeta Elegoo Car */}
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🤖</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Elegoo Car</h3>
                        <p className="text-sm text-gray-500">Robot de navegación</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-600">Online</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600">Batería</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">85%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600">Última conexión</span>
                      <span className="text-sm font-medium text-gray-700">Hace 2 min</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Amazon Echo Show */}
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📱</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Amazon Echo Show</h3>
                        <p className="text-sm text-gray-500">Interfaz de usuario</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-600">Activo</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-600">Modo actual</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        Guía por voz y pantalla
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-600">Volumen</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">70%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📊</span> Resumen del Sistema
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">12</div>
                  <div className="text-blue-100 text-sm">Rutas creadas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-blue-100 text-sm">Mapas activos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-blue-100 text-sm">Disponibilidad</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-blue-100 text-sm">Eficiencia</div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Acciones rápidas */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="text-blue-600">⚡</span> Acciones Rápidas
                </h3>

                <div className="space-y-4">
                  {/* Botón Crear Ruta */}
                  <button 
                    onClick={handleCrearRuta}
                    className="w-full group flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-xl">🗺️</span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold">Crear Nueva Ruta</div>
                        <div className="text-blue-100 text-sm">Definir recorridos en mapas</div>
                      </div>
                    </div>
                    <span className="text-lg opacity-80 group-hover:translate-x-1 transition-transform">→</span>
                  </button>

                  {/* Botón Crear Mapa */}
                  <button 
                    onClick={handleCrearMapa}
                    className="w-full group flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-xl">🗾</span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold">Crear Nuevo Mapa</div>
                        <div className="text-green-100 text-sm">Agregar imagen de mapa</div>
                      </div>
                    </div>
                    <span className="text-lg opacity-80 group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

                {/* Acciones adicionales */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-3">Otras acciones</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="flex items-center gap-2 text-gray-700">
                        <span>📋</span>
                        <span>Ver rutas existentes</span>
                      </span>
                    </button>
                    <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="flex items-center gap-2 text-gray-700">
                        <span>⚙️</span>
                        <span>Configuración del sistema</span>
                      </span>
                    </button>
                    <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="flex items-center gap-2 text-gray-700">
                        <span>📈</span>
                        <span>Ver estadísticas</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Información del sistema */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-600">Estado del sistema:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      Óptimo
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Todos los sistemas funcionando correctamente. Última verificación: hace 5 minutos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer o información adicional */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Sistema de Navegación Inteligente • Versión 2.1.0 • © 2024</p>
        </div>
      </div>
    </div>
  );
}