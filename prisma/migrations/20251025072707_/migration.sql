-- CreateTable
CREATE TABLE "SchedulePoll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchedulePoll_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchedulePollOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchedulePollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "SchedulePoll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchedulePollResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "donorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchedulePollResponse_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "SchedulePoll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SchedulePollResponse_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SchedulePollOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SchedulePollResponse_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT,
    "actorId" TEXT,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Broadcast_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Broadcast_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Donor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
