import {
    faFacebook,
    faInstagram,
    faLinkedin,
    faTwitter,
    faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

const socialChannels = [
    { name: "Facebook", icon: faFacebook },
    { name: "Instagram", icon: faInstagram },
    { name: "Twitter", icon: faTwitter },
    { name: "LinkedIn", icon: faLinkedin },
    { name: "YouTube", icon: faYoutube },
];

const FooterSection = () => (
    <footer className="border-t border-border bg-background px-6 py-16 text-foreground sm:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-7xl 2xl:max-w-none 2xl:px-[clamp(2rem,3vw,6rem)]">
            <div className="grid gap-12 border-b border-border pb-12 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))] lg:grid-cols-[minmax(0,1fr)_200px_160px] lg:gap-10">
                <div id="about" className="max-w-sm scroll-mt-20">
                    <Link href="/" className="text-2xl font-bold tracking-tight">ESTATEHUB</Link>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        A home for the whole rental journey. Find places worth a closer look, keep track of your applications, and stay connected as plans move forward.
                    </p>
                    <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Social channels coming soon</p>
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="Planned social channels">
                        {socialChannels.map(({ name, icon }) => (
                            <span key={name} title={`${name} coming soon`} aria-label={`${name} coming soon`} className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground">
                                <FontAwesomeIcon icon={icon} className="size-4" />
                            </span>
                        ))}
                    </div>
                </div>

                <nav aria-label="Explore" className="text-sm">
                    <h2 className="font-semibold text-foreground">Explore</h2>
                    <ul className="mt-5 space-y-3 text-muted-foreground">
                        <li><Link href="/search" className="hover:text-foreground">Browse homes</Link></li>
                        <li><Link href="/#for-everyone" className="hover:text-foreground">For renters and managers</Link></li>
                        <li><Link href="/sign-up" className="hover:text-foreground">Create an account</Link></li>
                    </ul>
                </nav>

                <nav aria-label="EstateHub" className="text-sm">
                    <h2 className="font-semibold text-foreground">EstateHub</h2>
                    <ul className="mt-5 space-y-3 text-muted-foreground">
                        <li><Link href="/#about" className="hover:text-foreground">About Us</Link></li>
                        <li><Link href="/#faq" className="hover:text-foreground">FAQ</Link></li>
                        <li><span className="text-muted-foreground/75">Contact Us · Coming soon</span></li>
                    </ul>
                </nav>
            </div>

            <div className="flex flex-col gap-5 pt-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>Copyright © {new Date().getFullYear()} EstateHub. All rights reserved.</span>
                <div className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Policies">
                    <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
                    <Link href="/refund-cancellation" className="hover:text-foreground">Refund & Cancellation</Link>
                    <Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link>
                </div>
            </div>
        </div>
    </footer>
);

export default FooterSection;
