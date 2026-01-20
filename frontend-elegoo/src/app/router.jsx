import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Rutas from "../pages/Rutas";
import Guia from "../pages/Guia";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/rutas", element: <Rutas /> },
      { path: "/guia", element: <Guia /> },
    ],
  },
]);

export default router;
