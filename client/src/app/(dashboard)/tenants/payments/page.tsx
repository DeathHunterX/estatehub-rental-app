"use client";

import PageSkeleton from "@/components/shared/page-skeleton";

import Link from "next/link";
import {
    CalendarClock,
    CheckCircle2,
    Clock3,
    CreditCard,
    FileText,
    Inbox,
} from "lucide-react";
import Header from "@/components/shared/header";
import { ApplicationPaymentActions } from "@/features/applications/components/application-payment-actions";
import { Button } from "@/components/ui/button";
import { partitionTenantPayments } from "@/features/applications/lib/tenant-application-view";
import {
    useGetApplicationsQuery,
    useGetAuthCurrentUserQuery,
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

export default function TenantPaymentsPage() {
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const userId = authUser?.user?.id;
    const {
        data: applications,
        isLoading,
        error,
        refetch,
    } = useGetApplicationsQuery(
        { userId, userType: "tenant" },
        { skip: !userId, pollingInterval: 30_000, refetchOnFocus: true }
    );
    const { due, completed } = partitionTenantPayments(applications ?? []);

    return (
        <div className="dashboard-container space-y-6 pb-12">
            <Header
                title="Payments"
                subtitle="See your first payment, deadline, and confirmation progress in one place."
            />
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground">
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Clock3 className="size-5" />
                    </span>
                    <div>
                        <p className="text-2xl font-semibold">{due.length}</p>
                        <p className="text-xs text-muted-foreground">
                            Approved payment cases
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground">
                    <span className="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                        <CheckCircle2 className="size-5" />
                    </span>
                    <div>
                        <p className="text-2xl font-semibold">
                            {completed.length}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            First payments recorded
                        </p>
                    </div>
                </div>
            </div>

            {!userId || isLoading ? (
                <PageSkeleton variant="table" />
            ) : error || !applications ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground">
                    <p>Payments could not be loaded.</p>
                    <Button
                        className="mt-3"
                        variant="outline"
                        onClick={() => refetch()}
                    >
                        Try again
                    </Button>
                </div>
            ) : (
                <>
                    <section
                        aria-labelledby="payments-due"
                        className="space-y-3"
                    >
                        <div>
                            <h2
                                id="payments-due"
                                className="text-lg font-semibold text-foreground"
                            >
                                Approved payment status
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Only confirm a cash handover after you actually
                                give the agreed amount to the manager.
                            </p>
                        </div>
                        {due.length === 0 ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-5 py-6 text-sm text-muted-foreground">
                                <Inbox className="size-5 shrink-0" />
                                <span>
                                    No approved applications are waiting for a
                                    first payment.{" "}
                                    <Link
                                        href="/tenants/applications"
                                        className="font-medium text-primary underline underline-offset-2"
                                    >
                                        View applications
                                    </Link>
                                </span>
                            </div>
                        ) : (
                            due.map((application) => {
                                const deposit =
                                    application.lease?.deposit ??
                                    application.originalDeposit ??
                                    application.property.securityDeposit;
                                const rent =
                                    application.lease?.rent ??
                                    application.agreedMonthlyRent ??
                                    application.originalMonthlyRent ??
                                    application.property.pricePerMonth;
                                return (
                                    <article
                                        key={application.id}
                                        className="space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-foreground">
                                                    {application.property.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Application #
                                                    {application.id}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-2 text-right">
                                                <p className="text-xs text-muted-foreground">
                                                    First payment · rent +
                                                    deposit
                                                </p>
                                                <p className="text-lg font-semibold text-foreground">
                                                    {money(rent + deposit)}
                                                </p>
                                            </div>
                                        </div>
                                        {application.cancellationExecuteAt ? (
                                            <Notice
                                                icon={Clock3}
                                                title="Cancellation scheduled"
                                                detail={`Payment is closed. This application will be declined ${dateLabel(application.cancellationExecuteAt)}.`}
                                                warning
                                            />
                                        ) : application.paymentDueAt ? (
                                            <Notice
                                                icon={CalendarClock}
                                                title={`Payment due ${dateLabel(application.paymentDueAt)}`}
                                                detail={
                                                    application.tenantConfirmedAt
                                                        ? "You reported handing over cash. Waiting for the manager to confirm or review your claim."
                                                        : application.firstPaymentAvailable
                                                          ? "Hand cash directly to the manager and record the handover before this deadline."
                                                          : "The deadline has passed. This application will update automatically."
                                                }
                                                warning={
                                                    !application.firstPaymentAvailable
                                                }
                                            />
                                        ) : (
                                            <Notice
                                                icon={FileText}
                                                title="Older approval without an automatic deadline"
                                                detail={
                                                    application.leaseId
                                                        ? "This application already has a lease. Review the payment below; it will not be automatically declined by the new deadline rule."
                                                        : "Your manager has not set a new payment term for this older approval."
                                                }
                                            />
                                        )}
                                        {application.firstPaymentAvailable ? (
                                            <ApplicationPaymentActions
                                                application={application}
                                                deposit={deposit}
                                                rentOverride={
                                                    application.lease?.rent
                                                }
                                                role="tenant"
                                            />
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Payment actions are currently
                                                unavailable for this
                                                application. Check its status in{" "}
                                                <Link
                                                    href="/tenants/applications"
                                                    className="font-medium text-primary underline underline-offset-2"
                                                >
                                                    Applications
                                                </Link>
                                                .
                                            </p>
                                        )}
                                    </article>
                                );
                            })
                        )}
                    </section>

                    {completed.length > 0 && (
                        <section
                            aria-labelledby="payments-completed"
                            className="space-y-3"
                        >
                            <div>
                                <h2
                                    id="payments-completed"
                                    className="text-lg font-semibold text-foreground"
                                >
                                    Recorded payments
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Open your residence for the full billing
                                    history.
                                </p>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-2">
                                {completed.map((application) => (
                                    <article
                                        key={application.id}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground"
                                    >
                                        <div>
                                            <p className="font-semibold">
                                                {application.property.name}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {application.paidAt
                                                    ? `First payment recorded ${dateLabel(application.paidAt)}`
                                                    : "Payment record exists for this lease"}
                                            </p>
                                        </div>
                                        {application.lease && (
                                            <Button variant="outline" asChild>
                                                <Link
                                                    href={`/tenants/residences/${application.propertyId}`}
                                                >
                                                    <CreditCard className="mr-2 size-4" />{" "}
                                                    Billing history
                                                </Link>
                                            </Button>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

function Notice({
    icon: Icon,
    title,
    detail,
    warning = false,
}: {
    icon: typeof CalendarClock;
    title: string;
    detail: string;
    warning?: boolean;
}) {
    return (
        <div
            role="status"
            className={`flex gap-3 rounded-xl border p-4 ${warning ? "border-amber-500/35 bg-amber-500/10" : "border-primary/30 bg-primary/5"}`}
        >
            <Icon
                className={`mt-0.5 size-5 shrink-0 ${warning ? "text-amber-500" : "text-primary"}`}
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
