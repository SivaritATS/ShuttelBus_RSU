import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const routes = await Promise.all([
    prisma.route.upsert({
      where: { name: "RSU Main Campus" },
      update: { color: "#0F766E", isActive: true },
      create: { name: "RSU Main Campus", color: "#0F766E", isActive: true },
    }),
    prisma.route.upsert({
      where: { name: "Rangsit Connector" },
      update: { color: "#F97316", isActive: true },
      create: { name: "Rangsit Connector", color: "#F97316", isActive: true },
    }),
    prisma.route.upsert({
      where: { name: "Weekend Loop" },
      update: { color: "#7C3AED", isActive: false },
      create: { name: "Weekend Loop", color: "#7C3AED", isActive: false },
    }),
  ]);

  const stops = await Promise.all([
    prisma.stop.upsert({
      where: { id: 1 },
      update: { nameTh: "อาคารหอพัก", nameEn: "Residence Hall", latitude: 13.9552, longitude: 100.5851, isActive: true },
      create: { nameTh: "อาคารหอพัก", nameEn: "Residence Hall", latitude: 13.9552, longitude: 100.5851 },
    }),
    prisma.stop.upsert({
      where: { id: 2 },
      update: { nameTh: "อาคารเรียนรวม", nameEn: "Academic Complex", latitude: 13.9565, longitude: 100.587, isActive: true },
      create: { nameTh: "อาคารเรียนรวม", nameEn: "Academic Complex", latitude: 13.9565, longitude: 100.587 },
    }),
    prisma.stop.upsert({
      where: { id: 3 },
      update: { nameTh: "ศูนย์กีฬา", nameEn: "Sports Center", latitude: 13.958, longitude: 100.5891, isActive: true },
      create: { nameTh: "ศูนย์กีฬา", nameEn: "Sports Center", latitude: 13.958, longitude: 100.5891 },
    }),
    prisma.stop.upsert({
      where: { id: 4 },
      update: { nameTh: "ประตูมหาวิทยาลัย", nameEn: "University Gate", latitude: 13.9536, longitude: 100.5819, isActive: true },
      create: { nameTh: "ประตูมหาวิทยาลัย", nameEn: "University Gate", latitude: 13.9536, longitude: 100.5819 },
    }),
    prisma.stop.upsert({
      where: { id: 5 },
      update: { nameTh: "โรงอาหารกลาง", nameEn: "Central Cafeteria", latitude: 13.9549, longitude: 100.5889, isActive: true },
      create: { nameTh: "โรงอาหารกลาง", nameEn: "Central Cafeteria", latitude: 13.9549, longitude: 100.5889 },
    }),
  ]);

  const [mainRoute, connector, weekend] = routes;
  const [dorm, academic, sports, gate, cafeteria] = stops;

  await prisma.routeStop.deleteMany();
  await prisma.routeStop.createMany({
    data: [
      { routeId: mainRoute.id, stopId: gate.id, stopOrder: 1 },
      { routeId: mainRoute.id, stopId: dorm.id, stopOrder: 2 },
      { routeId: mainRoute.id, stopId: academic.id, stopOrder: 3 },
      { routeId: mainRoute.id, stopId: cafeteria.id, stopOrder: 4 },
      { routeId: connector.id, stopId: gate.id, stopOrder: 1 },
      { routeId: connector.id, stopId: sports.id, stopOrder: 2 },
      { routeId: connector.id, stopId: cafeteria.id, stopOrder: 3 },
      { routeId: weekend.id, stopId: dorm.id, stopOrder: 1 },
      { routeId: weekend.id, stopId: sports.id, stopOrder: 2 },
    ],
  });

  await prisma.vehicle.upsert({
    where: { name: "RSU Shuttle 01" },
    update: { type: "Electric Van", routeId: mainRoute.id, isActive: true },
    create: { name: "RSU Shuttle 01", type: "Electric Van", routeId: mainRoute.id, isActive: true },
  });
  await prisma.vehicle.upsert({
    where: { name: "RSU Shuttle 02" },
    update: { type: "Mini Bus", routeId: connector.id, isActive: true },
    create: { name: "RSU Shuttle 02", type: "Mini Bus", routeId: connector.id, isActive: true },
  });
  await prisma.vehicle.upsert({
    where: { name: "RSU Shuttle 03" },
    update: { type: "Mini Bus", routeId: null, isActive: false },
    create: { name: "RSU Shuttle 03", type: "Mini Bus", isActive: false },
  });

  console.log(`Seeded ${routes.length} routes, ${stops.length} stops, and 3 vehicles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
