"use client";

// Libraries
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
import z from "zod";

// Components
import { CustomFormField } from "@/components/shared/form-field";
import { PropertyPhotoUploader } from "@/features/properties/components/property-photo-uploader";
import Header from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

// APIs
import {
    useCreatePropertyMutation,
    useUpdatePropertyMutation,
    useGetAuthCurrentUserQuery,
} from "@/lib/api/api";

// Constants
import { AmenityEnum, HighlightEnum, PropertyTypeEnum } from "@/constants";

// Validation
import { PropertyFormData, propertySchema } from "@/lib/schemas";

// Libs
import { serializePropertyFields } from "@/features/properties/lib/property-form-payload";

// Types
import type { Property } from "@/types/prisma";

type EditableProperty = Property & {
    location: {
        address: string;
        subdistrict?: string | null;
        district?: string | null;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };
};
const optionLabel = (value: string) =>
    value.replace(/([a-z])([A-Z])/g, "$1 $2");

const PropertyEditorForm = ({ property }: { property?: EditableProperty }) => {
    const [createProperty, { isLoading }] = useCreatePropertyMutation();
    const [updateProperty, { isLoading: isUpdating }] =
        useUpdatePropertyMutation();
    const [photosPending, setPhotosPending] = useState(false);
    const savedRef = useRef(false);
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const router = useRouter();

    const form = useForm<
        z.input<typeof propertySchema>,
        undefined,
        PropertyFormData
    >({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            name: property?.name ?? "",
            description: property?.description ?? "",
            pricePerMonth: String(property?.pricePerMonth ?? 1000),
            securityDeposit: String(property?.securityDeposit ?? 500),
            applicationFee: String(property?.applicationFee ?? 100),
            isPetsAllowed: property?.isPetsAllowed ?? true,
            isParkingIncluded: property?.isParkingIncluded ?? true,
            photoUrls: property?.photoUrls ?? [],
            amenities: property?.amenities ?? [],
            highlights: property?.highlights ?? [],
            beds: String(property?.beds ?? 1),
            baths: String(property?.baths ?? 1),
            squareFeet: String(property?.squareFeet ?? 1000),
            address: property?.location?.address ?? "",
            subdistrict: property?.location?.subdistrict ?? "",
            district: property?.location?.district ?? "",
            city: property?.location?.city ?? "",
            state: property?.location?.state ?? "",
            country: property?.location?.country ?? "",
            postalCode: property?.location?.postalCode ?? "",
            propertyType: property?.propertyType ?? PropertyTypeEnum.Apartment,
        },
    });

    async function onSubmit(data: PropertyFormData) {
        // Navigation marks staged photos as saved so the uploader does not discard them.
        if (photosPending) return;
        if (!authUser?.user?.id) {
            throw new Error("No manager ID found");
        }

        const formData = serializePropertyFields(data);

        formData.append("managerUserId", authUser.user.id);

        try {
            if (property) {
                await updateProperty({
                    id: property.id,
                    data: formData,
                }).unwrap();
                savedRef.current = true;
                router.push(`/managers/properties/${property.id}`);
            } else {
                await createProperty(formData).unwrap();
                savedRef.current = true;
                router.push("/managers/properties");
            }
        } catch {
            /* API mutation displays the error */
        }
    }

    // React Hook Form invokes this callback only after a submit event.
    // eslint-disable-next-line react-hooks/refs
    const submitHandler = form.handleSubmit(onSubmit);

    return (
        <div className="dashboard-container property-new-page text-foreground">
            <Header
                title={property ? "Edit Property" : "Add New Property"}
                subtitle={
                    property
                        ? "Update your listing details and photos"
                        : "Create a new property listing with detailed information"
                }
            />
            <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8">
                <Form {...form}>
                    <form onSubmit={submitHandler} className="space-y-10">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">
                                Basic Information
                            </h2>
                            <div className="space-y-4">
                                <CustomFormField
                                    name="name"
                                    label="Property Name"
                                    disabled={isLoading}
                                />
                                <CustomFormField
                                    name="description"
                                    label="Description"
                                    type="textarea"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-border" />

                        {/* Fees */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold mb-4">Fees</h2>
                            <CustomFormField
                                name="pricePerMonth"
                                label="Price per Month"
                                type="number"
                                disabled={isLoading}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomFormField
                                    name="securityDeposit"
                                    label="Security Deposit"
                                    type="number"
                                />
                                <CustomFormField
                                    name="applicationFee"
                                    label="Application Fee"
                                    type="number"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-border" />

                        {/* Property Details */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold mb-4">
                                Property Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <CustomFormField
                                    name="beds"
                                    label="Number of Beds"
                                    type="number"
                                />
                                <CustomFormField
                                    name="baths"
                                    label="Number of Baths"
                                    type="number"
                                    disabled={isLoading}
                                />
                                <CustomFormField
                                    name="squareFeet"
                                    label="Square Feet"
                                    type="number"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <CustomFormField
                                    name="isPetsAllowed"
                                    label="Pets Allowed"
                                    type="switch"
                                    disabled={isLoading}
                                />
                                <CustomFormField
                                    name="isParkingIncluded"
                                    label="Parking Included"
                                    type="switch"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="mt-4">
                                <CustomFormField
                                    name="propertyType"
                                    label="Property Type"
                                    type="select"
                                    options={Object.keys(PropertyTypeEnum).map(
                                        (type) => ({
                                            value: type,
                                            label: type,
                                        })
                                    )}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-border" />

                        {/* Amenities and Highlights */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">
                                Amenities and Highlights
                            </h2>
                            <div className="space-y-6">
                                <CustomFormField
                                    name="amenities"
                                    label="Amenities"
                                    type="multi-select"
                                    options={Object.keys(AmenityEnum).map(
                                        (amenity) => ({
                                            value: amenity,
                                            label: optionLabel(amenity),
                                        })
                                    )}
                                    disabled={isLoading}
                                />
                                <CustomFormField
                                    name="highlights"
                                    label="Highlights"
                                    type="multi-select"
                                    options={Object.keys(HighlightEnum).map(
                                        (highlight) => ({
                                            value: highlight,
                                            label: optionLabel(highlight),
                                        })
                                    )}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-border" />

                        {/* Photos */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">
                                Photos
                            </h2>
                            <PropertyPhotoUploader
                                initialUrls={property?.photoUrls}
                                disabled={isLoading || isUpdating}
                                onUploadStateChange={setPhotosPending}
                                savedRef={savedRef}
                            />
                        </div>

                        <hr className="my-6 border-border" />

                        {/* Location */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold mb-4">
                                Property Address
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Enter the full street address and local
                                administrative areas so guests can find this
                                property accurately.
                            </p>
                            <CustomFormField
                                name="address"
                                label="Street address and number"
                                disabled={isLoading || isUpdating}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <CustomFormField
                                    name="subdistrict"
                                    label="Ward / suburb (optional)"
                                    disabled={isLoading || isUpdating}
                                />
                                <CustomFormField
                                    name="district"
                                    label="District / county (optional)"
                                    disabled={isLoading || isUpdating}
                                />
                                <CustomFormField
                                    name="city"
                                    label="City / town / locality"
                                    className="w-full"
                                    disabled={isLoading || isUpdating}
                                />
                                <CustomFormField
                                    name="state"
                                    label="State / province / region (optional)"
                                    className="w-full"
                                    disabled={isLoading || isUpdating}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <CustomFormField
                                    name="country"
                                    label="Country"
                                    disabled={isLoading || isUpdating}
                                />
                                <CustomFormField
                                    name="postalCode"
                                    label="Postal / ZIP code (optional)"
                                    disabled={isLoading || isUpdating}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-8 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={isLoading || isUpdating || photosPending}
                        >
                            {isLoading || isUpdating
                                ? "Saving..."
                                : property
                                  ? "Save Changes"
                                  : "Create Property"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default PropertyEditorForm;
