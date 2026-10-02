"use client";

import { Bath, Bed, Heart, House, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { propertyImageSrc, usablePropertyPhotos } from "@/features/properties/lib/property-image";
import PropertyPhotoFallback from "./property-photo-fallback";

const PropertyCard = ({
    property,
    isFavorite,
    onFavoriteToggle,
    showFavoriteButton = true,
    propertyLink,
    eagerImage = false,
}: CardProps) => {
    const [imgSrc, setImgSrc] = useState<string>(
        propertyImageSrc(usablePropertyPhotos(property.photoUrls)[0])
    );

    return (
        <div className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-lg w-full mb-5">
            <div className="relative">
                {property.listingStatus === "Closed" && <span className="absolute right-3 top-3 z-10 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">Closed</span>}
                <div className="w-full h-48 relative">
                    {imgSrc === "/placeholder.jpg" ? <PropertyPhotoFallback /> : <Image
                        src={imgSrc}
                        alt={property.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading={eagerImage ? "eager" : "lazy"}
                        onError={() => setImgSrc("/placeholder.jpg")}
                    />}
                </div>
                <div className="absolute bottom-4 left-4 flex gap-2">
                    {property.isPetsAllowed && (
                        <span className="rounded-full border border-border bg-card/90 px-2 py-1 text-xs font-semibold text-card-foreground backdrop-blur-sm">
                            Pets Allowed
                        </span>
                    )}
                    {property.isParkingIncluded && (
                        <span className="rounded-full border border-border bg-card/90 px-2 py-1 text-xs font-semibold text-card-foreground backdrop-blur-sm">
                            Parking Included
                        </span>
                    )}
                </div>
                {showFavoriteButton && (
                    <button
                        type="button"
                        aria-label={isFavorite ? `Remove ${property.name} from favorites` : `Add ${property.name} to favorites`}
                        className="absolute bottom-4 right-4 cursor-pointer rounded-full border border-border bg-card p-2 text-card-foreground hover:bg-accent"
                        onClick={onFavoriteToggle}
                    >
                        <Heart
                            className={`w-5 h-5 ${
                                isFavorite
                                    ? "text-red-500 fill-red-500"
                                    : "text-muted-foreground"
                            }`}
                        />
                    </button>
                )}
            </div>
            <div className="p-4">
                <h2 className="text-xl font-bold mb-1">
                    {propertyLink ? (
                        <Link
                            href={propertyLink}
                            className="hover:underline hover:text-primary"
                            scroll={false}
                        >
                            {property.name}
                        </Link>
                    ) : (
                        property.name
                    )}
                </h2>
                <p className="text-muted-foreground mb-2">
                    {property?.location?.address}, {property?.location?.city}
                </p>
                <div className="flex justify-between items-center">
                    <div className="flex items-center mb-2">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="font-semibold">
                            {property.averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                            ({property.numberOfReviews} Reviews)
                        </span>
                    </div>
                    <p className="text-lg font-bold mb-3">
                        ${property.pricePerMonth.toFixed(0)}{" "}
                        <span className="text-muted-foreground text-base font-normal">
                            {" "}
                            /month
                        </span>
                    </p>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between items-center gap-4 text-muted-foreground mt-5">
                    <span className="flex items-center">
                        <Bed className="w-5 h-5 mr-2" />
                        {property.beds} Bed
                    </span>
                    <span className="flex items-center">
                        <Bath className="w-5 h-5 mr-2" />
                        {property.baths} Bath
                    </span>
                    <span className="flex items-center">
                        <House className="w-5 h-5 mr-2" />
                        {property.squareFeet} sq ft
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
