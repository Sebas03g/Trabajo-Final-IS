/*
  Warnings:

  - Added the required column `beginning` to the `Route` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ending` to the `Route` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoRobot" AS ENUM ('OCUPADO', 'MANTENIMIENTO', 'LIBRE');

-- CreateEnum
CREATE TYPE "Ubicaciones" AS ENUM ('BLOQUE_C', 'BLOQUE_B', 'PUERTA_1', 'PUNTO_ESPERA', 'SALIDA');

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "beginning" "Ubicaciones" NOT NULL,
ADD COLUMN     "ending" "Ubicaciones" NOT NULL;

-- CreateTable
CREATE TABLE "Mapa" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Mapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guia" (
    "id" SERIAL NOT NULL,
    "id_ruta" INTEGER NOT NULL,
    "puntoActual" INTEGER NOT NULL DEFAULT 0,
    "id_robot" INTEGER NOT NULL,

    CONSTRAINT "Guia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispositivo" (
    "id" SERIAL NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "cardinalDirection" DOUBLE PRECISION NOT NULL,
    "robotId" INTEGER,

    CONSTRAINT "Dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsistentedeVoz" (
    "id" SERIAL NOT NULL,
    "ubicacion" "Ubicaciones" NOT NULL,
    "estado" "EstadoRobot" NOT NULL DEFAULT 'LIBRE',
    "id_rutaActual" INTEGER,

    CONSTRAINT "AsistentedeVoz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RobotAutomatico" (
    "id" SERIAL NOT NULL,
    "estado" "EstadoRobot" NOT NULL DEFAULT 'LIBRE',
    "clienteID" TEXT NOT NULL,
    "batteryLevel" INTEGER DEFAULT 100,
    "id_rutaActual" INTEGER,

    CONSTRAINT "RobotAutomatico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AsistenteRobot" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AsistenteRobot_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Guia_id_ruta_idx" ON "Guia"("id_ruta");

-- CreateIndex
CREATE INDEX "Guia_id_robot_idx" ON "Guia"("id_robot");

-- CreateIndex
CREATE UNIQUE INDEX "Dispositivo_robotId_key" ON "Dispositivo"("robotId");

-- CreateIndex
CREATE INDEX "Dispositivo_robotId_idx" ON "Dispositivo"("robotId");

-- CreateIndex
CREATE INDEX "RobotAutomatico_clienteID_idx" ON "RobotAutomatico"("clienteID");

-- CreateIndex
CREATE INDEX "RobotAutomatico_id_rutaActual_idx" ON "RobotAutomatico"("id_rutaActual");

-- CreateIndex
CREATE INDEX "_AsistenteRobot_B_index" ON "_AsistenteRobot"("B");
