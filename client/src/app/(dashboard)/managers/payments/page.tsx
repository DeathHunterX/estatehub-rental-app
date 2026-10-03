"use client";

// Libraries
import { useState } from "react";
import Link from "next/link";
import {
    CalendarClock,
    CheckCircle2,
    Clock3,
    FileText,
    Inbox,
    Wallet,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Components
import PageSkeleton from "@/components/shared/page-skeleton";
import Header from "@/components/shared/header";
import { ApplicationPaymentActions } from "@/features/applications/components/application-payment-actions";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// APIs
import {
    useGetApplicationsQuery,
    useGetAuthCurrentUserQuery,
    useScheduleLegacyPaymentDeadlineMutation,
    useUpdateApplicationStatusMutation,
} from "@/lib/api/api";

const dateLabel = (value: Date | string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

const money = (value: number) =>
    new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);

const dueDayOptions = Array.from({ length: 15 }, (_, index) => index + 7);

export default function ManagerPaymentsPage() {
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const userId = authUser?.user?.id;
    const {
        data: applications,
        isLoading,
        error,
        refetch,
    } = useGetApplicationsQuery(
        { userId, userType: "manager" },
        { skip: !userId, pollingInterval: 30_000, skipPollingIfUnfocused: true, refetchOnFocus: true }
    );
    const [dueDays, setDueDays] = useState<Record<number, number>>({});
    const [busyId, setBusyId] = useState<number | null>(null);
    const [approve] = useUpdateApplicationStatusMutation();
    const [scheduleLegacy] = useScheduleLegacyPaymentDeadlineMutation();

    const handleApprove = async (id: number) => {
        setBusyId(id);
        try {
            await approve({
                id,
                status: "Approved",
                paymentDueDays: dueDays[id] ?? 14,
            }).unwrap();
            toast.success(
                "Application approved. The tenant can see the payment deadline."
            );
        } catch {
            toast.error(
                "Could not approve this application. Refresh and check its current status."
            );
        } finally {
            setBusyId(null);
        }
    };

    const handleLegacy = async (id: number) => {
        setBusyId(id);
        try {
            await scheduleLegacy({
                id,
                paymentDueDays: dueDays[id] ?? 14,
            }).unwrap();
            toast.success("Payment deadline set and the tenant notified.");
        } catch {
            toast.error(
                "Could not set a deadline. Refresh and check the application and lease status."
            );
        } finally {
            setBusyId(null);
        }
    };

    const pending =
        applications?.filter((item) => item.status === "Pending") ?? [];
    const awaiting =
        applications?.filter(
            (item) =>
                item.status === "Approved" &&
                !item.paymentRecordExists &&
                !item.paidAt
        ) ?? [];
    const paid =
        applications?.filter(
            (item) =>
                item.status === "Paid" ||
                (item.status === "Approved" &&
                    (item.paymentRecordExists || !!item.paidAt))
        ) ?? [];

    const termSelect = (id: number) => (
        <div className="flex flex-wrap items-center gap-2">
            <label
                id={`due-days-${id}`}
                className="text-sm font-medium text-foreground"
            >
                Pay within
            </label>
            <Select
                value={String(dueDays[id] ?? 14)}
                onValueChange={(value) =>
                    setDueDays((current) => ({
                        ...current,
                        [id]: Number(value),
                    }))
                }
            >
                <SelectTrigger
                    aria-labelledby={`due-days-${id}`}
                    className="min-w-28 bg-background text-foreground"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {dueDayOptions.map((days) => (
                        <SelectItem key={days} value={String(days)}>
                            {days} days
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
                7–21 days; default 14
            </span>
        </div>
    );

    const applicationHeader = (
        item: NonNullable<typeof applications>[number]
    ) => (
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
                <Link
                    href={`/managers/properties/${item.propertyId}`}
                    className="font-semibold text-foreground hover:text-primary"
                >
                    {item.property.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                    {item.name} · Application #{item.id}
                </p>
            </div>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
                {money(
                    item.agreedMonthlyRent ??
                        item.originalMonthlyRent ??
                        item.property.pricePerMonth
                )}{" "}
                / month
            </span>
        </div>
    );

    return (
        <div className="dashboard-container space-y-6 pb-12">
            <Header
                title="Payments & deadlines"
                subtitle="Set the first payment term, follow handovers, and review older applications in one place."
            />
            <div className="grid gap-3 sm:grid-cols-3">
                {[
                    {
                        label: "Awaiting approval",
                        count: pending.length,
                        icon: FileText,
                    },
                    {
                        label: "Awaiting payment",
                        count: awaiting.length,
                        icon: Clock3,
                    },
                    { label: "Paid", count: paid.length, icon: CheckCircle2 },
                ].map(({ label, count, icon: Icon }) => (
                    <div
                        key={label}
                        className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground"
                    >
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="size-5" />
                        </span>
                        <div>
                            <p className="text-2xl font-semibold">{count}</p>
                            <p className="text-xs text-muted-foreground">
                                {label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {!userId || isLoading ? (
                <PageSkeleton variant="table" />
            ) : error || !applications ? (
                <div className="rounded-2xl border border-border bg-card p-6">
                    <p>Payment records could not be loaded.</p>
                    <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => refetch()}
                    >
                        Try again
                    </Button>
                </div>
            ) : (
                <>
                    <section
                        aria-labelledby="pending-payments"
                        className="space-y-3"
                    >
                        <div>
                            <h2
                                id="pending-payments"
                                className="text-lg font-semibold text-foreground"
                            >
                                1. Choose a term when approving
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                The deadline starts when you approve. The tenant
                                receives an account notification.
                            </p>
                        </div>
                        {pending.length === 0 ? (
                            <EmptyState message="No applications are waiting for approval." />
                        ) : (
                            pending.map((item) => (
                                <article
                                    key={item.id}
                                    className="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5"
                                >
                                    {applicationHeader(item)}
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                                        {termSelect(item.id)}
                                        <Button
                                            disabled={busyId === item.id}
                                            onClick={() =>
                                                handleApprove(item.id)
                                            }
                                        >
                                            Approve with deadline
                                        </Button>
                                    </div>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        Review or deny this application from{" "}
                                        <Link
                                            href="/managers/applications"
                                            className="font-medium text-primary underline underline-offset-2"
                                        >
                                            Applications
                                        </Link>
                                        .
                                    </p>
                                </article>
                            ))
                        )}
                    </section>

                    <section
                        aria-labelledby="awaiting-payments"
                        className="space-y-3"
                    >
                        <div>
                            <h2
                                id="awaiting-payments"
                                className="text-lg font-semibold text-foreground"
                            >
                                2. Follow payments
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Check the due date and whether each side has
                                confirmed a cash handover.
                            </p>
                        </div>
                        {awaiting.length === 0 ? (
                            <EmptyState message="No approved applications are waiting for payment." />
                        ) : (
                            awaiting.map((item) => {
                                const canSetLegacy =
                                    !item.approvedAt &&
                                    !item.paymentDueAt &&
                                    !item.leaseId &&
                                    !item.paidAt &&
                                    !item.tenantConfirmedAt &&
                                    !item.managerConfirmedAt &&
                                    !item.cancellationRequestedAt;
                                const legacyLease =
                                    !item.paymentDueAt && !!item.leaseId;
                                return (
                                    <article
                                        key={item.id}
                                        className="space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5"
                                    >
                                        {applicationHeader(item)}
                                        {item.cancellationExecuteAt ? (
                                            <Status
                                                icon={Clock3}
                                                tone="warning"
                                                title="Cancellation scheduled"
                                                detail={`Payment is locked. The application will close ${dateLabel(item.cancellationExecuteAt)}.`}
                                            />
                                        ) : item.paymentDueAt ? (
                                            <Status
                                                icon={CalendarClock}
                                                tone="primary"
                                                title={`Due ${dateLabel(item.paymentDueAt)}`}
                                                detail={
                                                    item.tenantConfirmedAt
                                                        ? "Tenant reported handing over cash; review the receipt or dispute."
                                                        : new Date(
                                                                item.paymentDueAt
                                                            ) <= new Date()
                                                          ? "Deadline passed. The server will close this unpaid application shortly."
                                                          : "The tenant must confirm payment before this deadline."
                                                }
                                            />
                                        ) : legacyLease ? (
                                            <Status
                                                icon={FileText}
                                                tone="warning"
                                                title="Existing lease — no automatic deadline"
                                                detail="This application was approved before deadline tracking and already has a lease. You can review payment below; automatic application denial is disabled to protect the lease."
                                            />
                                        ) : canSetLegacy ? (
                                            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                                                <p className="mb-3 text-sm font-medium text-foreground">
                                                    Older approval without a
                                                    payment term. Start one new
                                                    7–21 day window from today
                                                    and notify the tenant.
                                                </p>
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    {termSelect(item.id)}
                                                    <Button
                                                        disabled={
                                                            busyId === item.id
                                                        }
                                                        onClick={() =>
                                                            handleLegacy(
                                                                item.id
                                                            )
                                                        }
                                                    >
                                                        Set deadline
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Status
                                                icon={Wallet}
                                                tone="warning"
                                                title="No automatic deadline"
                                                detail="This older payment has a claim or another active process. Review the payment record before taking action."
                                            />
                                        )}
                                        {item.firstPaymentAvailable && (
                                            <ApplicationPaymentActions
                                                application={item}
                                                deposit={
                                                    item.lease?.deposit ??
                                                    item.originalDeposit ??
                                                    item.property
                                                        .securityDeposit
                                                }
                                                rentOverride={item.lease?.rent}
                                                role="manager"
                                            />
                                        )}
                                    </article>
                                );
                            })
                        )}
                    </section>

                    {paid.length > 0 && (
                        <section
                            aria-labelledby="paid-payments"
                            className="space-y-3"
                        >
                            <h2
                                id="paid-payments"
                                className="text-lg font-semibold text-foreground"
                            >
                                3. Completed first payments
                            </h2>
                            <div className="grid gap-3 lg:grid-cols-2">
                                {paid.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-border bg-card p-4 text-card-foreground"
                                    >
                                        {applicationHeader(item)}
                                        <p className="mt-3 text-xs text-muted-foreground">
                                            {item.paidAt
                                                ? `Paid ${dateLabel(item.paidAt)}`
                                                : "Payment recorded"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-5 py-6 text-sm text-muted-foreground">
            <Inbox className="size-5 shrink-0" />
            {message}
        </div>
    );
}

function Status({
    icon: Icon,
    tone,
    title,
    detail,
}: {
    icon: typeof CalendarClock;
    tone: "primary" | "warning";
    title: string;
    detail: string;
}) {
    return (
        <div
            role="status"
            className={`flex gap-3 rounded-xl border p-4 ${tone === "warning" ? "border-amber-500/35 bg-amber-500/10" : "border-primary/30 bg-primary/5"}`}
        >
            <Icon
                className={`mt-0.5 size-5 shrink-0 ${tone === "warning" ? "text-amber-500" : "text-primary"}`}
            />
            <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {detail}
                </p>
            </div>
        </div>
    );
}
