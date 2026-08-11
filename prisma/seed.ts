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

    const bearers = [
        {
            name: "Antony M A",
            position: "President",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9847724914",
            photoUrl: "/uploads/bearers/bearer-1771398419548-antony_ma.jpeg",
            order: 1
        },
        {
            name: "Navas T Backer",
            position: "Secretary",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9847036968",
            photoUrl: "/uploads/bearers/bearer-1771398476610-Navas_T_Backer.JPG",
            order: 2
        },
        {
            name: "Subhash T S",
            position: "Treasurer",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "98479 64109",
            photoUrl: "/uploads/bearers/bearer-1771398521582-subhash_t_s.jpeg",
            order: 3
        },
        {
            name: "Antony T A",
            position: "Complaint Cell",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "94470 13115",
            photoUrl: "/uploads/bearers/bearer-1771398636204-antony_t_a.jpg",
            order: 4
        },
        {
            name: "Gladwin",
            position: "Snehasparsham",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9847058889",
            photoUrl: "/uploads/bearers/bearer-1771399055038-gladwin.jpeg",
            order: 5
        },
        {
            name: "Philip Mathew",
            position: "Vice President",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9847333539",
            photoUrl: "/uploads/bearers/bearer-1771399613282-Philip_Mathew.jpeg",
            order: 6
        },
        {
            name: "Davis Paul",
            position: "Join Secretary",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9388606117",
            photoUrl: "/uploads/bearers/bearer-1771399728215-Davis_M._Paul.jpeg",
            order: 7
        },
        {
            name: "Jijo Thomas",
            position: "IT Shoppe",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9846039420",
            photoUrl: "/uploads/bearers/bearer-1771399811890-Jijo.jpeg",
            order: 8
        },
        {
            name: "Toshy P Mathew",
            position: "IPP",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9847165626",
            photoUrl: "/uploads/bearers/bearer-1771399875410-toshy_p_mathew.jpeg",
            order: 9
        },
        {
            name: "Cyriac Thomas",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "6282294302",
            photoUrl: "/uploads/bearers/bearer-1771399990045-Cyriac_Thomas.jpeg",
            order: 10
        },
        {
            name: "Dileep Babu",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9846058597",
            photoUrl: "/uploads/bearers/bearer-1771400155953-dileep.jpeg",
            order: 11
        },
        {
            name: "Mahesh K",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9847722801",
            photoUrl: "/uploads/bearers/bearer-1771400245856-Mahesh_.k.jpeg",
            order: 12
        },
        {
            name: "Eldhose",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9447229404",
            photoUrl: "/uploads/bearers/bearer-1771400335982-Eldho_Paul.jpeg",
            order: 13
        },
        {
            name: "Thomas Paul",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9847724909",
            photoUrl: "/uploads/bearers/bearer-1771400441049-Thomas_Paul.jpeg",
            order: 14
        },
        {
            name: "Rejaneesh Kumar",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9895433716",
            photoUrl: "/uploads/bearers/bearer-1771400519647-Rejaneesh_kumar_T_R.jpeg",
            order: 15
        },
        {
            name: "Hareesh Kumar K",
            position: "State President",
            level: "STATE",
            district: "Ernakulam",
            phone: "",
            photoUrl: "/uploads/bearers/bearer-1774611724080-Hareeshkumar-K@2x.png",
            order: 1
        },
        {
            name: "Dileep Babu",
            position: "State General Secretary",
            level: "STATE",
            district: "Ernakulam",
            phone: "",
            photoUrl: "/uploads/bearers/bearer-1774611944565-dileep.jpeg",
            order: 2
        }
    ];

    for (const b of bearers) {
        const existing = await prisma.officeBearer.findFirst({
            where: { name: b.name, position: b.position, level: b.level }
        });
        if (!existing) {
            await prisma.officeBearer.create({ data: b });
            console.log(`Seeded office bearer: ${b.name} (${b.position})`);
        }
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
