import prisma from "../config/prisma.js";
import mqttService from '../services/mqttService.js'; 

export const findRouteByDestination = async ({
  id_asistente,
  beginning,
  ending
}) => {

  // 1️⃣ Obtener asistente con robots
  const asistente = await prisma.asistentedeVoz.findUnique({
    where: { id: Number(id_asistente) },
    include: { robots: true }
  });

  if (!asistente) {
    throw new Error("Asistente no encontrado");
  }

  // 2️⃣ Buscar robots libres
  const robotLibre = asistente.robots.find(
    (r) => r.estado === "LIBRE"
  );

  if (!robotLibre) {
    throw new Error("No hay robots disponibles");
  }

  // 3️⃣ Buscar rutas
  const rutas = await prisma.route.findMany({
    where: {
      beginning,
      ending
    }
  });

  if (rutas.length === 0) {
    throw new Error("No existen rutas para ese destino");
  }

  return {robotLibre, rutas}
};

export const inicializeGuide = async ({
    id_robot,
    id_asistente,
    id_route,
}) => {
    prisma.robotAutomatico.update({
        where: {id : Number(id_robot)},
        data: {
            estado: "OCUPADO",
            rutaActual: id_route
        }
    });

    prisma.asistentedeVoz.update({
        where: {id : Number(id_asistente)},
        data: {
            estado: "OCUPADO"
        }
    });

    
};

export const startDirection = async({
  id_robot,
  id_asistente,
  id_route,
}) => {
  
};

export const makeMovement = async({
  id_robot,
  direction
}) => {
  const result = await mqttService.sendBasicMovement(id_robot, direction, {
      speed:50,
  });
} 