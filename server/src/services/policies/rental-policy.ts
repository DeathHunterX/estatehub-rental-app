import type { PropertyListingState } from "../../types/global";
import { ApplicationStatus, PropertyListingStatus } from "@prisma/client";

export const canApply = (
    property: Pick<PropertyListingState, "listingStatus" | "archivedAt">,
    occupied: boolean
) =>
    property.listingStatus === PropertyListingStatus.Free &&
    !property.archivedAt &&
    !occupied;

export const availability = (
    property: Pick<PropertyListingState, "listingStatus" | "archivedAt">,
    occupied: boolean,
    waiting: boolean
) => {
    if (
        property.archivedAt ||
        property.listingStatus === PropertyListingStatus.Closed
    )
        return "Closed";
    if (occupied) return "Occupied";
    return waiting ? "Waiting" : "Free";
};

export const isMoneyAmount = (value: number, allowZero = false) => {
    const cents = value * 100;
    return (
        Number.isFinite(value) &&
        (allowZero ? value >= 0 : value > 0) &&
        Number.isSafeInteger(Math.round(cents)) &&
        Math.abs(cents - Math.round(cents)) < 0.000001
    );
};

export const quoteAllowed = (
    status: ApplicationStatus,
    original: number,
    proposed: number,
    current: number
) => {
    if (!isMoneyAmount(original) || !isMoneyAmount(proposed)) return false;
    if (status === ApplicationStatus.Pending) return true;
    if (status === ApplicationStatus.Approved)
        return proposed >= original * 0.75 && proposed <= current;
    return false;
};

export const canArchive = (
    property: PropertyListingState,
    activeLease: boolean,
    now = new Date()
) =>
    property.listingStatus === PropertyListingStatus.Closed &&
    !property.archivedAt &&
    !activeLease &&
    !!property.closedAt &&
    now.getTime() - property.closedAt.getTime() >= 30 * 24 * 60 * 60 * 1000;

export const activeLeaseWhere = (now = new Date()) => ({
    startDate: { lte: now },
    endDate: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
});
