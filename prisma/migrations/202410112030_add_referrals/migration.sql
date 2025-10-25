CREATE TABLE "Referral" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "eventId" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "inviteeId" TEXT,
  "inviteeEmail" TEXT,
  "inviteSentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" DATETIME,
  "completedAt" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'INVITED',
  CONSTRAINT "Referral_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Referral_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "Donor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
