"use client";

import PageSkeleton from "@/components/shared/page-skeleton";

import PropertyCard from "@/features/properties/components/property-card";
import Header from "@/components/shared/header";
import {
    useGetAuthCurrentUserQuery,
    useGetManagerPropertiesQuery,
} from "@/lib/api/api";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useAppSelector } from "@/states/store";

const downloadHistory = async (id: number, token: string | null) => {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/properties/${id}/history.csv`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!response.ok) throw new Error("Download failed");

        const url = URL.createObjectURL(await response.blob());
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = `property-${id}-history.csv`;
        anchor.click();

        URL.revokeObjectURL(url);
    } catch {
        toast.error("Could not download property history");
    }
};

const PropertiesPage = () => {
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const {
        data: managerProperties,
        isLoading,
        error,
    } = useGetManagerPropertiesQuery(authUser?.user.id || "", {
        skip: !authUser?.user.id,
    });

    if (isLoading) return <PageSkeleton variant="cards" />;
    if (error) return <div>Error loading manager properties</div>;

    return (
        <div className="dashboard-container">
            <Header
                title="My Properties"
                subtitle="View and manage your property listings"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {managerProperties
                    ?.filter((property) => !property.archivedAt)
                    .map((property, index) => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                            eagerImage={index < 4}
                            isFavorite={false}
                            onFavoriteToggle={() => {}}
                            showFavoriteButton={false}
                            propertyLink={`/managers/properties/${property.id}`}
                        />
                    ))}
            </div>
            {(!managerProperties ||
                managerProperties.filter((property) => !property.archivedAt)
                    .length === 0) && (
                <p>You don&lsquo;t manage any properties.</p>
            )}
            {!!managerProperties?.some((property) => property.archivedAt) && (
                <section className="mt-10 rounded-2xl border border-border bg-card p-5 text-card-foreground">
                    <h2 className="text-lg font-semibold">
                        Archived property records
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        These listings are hidden from search. Their
                        applications, leases and payments remain available in
                        your CSV copy.
                    </p>
                    <div className="mt-4 space-y-3">
                        {managerProperties
                            .filter((property) => property.archivedAt)
                            .map((property) => (
                                <div
                                    key={property.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                                >
                                    <span>
                                        {property.name} · #{property.id}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            downloadHistory(
                                                property.id,
                                                accessToken
                                            )
                                        }
                                    >
                                        Download CSV
                                    </Button>
                                </div>
                            ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default PropertiesPage;
