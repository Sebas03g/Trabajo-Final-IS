import RoutesView from "../modules/routes/RoutesView";

export default function Rutas() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        📍 Rutas disponibles
      </h2>

      <RoutesView />
    </div>
  );
}
