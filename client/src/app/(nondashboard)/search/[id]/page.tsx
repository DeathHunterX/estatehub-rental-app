"use client";

// Libraries
import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Components
import PageSkeleton from "@/components/shared/page-skeleton";
import ApplicationModal from "./_components/application-modal";
import ContactWidget from "./_components/contact-widget";
import ImagePreviews from "./_components/image-previews";
import PropertyDetails from "./_components/property-details";
import PropertyLocation from "./_components/property-location";
import PropertyOverview from "./_components/property-overview";

// APIs
import { useGetAuthCurrentUserQuery } from "@/lib/api/api";
import { useGetPropertyQuery } from "@/lib/api/api";

// State
import { useAppSelector } from "@/states/store";

// Libs
import { usablePropertyPhotos } from "@/features/properties/lib/property-image";

const PropertyDetailedPage = () => {
    const { id } = useParams();
    const propertyId = Number(id);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const { data: authUser } = useGetAuthCurrentUserQuery(undefined, { skip: !accessToken });
    const { data: property, isLoading, isError } = useGetPropertyQuery(propertyId, { skip: !Number.isInteger(propertyId) });
    const photos = usablePropertyPhotos(property?.photoUrls);

    if (isLoading) return <PageSkeleton variant="detail" />;
    if (isError || !property) return <div className="mx-auto max-w-7xl px-5 py-12 text-foreground"><h1 className="text-2xl font-semibold">Property not found</h1><Link href="/search" className="mt-4 inline-flex text-primary hover:underline">Back to search</Link></div>;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto w-full max-w-7xl space-y-5 px-4 pb-20 pt-5 sm:space-y-6 sm:px-6 lg:space-y-7 lg:px-8 lg:pt-10">
                <Link href="/search" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to search</Link>
                <div className="hidden lg:block"><PropertyOverview propertyId={propertyId} /></div>
                <ImagePreviews key={propertyId} images={photos} title={property.name} />
                <div className="lg:hidden"><PropertyOverview propertyId={propertyId} /></div>
                <div className="grid min-w-0 items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-9">
                    <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1"><ContactWidget onOpenModal={() => setIsModalOpen(true)} propertyId={propertyId} availability={property.availability} /></aside>
                    <div className="min-w-0 space-y-5 sm:space-y-6 lg:col-start-1 lg:row-start-1 lg:space-y-7"><PropertyDetails propertyId={propertyId} /><PropertyLocation propertyId={propertyId} /></div>
                </div>
            </div>

            {authUser && (
                <ApplicationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    propertyId={propertyId}
                />
            )}
        </div>
    );
};

export default PropertyDetailedPage;
