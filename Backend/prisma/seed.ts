import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { MOCK_STOPS, MOCK_ROUTES, MOCK_VEHICLES } from "../../mockup/mockData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding RSU Campus database using mockup dataset...");

  // 1. Seed Routes
  const createdRoutes = [];
  for (const r of MOCK_ROUTES) {
    const route = await prisma.route.upsert({
      where: { name: r.name },
      update: { color: r.color, isActive: r.isActive },
      create: { name: r.name, color: r.color, isActive: r.isActive },
    });
    createdRoutes.push(route);
  }

  // ปิดการใช้งาน route เก่าที่ไม่ตรงกับ mockup
  const validRouteNames = MOCK_ROUTES.map((r) => r.name);
  await prisma.route.updateMany({
    where: { name: { notIn: validRouteNames } },
    data: { isActive: false },
  });

  // 2. Clear old RouteStops & Stops to re-index correctly
  await prisma.routeStop.deleteMany();
  await prisma.stop.deleteMany();

  try {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE stops_id_seq RESTART WITH 1;`);
  } catch {
    // Ignore if not PostgreSQL sequence
  }

  // 3. Seed Stops exactly matching the mockup sequence
  const savedStops = [];
  for (const stop of MOCK_STOPS) {
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
    // Ignore
  }

  // 4. Seed Route Stops mapping
  const routeStopData: Array<{ routeId: number; stopId: number; stopOrder: number }> = [];
  for (const r of MOCK_ROUTES) {
    const dbRoute = createdRoutes.find((cr) => cr.name === r.name);
    if (!dbRoute) continue;

    r.stopIds.forEach((stopId, index) => {
      routeStopData.push({
        routeId: dbRoute.id,
        stopId,
        stopOrder: index + 1,
      });
    });
  }

  await prisma.routeStop.createMany({
    data: routeStopData,
  });

  // 5. Seed Vehicles
  const now = new Date();
  for (const v of MOCK_VEHICLES) {
    const dbRoute = createdRoutes.find((cr) => cr.id === v.routeId) || createdRoutes[0];

    await prisma.vehicle.upsert({
      where: { name: v.name },
      update: {
        type: v.type,
        routeId: dbRoute.id,
        latitude: v.latitude,
        longitude: v.longitude,
        isActive: v.isActive,
        lastSeenAt: now,
      },
      create: {
        name: v.name,
        type: v.type,
        routeId: dbRoute.id,
        latitude: v.latitude,
        longitude: v.longitude,
        isActive: v.isActive,
        lastSeenAt: now,
      },
    });
  }

  console.log(
    `Successfully seeded ${createdRoutes.length} routes, ${savedStops.length} RSU stops, and ${MOCK_VEHICLES.length} vehicles from mockup data.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
