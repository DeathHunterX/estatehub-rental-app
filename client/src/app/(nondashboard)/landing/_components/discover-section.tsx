"use client";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const DiscoverSection = () => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="bg-card py-20 text-card-foreground lg:py-28"
        >
            <div className="max-w-6xl xl:max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
                <motion.div
                    variants={itemVariants}
                    className="mb-12 text-center"
                >
                    <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                        Your next move, step by step
                    </h2>

                    <p className="mt-4 text-lg text-muted-foreground">
                        From the first search to the next conversation.
                    </p>

                    <p className="mx-auto mt-2 max-w-3xl text-muted-foreground">
                        See how a promising listing becomes an application, then
                        keep track of what happens next from your account.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16 text-center">
                    {[
                        {
                            id: "search",
                            imageSrc: "/landing-icon-wand.png",
                            title: "Search for Properties",
                            description:
                                "Search by location, explore listing photos, and check the rent and amenities before you make a shortlist.",
                        },
                        {
                            id: "apply",
                            imageSrc: "/landing-icon-calendar.png",
                            title: "Apply for a Home",
                            description:
                                "When a home feels right, send an application from its listing and follow updates in your dashboard.",
                        },
                        {
                            id: "connect",
                            imageSrc: "/landing-icon-heart.png",
                            title: "Stay Connected",
                            description:
                                "Message the property manager and return to your application and rental details whenever you need them.",
                        },
                    ].map((card) => (
                        <motion.div key={card.id} variants={itemVariants}>
                            <DiscoverCard {...card} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const DiscoverCard = ({
    imageSrc,
    title,
    description,
}: {
    imageSrc: string;
    title: string;
    description: string;
}) => (
    <div className="h-full rounded-2xl border border-border bg-background px-6 py-10 shadow-sm">
        <div className="bg-primary-700 p-[0.6rem] rounded-full mb-4 size-10 mx-auto">
            <Image
                src={imageSrc}
                alt={title}
                width={30}
                height={30}
                className="size-full object-contain"
            />
        </div>
        <h3 className="mt-4 text-xl font-medium">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
        </p>
    </div>
);
export default DiscoverSection;
