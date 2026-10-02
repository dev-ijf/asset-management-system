import "dotenv/config";
import { cleanupDrivePhotos } from "../src/lib/asset-photo-storage";
import { prisma } from "../src/lib/prisma";

try { console.log(await cleanupDrivePhotos()); }
finally { await prisma.$disconnect(); }
