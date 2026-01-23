// frontend/src/services/mapsApi.js
const API_URL = "http://localhost:3000/api/rutas";

export const saveMap = async (mapa, tipo) => {
  try {
    console.log("📤 Enviando payload:", mapa); // Para debug

    
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mapa), // Envía directamente el objeto
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    }
    
    console.log("📥 Respuesta recibida:", data); // Para debug
    return data;
  } catch (error) {
    console.error("❌ Error en saveMap:", error);
    throw error;
  }
};

export const getMaps = async () => {
  try {
    console.log("🔄 Llamando a /api/mapas/todos...");
    const res = await fetch("http://localhost:3000/api/mapas/todos", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    console.log("📦 Respuesta recibida, status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error en la respuesta:", errorText);
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log("✅ Datos recibidos:", data);
    return data;
    
  } catch (error) {
    console.error("❌ Error en getMaps:", error);
    throw error;
  }
};

export const getRoutes = async () => {
  try {
    console.log("🔄 Llamando a /api/rutas/...");
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    console.log("📦 Respuesta recibida, status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error en la respuesta:", errorText);
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log("✅ Datos recibidos:", data);
    return data;
    
  } catch (error) {
    console.error("❌ Error en getMaps:", error);
    throw error;
  }
};


export const createMap = async (mapa) => {
  try {
    console.log("📤 Enviando payload:", mapa); // Para debug
    
    
    const res = await fetch("http://localhost:3000/api/mapas/crear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mapa), // Envía directamente el objeto
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    }
    
    console.log("📥 Respuesta recibida:", data); // Para debug
    return data;
  } catch (error) {
    console.error("❌ Error en saveMap:", error);
    throw error;
  }
};
