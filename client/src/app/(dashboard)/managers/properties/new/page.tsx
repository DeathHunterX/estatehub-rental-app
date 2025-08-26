"use client";
import { CustomFormField } from "@/components/shared/form-field";
import Header from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AmenityEnum, HighlightEnum, PropertyTypeEnum } from "@/constants";
import { PropertyFormData, propertySchema } from "@/lib/schemas";
import {
    useCreatePropertyMutation,
    useGetAuthCurrentUserQuery,
} from "@/states/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import z from "zod";

const NewPropertiesPage = () => {
    const [createProperty, { isLoading }] = useCreatePropertyMutation();
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const router = useRouter();

    const form = useForm<
        z.input<typeof propertySchema>,
        undefined,
        PropertyFormData
    >({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            name: "",
            description: "",
            pricePerMonth: "1000",
            securityDeposit: "500",
            applicationFee: "100",
            isPetsAllowed: true,
            isParkingIncluded: true,
            photoUrls: [],
            amenities: "",
            highlights: "",
            beds: "1",
            baths: "1",
            squareFeet: "1000",
            address: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
            propertyType: PropertyTypeEnum.Apartment, // ✅ Add this line
        },
    });

    async function onSubmit(data: PropertyFormData) {
        if (!authUser?.user?.id) {
            throw new Error("No manager ID found");
        }

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key === "photoUrls") {
                const files = value as File[];
                files.forEach((file: File) => {
                    formData.append("photos", file);
                });
            } else if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, String(value));
            }
        });

        formData.append("managerUserId", authUser.user.id);

        const response = await createProperty(formData).unwrap();

        if (response.success) {
            toast.success("Property created successfully");
            router.push("/managers/properties");
        } else {
            toast.error("Failed to create property");
        }
    }

    return (
        <div className="dashboard-container">
            <Header
                title="Add New Property"
                subtitle="Create a new property listing with detailed information"
            />
            <div className="bg-white rounded-xl p-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="p-4 space-y-10"
                    >
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

                        <hr className="my-6 border-gray-200" />

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

                        <hr className="my-6 border-gray-200" />

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

                        <hr className="my-6 border-gray-200" />

                        {/* Amenities and Highlights */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">
                                Amenities and Highlights
                            </h2>
                            <div className="space-y-6">
                                <CustomFormField
                                    name="amenities"
                                    label="Amenities"
                                    type="select"
                                    options={Object.keys(AmenityEnum).map(
                                        (amenity) => ({
                                            value: amenity,
                                            label: amenity,
                                        })
                                    )}
                                    disabled={isLoading}
                                />
                                <CustomFormField
                                    name="highlights"
                                    label="Highlights"
                                    type="select"
                                    options={Object.keys(HighlightEnum).map(
                                        (highlight) => ({
                                            value: highlight,
                                            label: highlight,
                                        })
                                    )}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-gray-200" />

                        {/* Photos */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">
                                Photos
                            </h2>
                            <CustomFormField
                                name="photoUrls"
                                label="Property Photos"
                                type="file"
                                accept="image/*"
                                disabled={isLoading}
                            />
                        </div>

                        <hr className="my-6 border-gray-200" />

                        {/* Additional Information */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold mb-4">
                                Additional Information
                            </h2>
                            <CustomFormField name="address" label="Address" />
                            <div className="flex justify-between gap-4">
                                <CustomFormField
                                    name="city"
                                    label="City"
                                    className="w-full"
                                    disabled={isLoading}
                                />
                                <CustomFormField
                                    name="state"
                                    label="State"
                                    className="w-full"
                                    disabled={isLoading}
                                />
                                <CustomFormField
                                    name="postalCode"
                                    label="Postal Code"
                                    className="w-full"
                                    disabled={isLoading}
                                />
                            </div>
                            <CustomFormField
                                name="country"
                                label="Country"
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="bg-primary-700 text-white w-full mt-8"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating..." : "Create Property"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default NewPropertiesPage;
