"use client";
import { NAVBAR_HEIGHT } from "@/constants";

import { useAppSelector } from "@/states/store";

import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import FiltersBar from "./_components/filters-bar";
import FiltersFull from "./_components/filters-full";
import Listings from "./_components/listings";
import Map from "./_components/map";

const SearchPage = () => {
    const isFiltersFullOpen = useAppSelector(
        (state) => state.global.isFiltersFullOpen
    );

    const isMobile = useIsMobile();

    return (
        <div
            className="w-full mx-auto px-5 flex flex-col"
            style={{
                height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            }}
        >
            <FiltersBar />
            <div className="relative flex justify-between flex-1 overflow-hidden gap-3 mb-5">
                <AnimatePresence initial={false}>
                    {isFiltersFullOpen && (
                        <motion.div
                            initial="collapsed"
                            animate="open"
                            exit="collapsed"
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 30,
                            }}
                            variants={{
                                open: {
                                    opacity: 1,
                                    x: 0,
                                    width: isMobile ? "100%" : 500,
                                },
                                collapsed: {
                                    opacity: 0,
                                    x: -150,
                                    width: 0,
                                },
                            }}
                            className="absolute top-0 left-0 z-10 h-full bg-white shadow-lg overflow-hidden"
                        >
                            <FiltersFull />
                        </motion.div>
                    )}
                </AnimatePresence>

                <Map />
                <div className="overflow-y-auto basis-full md:basis-5/12 lg:basis-4/12">
                    <Listings />
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
