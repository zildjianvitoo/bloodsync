import { prisma } from "@/lib/db/prisma";

export type FeedbackInput = {
  eventId: string;
  donorId?: string | null;
  csat: number;
  nps: number;
  comment?: string | null;
};

export async function createFeedback(input: FeedbackInput) {
  const trimmedComment = input.comment?.trim();

  return prisma.feedback.create({
    data: {
      eventId: input.eventId,
      donorId: input.donorId ?? null,
      csat: input.csat,
      nps: input.nps,
      comment: trimmedComment?.length ? trimmedComment : null,
      status: "PENDING",
    },
    select: {
      id: true,
      eventId: true,
      csat: true,
      nps: true,
      comment: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function listFeedbackForModeration(eventId: string, status: string, limit = 10) {
  return prisma.feedback.findMany({
    where: {
      eventId,
      status,
      comment: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
    select: {
      id: true,
      donor: {
        select: {
          id: true,
          name: true,
        },
      },
      comment: true,
      createdAt: true,
      status: true,
    },
  });
}

export async function moderateFeedback(id: string, status: "APPROVED" | "REJECTED", moderatorId: string) {
  return prisma.feedback.update({
    where: { id },
    data: {
      status,
      moderatedAt: new Date(),
      moderatedBy: moderatorId,
    },
    select: {
      id: true,
      status: true,
      moderatedAt: true,
    },
  });
}

export async function getFeedbackSummary(eventId: string) {
  const aggregate = await prisma.feedback.aggregate({
    where: {
      eventId,
      status: "APPROVED",
    },
    _avg: {
      csat: true,
      nps: true,
    },
    _count: {
      _all: true,
    },
  });

  return {
    avgCsat: aggregate._avg.csat ?? 0,
    avgNps: aggregate._avg.nps ?? 0,
    responses: aggregate._count._all ?? 0,
  };
}
