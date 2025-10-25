import { prisma } from "@/lib/db/prisma";

export class RewardError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function listRewardItems(eventId?: string, includeInactive = false) {
  return prisma.rewardItem.findMany({
    where: {
      ...(eventId ? { eventId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createRewardItem(data: {
  eventId: string;
  name: string;
  cost: number;
  stock: number;
  sponsorId?: string | null;
}) {
  if (data.cost <= 0) {
    throw new RewardError("Cost must be positive");
  }
  if (data.stock < 0) {
    throw new RewardError("Stock cannot be negative");
  }

  return prisma.rewardItem.create({
    data: {
      ...data,
      sponsorId: data.sponsorId ?? null,
    },
  });
}

export async function updateRewardItem(
  id: string,
  data: Partial<{ name: string; cost: number; stock: number; isActive: boolean; sponsorId?: string | null }>
) {
  if (data.cost !== undefined && data.cost <= 0) {
    throw new RewardError("Cost must be positive");
  }
  if (data.stock !== undefined && data.stock < 0) {
    throw new RewardError("Stock cannot be negative");
  }

  return prisma.rewardItem.update({
    where: { id },
    data: {
      ...data,
      sponsorId: data.sponsorId === undefined ? undefined : data.sponsorId ?? null,
    },
  });
}

export async function deactivateRewardItem(id: string) {
  return prisma.rewardItem.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function redeemRewardItem(params: { donorId: string; rewardItemId: string }) {
  const { donorId, rewardItemId } = params;

  return prisma.$transaction(async (tx) => {
    const reward = await tx.rewardItem.findUnique({
      where: { id: rewardItemId },
    });

    if (!reward) {
      throw new RewardError("Reward not found", 404);
    }
    if (!reward.isActive) {
      throw new RewardError("Reward is not available", 400);
    }
    if (reward.stock <= 0) {
      throw new RewardError("Reward is out of stock", 409);
    }

    const balanceAggregate = await tx.point.aggregate({
      where: { donorId },
      _sum: { value: true },
    });
    const balance = balanceAggregate._sum.value ?? 0;

    if (balance < reward.cost) {
      throw new RewardError("Not enough points to redeem", 400);
    }

    const stockUpdate = await tx.rewardItem.updateMany({
      where: { id: rewardItemId, stock: { gt: 0 } },
      data: {
        stock: { decrement: 1 },
      },
    });

    if (stockUpdate.count === 0) {
      throw new RewardError("Reward just went out of stock", 409);
    }

    const redemption = await tx.redemption.create({
      data: {
        donorId,
        rewardItemId,
        cost: reward.cost,
        status: "RESERVED",
      },
      include: {
        rewardItem: true,
        donor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await tx.point.create({
      data: {
        donorId,
        value: -reward.cost,
        source: "REDEEM",
        eventId: reward.eventId,
        note: `Redeemed ${reward.name}`,
        awardKey: `redemption:${redemption.id}`,
      },
    });

    return {
      redemption,
      balance: balance - reward.cost,
    };
  });
}

export async function fulfillRedemption(id: string, fulfilledBy?: string | null) {
  const redemption = await prisma.redemption.findUnique({ where: { id } });
  if (!redemption) {
    throw new RewardError("Redemption not found", 404);
  }
  if (redemption.status === "CANCELLED") {
    throw new RewardError("Redemption was cancelled", 400);
  }
  if (redemption.status === "FULFILLED") {
    return redemption;
  }

  return prisma.redemption.update({
    where: { id },
    data: {
      status: "FULFILLED",
      fulfilledBy: fulfilledBy ?? null,
    },
  });
}

export async function cancelRedemption(id: string) {
  return prisma.$transaction(async (tx) => {
    const redemption = await tx.redemption.findUnique({
      where: { id },
      include: {
        rewardItem: true,
      },
    });

    if (!redemption) {
      throw new RewardError("Redemption not found", 404);
    }

    if (redemption.status === "FULFILLED") {
      throw new RewardError("Redeemed item already fulfilled", 400);
    }

    if (redemption.status === "CANCELLED") {
      return redemption;
    }

    await tx.rewardItem.update({
      where: { id: redemption.rewardItemId },
      data: {
        stock: { increment: 1 },
      },
    });

    await tx.point.create({
      data: {
        donorId: redemption.donorId,
        value: redemption.cost,
        source: "REFUND",
        eventId: redemption.rewardItem.eventId,
        note: `Refunded ${redemption.rewardItem.name}`,
        awardKey: `redemption_refund:${redemption.id}`,
      },
    });

    return tx.redemption.update({
      where: { id },
      data: {
        status: "CANCELLED",
        fulfilledBy: null,
      },
    });
  });
}

export async function listEventRedemptions(eventId: string, limit = 20) {
  return prisma.redemption.findMany({
    where: {
      rewardItem: {
        eventId,
      },
    },
    include: {
      rewardItem: {
        select: {
          id: true,
          name: true,
        },
      },
      donor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
