import prisma from "../lib/prisma";

export const sendLeaseReminders = async (now = new Date()) => {
    const sixtyDays = new Date(now.getTime() + 60 * 86_400_000);
    const leases = await prisma.lease.findMany({
        where: { endDate: { gt: now, lte: sixtyDays } },
        include: { property: { select: { name: true } } },
    });
    for (const lease of leases) {
        const daysLeft = (lease.endDate.getTime() - now.getTime()) / 86_400_000;
        const window = daysLeft <= 30 ? 30 : 60;
        // Include the window and end date in the key so each reminder is sent once per lease term.
        await prisma.notification.upsert({
            where: {
                dedupeKey: `lease-${lease.id}-renewal-${window}-${lease.endDate.toISOString().slice(0, 10)}`,
            },
            create: {
                userId: lease.tenantUserId,
                kind: "RenewalReminder",
                title: "Your lease is nearing its end",
                body: `${lease.property.name} ends on ${lease.endDate.toLocaleDateString()}. You can request a renewal now.`,
                resourceId: lease.id,
                dedupeKey: `lease-${lease.id}-renewal-${window}-${lease.endDate.toISOString().slice(0, 10)}`,
            },
            update: {},
        });
    }
};
