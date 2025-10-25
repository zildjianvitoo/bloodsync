import { prisma } from "@/lib/db/prisma";

type LeaderboardOptions = {
  eventId?: string;
  limit?: number;
};

export async function getIndividualLeaderboard({ eventId, limit = 10 }: LeaderboardOptions) {
  const aggregates = await prisma.point.groupBy({
    by: ["donorId"],
    where: eventId ? { eventId } : {},
    _sum: { value: true },
    orderBy: {
      _sum: {
        value: "desc",
      },
    },
    take: limit,
  });

  const donorIds = aggregates.map((entry) => entry.donorId);
  const donors = await prisma.donor.findMany({
    where: { id: { in: donorIds } },
    select: {
      id: true,
      name: true,
      teamMemberships: {
        select: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  const donorMap = new Map(donors.map((donor) => [donor.id, donor]));

  return aggregates.map((entry) => {
    const donor = donorMap.get(entry.donorId);
    return {
      donorId: entry.donorId,
      donorName: donor?.name ?? "Anonymous donor",
      teamName: donor?.teamMemberships[0]?.team.name ?? null,
      totalPoints: entry._sum.value ?? 0,
    };
  });
}

export async function getTeamLeaderboard({ eventId, limit = 10 }: LeaderboardOptions) {
  if (eventId) {
    const aggregates = await prisma.point.groupBy({
      by: ["donorId"],
      where: { eventId },
      _sum: { value: true },
    });

    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        donorId: {
          in: aggregates.map((entry) => entry.donorId),
        },
      },
      select: {
        donorId: true,
        teamId: true,
      },
    });

    const teamTotals = new Map<string, number>();
    const donorToTeam = new Map(teamMemberships.map((member) => [member.donorId, member.teamId]));

    aggregates.forEach((entry) => {
      const teamId = donorToTeam.get(entry.donorId);
      if (!teamId) return;
      const current = teamTotals.get(teamId) ?? 0;
      teamTotals.set(teamId, current + (entry._sum.value ?? 0));
    });

    const teams = await prisma.team.findMany({
      where: {
        id: {
          in: Array.from(teamTotals.keys()),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const teamMap = new Map(teams.map((team) => [team.id, team]));

    return Array.from(teamTotals.entries())
      .map(([teamId, totalPoints]) => ({
        teamId,
        teamName: teamMap.get(teamId)?.name ?? "Team",
        totalPoints,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }

  const aggregates = await prisma.teamPoint.groupBy({
    by: ["teamId"],
    _sum: { value: true },
    orderBy: {
      _sum: {
        value: "desc",
      },
    },
    take: limit,
  });

  const teams = await prisma.team.findMany({
    where: { id: { in: aggregates.map((entry) => entry.teamId) } },
    select: {
      id: true,
      name: true,
    },
  });
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  return aggregates.map((entry) => ({
    teamId: entry.teamId,
    teamName: teamMap.get(entry.teamId)?.name ?? "Team",
    totalPoints: entry._sum.value ?? 0,
  }));
}
