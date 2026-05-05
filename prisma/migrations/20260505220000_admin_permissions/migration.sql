-- AlterTable
ALTER TABLE "AdminAccount" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
