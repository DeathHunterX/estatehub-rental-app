import { AmenityIcons, HighlightIcons } from "@/constants";
import { formatEnumString } from "@/lib/utils";
import { useGetPropertyQuery } from "@/lib/api/api";
import { Bath, BedDouble, CalendarDays, Car, HelpCircle, Maximize2, PawPrint } from "lucide-react";

const PropertyDetails = ({ propertyId }: PropertyDetailsProps) => {
    const { data: property } = useGetPropertyQuery(propertyId);
    if (!property) return null;

    const facts = [
        { label: "Bedrooms", value: String(property.beds), Icon: BedDouble },
        { label: "Bathrooms", value: String(property.baths), Icon: Bath },
        { label: "Floor area", value: `${property.squareFeet.toLocaleString()} sq ft`, Icon: Maximize2 },
        { label: "Listed on", value: property.postedDate ? new Date(property.postedDate).toLocaleDateString() : "Date unavailable", Icon: CalendarDays },
    ];

    return <div className="space-y-7">
        <section aria-label="Property at a glance" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map(({ label, value, Icon }) => <div key={label} className="rounded-xl border border-border bg-card p-4"><Icon className="mb-3 size-5 text-primary" aria-hidden="true" /><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-card-foreground sm:text-base">{value}</p></div>)}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="text-xl font-semibold">About this property</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">{property.description?.trim() || "The property manager has not added a description yet."}</p>
        </section>

        {(property.amenities.length > 0 || property.highlights.length > 0) && <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="text-xl font-semibold">Features & amenities</h2>
            {property.highlights.length > 0 && <div className="mt-5"><h3 className="text-sm font-semibold text-muted-foreground">Highlights</h3><div className="mt-3 flex flex-wrap gap-2">{property.highlights.map((highlight: HighlightEnum) => { const Icon = HighlightIcons[highlight] || HelpCircle; return <span key={highlight} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"><Icon className="size-4 text-primary" aria-hidden="true" />{formatEnumString(highlight)}</span>; })}</div></div>}
            {property.amenities.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-muted-foreground">Amenities</h3><div className="mt-3 flex flex-wrap gap-2">{property.amenities.map((amenity: AmenityEnum) => { const Icon = AmenityIcons[amenity] || HelpCircle; return <span key={amenity} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"><Icon className="size-4 text-primary" aria-hidden="true" />{formatEnumString(amenity)}</span>; })}</div></div>}
        </section>}

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="text-xl font-semibold">Fees & policies</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fees are supplied by the property manager. Confirm any additional charges before applying.</p>
            <dl className="mt-5 divide-y divide-border text-sm">
                <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Application fee</dt><dd className="font-semibold">${property.applicationFee.toLocaleString()}</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Security deposit</dt><dd className="font-semibold">${property.securityDeposit.toLocaleString()}</dd></div>
                <div className="flex items-center justify-between gap-4 py-3"><dt className="inline-flex items-center gap-2 text-muted-foreground"><PawPrint className="size-4" />Pets</dt><dd className="font-medium">{property.isPetsAllowed ? "Allowed" : "Not allowed"}</dd></div>
                <div className="flex items-center justify-between gap-4 py-3"><dt className="inline-flex items-center gap-2 text-muted-foreground"><Car className="size-4" />Parking</dt><dd className="font-medium">{property.isParkingIncluded ? "Included" : "Not included"}</dd></div>
            </dl>
        </section>
    </div>;
};

export default PropertyDetails;
