import { ArrowRight, Building2, Heart } from "lucide-react";
import Link from "next/link";

const AudienceSection = () => (
    <section
        className="bg-background px-6 py-20 text-foreground sm:px-8 lg:py-28"
        id="for-everyone"
    >
        <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                    Made for both sides
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    One place for the whole rental journey
                </h2>
                <p className="mt-4 leading-7 text-muted-foreground">
                    Whether you are looking for a place to live or managing one,
                    EstateHub brings the useful details and next steps into one
                    clear view.
                </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-7 sm:p-9">
                    <Heart className="size-8 text-primary" />
                    <h3 className="mt-6 text-2xl font-semibold">For renters</h3>
                    <p className="mt-3 leading-7 text-muted-foreground">
                        Explore homes at your own pace. Save the listings worth
                        revisiting, send applications, and check their progress
                        from your dashboard.
                    </p>
                    <Link
                        href="/search"
                        className="mt-7 inline-flex items-center gap-2 font-medium text-primary hover:underline"
                    >
                        Explore homes <ArrowRight className="size-4" />
                    </Link>
                </div>
                <div className="rounded-2xl border border-border bg-card p-7 sm:p-9">
                    <Building2 className="size-8 text-primary" />
                    <h3 className="mt-6 text-2xl font-semibold">
                        For managers
                    </h3>
                    <p className="mt-3 leading-7 text-muted-foreground">
                        Put your property in front of renters with clear listing
                        details. Review applications and keep conversations
                        close to the homes you manage.
                    </p>
                    <Link
                        href="/sign-up"
                        className="mt-7 inline-flex items-center gap-2 font-medium text-primary hover:underline"
                    >
                        Create an account <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

export default AudienceSection;
