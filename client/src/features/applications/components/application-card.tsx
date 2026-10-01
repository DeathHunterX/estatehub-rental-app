"use client";

import { CalendarDays, Mail, MapPin, MessageSquareText, Phone } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { applicationContact } from "@/features/applications/lib/application-display";
import { propertyImageSrc } from "@/features/properties/lib/property-image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusStyles: Record<string, string> = {
    Paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    Approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    Denied: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    Pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    Withdrawn: "border-border bg-muted text-muted-foreground",
};

const ApplicationCard = ({ application, userType, children }: ApplicationCardProps) => {
    const [imgSrc, setImgSrc] = useState(propertyImageSrc(application.property.photoUrls?.[0]));
    const [isMessageExpanded, setIsMessageExpanded] = useState(false);
    const messageId = useId();
    const contact = applicationContact(application, userType);
    const message = contact.message;
    const isLongMessage = !!message && (message.length > 180 || message.split("\n").length > 3);
    const date = (value: Date | string) => new Date(value).toLocaleDateString();

    return (
        <article className="mb-4 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="grid gap-5 p-5 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6 md:p-6">
                <div className="relative h-44 overflow-hidden rounded-xl bg-muted md:h-48">
                    <Image src={imgSrc} alt={application.property.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 180px" onError={() => setImgSrc("/placeholder.jpg")} />
                </div>
                <div className="min-w-0 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Application #{application.id}</p>
                            <h2 className="mt-1 text-xl font-semibold leading-tight">{application.property.name}</h2>
                            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4 shrink-0" /> {application.property.location.city}, {application.property.location.country}</p>
                            {application.property.description?.trim() && <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-muted-foreground">{application.property.description}</p>}
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${application.status === "Approved" && application.cancellationRequestedAt ? statusStyles.Pending : statusStyles[application.status] || "border-border bg-muted text-foreground"}`}>{application.status === "Approved" && application.cancellationRequestedAt ? "Cancellation scheduled" : application.status === "Withdrawn" ? userType === "manager" ? "Withdrawn by tenant" : "Withdrawn by you" : application.status}</span>
                    </div>

                    <div className="grid gap-5 border-t border-border pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="min-w-0 space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{userType === "manager" ? "Applicant details" : "Property manager"}</h3>
                            <p className="font-semibold">{contact.name}</p>
                            <p className="flex items-center gap-2 break-all text-sm"><Phone className="size-4 shrink-0 text-muted-foreground" /> {contact.phone === "Not provided" ? contact.phone : <a href={`tel:${contact.phone}`} className="hover:text-primary hover:underline">{contact.phone}</a>}</p>
                            <p className="flex items-center gap-2 break-all text-sm"><Mail className="size-4 shrink-0 text-muted-foreground" /> {contact.email === "Not provided" ? contact.email : <a href={`mailto:${contact.email}`} className="hover:text-primary hover:underline">{contact.email}</a>}</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Application</h3>
                            <p className="flex items-center gap-2 text-sm"><CalendarDays className="size-4 text-muted-foreground" /> Submitted {date(application.applicationDate)}</p>
                            <p className="text-sm"><span className="font-semibold">${(application.agreedMonthlyRent ?? application.property.pricePerMonth).toLocaleString()}</span><span className="text-muted-foreground"> / month</span></p>
                            {userType === "manager" && application.status === "Approved" && application.tenantConfirmedAt && !application.managerConfirmedAt && <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Tenant reported cash handover · verify receipt before confirming</p>}
                            {userType === "manager" && application.status === "Paid" && <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Payment confirmed by manager{application.paidAt ? ` on ${date(application.paidAt)}` : ""}</p>}
                            {application.lease && <p className="text-sm text-muted-foreground">Lease: {date(application.lease.startDate)} – {date(application.lease.endDate)}</p>}
                        </div>
                    </div>

                    <div className="min-w-0 rounded-xl border border-border bg-muted/40 px-4 py-3">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><MessageSquareText className="size-4" /> {userType === "manager" ? "Applicant message" : "Your message"}</p>
                        <p id={messageId} className={`mt-2 min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-6 text-foreground ${isLongMessage ? "line-clamp-3" : ""}`}>{message || "No message provided with this application."}</p>
                        {isLongMessage && <button type="button" aria-haspopup="dialog" onClick={() => setIsMessageExpanded(true)} className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Read full message</button>}
                    </div>
                    {application.status === "Denied" && application.denialReason && <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm"><p className="font-semibold text-foreground">Reason for decline</p><p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere] text-muted-foreground">{application.denialReason}</p></div>}
                </div>
            </div>
            {children && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/20 px-5 py-4 md:px-6">{children}</div>}
            <Dialog open={isMessageExpanded} onOpenChange={setIsMessageExpanded}>
                <DialogContent className="max-h-[min(80dvh,700px)] overflow-hidden border-border bg-card text-card-foreground sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{userType === "manager" ? "Applicant message" : "Your application message"}</DialogTitle>
                        <DialogDescription>Application #{application.id} · {application.property.name}</DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 overflow-y-auto whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-7 text-foreground">{message}</div>
                </DialogContent>
            </Dialog>
        </article>
    );
};

export default ApplicationCard;
