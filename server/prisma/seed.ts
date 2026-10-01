import type { SeedName, SeedRow, SeedData, SeedConflictRow } from "../src/types/global";
import dotenv from "dotenv";
import { Prisma, PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Fixtures are stored by model in seedData; demo account hashes are precomputed.
export const seedNames = [
    "location", "user", "account", "manager", "managerSigningProfile",
    "property", "tenant", "lease", "application", "payment", "chat", "message", "notification",
] as const;

// Fixture dates are anchored here and shifted together, keeping deadlines useful
// without changing lease lengths or payment/application chronology.
const fixtureEpoch = Date.parse("2026-09-28T12:00:00Z");

export function loadSeedData(now = new Date()): SeedData {
    const data = {} as SeedData;
    for (const name of seedNames) {
        const model = Prisma.dmmf.datamodel.models.find(item =>
            item.name[0].toLowerCase() + item.name.slice(1) === name
        )!;
        const dateFields = new Set(model.fields.filter(field => field.type === "DateTime").map(field => field.name));
        const fixturePath = join(__dirname, "seedData", `${name}.json`);
        const rows = JSON.parse(readFileSync(fixturePath, "utf8")) as SeedRow[];
        if (!Array.isArray(rows)) throw new Error(`Invalid fixture: ${fixturePath}`);
        data[name] = rows;
        for (const row of data[name]) {
            for (const field of dateFields) {
                if (row[field] != null) {
                    const date = Date.parse(row[field]);
                    if (!Number.isFinite(date)) throw new Error(`Invalid fixture date ${name}.${field}`);
                    row[field] = new Date(date + now.getTime() - fixtureEpoch);
                }
            }
        }
    }
    return data;
}

const names = seedNames;

export function findSeedConflicts(
    sample: Record<string, SeedConflictRow[]>,
    existing: Record<string, SeedConflictRow[]>
): string[] {
    const conflicts: string[] = [];
    for (const [model, rows] of Object.entries(sample)) {
        const current = existing[model] ?? [];
        const label = model.charAt(0).toUpperCase() + model.slice(1);
        for (const row of rows) {
            if (row.id !== undefined && current.some((item) => item.id === row.id)) {
                conflicts.push(`${label} ID ${row.id} already exists`);
            }
            if (model === "user" && current.some((item) => item.email === row.email)) {
                conflicts.push(`User email ${row.email} already exists`);
            }
            if (model === "account" && current.some((item) =>
                item.provider === row.provider && item.providerAccountId === row.providerAccountId
            )) {
                conflicts.push(`Account ${row.provider}/${row.providerAccountId} already exists`);
            }
            if ((model === "manager" || model === "tenant") &&
                current.some((item) => item.userId === row.userId)) {
                conflicts.push(`${label} user ${row.userId} already exists`);
            }
            if (model === "managerSigningProfile" && current.some(item => item.managerUserId === row.managerUserId)) {
                conflicts.push(`Manager signing profile ${row.managerUserId} already exists`);
            }
            if (model === "application" && row.leaseId != null &&
                current.some((item) => item.leaseId === row.leaseId)) {
                conflicts.push(`Application lease ${row.leaseId} already exists`);
            }
        }
    }
    return conflicts;
}

export function remapSeedIds<T extends Record<string, any[]>>(
    source: T,
    highestIds: Record<string, number>
): T {
    const data = structuredClone(source);
    const maps: Record<string, Map<number, number>> = {};
    for (const [name, rows] of Object.entries(data)) {
        if (!(name in highestIds)) continue;
        maps[name] = new Map(rows.map((row) => [row.id, row.id + highestIds[name]]));
        for (const row of rows) row.id = maps[name].get(row.id);
    }
    const ref = (name: string, id: number) => {
        const mapped = maps[name]?.get(id);
        if (mapped === undefined) throw new Error(`Missing sample ${name} ID ${id}`);
        return mapped;
    };
    for (const row of data.property ?? []) row.locationId = ref("location", row.locationId);
    for (const row of data.tenant ?? []) {
        for (const relation of ["properties", "favorites"]) {
            for (const connected of row[relation]?.connect ?? []) {
                connected.id = ref("property", connected.id);
            }
        }
    }
    for (const row of data.lease ?? []) row.propertyId = ref("property", row.propertyId);
    for (const row of data.application ?? []) {
        row.propertyId = ref("property", row.propertyId);
        if (row.leaseId != null) row.leaseId = ref("lease", row.leaseId);
    }
    for (const row of data.payment ?? []) {
        row.leaseId = ref("lease", row.leaseId ?? row.lease.connect.id);
        delete row.lease;
    }
    for (const row of data.chat ?? []) {
        if (row.lastMessageId != null) row.lastMessageId = ref("message", row.lastMessageId);
    }
    for (const row of data.message ?? []) row.chatId = ref("chat", row.chatId);
    for (const row of data.notification ?? []) {
        if (row.resourceId == null) continue;
        // Notification links follow the resource each action opens in the UI.
        const applicationKinds = new Set([
            "CashHandoverClaimed", "PaymentConfirmed", "PaymentDisputed",
            "PaymentDisputeResolved", "CashClaimRetracted", "PropertyPriceChanged",
        ]);
        if (row.kind.startsWith("Application") || applicationKinds.has(row.kind)) {
            row.resourceId = ref("application", row.resourceId);
        } else if (row.kind.startsWith("Lease") || row.kind.startsWith("Renewal")) {
            row.resourceId = ref("lease", row.resourceId);
        }
    }
    return data;
}

async function findExisting(tx: Prisma.TransactionClient, data: SeedData) {
    const existing = {} as Record<SeedName, SeedRow[]>;
    for (const name of names) {
        const model = (tx as any)[name];
        if (name === "managerSigningProfile") {
            existing[name] = await model.findMany({ where: { managerUserId: { in: data[name].map(row => row.managerUserId) } } });
            continue;
        }
        const filters: any[] = [{ id: { in: data[name].map((row) => row.id) } }];
        if (name === "user") {
            filters.push({ email: { in: data.user.map((row) => row.email) } });
        } else if (name === "account") {
            filters.push(...data.account.map((row) => ({
                provider: row.provider,
                providerAccountId: row.providerAccountId,
            })));
        } else if (name === "manager" || name === "tenant") {
            filters.push({ userId: { in: data[name].map((row) => row.userId) } });
        } else if (name === "application") {
            filters.push({ leaseId: { in: data.application
                .map((row) => row.leaseId)
                .filter((id) => id != null) } });
        }
        existing[name] = await model.findMany({ where: { OR: filters } });
    }
    return existing;
}

async function highestIds(tx: Prisma.TransactionClient) {
    const highest: Record<string, number> = {};
    for (const name of ["location", "manager", "property", "tenant", "lease", "application", "payment", "chat", "message", "notification"]) {
        const row = await (tx as any)[name].findFirst({
            select: { id: true }, orderBy: { id: "desc" },
        });
        highest[name] = row?.id ?? 0;
    }
    return highest;
}

async function insertData(tx: Prisma.TransactionClient, data: SeedData) {
    for (const name of names) {
        for (const row of data[name]) {
            if (name === "location") {
                await tx.$executeRaw`
                    INSERT INTO "Location" ("id", "country", "city", "state", "address", "subdistrict", "district", "postalCode", "coordinates")
                    VALUES (${row.id}, ${row.country}, ${row.city}, ${row.state}, ${row.address},
                        ${row.subdistrict}, ${row.district}, ${row.postalCode}, ST_GeomFromText(${row.coordinates}, 4326)::geography)
                `;
            } else {
                await (tx as any)[name].create({ data: row });
            }
        }
    }

    for (const chat of data.chat) {
        const latest = data.message.filter(row => row.chatId === chat.id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id)[0];
        if (latest) await tx.chat.update({ where: { id: chat.id }, data: { lastMessageId: latest.id } });
    }

    for (const name of ["Location", "Manager", "Property", "Tenant", "Lease", "Application", "Payment", "Chat", "Message", "Notification"]) {
        const table = Prisma.raw(`"${name}"`);
        const sequence = Prisma.raw(`pg_get_serial_sequence('"${name}"', 'id')`);
        await tx.$executeRaw`
            SELECT setval(${sequence}, GREATEST(
                (SELECT COALESCE(MAX(id), 1) FROM ${table}), nextval(${sequence})
            ), true)
        `;
    }
}

async function main() {
    dotenv.config({ path: [".env.local", ".env"], quiet: true });
    if (process.env.NODE_ENV === "production") {
        throw new Error("Demo seed is unavailable in production");
    }
    process.env.DATABASE_URL ??= process.env.DB_URL;
    process.env.DB_URL ??= process.env.DATABASE_URL;
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL or DB_URL is required");
    const data = loadSeedData();
    const dryRun = process.argv.includes("--dry-run");
    if (data.account.some(account => account.provider !== "Credentials" || !account.passwordHash)) {
        throw new Error("Every demo account must have a Credentials password hash");
    }

    const prisma = new PrismaClient();
    try {
        await prisma.$transaction(async (tx) => {
            const remapped = remapSeedIds(data, await highestIds(tx));
            const conflicts = findSeedConflicts(remapped, await findExisting(tx, remapped));
            if (conflicts.length) {
                throw new Error(`Seed stopped before writing; ${conflicts.length} conflict(s):\n${conflicts.join("\n")}`);
            }
            if (!dryRun) await insertData(tx, remapped);
        }, { timeout: 30000 });

        const counts = names.map((name) => `${name}: ${data[name].length}`).join(", ");
        console.log(`${dryRun ? "Dry run OK" : "Seed complete"} (${counts})`);
    } finally {
        await prisma.$disconnect();
    }
}

// Importing helpers for tests must not connect to or seed a database.
if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
