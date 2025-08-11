/*
  Warnings:

  - You are about to drop the `DrawingOp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DrawingSnapshot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DrawingOp" DROP CONSTRAINT "DrawingOp_roomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DrawingSnapshot" DROP CONSTRAINT "DrawingSnapshot_roomId_fkey";

-- DropTable
DROP TABLE "public"."DrawingOp";

-- DropTable
DROP TABLE "public"."DrawingSnapshot";
