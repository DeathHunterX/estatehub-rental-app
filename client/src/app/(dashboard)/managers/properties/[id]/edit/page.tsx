"use client";

import PageSkeleton from "@/components/shared/page-skeleton";

import PropertyEditorForm from "../../../../../../features/properties/components/property-editor-form";
import { useGetPropertyQuery } from "@/lib/api/api";
import { useParams } from "next/navigation";

export default function EditPropertyPage() {
    const { id } = useParams();
    const propertyId = Number(id);
    const {
        data: property,
        isLoading,
        isError,
        refetch,
    } = useGetPropertyQuery(propertyId, {
        skip: !Number.isInteger(propertyId),
    });
    if (isLoading) return <PageSkeleton variant="form" />;
    if (isError || !property)
        return (
            <div className="dashboard-container text-foreground">
                <p>Property could not be loaded.</p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-3 text-primary underline"
                >
                    Try again
                </button>
            </div>
        );
    return <PropertyEditorForm property={property} />;
}
