import { useGetPropertyQuery } from "@/lib/api/api";
import { formatPropertyAddress } from "@/features/properties/lib/property-address";
import { MapPin, Star } from "lucide-react";

const PropertyOverview = ({ propertyId }: PropertyOverviewProps) => {
    const { data: property } = useGetPropertyQuery(propertyId);
    if (!property) return null;

    const location = formatPropertyAddress({ city: property.location?.city, state: property.location?.state, country: property.location?.country });

    return (
        <header className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end sm:p-6 lg:gap-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
            <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Property details</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{property.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    {location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{location}</span>}
                    <span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" /><strong className="font-semibold text-foreground">{property.averageRating.toFixed(1)}</strong> ({property.numberOfReviews} reviews)</span>
                </div>
            </div>
            <div className="shrink-0 sm:text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly rent</p>
                <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">${property.pricePerMonth.toLocaleString()}<span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span></p>
            </div>
        </header>
    );
};

export default PropertyOverview;
