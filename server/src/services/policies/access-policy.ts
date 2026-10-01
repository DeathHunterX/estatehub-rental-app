import type { UserIdentity, LeaseAccessTarget } from "../../types/global";
import { ApplicationStatus, UserRole } from "@prisma/client";
import { ConflictError, ForbiddenError } from "../../errors/http-error";

export const applicationScope = (user: UserIdentity) =>
    user.role === UserRole.Tenant
        ? { tenantUserId: user.id }
        : { property: { managerUserId: user.id } };

export const assertLeaseAccess = (
    user: UserIdentity,
    lease: LeaseAccessTarget
) => {
    const ownerId =
        user.role === UserRole.Tenant
            ? lease.tenantUserId
            : lease.property.managerUserId;
    if (ownerId !== user.id) throw new ForbiddenError("Lease access denied");
};

export const assertPendingApplication = (status: ApplicationStatus) => {
    if (status !== ApplicationStatus.Pending) {
        throw new ConflictError("Only pending applications can be reviewed");
    }
};
