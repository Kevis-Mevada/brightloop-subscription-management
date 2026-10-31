import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const defaultUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/brightloop?sslmode=prefer";

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: defaultUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
