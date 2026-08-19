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
