import "dotenv/config";
import { UserRole, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function getOption(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const username = getOption("--username")?.trim().toLowerCase();
  const password = getOption("--password");
  const roleValue = getOption("--role")?.toUpperCase() || "USER";

  if (!username || !password || !["USER", "ADMIN"].includes(roleValue)) {
    throw new Error("Usage: npm run db:user -- --username admin --password 'change-me' --role ADMIN");
  }
  if (username.length > 100) throw new Error("Username ต้องยาวไม่เกิน 100 ตัวอักษร");
  if (password.length < 8) throw new Error("Password ต้องมีอย่างน้อย 8 ตัวอักษร");

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, role: roleValue as UserRole, isActive: true },
    create: { username, passwordHash, role: roleValue as UserRole },
  });

  console.log(`User '${user.username}' พร้อมใช้งานด้วย role ${user.role}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
