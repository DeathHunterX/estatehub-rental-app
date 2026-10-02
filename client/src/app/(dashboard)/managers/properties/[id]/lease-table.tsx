"use client";

// Libraries
import { CalendarDays, Download, Users } from "lucide-react";
import { useState } from "react";

// Components
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import LeaseAgreementButton from "./lease-agreement-button";

// Libs
import { downloadLeasesCsv } from "@/lib/downloads";
import {
    leaseStatus,
    paymentSummary,
    type LeaseStatus,
} from "@/features/leases/lib/lease-overview";

// Types
import type { Lease, Payment } from "@/types/prisma";
import type { ManagerSigningProfile } from "@/features/signing/types/signing-profile";

const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
const date = (value: Date | string) => new Date(value).toLocaleDateString();
const statusClasses: Record<LeaseStatus, string> = {
    Active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    Pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    Expired: "bg-muted text-muted-foreground",
};

export default function LeaseTable({
    leases,
    payments,
    propertyName,
    address,
    profile,
}: {
    leases: Lease[];
    payments: Payment[];
    propertyName: string;
    address: string;
    profile: ManagerSigningProfile | null;
}) {
    const [filter, setFilter] = useState<"All" | LeaseStatus>("All");
    const now = new Date();
    const counts = { All: leases.length, Active: 0, Pending: 0, Expired: 0 };
    leases.forEach((lease) => {
        counts[leaseStatus(lease, now)] += 1;
    });
    const visibleLeases =
        filter === "All"
            ? leases
            : leases.filter((lease) => leaseStatus(lease, now) === filter);

    return (
        <section
            className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground"
            aria-labelledby="leases-heading"
        >
            <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
                <div>
                    <h2 id="leases-heading" className="text-xl font-semibold">
                        Tenants & leases
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review each tenant, lease term, balance, status, and
                        agreement draft.
                    </p>
                </div>
                <Button
                    variant="outline"
                    disabled={!leases.length}
                    onClick={() => downloadLeasesCsv(leases, propertyName)}
                    className="w-fit gap-2"
                >
                    <Download className="size-4" /> Download lease list
                </Button>
            </div>
            {!leases.length ? (
                <div className="p-10 text-center">
                    <Users className="mx-auto size-9 text-muted-foreground" />
                    <h3 className="mt-3 font-semibold">
                        No leases for this property yet
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Approved applications and signed leases will appear
                        here.
                    </p>
                </div>
            ) : (
                <>
                    <div
                        className="flex gap-2 overflow-x-auto px-5 pt-5 sm:px-6"
                        role="group"
                        aria-label="Filter leases by status"
                    >
                        {(["All", "Active", "Pending", "Expired"] as const).map(
                            (status) => (
                                <button
                                    key={status}
                                    type="button"
                                    aria-pressed={filter === status}
                                    onClick={() => setFilter(status)}
                                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${filter === status ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                                >
                                    {status}{" "}
                                    <span className="ml-1 opacity-70">
                                        {counts[status]}
                                    </span>
                                </button>
                            )
                        )}
                    </div>
                    <div className="p-5 pt-4 sm:p-6 sm:pt-4">
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <Table className="min-w-[1050px]">
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="min-w-48">
                                            Tenant & contact
                                        </TableHead>
                                        <TableHead className="min-w-44">
                                            Lease term
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="min-w-32">
                                            Financials
                                        </TableHead>
                                        <TableHead className="min-w-44">
                                            Current payment
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Agreement
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleLeases.map((lease) => {
                                        const status = leaseStatus(lease, now);
                                        const payment = paymentSummary(
                                            payments,
                                            lease.id,
                                            now
                                        );
                                        const outstanding = payment
                                            ? Math.max(
                                                  0,
                                                  payment.amountDue -
                                                      payment.amountPaid
                                              )
                                            : null;
                                        return (
                                            <TableRow
                                                key={lease.id}
                                                className="hover:bg-muted/40"
                                            >
                                                <TableCell className="align-top">
                                                    <div className="font-semibold">
                                                        {lease.tenant.user.name}
                                                    </div>
                                                    <a
                                                        href={`mailto:${lease.tenant.user.email}`}
                                                        className="block max-w-48 truncate text-xs text-primary hover:underline"
                                                    >
                                                        {
                                                            lease.tenant.user
                                                                .email
                                                        }
                                                    </a>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        {lease.tenant.user
                                                            .phoneNumber ||
                                                            "Phone not provided"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <CalendarDays className="size-3.5 text-muted-foreground" />{" "}
                                                        {date(lease.startDate)}
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        through{" "}
                                                        {date(lease.endDate)}
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        Lease #{lease.id}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
                                                    >
                                                        {status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="font-semibold">
                                                        {money(lease.rent)}
                                                        <span className="text-xs font-normal text-muted-foreground">
                                                            {" "}
                                                            / mo
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        Deposit{" "}
                                                        {money(lease.deposit)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${payment?.paymentStatus === "Paid" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : payment ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}
                                                    >
                                                        {payment?.paymentStatus ??
                                                            "Not scheduled"}
                                                    </span>
                                                    {payment && (
                                                        <>
                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                Due{" "}
                                                                {date(
                                                                    payment.dueDate
                                                                )}{" "}
                                                                ·{" "}
                                                                {money(
                                                                    payment.amountPaid
                                                                )}{" "}
                                                                paid
                                                            </div>
                                                            <div className="mt-1 text-xs font-medium">
                                                                {outstanding
                                                                    ? `${money(outstanding)} outstanding`
                                                                    : "Balance settled"}
                                                            </div>
                                                        </>
                                                    )}
                                                </TableCell>
                                                <TableCell className="align-top text-right">
                                                    <LeaseAgreementButton
                                                        lease={lease}
                                                        propertyName={
                                                            propertyName
                                                        }
                                                        address={address}
                                                        profile={profile}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {visibleLeases.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No {filter.toLowerCase()} leases.
                            </p>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
