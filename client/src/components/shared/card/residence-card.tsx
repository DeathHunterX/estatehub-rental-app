import { Button } from "@/components/ui/button";
import { Lease, Property } from "@/types/prisma";
import { Download, MapPin, User } from "lucide-react";
import Image from "next/image";

const ResidenceCard = ({
    property,
    currentLease,
}: {
    property: Property;
    currentLease: Lease;
}) => {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex gap-5">
                {property?.photoUrls?.length > 0 ? (
                    <Image
                        src={property.photoUrls[0]}
                        alt={property.name}
                        width={256}
                        height={128}
                        className="w-64 h-32 object-cover bg-slate-500 rounded-xl"
                    />
                ) : (
                    <div className="w-64 h-32 object-cover bg-slate-500 rounded-xl" />
                )}

                <div className="flex flex-col justify-between">
                    <div>
                        <div className="bg-green-500 w-fit text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Active Leases
                        </div>

                        <h2 className="text-2xl font-bold my-2">
                            {property.name}
                        </h2>
                        <div className="flex items-center mb-2">
                            <MapPin className="w-5 h-5 mr-1" />
                            <span>
                                {property.location.city},{" "}
                                {property.location.country}
                            </span>
                        </div>
                    </div>
                    <div className="text-xl font-bold">
                        ${currentLease.rent}{" "}
                        <span className="text-gray-500 text-sm font-normal">
                            / night
                        </span>
                    </div>
                </div>
            </div>
            {/* Dates */}
            <div>
                <hr className="my-4" />
                <div className="flex justify-between items-center">
                    <div className="xl:flex">
                        <div className="text-gray-500 mr-2">Start Date: </div>
                        <div className="font-semibold">
                            {new Date(
                                currentLease.startDate
                            ).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="border-[0.5px] border-primary-300 h-4" />
                    <div className="xl:flex">
                        <div className="text-gray-500 mr-2">End Date: </div>
                        <div className="font-semibold">
                            {new Date(
                                currentLease.endDate
                            ).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="border-[0.5px] border-primary-300 h-4" />
                    <div className="xl:flex">
                        <div className="text-gray-500 mr-2">Next Payment: </div>
                        <div className="font-semibold">
                            {new Date(
                                currentLease.endDate
                            ).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <hr className="my-4" />
            </div>
            {/* Buttons */}
            <div className="flex justify-end gap-2 w-full">
                <Button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50">
                    <User className="w-5 h-5 mr-2" />
                    Manager
                </Button>
                <Button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50">
                    <Download className="w-5 h-5 mr-2" />
                    Download Agreement
                </Button>
            </div>
        </div>
    );
};

export default ResidenceCard;
