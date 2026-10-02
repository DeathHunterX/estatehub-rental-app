import Image from "next/image";
import { MapPin } from "lucide-react";

import TenantAgreementButton from "@/features/leases/components/tenant-agreement-button";
import PropertyPhotoFallback from "@/features/properties/components/property-photo-fallback";
import {
    propertyImageSrc,
    usablePropertyPhotos,
} from "@/features/properties/lib/property-image";

import { Lease, Property } from "@/types/prisma";

const ResidenceCard = ({
    property,
    currentLease,
}: {
    property: Property;
    currentLease: Lease;
}) => {
    const nextPaymentDate = new Date(currentLease.startDate);
    while (
        nextPaymentDate <= new Date() &&
        nextPaymentDate <= new Date(currentLease.endDate)
    ) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }
    const photo = usablePropertyPhotos(property.photoUrls)[0];
    return (
        <div className="flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-5">
                {photo ? (
                    <Image
                        src={propertyImageSrc(photo)}
                        alt={property.name}
                        width={256}
                        height={128}
                        loading="eager"
                        className="h-32 w-full rounded-xl bg-muted object-cover sm:w-64"
                    />
                ) : (
                    <div className="relative h-32 w-full overflow-hidden rounded-xl bg-muted sm:w-64">
                        <PropertyPhotoFallback />
                    </div>
                )}

                <div className="flex flex-col justify-between">
                    <div>
                        <div className="w-fit rounded-full bg-emerald-950/60 px-3 py-1 text-sm font-semibold text-emerald-300">
                            Active lease
                        </div>

                        <h2 className="text-2xl font-bold my-2">
                            {property.name}
                        </h2>
                        <div className="mb-2 flex items-center text-muted-foreground">
                            <MapPin className="w-5 h-5 mr-1" />
                            <span>
                                {property.location.city},{" "}
                                {property.location.country}
                            </span>
                        </div>
                    </div>
                    <div className="text-xl font-bold">
                        ${currentLease.rent}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                            / month
                        </span>
                    </div>
                </div>
            </div>
            {/* Dates */}
            <div>
                <hr className="my-4 border-border" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="xl:flex">
                        <div className="mr-2 text-muted-foreground">
                            Start Date:{" "}
                        </div>
                        <div className="font-semibold">
                            {new Date(
                                currentLease.startDate
                            ).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="xl:flex">
                        <div className="mr-2 text-muted-foreground">
                            End Date:{" "}
                        </div>
                        <div className="font-semibold">
                            {new Date(
                                currentLease.endDate
                            ).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="xl:flex">
                        <div className="mr-2 text-muted-foreground">
                            Next Payment:{" "}
                        </div>
                        <div className="font-semibold">
                            {nextPaymentDate > new Date(currentLease.endDate)
                                ? "Lease ended"
                                : nextPaymentDate.toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <hr className="my-4 border-border" />
            </div>
            {/* Buttons */}
            <div className="flex justify-end gap-2 w-full">
                <TenantAgreementButton leaseId={currentLease.id} />
            </div>
        </div>
    );
};

export default ResidenceCard;
