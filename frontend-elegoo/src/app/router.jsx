import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Rutas from "../pages/Rutas";
import Guia from "../pages/Guia";
import Mapas from "../pages/Mapas";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/rutas", element: <Rutas /> },
      { path: "/guia", element: <Guia /> },
      { path: "/Mapas", element: <Mapas /> },
    ],
  },
]);

export default router;
