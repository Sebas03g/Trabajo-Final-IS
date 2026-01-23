/*
  Warnings:

  - Added the required column `id_mapa` to the `Route` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "id_mapa" INTEGER NOT NULL;
