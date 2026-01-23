import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../PaginasPrincipales/Home";
import Rutas from "../PaginasPrincipales/Rutas";
import Mapas from "../PaginasPrincipales/Mapas";
import CreateMaps from "../PaginasPrincipales/CrearMapa";
import CreateRoutes from "../PaginasPrincipales/CrearRuta";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/crear-rutas", element: <CreateRoutes /> },
      { path: "/rutas", element: <Rutas /> },
      { path: "/crear-mapas", element: <CreateMaps /> },
      { path: "/mapas", element: <Mapas /> },
    ],
  },
]);

export default router;
