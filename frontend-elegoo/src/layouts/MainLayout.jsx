import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar"; // ✅ IMPORT CORRECTO

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}

