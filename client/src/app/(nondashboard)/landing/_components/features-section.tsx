"use client";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, staggerChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const features = [
    {
        id: "explore",
        imageSrc: "/landing-search3.png",
        title: "Explore rental homes",
        description: "Start with available homes and open any listing for a closer look at the space, location, and photos.",
        linkText: "Browse homes",
        linkHref: "/search",
    },
    {
        id: "compare",
        imageSrc: "/landing-search2.png",
        title: "Compare the details",
        description: "Check rent, bedrooms, bathrooms, and amenities side by side as you decide what belongs on your shortlist.",
        linkText: "See listings",
        linkHref: "/search",
    },
    {
        id: "refine",
        imageSrc: "/landing-search1.png",
        title: "Refine your search",
        description: "Set a location and narrow results by price, property type, and the features that matter most to you.",
        linkText: "Start filtering",
        linkHref: "/search",
    },
];

const FeaturesSection = () => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="bg-background px-6 py-20 text-foreground sm:px-8 lg:px-12 lg:py-28 xl:px-16"
        >
            <div className="max-w-4xl xl:max-w-6xl mx-auto">
                <motion.h2
                    variants={itemVariants}
                    className="mx-auto mb-4 max-w-3xl text-center text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    Find a place that fits your day to day
                </motion.h2>

                <p className="mx-auto mb-12 max-w-2xl text-center leading-7 text-muted-foreground">
                    A good rental search starts with the details. Browse available homes, check what each space offers, and focus on the options that match your needs.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16">
                    {features.map((feature) => (
                        <motion.div key={feature.id} variants={itemVariants}>
                            <FeatureCard {...feature} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const FeatureCard = ({
    imageSrc,
    title,
    description,
    linkText,
    linkHref,
}: {
    imageSrc: string;
    title: string;
    description: string;
    linkText: string;
    linkHref: string;
}) => (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-sm">
        <div className="mb-5 flex h-44 items-center justify-center rounded-xl bg-background p-4">
            <Image
                src={imageSrc}
                alt={title}
                width={400}
                height={400}
                className="size-full object-contain"
            />
        </div>
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        <p className="mb-6 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>

        <Link
            href={linkHref}
            className="inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            scroll={false}
        >
            {linkText}
        </Link>
    </div>
);
export default FeaturesSection;
