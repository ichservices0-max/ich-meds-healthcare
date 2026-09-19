-- Add tokenNumber column as nullable
ALTER TABLE "appointments" ADD COLUMN "tokenNumber" INTEGER;

-- Backfill tokenNumber per session based on createdAt order
UPDATE "appointments" a
SET "tokenNumber" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "sessionId" ORDER BY "createdAt") AS rn
  FROM "appointments"
) sub
WHERE a.id = sub.id;

-- Make tokenNumber NOT NULL
ALTER TABLE "appointments" ALTER COLUMN "tokenNumber" SET NOT NULL;

