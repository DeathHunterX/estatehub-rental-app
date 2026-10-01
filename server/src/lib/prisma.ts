import { PrismaClient } from "@prisma/client";
import "../config";

const prisma = new PrismaClient();

export default prisma;
