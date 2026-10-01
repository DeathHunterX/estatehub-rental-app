"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const CallToActionSection = () => {
    return (
        <section className="relative py-20 lg:py-28">
            <Image
                src="/landing-call-to-action.jpg"
                alt="EstateHub CTA Section Background"
                fill
                sizes="100vw"
                className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-black opacity-60"></div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-12"
            >
                <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                            Ready to see what is available?
                        </h2>
                        <p className="mt-4 leading-7 text-white/85">
                            Explore homes with the space, price, and location you need. When you find a match, create an account to save it or apply.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                            <Link href="/search" className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-primary-800 hover:bg-primary-100">
                                Search homes
                            </Link>
                            <Link
                                href="/sign-up"
                                className="inline-block rounded-lg bg-secondary-600 px-6 py-3 font-semibold text-white hover:bg-secondary-700"
                                scroll={false}
                            >
                                Create an account
                            </Link>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default CallToActionSection;
