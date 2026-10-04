-- Add the owner as nullable first so existing customer data can be backfilled.
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Existing data belongs to nghia. If that account is absent, use the oldest
-- existing account so the migration remains usable on older installations.
UPDATE "Customer"
SET "userId" = COALESCE(
  (SELECT "id" FROM "User" WHERE "username" = 'nghia' LIMIT 1),
  (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE "userId" IS NULL;

ALTER TABLE "Customer" ALTER COLUMN "userId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Customer_userId_fkey'
  ) THEN
    ALTER TABLE "Customer"
    ADD CONSTRAINT "Customer_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Customer_userId_createdAt_idx"
ON "Customer"("userId", "createdAt");
