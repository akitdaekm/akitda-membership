import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash("admin123", 10);

    const admins = [
        { email: "admin@akitdaekm.com", role: "SUPER_ADMIN" },
        { email: "president@akitdaekm.com", role: "PRESIDENT" },
        { email: "secretary@akitdaekm.com", role: "SECRETARY" },
        { email: "treasurer@akitdaekm.com", role: "TREASURER" },
    ];

    for (const admin of admins) {
        await prisma.admin.upsert({
            where: { email: admin.email },
            update: { role: admin.role },
            create: {
                email: admin.email,
                password,
                role: admin.role,
            },
        });
        console.log(`Seeded admin: ${admin.email} (${admin.role})`);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
