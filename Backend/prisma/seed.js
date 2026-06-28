// Seeds the default departments (Feature 5 routing targets) and a demo admin.
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: "Road Maintenance", description: "Potholes, road damage, open manholes" },
  { name: "Water Supply", description: "Water leakage, pipeline issues" },
  { name: "Sanitation", description: "Garbage overflow, illegal dumping" },
  { name: "Electricity", description: "Broken street lights, exposed wires" },
  { name: "Forest Department", description: "Fallen trees, green cover" },
  { name: "Drainage", description: "Drainage blockage, waterlogging" },
];

async function main() {
  console.log("Seeding departments...");
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  console.log("Seeding demo admin...");
  const passwordHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@communityhero.dev" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@communityhero.dev",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
