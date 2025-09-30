import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.teamPoint.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.redemption.deleteMany();
  await prisma.rewardItem.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.point.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.screening.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.station.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.event.deleteMany();

  const event = await prisma.event.create({
    data: {
      name: "Sinergi Fest Blood Drive",
      targetUnits: 200,
      startAt: new Date("2025-02-15T08:00:00.000Z"),
      endAt: new Date("2025-02-15T17:00:00.000Z"),
    },
  });

  await prisma.schedulePoll.create({
    data: {
      eventId: event.id,
      question: "When should we schedule your next donation?",
      options: {
        create: [
          { label: "Morning (8–10 AM)" },
          { label: "Midday (10 AM–12 PM)" },
          { label: "Afternoon (1–3 PM)" },
        ],
      },
    },
  });

  const [screeningStation, donorStation] = await Promise.all([
    prisma.station.create({
      data: {
        eventId: event.id,
        type: "SCREENING",
        isActive: true,
      },
    }),
    prisma.station.create({
      data: {
        eventId: event.id,
        type: "DONOR",
        isActive: true,
      },
    }),
  ]);

  const alice = await prisma.donor.create({
    data: {
      name: "Alice Pratama",
      phoneHash: "hash:alice",
      bloodType: "O+",
      lastDonationAt: new Date("2024-10-01T04:00:00.000Z"),
    },
  });

  const bob = await prisma.donor.create({
    data: {
      name: "Bob Santoso",
      phoneHash: "hash:bob",
      bloodType: "A+",
    },
  });

  const chandra = await prisma.donor.create({
    data: {
      name: "Chandra Wijaya",
      phoneHash: "hash:chandra",
      bloodType: "B+",
    },
  });

  const dina = await prisma.donor.create({
    data: {
      name: "Dina Kusuma",
      phoneHash: "hash:dina",
      bloodType: "AB+",
    },
  });

  const erin = await prisma.donor.create({
    data: {
      name: "Erin Nugraha",
      phoneHash: "hash:erin",
      bloodType: "O-",
    },
  });

  const farid = await prisma.donor.create({
    data: {
      name: "Farid Rahman",
      phoneHash: "hash:farid",
      bloodType: "B-",
    },
  });

  const gloria = await prisma.donor.create({
    data: {
      name: "Gloria Hutapea",
      phoneHash: "hash:gloria",
      bloodType: "A-",
    },
  });

  const aliceAppointment = await prisma.appointment.create({
    data: {
      eventId: event.id,
      donorId: alice.id,
      stationId: screeningStation.id,
      slotTime: new Date("2025-02-15T08:30:00.000Z"),
      status: "SCREENING",
    },
  });

  await prisma.checkin.create({
    data: {
      appointmentId: aliceAppointment.id,
      timestamp: new Date("2025-02-15T08:05:00.000Z"),
    },
  });

  await prisma.screening.create({
    data: {
      appointmentId: aliceAppointment.id,
      answers: JSON.stringify({ hemoglobinOk: true, travelNo: true }),
      riskFlags: null,
    },
  });

  await prisma.point.createMany({
    data: [
      {
        donorId: alice.id,
        value: 20,
        source: "ATTEND",
      },
      {
        donorId: alice.id,
        value: 50,
        source: "COMPLETE",
      },
      {
        donorId: bob.id,
        value: 5,
        source: "SIGN_UP",
      },
      { donorId: chandra.id, value: 5, source: "SIGN_UP" },
      { donorId: dina.id, value: 5, source: "SIGN_UP" },
      { donorId: erin.id, value: 5, source: "SIGN_UP" },
      { donorId: farid.id, value: 5, source: "SIGN_UP" },
      { donorId: gloria.id, value: 5, source: "SIGN_UP" },
    ],
  });

  await prisma.badge.create({
    data: {
      donorId: alice.id,
      key: "FIRST_DROP",
    },
  });

  const rewardItem = await prisma.rewardItem.create({
    data: {
      eventId: event.id,
      name: "Isotonic Drink",
      cost: 30,
      stock: 50,
      sponsorId: "Hydrate+",
    },
  });

  await prisma.redemption.create({
    data: {
      donorId: alice.id,
      rewardItemId: rewardItem.id,
      cost: 30,
      status: "RESERVED",
    },
  });

  await prisma.feedback.createMany({
    data: [
      {
        eventId: event.id,
        donorId: alice.id,
        csat: 5,
        nps: 9,
        comment: "Volunteers were super friendly!",
      },
      {
        eventId: event.id,
        donorId: bob.id,
        csat: 4,
        nps: 8,
        comment: "Queue moved faster than expected.",
      },
    ],
  });

  const team = await prisma.team.create({
    data: {
      name: "Team Hemoglobin",
    },
  });

  await prisma.teamMember.createMany({
    data: [
      {
        teamId: team.id,
        donorId: alice.id,
      },
      {
        teamId: team.id,
        donorId: bob.id,
      },
    ],
  });

  await prisma.teamPoint.create({
    data: {
      teamId: team.id,
      value: 85,
      note: "Kickoff day contributions",
    },
  });

  await prisma.appointment.create({
    data: {
      eventId: event.id,
      donorId: bob.id,
      slotTime: new Date("2025-02-15T09:00:00.000Z"),
      status: "BOOKED",
    },
  });

  await prisma.appointment.create({
    data: {
      eventId: event.id,
      donorId: erin.id,
      slotTime: new Date("2025-02-15T09:05:00.000Z"),
      status: "BOOKED",
    },
  });

  await prisma.appointment.create({
    data: {
      eventId: event.id,
      donorId: farid.id,
      slotTime: new Date("2025-02-15T09:10:00.000Z"),
      status: "BOOKED",
    },
  });

  await prisma.appointment.create({
    data: {
      eventId: event.id,
      donorId: gloria.id,
      slotTime: new Date("2025-02-15T09:12:00.000Z"),
      status: "BOOKED",
    },
  });

  await prisma.appointment.create({
    data: {
      eventId: event.id,
      donorId: chandra.id,
      slotTime: new Date("2025-02-15T09:15:00.000Z"),
      status: "BOOKED",
    },
  });

  await prisma.appointment.create({
    data: {
      eventId: event.id,
      donorId: dina.id,
      slotTime: new Date("2025-02-15T09:30:00.000Z"),
      status: "BOOKED",
    },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
