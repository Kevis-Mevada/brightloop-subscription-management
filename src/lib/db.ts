import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let _prismaInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (typeof window !== "undefined") {
    throw new Error("Prisma Client cannot be used on the client side.");
  }

  if (!_prismaInstance) {
    const defaultUrl =
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/brightloop?sslmode=prefer";

    if (process.env.NODE_ENV === "production") {
      _prismaInstance = new PrismaClient({
        datasources: { db: { url: defaultUrl } },
        log: ["error"],
      });
    } else {
      if (!global.prisma) {
        global.prisma = new PrismaClient({
          datasources: { db: { url: defaultUrl } },
          log: ["warn", "error"],
        });
      }
      _prismaInstance = global.prisma;
    }
  }

  return _prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrisma();
    const val = (instance as any)[prop];
    if (typeof val === "function") {
      return val.bind(instance);
    }
    return val;
  },
});

export default prisma;
