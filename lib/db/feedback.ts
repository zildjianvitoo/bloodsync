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
    },
    select: {
      id: true,
      eventId: true,
      csat: true,
      nps: true,
      comment: true,
      createdAt: true,
    },
  });
}
