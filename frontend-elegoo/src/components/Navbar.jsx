import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex gap-4">
      <NavLink to="/" className="hover:underline">
        Home
      </NavLink>
      <NavLink to="/rutas" className="hover:underline">
        Rutas
      </NavLink>
      <NavLink to="/guia" className="hover:underline">
        Guía
      </NavLink>
    </nav>
  );
}
