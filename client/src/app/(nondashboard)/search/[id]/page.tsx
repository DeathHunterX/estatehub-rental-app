"use client";

import { useGetAuthCurrentUserQuery } from "@/states/api";
import { useParams } from "next/navigation";
import { useState } from "react";
import ApplicationModal from "./_components/application-modal";
import ContactWidget from "./_components/contact-widget";
import ImagePreviews from "./_components/image-previews";
import PropertyDetails from "./_components/property-details";
import PropertyLocation from "./_components/property-location";
import PropertyOverview from "./_components/property-overview";

const PropertyDetailedPage = () => {
    const { id } = useParams();
    const propertyId = Number(id);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const { data: authUser } = useGetAuthCurrentUserQuery();

    return (
        <div>
            <ImagePreviews
                images={["/singlelisting-2.jpg", "/singlelisting-3.jpg"]}
            />
            <div className="flex flex-col md:flex-row justify-center gap-10 mx-10 md:w-2/3 md:mx-auto mt-16 mb-8">
                <div className="order-2 md:order-1">
                    <PropertyOverview propertyId={propertyId} />
                    <PropertyDetails propertyId={propertyId} />
                    <PropertyLocation propertyId={propertyId} />
                </div>

                <div className="order-1 md:order-2">
                    <ContactWidget
                        onOpenModal={() => setIsModalOpen(true)}
                        propertyId={propertyId}
                    />
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
