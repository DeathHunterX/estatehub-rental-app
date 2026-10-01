"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

type PropertyPhotoLightboxProps = {
    images: string[];
    index: number;
    title: string;
    onChange: (index: number) => void;
    onClose: () => void;
};

const PropertyPhotoLightbox = ({
    images,
    index,
    title,
    onChange,
    onClose,
}: PropertyPhotoLightboxProps) => {
    const activeIndex = Math.min(Math.max(index, 0), images.length - 1);

    useEffect(() => {
        if (images.length < 2) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft")
                onChange((activeIndex - 1 + images.length) % images.length);
            if (event.key === "ArrowRight")
                onChange((activeIndex + 1) % images.length);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [activeIndex, images.length, onChange]);

    if (!images.length) return null;

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent
                showCloseButton={false}
                className="w-[min(98vw,1400px)] max-w-[98vw] gap-0 overflow-hidden border-white/15 bg-zinc-950 p-2 text-white shadow-2xl sm:max-w-[min(98vw,1400px)] sm:p-3"
            >
                <DialogTitle className="sr-only">
                    {title} photo {activeIndex + 1} of {images.length}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Full-size property photo viewer. Press Escape to close.
                </DialogDescription>
                <button
                    type="button"
                    aria-label="Close photo viewer"
                    onClick={onClose}
                    className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                    <X className="size-5" />
                </button>
                <div className="relative h-[min(85dvh,950px)] min-h-64 w-full bg-black">
                    <Image
                        src={images[activeIndex]}
                        alt={`${title} photo ${activeIndex + 1} of ${images.length}`}
                        fill
                        sizes="(max-width: 1400px) 98vw, 1400px"
                        className="object-contain"
                    />
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                aria-label="Previous full-size photo"
                                onClick={() =>
                                    onChange(
                                        (activeIndex - 1 + images.length) %
                                            images.length
                                    )
                                }
                                className="absolute left-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-white sm:left-4"
                            >
                                <ChevronLeft className="size-5" />
                            </button>
                            <button
                                type="button"
                                aria-label="Next full-size photo"
                                onClick={() =>
                                    onChange((activeIndex + 1) % images.length)
                                }
                                className="absolute right-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-white sm:right-4"
                            >
                                <ChevronRight className="size-5" />
                            </button>
                        </>
                    )}
                </div>
                <p className="px-1 pt-3 text-center text-sm text-zinc-200">
                    {title}
                    {images.length > 1 &&
                        ` · ${activeIndex + 1} / ${images.length}`}
                </p>
            </DialogContent>
        </Dialog>
    );
};

export default PropertyPhotoLightbox;
