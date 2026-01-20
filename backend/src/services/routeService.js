import prisma from "../config/prisma.js";

export const getAllRoutes = () => {
  return prisma.route.findMany();
};

export const createRoute = (data) => {
  return prisma.route.create({
    data: {
      name: data.name,
      points: data.points
    }
  });
};

export const getRouteById = (id) => {
  return prisma.route.findUnique({
    where: { id: Number(id) }
  });
};

export const getAllRoutesBeginningEnd = (beginning, ending) => {
  return prisma.route.findMany({
    where: {beginnig: String(beginning), ending: String(ending)}
  });

}




