import { prisma } from "@/lib/db/prisma";
import { BADGE_META, type BadgeKey } from "@/lib/badges/meta";

async function awardBadge(donorId: string, key: BadgeKey) {
  const existing = await prisma.badge.findFirst({
    where: { donorId, key },
  });
  if (existing) {
    return existing;
  }
  return prisma.badge.create({
    data: {
      donorId,
      key,
    },
  });
}

export async function awardCompletionBadges(donorId: string) {
  const completed = await prisma.appointment.count({
    where: {
      donorId,
      status: "DONE",
    },
  });

  const awards: BadgeKey[] = [];
  if (completed >= 1) {
    await awardBadge(donorId, "FIRST_DROP");
    awards.push("FIRST_DROP");
  }
  if (completed >= 3) {
    await awardBadge(donorId, "THREES_A_CHARM");
    awards.push("THREES_A_CHARM");
  }
  return awards;
}

const ON_TIME_GRACE_MINUTES = Number(process.env.ON_TIME_GRACE_MINUTES ?? 5);

export async function awardOnTimeBadge(
  donorId: string,
  slotTime: Date | null,
  checkinTime: Date
) {
  if (!slotTime || ON_TIME_GRACE_MINUTES <= 0) return null;
  const windowMs = ON_TIME_GRACE_MINUTES * 60 * 1000;
  if (checkinTime.getTime() > slotTime.getTime() + windowMs) {
    return null;
  }
  await awardBadge(donorId, "ON_TIME");
  return "ON_TIME";
}

export async function listDonorBadges(donorId: string) {
  return prisma.badge.findMany({
    where: { donorId },
    orderBy: { awardedAt: "desc" },
  });
}

export { BADGE_META } from "./meta";
