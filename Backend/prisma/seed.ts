import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rsuStops = [
  { id: 1, nameTh: "ทางเข้า (อาคารอุไร)", nameEn: "Entrance (Urai Building)", latitude: 13.964839, longitude: 100.587530 },
  { id: 2, nameTh: "ตึก 2", nameEn: "Building 2", latitude: 13.9641728, longitude: 100.587568 },
  { id: 3, nameTh: "ตึก 3", nameEn: "Building 3", latitude: 13.9639947, longitude: 100.5871336 },
  { id: 4, nameTh: "ตึก 4", nameEn: "Building 4", latitude: 13.9638462, longitude: 100.5864097 },
  { id: 5, nameTh: "ตึก 5", nameEn: "Building 5", latitude: 13.9646207, longitude: 100.5861076 },
  { id: 6, nameTh: "ตึก 8", nameEn: "Building 8", latitude: 13.9652231, longitude: 100.585927 },
  { id: 7, nameTh: "ตึก 9", nameEn: "Building 9", latitude: 13.9659386, longitude: 100.5857465 },
  { id: 8, nameTh: "ตึก 13", nameEn: "Building 13", latitude: 13.9667372, longitude: 100.585528 },
  { id: 9, nameTh: "ตึก 17", nameEn: "Building 17", latitude: 13.9668052, longitude: 100.5833635 },
  { id: 10, nameTh: "ตึก 18/19", nameEn: "Building 18/19", latitude: 13.9688263, longitude: 100.583911 },
  { id: 11, nameTh: "ตึก 15", nameEn: "Building 15", latitude: 13.967794, longitude: 100.585149 },
  { id: 12, nameTh: "ตึก 14", nameEn: "Building 14", latitude: 13.9681782, longitude: 100.5872618 },
  { id: 13, nameTh: "ตึก 11", nameEn: "Building 11", latitude: 13.9664461, longitude: 100.5868495 },
  { id: 14, nameTh: "ทางออก (อาคารอุไร)", nameEn: "Exit (Urai Building)", latitude: 13.965755, longitude: 100.587327 },
];

async function main() {
  const routes = await Promise.all([
    prisma.route.upsert({
      where: { name: "RSU Main Campus Loop" },
      update: { color: "#165dff", isActive: true },
      create: { name: "RSU Main Campus Loop", color: "#165dff", isActive: true },
    }),
    prisma.route.upsert({
      where: { name: "RSU North-South Line" },
      update: { color: "#F97316", isActive: true },
      create: { name: "RSU North-South Line", color: "#F97316", isActive: true },
    }),
    prisma.route.upsert({
      where: { name: "RSU Special Express" },
      update: { color: "#0ba6a6", isActive: true },
      create: { name: "RSU Special Express", color: "#0ba6a6", isActive: true },
    }),
  ]);

  const [mainRoute, northSouthRoute, expressRoute] = routes;

  // ปิดการใช้งาน route เก่าที่ไม่เกี่ยวข้อง
  await prisma.route.updateMany({
    where: { name: { notIn: ["RSU Main Campus Loop", "RSU North-South Line", "RSU Special Express"] } },
    data: { isActive: false },
  });

  await prisma.routeStop.deleteMany();
  await prisma.stop.deleteMany();
  try {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE stops_id_seq RESTART WITH 1;`);
  } catch {
    // Ignore if not PostgreSQL or sequence name differs
  }

  const savedStops = [];
  for (const stop of rsuStops) {
    const s = await prisma.stop.create({
      data: {
        id: stop.id,
        nameTh: stop.nameTh,
        nameEn: stop.nameEn,
        latitude: stop.latitude,
        longitude: stop.longitude,
        isActive: true,
      },
    });
    savedStops.push(s);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE stops_id_seq RESTART WITH 15;`);
  } catch {
    // Ignore if not PostgreSQL
  }

  // Route 1: Main Campus Loop (รอบมหาวิทยาลัย ครบทั้ง 14 ป้าย ตามลำดับใหม่)
  const mainLoopStopIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  // Route 2: North-South Line (สายทางตรง เชื่อมตึกวิทยาการและศิลป์)
  const nsStopIds = [1, 5, 7, 8, 10, 11, 14];
  // Route 3: Special Express (สายทันตแพทย์ ดนตรี นิเทศศาสตร์)
  const expressStopIds = [1, 9, 10, 11, 12, 13, 14];

  await prisma.routeStop.createMany({
    data: [
      ...mainLoopStopIds.map((stopId, index) => ({
        routeId: mainRoute.id,
        stopId,
        stopOrder: index + 1,
      })),
      ...nsStopIds.map((stopId, index) => ({
        routeId: northSouthRoute.id,
        stopId,
        stopOrder: index + 1,
      })),
      ...expressStopIds.map((stopId, index) => ({
        routeId: expressRoute.id,
        stopId,
        stopOrder: index + 1,
      })),
    ],
  });

  const now = new Date();

  await prisma.vehicle.upsert({
    where: { name: "RSU Shuttle 01 (รถรางไฟฟ้า 1)" },
    update: {
      type: "Electric Tram",
      routeId: mainRoute.id,
      latitude: 13.9646207,
      longitude: 100.5861076, // ใกล้ตึก 5
      isActive: true,
      lastSeenAt: now,
    },
    create: {
      name: "RSU Shuttle 01 (รถรางไฟฟ้า 1)",
      type: "Electric Tram",
      routeId: mainRoute.id,
      latitude: 13.9646207,
      longitude: 100.5861076,
      isActive: true,
      lastSeenAt: now,
    },
  });

  await prisma.vehicle.upsert({
    where: { name: "RSU Shuttle 02 (รถรางไฟฟ้า 2)" },
    update: {
      type: "Electric Tram",
      routeId: northSouthRoute.id,
      latitude: 13.9664461,
      longitude: 100.5868495, // ใกล้ตึก 11
      isActive: true,
      lastSeenAt: now,
    },
    create: {
      name: "RSU Shuttle 02 (รถรางไฟฟ้า 2)",
      type: "Electric Tram",
      routeId: northSouthRoute.id,
      latitude: 13.9664461,
      longitude: 100.5868495,
      isActive: true,
      lastSeenAt: now,
    },
  });

  await prisma.vehicle.upsert({
    where: { name: "RSU Shuttle 03 (รถมินิบัสรับส่ง)" },
    update: {
      type: "Mini Bus",
      routeId: expressRoute.id,
      latitude: 13.9681782,
      longitude: 100.5872618, // ใกล้ตึก 14
      isActive: true,
      lastSeenAt: now,
    },
    create: {
      name: "RSU Shuttle 03 (รถมินิบัสรับส่ง)",
      type: "Mini Bus",
      routeId: expressRoute.id,
      latitude: 13.9681782,
      longitude: 100.5872618,
      isActive: true,
      lastSeenAt: now,
    },
  });

  console.log(`Seeded ${routes.length} routes, ${savedStops.length} RSU stops, and 3 vehicles with exact coordinates.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
