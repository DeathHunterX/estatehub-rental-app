"use client";

import PropertyPhotoLightbox from "@/features/properties/components/property-photo-lightbox";
import PropertyPhotoRail from "@/features/properties/components/property-photo-rail";
import { ChevronLeft, ChevronRight, ImageOff, Maximize2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const ImagePreviews = ({
    images,
    title,
}: ImagePreviewsProps & { title: string }) => {
    const [index, setIndex] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [failed, setFailed] = useState<string[]>([]);
    const available = images.filter((image) => !failed.includes(image));
    const activeIndex = index % Math.max(available.length, 1);

    if (!available.length)
        return (
            <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-muted-foreground sm:h-[320px] lg:h-[440px]">
                <ImageOff className="size-9" aria-hidden="true" />
                <p className="text-sm font-medium">
                    Property photos are not available yet.
                </p>
            </div>
        );

    return (
        <>
            <section
                aria-label="Property photos"
                className="overflow-hidden rounded-2xl border border-border bg-card"
            >
                <div className="sm:flex sm:h-[400px] lg:h-[520px]">
                    <div className="relative h-64 min-w-0 flex-1 bg-muted sm:h-full">
                        <button
                            type="button"
                            aria-label={`View full-size photo ${activeIndex + 1} of ${available.length}`}
                            onClick={() => setViewerOpen(true)}
                            className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
                        >
                            <Image
                                key={available[activeIndex]}
                                src={available[activeIndex]}
                                alt={`Property photo ${activeIndex + 1} of ${available.length}`}
                                fill
                                preload={activeIndex === 0}
                                sizes="(max-width: 1280px) 100vw, 1280px"
                                className="object-cover"
                                onError={() =>
                                    setFailed((current) => [
                                        ...current,
                                        available[activeIndex],
                                    ])
                                }
                            />
                            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md">
                                <Maximize2 className="size-3.5" /> View full
                                photo
                            </span>
                        </button>
                        {available.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    aria-label="Previous photo"
                                    onClick={() =>
                                        setIndex(
                                            (activeIndex -
                                                1 +
                                                available.length) %
                                                available.length
                                        )
                                    }
                                    className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md transition hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                    <ChevronLeft className="size-5" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Next photo"
                                    onClick={() =>
                                        setIndex(
                                            (activeIndex + 1) % available.length
                                        )
                                    }
                                    className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md transition hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                    <ChevronRight className="size-5" />
                                </button>
                                <span className="absolute bottom-4 right-4 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground">
                                    {activeIndex + 1} / {available.length}{" "}
                                    photos
                                </span>
                            </>
                        )}
                    </div>
                    {available.length > 1 && (
                        <PropertyPhotoRail
                            images={available}
                            activeIndex={activeIndex}
                            onSelect={setIndex}
                            onImageError={(image) =>
                                setFailed((current) =>
                                    current.includes(image)
                                        ? current
                                        : [...current, image]
                                )
                            }
                        />
                    )}
                </div>
            </section>
            {viewerOpen && (
                <PropertyPhotoLightbox
                    images={available}
                    index={activeIndex}
                    title={title}
                    onChange={setIndex}
                    onClose={() => setViewerOpen(false)}
                />
            )}
        </>
    );
};

export default ImagePreviews;
