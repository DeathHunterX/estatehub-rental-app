"use client";

// Libraries
import {
    ArrowLeft,
    Bath,
    Bed,
    Check,
    MapPin,
    Maximize2,
    Pencil,
    Ruler,
    Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

// Components
import PageSkeleton from "@/components/shared/page-skeleton";
import PropertyPhotoLightbox from "@/features/properties/components/property-photo-lightbox";
import PropertyPhotoRail from "@/features/properties/components/property-photo-rail";
import { Button } from "@/components/ui/button";
import LeaseTable from "./lease-table";

// APIs
import {
    useArchivePropertyMutation,
    useGetPropertyPaymentsQuery,
    useGetPropertyLeasesQuery,
    useGetPropertyQuery,
    useUpdatePropertyListingStatusMutation,
} from "@/lib/api/api";
import { useGetManagerSigningProfileQuery } from "@/lib/api/api";

// Libs
import {
    propertyImageSrc,
    usablePropertyPhotos,
} from "@/features/properties/lib/property-image";
import PropertyPhotoFallback from "@/features/properties/components/property-photo-fallback";
import { formatPropertyAddress } from "@/features/properties/lib/property-address";

const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
const date = (value: Date | string) => new Date(value).toLocaleDateString();
const label = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2");

const PropertyTenantsPage = () => {
    const { id } = useParams();
    const [selectedPhoto, setSelectedPhoto] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);
    const propertyId = Number(id);
    const {
        data: property,
        isLoading: propertyLoading,
        isError: propertyError,
    } = useGetPropertyQuery(propertyId);
    const {
        data: leases,
        isLoading: leasesLoading,
        isError: leasesError,
    } = useGetPropertyLeasesQuery(propertyId);
    const {
        data: payments,
        isLoading: paymentsLoading,
        isError: paymentsError,
    } = useGetPropertyPaymentsQuery(propertyId);
    const { data: signingProfile } = useGetManagerSigningProfileQuery();
    const [setStatus] = useUpdatePropertyListingStatusMutation();
    const [archive] = useArchivePropertyMutation();

    if (propertyLoading || leasesLoading || paymentsLoading)
        return <PageSkeleton variant="detail" />;
    if (propertyError || leasesError || paymentsError || !property)
        return (
            <div className="dashboard-container text-foreground">
                <h1 className="text-xl font-semibold">
                    Property details could not be loaded
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Please try again when the connection is available.
                </p>
            </div>
        );

    const now = new Date();
    const activeLeases = (leases ?? []).filter(
        (lease) =>
            new Date(lease.startDate) <= now && new Date(lease.endDate) >= now
    );
    const address = formatPropertyAddress(property.location);
    const photos = usablePropertyPhotos(property.photoUrls);
    const currentPhoto = Math.min(
        selectedPhoto,
        Math.max(photos.length - 1, 0)
    );

    return (
        <div className="dashboard-container space-y-7 text-foreground">
            <Link
                href="/managers/properties"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" /> All properties
            </Link>
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Property overview
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                        {property.name}
                    </h1>
                    <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 size-4 shrink-0" /> {address}
                    </p>
                    <span className="mt-3 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                        {property.availability ?? property.listingStatus}
                    </span>
                </div>
                <Button
                    asChild
                    className="w-fit gap-2 bg-secondary-500 font-semibold text-primary-950 hover:bg-secondary-400 hover:text-primary-950"
                >
                    <Link href={`/managers/properties/${propertyId}/edit`}>
                        <Pencil className="size-4" /> Edit property
                    </Link>
                </Button>
            </div>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.75fr)]">
                <div className="space-y-6">
                    <section className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
                        <div className="sm:flex sm:h-96">
                            <div className="relative h-64 min-w-0 flex-1 bg-muted sm:h-full">
                                {photos.length ? (
                                    <button
                                        type="button"
                                        aria-label={`View full-size photo ${currentPhoto + 1} of ${photos.length}`}
                                        onClick={() => setViewerOpen(true)}
                                        className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
                                    >
                                        <Image
                                            src={propertyImageSrc(
                                                photos[currentPhoto]
                                            )}
                                            alt={`${property.name} photo ${currentPhoto + 1} of ${photos.length}`}
                                            fill
                                            sizes="(max-width: 1280px) 100vw, 65vw"
                                            loading={
                                                currentPhoto === 0
                                                    ? "eager"
                                                    : "lazy"
                                            }
                                            className="object-contain"
                                        />
                                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md">
                                            <Maximize2 className="size-3.5" />{" "}
                                            View full photo
                                        </span>
                                    </button>
                                ) : (
                                    <PropertyPhotoFallback />
                                )}
                            </div>
                            {photos.length > 1 && (
                                <PropertyPhotoRail
                                    images={photos.map((photo: string) =>
                                        propertyImageSrc(photo)
                                    )}
                                    activeIndex={currentPhoto}
                                    onSelect={setSelectedPhoto}
                                />
                            )}
                        </div>
                        <div className="p-5 sm:p-6">
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold">
                                    {label(property.propertyType)}
                                </span>
                                <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs">
                                    {photos.length}{" "}
                                    {photos.length === 1 ? "photo" : "photos"}
                                </span>
                            </div>
                            <h2 className="mt-5 text-lg font-semibold">
                                About this property
                            </h2>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                                {property.description?.trim() ||
                                    "No description has been added yet."}
                            </p>
                            <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-muted/30 py-4 text-center">
                                <div>
                                    <Bed className="mx-auto size-5 text-primary" />
                                    <p className="mt-1 font-semibold">
                                        {property.beds}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Beds
                                    </p>
                                </div>
                                <div>
                                    <Bath className="mx-auto size-5 text-primary" />
                                    <p className="mt-1 font-semibold">
                                        {property.baths}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Baths
                                    </p>
                                </div>
                                <div>
                                    <Ruler className="mx-auto size-5 text-primary" />
                                    <p className="mt-1 font-semibold">
                                        {property.squareFeet.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Sq ft
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
                        <h2 className="text-lg font-semibold">Features</h2>
                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Amenities
                                </h3>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {property.amenities.length ? (
                                        property.amenities.map(
                                            (item: string) => (
                                                <span
                                                    key={item}
                                                    className="rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs"
                                                >
                                                    {label(item)}
                                                </span>
                                            )
                                        )
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            None listed
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">
                                    Highlights
                                </h3>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {property.highlights.length ? (
                                        property.highlights.map(
                                            (item: string) => (
                                                <span
                                                    key={item}
                                                    className="rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs"
                                                >
                                                    {label(item)}
                                                </span>
                                            )
                                        )
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            None listed
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-4 border-t border-border pt-5 text-sm">
                            <span className="flex items-center gap-2">
                                <Check className="size-4 text-primary" /> Pets{" "}
                                {property.isPetsAllowed
                                    ? "allowed"
                                    : "not allowed"}
                            </span>
                            <span className="flex items-center gap-2">
                                <Check className="size-4 text-primary" />{" "}
                                Parking{" "}
                                {property.isParkingIncluded
                                    ? "included"
                                    : "not included"}
                            </span>
                        </div>
                    </section>
                </div>

                <aside className="space-y-4 xl:sticky xl:top-24">
                    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Monthly asking rent
                        </p>
                        <p className="mt-2 text-3xl font-bold">
                            {money(property.pricePerMonth)}
                            <span className="ml-1 text-sm font-normal text-muted-foreground">
                                / month
                            </span>
                        </p>
                        <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">
                                    Security deposit
                                </span>
                                <strong>
                                    {money(property.securityDeposit)}
                                </strong>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">
                                    Application fee
                                </span>
                                <strong>
                                    {money(property.applicationFee)}
                                </strong>
                            </div>
                        </div>
                    </section>
                    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Users className="size-4" /> Occupancy
                        </p>
                        <p className="mt-3 text-3xl font-bold">
                            {activeLeases.length}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Active{" "}
                            {activeLeases.length === 1 ? "lease" : "leases"} ·{" "}
                            {(leases ?? []).length} total records
                        </p>
                    </section>
                    <section className="rounded-2xl border border-border bg-card p-5 text-sm text-card-foreground sm:p-6">
                        <h2 className="font-semibold">Listing information</h2>
                        <div className="mt-4 space-y-3 text-muted-foreground">
                            <p>
                                Type{" "}
                                <span className="float-right font-medium text-foreground">
                                    {label(property.propertyType)}
                                </span>
                            </p>
                            <p>
                                Listed{" "}
                                <span className="float-right font-medium text-foreground">
                                    {date(property.postedDate)}
                                </span>
                            </p>
                            <p>
                                Property ID{" "}
                                <span className="float-right font-medium text-foreground">
                                    #{property.id}
                                </span>
                            </p>
                        </div>
                    </section>
                    <section className="rounded-2xl border border-border bg-card p-5 text-sm text-card-foreground sm:p-6">
                        <h2 className="font-semibold">Listing controls</h2>
                        <p className="mt-2 text-muted-foreground">
                            {property.listingStatus === "Closed"
                                ? `Closed since ${property.closedAt ? date(property.closedAt) : "today"}. Archive becomes available after 30 days without an active lease.`
                                : activeLeases.length
                                  ? "Occupied while the lease is active."
                                  : "Open for applications."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={async () => {
                                    try {
                                        await setStatus({
                                            id: propertyId,
                                            status:
                                                property.listingStatus ===
                                                "Closed"
                                                    ? "Free"
                                                    : "Closed",
                                        }).unwrap();
                                        toast.success("Listing updated");
                                    } catch {
                                        toast.error(
                                            "Could not change listing status"
                                        );
                                    }
                                }}
                            >
                                {property.listingStatus === "Closed"
                                    ? "Reopen listing"
                                    : "Close listing"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={async () => {
                                    try {
                                        await archive(propertyId).unwrap();
                                        toast.success(
                                            "Property archived. Download its history from My Properties."
                                        );
                                    } catch {
                                        toast.error(
                                            "The property must be closed for 30 days with no active lease"
                                        );
                                    }
                                }}
                                disabled={
                                    property.listingStatus !== "Closed" ||
                                    !!activeLeases.length ||
                                    !property.closedAt
                                }
                            >
                                Archive after 30 days
                            </Button>
                        </div>
                    </section>
                </aside>
            </div>

            <LeaseTable
                leases={leases ?? []}
                payments={payments ?? []}
                propertyName={property.name}
                address={address}
                profile={signingProfile ?? null}
            />
            {viewerOpen && photos.length > 0 && (
                <PropertyPhotoLightbox
                    images={photos.map((photo: string) =>
                        propertyImageSrc(photo)
                    )}
                    index={currentPhoto}
                    title={property.name}
                    onChange={setSelectedPhoto}
                    onClose={() => setViewerOpen(false)}
                />
            )}
        </div>
    );
};

export default PropertyTenantsPage;
