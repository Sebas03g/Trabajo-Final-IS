import prisma from "../config/prisma.js";

export const getDispositivosActivos = async() => {
    return await prisma.robotAutomatico.getAll({
        where: {estado: "OCUPADO"},
        include: {dispositivo: true}
    });
}

export const getDispositivoByID = async(id) => {
    return await prisma.dispositivo.findUnique({
        where: {id: parseInt(id)},
    });
}