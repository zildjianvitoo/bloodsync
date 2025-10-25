import { prisma } from "@/lib/db/prisma";

export type CreateReferralInput = {
  eventId: string;
  referrerId: string;
  inviteeEmail?: string | null;
};

export async function createReferral(input: CreateReferralInput) {
  return prisma.referral.create({
    data: {
      eventId: input.eventId,
      referrerId: input.referrerId,
      inviteeEmail: input.inviteeEmail ?? null,
    },
  });
}

export async function markReferralAccepted(referralId: string, inviteeId: string) {
  return prisma.referral.update({
    where: { id: referralId },
    data: {
      inviteeId,
      acceptedAt: new Date(),
      status: "ACCEPTED",
    },
  });
}

export async function markReferralCompleted(referralId: string) {
  return prisma.referral.update({
    where: { id: referralId },
    data: {
      completedAt: new Date(),
      status: "COMPLETED",
    },
  });
}

export async function getReferralStats(eventId: string) {
  const [invites, accepted, completed] = await Promise.all([
    prisma.referral.count({ where: { eventId } }),
    prisma.referral.count({ where: { eventId, status: { in: ["ACCEPTED", "COMPLETED"] } } }),
    prisma.referral.count({ where: { eventId, status: "COMPLETED" } }),
  ]);
  const kFactor = invites > 0 ? accepted / invites : 0;
  return {
    invites,
    accepted,
    completed,
    kFactor,
  };
}

export async function listEventReferrals(eventId: string, limit = 10) {
  return prisma.referral.findMany({
    where: { eventId },
    orderBy: { inviteSentAt: "desc" },
    take: limit,
    select: {
      id: true,
      inviteeEmail: true,
      inviteSentAt: true,
      status: true,
      completedAt: true,
      acceptedAt: true,
      referrer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
