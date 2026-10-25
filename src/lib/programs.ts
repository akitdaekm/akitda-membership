import { prisma } from "@/lib/prisma";

export type ProgramItem = {
    id: string;
    title: string;
    date: string;
    venue: string;
    category: string;
    description: string;
    posterUrl?: string | null;
    order: number;
    createdAt: string;
};

export const SETTING_KEY = "upcoming_programs";

export const DEFAULT_PROGRAMS: ProgramItem[] = [
    {
        id: "prog-default-1",
        title: "20th Annual General Body & Exhibition",
        date: "December 15, 2026 • 4:00 PM Onwards",
        venue: "Gokulam Park, Ernakulam",
        category: "Upcoming Program",
        description:
            "AKITDA Ernakulam District 20th Annual General Body meeting and IT Exhibition. Starts at 4:00 PM at Gokulam Park, Ernakulam. All members and IT dealers are cordially invited.",
        posterUrl: "/about/20th-agm.jpg",
        order: 1,
        createdAt: "2026-10-22T00:00:00.000Z",
    },
    {
        id: "prog-default-2",
        title: "GST Compliance & Business Growth Workshop for IT Dealers",
        date: "Monthly Session • 2:30 PM",
        venue: "AKITDA District Office, Ernakulam",
        category: "Workshop & Training",
        description:
            "Interactive session covering latest taxation updates, OEM warranty/RMA dispute resolution, and digital transformation strategies for AKITDA members.",
        posterUrl: "/about/event-2.jpg",
        order: 2,
        createdAt: "2026-01-02T00:00:00.000Z",
    },
    {
        id: "prog-default-3",
        title: "AKITDA Mega IT Expo & Dealer Conclave",
        date: "Registration Opening Soon",
        venue: "Kochi, Ernakulam",
        category: "Exhibition & Expo",
        description:
            "A premier showcase of the latest IT hardware, networking solutions, surveillance tech, and exclusive vendor-dealer partnership opportunities.",
        posterUrl: "/about/event-3.jpg",
        order: 3,
        createdAt: "2026-01-03T00:00:00.000Z",
    },
];

let cachedPrograms: ProgramItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000;

export async function getPrograms(): Promise<ProgramItem[]> {
    const now = Date.now();
    if (cachedPrograms && now - cacheTimestamp < CACHE_TTL_MS) {
        return cachedPrograms;
    }

    try {
        const setting = await prisma.setting.findUnique({
            where: { key: SETTING_KEY },
        });
        if (!setting || !setting.value) {
            cachedPrograms = DEFAULT_PROGRAMS;
            cacheTimestamp = now;
            return DEFAULT_PROGRAMS;
        }
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
            const sorted = parsed.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            cachedPrograms = sorted;
            cacheTimestamp = now;
            return sorted;
        }
        cachedPrograms = DEFAULT_PROGRAMS;
        cacheTimestamp = now;
        return DEFAULT_PROGRAMS;
    } catch (error) {
        console.error("Failed to load upcoming programs:", error);
        return cachedPrograms ?? DEFAULT_PROGRAMS;
    }
}

export async function savePrograms(programs: ProgramItem[]): Promise<ProgramItem[]> {
    const sorted = [...programs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    await prisma.setting.upsert({
        where: { key: SETTING_KEY },
        update: { value: JSON.stringify(sorted) },
        create: { key: SETTING_KEY, value: JSON.stringify(sorted) },
    });
    cachedPrograms = sorted;
    cacheTimestamp = Date.now();
    return sorted;
}
