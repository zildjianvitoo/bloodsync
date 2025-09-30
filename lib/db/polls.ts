import { prisma } from "@/lib/db/prisma";

export class PollResponseError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type PollSummary = {
  poll: {
    id: string;
    question: string;
    totalResponses: number;
  };
  options: {
    id: string;
    label: string;
    votes: number;
  }[];
};

export async function getSchedulePollForEvent(eventId: string) {
  return prisma.schedulePoll.findFirst({
    where: { eventId },
    include: {
      options: {
        include: {
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          responses: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getPollSummary(pollId: string): Promise<PollSummary | null> {
  const poll = await prisma.schedulePoll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        include: {
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          responses: true,
        },
      },
    },
  });

  if (!poll) {
    return null;
  }

  return {
    poll: {
      id: poll.id,
      question: poll.question,
      totalResponses: poll._count.responses,
    },
    options: poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      votes: option._count.responses,
    })),
  };
}

export async function recordPollResponse(
  pollId: string,
  optionId: string,
  donorId?: string | null
) {
  return prisma.$transaction(async (tx) => {
    const poll = await tx.schedulePoll.findUnique({
      where: { id: pollId },
      select: { id: true },
    });

    if (!poll) {
      throw new PollResponseError("Poll not found", 404);
    }

    const option = await tx.schedulePollOption.findFirst({
      where: {
        id: optionId,
        pollId,
      },
      select: { id: true },
    });

    if (!option) {
      throw new PollResponseError("Invalid poll option", 404);
    }

    if (donorId) {
      const existing = await tx.schedulePollResponse.findFirst({
        where: {
          pollId,
          donorId,
        },
        select: {
          id: true,
          optionId: true,
        },
      });

      if (existing) {
        if (existing.optionId === optionId) {
          return existing;
        }

        return tx.schedulePollResponse.update({
          where: { id: existing.id },
          data: {
            optionId,
          },
        });
      }
    }

    return tx.schedulePollResponse.create({
      data: {
        pollId,
        optionId,
        donorId: donorId ?? null,
      },
    });
  });
}
