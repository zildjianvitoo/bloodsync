import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const POINT_RULES = {
  SIGN_UP: 5,
  ATTEND: 20,
  COMPLETE: 50,
  REFERRAL: 15,
} as const;

export type PointSource = keyof typeof POINT_RULES | "REDEEM" | "REFUND" | "ADJUST";

export type AwardPointInput = {
  donorId: string;
  source: PointSource;
  value: number;
  eventId?: string | null;
  note?: string | null;
  awardKey?: string | null;
};

const UNIQUE_CONFLICT_CODE = "P2002";

export function buildAwardKey(
  source: PointSource,
  donorId: string,
  eventId?: string | null
) {
  return `${source}:${eventId ?? "global"}:${donorId}`;
}

export async function awardPoints(input: AwardPointInput) {
  return prisma.point.create({
    data: {
      donorId: input.donorId,
      value: input.value,
      source: input.source,
      eventId: input.eventId ?? null,
      note: input.note ?? null,
      awardKey: input.awardKey ?? null,
    },
  });
}

export async function awardPointsOnce(input: AwardPointInput) {
  try {
    return await awardPoints({
      ...input,
      awardKey: input.awardKey ?? buildAwardKey(input.source, input.donorId, input.eventId),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_CONFLICT_CODE
    ) {
      return null;
    }
    throw error;
  }
}

export async function getPointSummary(donorId: string) {
  const [aggregate, ledger] = await Promise.all([
    prisma.point.groupBy({
      by: ["source"],
      where: { donorId },
      _sum: { value: true },
    }),
    prisma.point.findMany({
      where: { donorId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        value: true,
        source: true,
        note: true,
        createdAt: true,
        eventId: true,
      },
    }),
  ]);

  const totals = aggregate.reduce(
    (acc, item) => {
      const value = item._sum.value ?? 0;
      if (value >= 0) {
        acc.earned += value;
      } else {
        acc.spent += Math.abs(value);
      }
      acc.balance += value;
      return acc;
    },
    { balance: 0, earned: 0, spent: 0 }
  );

  return {
    balance: totals.balance,
    earned: totals.earned,
    spent: totals.spent,
    ledger,
  };
}

export async function getPointBalance(donorId: string) {
  const sum = await prisma.point.aggregate({
    where: { donorId },
    _sum: { value: true },
  });
  return sum._sum.value ?? 0;
}
