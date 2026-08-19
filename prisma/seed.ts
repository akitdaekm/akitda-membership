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
            name: "Ismail P S",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "",
            photoUrl: "data:image/jpeg;base64,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",
            order: 13
        },
        {
            name: "Eldhose",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9447229404",
            photoUrl: "/uploads/bearers/bearer-1771400335982-Eldho_Paul.jpeg",
            order: 14
        },
        {
            name: "Thomas Paul",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9847724909",
            photoUrl: "/uploads/bearers/bearer-1771400441049-Thomas_Paul.jpeg",
            order: 15
        },
        {
            name: "Rejaneesh Kumar",
            position: "Executive member",
            level: "DISTRICT",
            district: "Ernakulam",
            phone: "9895433716",
            photoUrl: "/uploads/bearers/bearer-1771400519647-Rejaneesh_kumar_T_R.jpeg",
            order: 16
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

    await prisma.officeBearer.deleteMany({});
    console.log("Cleared old office bearers.");

    for (const b of bearers) {
        await prisma.officeBearer.create({ data: b });
        console.log(`Seeded office bearer #${b.order} [${b.level}]: ${b.name} (${b.position})`);
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
