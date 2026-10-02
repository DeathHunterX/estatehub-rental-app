"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, MapPin, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const HeroSection = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const location = searchQuery.trim();
        router.push(
            location
                ? `/search?location=${encodeURIComponent(location)}`
                : "/search"
        );
    };

    return (
        <section className="relative isolate flex min-h-[calc(100svh-52px)] items-center justify-center overflow-hidden bg-[#080a0e] px-5 py-20 text-white sm:px-8 lg:min-h-[min(860px,calc(100svh-52px))]">
            <Image
                src="/landing-splash.jpg"
                alt="Modern rental home"
                fill
                sizes="100vw"
                className="-z-20 object-cover object-[55%_center] sm:object-center"
                priority
            />
            <div className="absolute inset-0 -z-10 bg-black/50" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#080a0e]/35 via-transparent to-[#080a0e]/80" />

            <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
                <p className="mb-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f4b4af] sm:text-sm">
                    <span className="h-px w-7 bg-current" /> Find your next home{" "}
                    <span className="h-px w-7 bg-current" />
                </p>
                <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-6xl lg:text-7xl">
                    Find the perfect place{" "}
                    <span className="text-[#f4b4af]">to call home.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
                    Explore rental homes that fit your life, then keep every
                    next step in one place.
                </p>

                <form
                    role="search"
                    onSubmit={handleSearch}
                    className="mt-9 flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-white/30 bg-[#12141b]/50 p-2 text-left shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-[6px] sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-2.5"
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-1 sm:px-5">
                        <MapPin
                            className="size-5 shrink-0 text-[#f4b4af]"
                            aria-hidden="true"
                        />
                        <label className="sr-only" htmlFor="hero-location">
                            City or neighborhood
                        </label>
                        <Input
                            ref={searchInputRef}
                            id="hero-location"
                            type="text"
                            enterKeyHint="search"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="City, neighborhood or address"
                            className="h-11 min-w-0 border-0 !bg-transparent px-0 text-[18px] font-medium text-white caret-white shadow-none placeholder:font-normal placeholder:text-white/75 focus-visible:border-0 focus-visible:ring-0 dark:!bg-transparent sm:h-12 md:text-[18px]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                title="Clear search"
                                onClick={() => {
                                    setSearchQuery("");
                                    searchInputRef.current?.focus();
                                }}
                                className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                <X className="size-5" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                    <Button
                        type="submit"
                        className="h-12 shrink-0 rounded-xl bg-[#ef9f9b] px-7 font-semibold text-[#241416] hover:bg-[#f6b7b2] sm:h-12 sm:rounded-full"
                    >
                        <Search className="size-4" /> Search homes
                    </Button>
                </form>

                <Link
                    href="/search"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/90 underline-offset-4 transition-colors hover:text-[#f4b4af] hover:underline"
                >
                    Browse all listings <ArrowRight className="size-4" />
                </Link>
            </div>
        </section>
    );
};

export default HeroSection;
