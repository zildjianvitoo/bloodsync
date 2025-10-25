-- Add event reference and metadata to point ledger
ALTER TABLE "Point" ADD COLUMN "eventId" TEXT REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Point" ADD COLUMN "note" TEXT;
ALTER TABLE "Point" ADD COLUMN "awardKey" TEXT;

CREATE UNIQUE INDEX "Point_awardKey_key" ON "Point"("awardKey");
