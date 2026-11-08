import "dotenv/config";
import { generateVehicleToken } from "../src/lib/vehicle-token";

function getOption(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const vehicleIdArg = getOption("--vehicle") || getOption("-v");
const vehicleId = vehicleIdArg ? Number(vehicleIdArg) : 1;

if (isNaN(vehicleId) || vehicleId <= 0) {
  console.error("Usage: npm run db:token -- --vehicle <vehicleId>");
  process.exit(1);
}

const token = generateVehicleToken(vehicleId);

console.log("=========================================");
console.log(`🚌 Vehicle ID: ${vehicleId}`);
console.log(`🔑 Signed Token (อายุ 90 วัน):`);
console.log(token);
console.log("=========================================");
console.log("นำค่าด้านบนไปกรอกในหน้า Quick Mode ของ Mobile App ได้ทันที!");

