import { prisma } from "@/lib/prisma";

/**
 * Generate the next sequential Membership ID in format: "AKITDA | EKM | 001"
 */
export async function generateNextMembershipId(): Promise<string> {
    const existing = await prisma.member.findMany({
        where: {
            OR: [
                { membershipId: { startsWith: "AKITDA | EKM | " } },
                { membershipId: { startsWith: "AKEKM" } },
            ],
        },
        select: { membershipId: true },
    });

    let maxNum = 0;
    for (const m of existing) {
        if (!m.membershipId) continue;
        const match = m.membershipId.match(/(\d+)\s*$/);
        if (match) {
            const n = parseInt(match[1], 10);
            if (!isNaN(n) && n > maxNum) {
                maxNum = n;
            }
        }
    }

    return `AKITDA | EKM | ${String(maxNum + 1).padStart(3, "0")}`;
}
