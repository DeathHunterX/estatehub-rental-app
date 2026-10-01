"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type PropertyPhotoRailProps = {
    images: string[];
    activeIndex: number;
    onSelect: (index: number) => void;
    onImageError?: (image: string) => void;
};

const PropertyPhotoRail = ({
    images,
    activeIndex,
    onSelect,
    onImageError,
}: PropertyPhotoRailProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scroll, setScroll] = useState({ up: false, down: false });

    useEffect(() => {
        const viewport = scrollRef.current;
        if (!viewport) return;
        const update = () => {
            const vertical = window.matchMedia("(min-width: 640px)").matches;
            setScroll({
                up: vertical && viewport.scrollTop > 1,
                down:
                    vertical &&
                    viewport.scrollTop + viewport.clientHeight <
                        viewport.scrollHeight - 1,
            });
        };
        const observer = new ResizeObserver(update);
        observer.observe(viewport);
        viewport.addEventListener("scroll", update);
        return () => {
            observer.disconnect();
            viewport.removeEventListener("scroll", update);
        };
    }, [images.length]);

    useEffect(() => {
        const viewport = scrollRef.current;
        const thumbnail = viewport?.children[activeIndex] as
            | HTMLElement
            | undefined;
        if (!viewport || !thumbnail) return;
        const revealActive = () => {
            const viewportRect = viewport.getBoundingClientRect();
            const thumbnailRect = thumbnail.getBoundingClientRect();
            if (window.matchMedia("(min-width: 640px)").matches) {
                if (thumbnailRect.top < viewportRect.top)
                    viewport.scrollBy({
                        top: thumbnailRect.top - viewportRect.top,
                        behavior: "auto",
                    });
                else if (thumbnailRect.bottom > viewportRect.bottom)
                    viewport.scrollBy({
                        top: thumbnailRect.bottom - viewportRect.bottom,
                        behavior: "auto",
                    });
            } else {
                if (thumbnailRect.left < viewportRect.left)
                    viewport.scrollBy({
                        left: thumbnailRect.left - viewportRect.left,
                        behavior: "auto",
                    });
                else if (thumbnailRect.right > viewportRect.right)
                    viewport.scrollBy({
                        left: thumbnailRect.right - viewportRect.right,
                        behavior: "auto",
                    });
            }
        };
        revealActive();
        window.addEventListener("resize", revealActive);
        return () => window.removeEventListener("resize", revealActive);
    }, [activeIndex, images.length]);

    const hasControls = scroll.up || scroll.down;

    return (
        <div
            className="border-t border-border bg-muted/40 sm:flex sm:h-full sm:w-28 sm:shrink-0 sm:flex-col sm:border-l sm:border-t-0 sm:p-2 lg:w-36"
            aria-label="Property photo previews"
        >
            {hasControls && (
                <button
                    type="button"
                    aria-label="Scroll property photos up"
                    disabled={!scroll.up}
                    onClick={() =>
                        scrollRef.current?.scrollBy({
                            top: -208,
                            behavior: "smooth",
                        })
                    }
                    className="mb-2 hidden h-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent disabled:opacity-40 sm:flex"
                >
                    <ChevronUp className="size-4" />
                </button>
            )}
            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto p-2 sm:min-h-0 sm:flex-1 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:p-0 [scrollbar-width:thin]"
            >
                {images.map((image, index) => (
                    <button
                        key={`${image}-${index}`}
                        type="button"
                        aria-label={`View photo ${index + 1} of ${images.length}`}
                        aria-pressed={activeIndex === index}
                        onClick={() => onSelect(index)}
                        className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring sm:h-24 sm:w-full ${activeIndex === index ? "border-primary" : "border-transparent opacity-65"}`}
                    >
                        <Image
                            src={image}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 144px, 112px"
                            className="object-cover"
                            onError={() => onImageError?.(image)}
                        />
                    </button>
                ))}
            </div>
            {hasControls && (
                <button
                    type="button"
                    aria-label="Scroll property photos down"
                    disabled={!scroll.down}
                    onClick={() =>
                        scrollRef.current?.scrollBy({
                            top: 208,
                            behavior: "smooth",
                        })
                    }
                    className="mt-2 hidden h-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent disabled:opacity-40 sm:flex"
                >
                    <ChevronDown className="size-4" />
                </button>
            )}
        </div>
    );
};

export default PropertyPhotoRail;
