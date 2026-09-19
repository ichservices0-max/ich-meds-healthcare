-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'in-person';
