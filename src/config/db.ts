import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import config from "./config";

const adapter = new PrismaPg({
  connectionString: config.DATABASE_URL as string,
});

const prisma = new PrismaClient({
  adapter,
  log: config.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export default prisma;