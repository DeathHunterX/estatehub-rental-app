import { Bath, Bed, Heart, House, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { propertyImageSrc } from "@/features/properties/lib/property-image";

const PropertyCardCompact = ({
    property,
    isFavorite,
    onFavoriteToggle,
    showFavoriteButton = true,
    propertyLink,
    selected = false,
    onFocusMap,
}: CardCompactProps) => {
    const [imgSrc, setImgSrc] = useState(
        propertyImageSrc(property.photoUrls?.[0])
    );

    return (
        <article onClick={onFocusMap} className={`group bg-card text-card-foreground relative border rounded-xl overflow-hidden shadow-sm w-full flex min-h-44 mb-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-xl focus-within:border-primary/70 focus-within:shadow-lg ${onFocusMap ? "cursor-pointer" : ""} ${selected ? "border-primary ring-2 ring-primary/50 shadow-lg" : "border-border"}`}>
            <div className="relative w-1/3">
                <Image
                    src={imgSrc}
                    alt={property.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={() => setImgSrc("/placeholder.jpg")}
                />
                <div className="absolute bottom-2 left-2 flex gap-1 flex-col">
                    {property.isPetsAllowed && (
                        <span className="w-fit rounded-full border border-border bg-card/90 px-2 py-1 text-xs font-semibold text-card-foreground backdrop-blur-sm">
                            Pets
                        </span>
                    )}
                    {property.isParkingIncluded && (
                        <span className="rounded-full border border-border bg-card/90 px-2 py-1 text-xs font-semibold text-card-foreground backdrop-blur-sm">
                            Parking
                        </span>
                    )}
                </div>
            </div>
            <div className="w-2/3 min-w-0 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <h2 className="text-lg font-bold mb-1 leading-tight line-clamp-2">
                            {propertyLink ? (
                                <Link
                                    href={propertyLink}
                                    className="relative z-10 hover:underline hover:text-primary"
                                    onClick={(event) => event.stopPropagation()}
                                    scroll={false}
                                >
                                    {property.name}
                                </Link>
                            ) : (
                                property.name
                            )}
                        </h2>
                        {showFavoriteButton && (
                            <button
                                className="relative z-10 rounded-full border border-border bg-background p-1.5 text-foreground hover:bg-accent"
                                onClick={(event) => { event.stopPropagation(); onFavoriteToggle(); }}
                                aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                            >
                                <Heart
                                    className={`w-4 h-4 ${
                                        isFavorite
                                            ? "text-red-500 fill-red-500"
                                            : "text-muted-foreground"
                                    }`}
                                />
                            </button>
                        )}
                    </div>
                    <p className="text-muted-foreground mb-1 text-sm line-clamp-1">
                        {property?.location?.address},{" "}
                        {property?.location?.city}
                    </p>
                    <div className="flex text-sm items-center">
                        <Star className="w-3 h-3 text-yellow-400 mr-1" />
                        <span className="font-semibold">
                            {property.averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                            ({property.numberOfReviews})
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2 text-sm">
                    <div className="flex gap-2 text-muted-foreground">
                        <span className="flex items-center">
                            <Bed className="w-4 h-4 mr-1" />
                            {property.beds}
                        </span>
                        <span className="flex items-center">
                            <Bath className="w-4 h-4 mr-1" />
                            {property.baths}
                        </span>
                        <span className="flex items-center">
                            <House className="w-4 h-4 mr-1" />
                            {property.squareFeet}
                        </span>
                    </div>

                    <p className="text-base font-bold">
                        ${property.pricePerMonth.toFixed(0)}
                        <span className="text-muted-foreground text-xs font-normal">
                            {" "}
                            /mo
                        </span>
                    </p>
                </div>
                {onFocusMap && <button type="button" onClick={(event) => { event.stopPropagation(); onFocusMap(); }} className="mt-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"><MapPin className="size-3.5" />Show on map</button>}
            </div>
        </article>
    );
};

export default PropertyCardCompact;
