"use client";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const ImagePreviews = ({ images }: ImagePreviewsProps) => {
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

    const handlePrev = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? images.length - 1 : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentImageIndex((prev) =>
            prev === images.length - 1 ? 0 : prev + 1
        );
    };

    return (
        <div className="relative h-[450px] w-full">
            {images.map((image, index) => (
                <div
                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                        index === currentImageIndex
                            ? "opacity-100"
                            : "opacity-0"
                    }`}
                    key={image}
                >
                    <Image
                        src={image}
                        alt={`Property Image ${index + 1}`}
                        fill
                        priority={index === 0}
                        className="object-cover cursor-pointer transition-transform duration-500 ease-in-out"
                    />
                </div>
            ))}

            <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-primary-700/50 
                p-2 rounded-full focus:outline-none focus:ring focus:ring-secondary-300
                hover:bg-primary-700 cursor-pointer
                "
                aria-label="Previous Image"
            >
                <ChevronLeftIcon className="h-6 w-6 text-white" />
            </button>
            <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-primary-700/50 
                p-2 rounded-full focus:outline-none focus:ring focus:ring-secondary-300
                hover:bg-primary-700 cursor-pointer
                "
                aria-label="Next Image"
            >
                <ChevronRightIcon className="h-6 w-6 text-white" />
            </button>
        </div>
    );
};

export default ImagePreviews;
