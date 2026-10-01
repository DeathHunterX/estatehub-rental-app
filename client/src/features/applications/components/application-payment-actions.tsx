"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    Check,
    Clock3,
    ShieldCheck,
    Undo2,
    Wallet,
} from "lucide-react";
import type { Application } from "@/types/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    useChooseSettlementMethodMutation,
    useConfirmCashSettlementMutation,
    useReportCashNotReceivedMutation,
    useResolveCashDisputeMutation,
    useRetractCashConfirmationMutation,
    useRequestApplicationCancellationMutation,
    useUpdateApplicationQuoteMutation,
    useWithdrawApplicationMutation,
} from "@/lib/api/api";

const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);

function ConfirmationStep({
    label,
    confirmed,
    active,
}: {
    label: string;
    confirmed: boolean;
    active: boolean;
}) {
    return (
        <div
            className={`flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3 ${confirmed ? "border-emerald-500/30 bg-emerald-500/10" : active ? "border-primary/35 bg-primary/10" : "border-border bg-background/60"}`}
        >
            <span
                className={`grid size-9 shrink-0 place-items-center rounded-full ${confirmed ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
                {confirmed ? (
                    <Check className="size-4" />
                ) : (
                    <Clock3 className="size-4" />
                )}
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                    {label}
                </span>
                <span className="block text-xs text-muted-foreground">
                    {confirmed ? "Confirmed" : "Awaiting confirmation"}
                </span>
            </span>
        </div>
    );
}

export function ApplicationPaymentActions({
    application,
    deposit,
    role,
    rentOverride,
}: {
    application: Application;
    deposit: number;
    role: "manager" | "tenant";
    rentOverride?: number;
}) {
    const rent =
        rentOverride ??
        application.agreedMonthlyRent ??
        application.originalMonthlyRent ??
        0;
    const hasExistingLease = !!application.leaseId;
    const [draft, setDraft] = useState<{ base: number; value: string } | null>(
        null
    );
    const quote = draft && draft.base === rent ? draft.value : String(rent);
    const [updateQuote, { isLoading: savingQuote }] =
        useUpdateApplicationQuoteMutation();
    const [chooseMethod, { isLoading: changingMethod }] =
        useChooseSettlementMethodMutation();
    const [confirmCash, { isLoading: confirming }] =
        useConfirmCashSettlementMutation();
    const [reportMissing, { isLoading: reporting }] =
        useReportCashNotReceivedMutation();
    const [resolveDispute, { isLoading: resolving }] =
        useResolveCashDisputeMutation();
    const [retractClaim, { isLoading: retracting }] =
        useRetractCashConfirmationMutation();
    const [requestCancellation, { isLoading: requestingCancellation }] =
        useRequestApplicationCancellationMutation();
    const [withdrawApplication, { isLoading: withdrawingApplication }] =
        useWithdrawApplicationMutation();
    const [action, setAction] = useState<
        | "schedule-cancellation"
        | "report-missing"
        | "resolve-dispute"
        | "withdraw-application"
        | "retract"
        | null
    >(null);
    const [reason, setReason] = useState("");
    const approved = application.status === "Approved";
    const total = rent + deposit;
    const tenantConfirmed = !!application.tenantConfirmedAt;
    const managerConfirmed = !!application.managerConfirmedAt;
    const ownConfirmation =
        role === "tenant" ? tenantConfirmed : managerConfirmed;
    // Once either party reports a cash handover, the settlement method is fixed.
    const methodLocked = tenantConfirmed || managerConfirmed;
    const disputed =
        !!application.paymentDisputedAt &&
        !application.paymentDisputeResolvedAt;

    const saveQuote = async () => {
        try {
            await updateQuote({
                id: application.id,
                monthlyRent: Number(quote),
            }).unwrap();
            setDraft(null);
            toast.success("Monthly rent updated");
        } catch {
            toast.error(
                "This monthly rent is not allowed at the current stage"
            );
        }
    };
    const selectCash = async () => {
        if (application.settlementMethod === "Cash") return;
        try {
            await chooseMethod({ id: application.id, method: "Cash" }).unwrap();
            toast.success("Cash selected");
        } catch {
            toast.error("Could not select cash handover");
        }
    };
    const confirm = async () => {
        try {
            await confirmCash({ id: application.id, amount: total }).unwrap();
            toast.success("Your cash confirmation was recorded");
        } catch {
            toast.error("Could not confirm this payment");
        }
    };
    // Destructive or disputed actions share one confirmation step and reset it only on success.
    const submitAction = async () => {
        try {
            if (action === "schedule-cancellation")
                await requestCancellation({
                    id: application.id,
                    reason: reason.trim(),
                }).unwrap();
            if (action === "report-missing")
                await reportMissing({
                    id: application.id,
                    reason: reason.trim(),
                }).unwrap();
            if (action === "resolve-dispute")
                await resolveDispute({
                    id: application.id,
                    reason: reason.trim(),
                }).unwrap();
            if (action === "withdraw-application")
                await withdrawApplication(application.id).unwrap();
            if (action === "retract")
                await retractClaim(application.id).unwrap();
            toast.success(
                action === "schedule-cancellation"
                    ? "Cancellation locked; it will complete in 48 hours"
                    : action === "report-missing"
                      ? "Payment dispute recorded"
                      : action === "resolve-dispute"
                        ? "Payment dispute resolved"
                        : action === "retract"
                          ? "Cash claim retracted"
                          : "Application updated"
            );
            setAction(null);
            setReason("");
        } catch {
            toast.error(
                "This action could not be completed. Refresh the application and try again."
            );
        }
    };
    const beginAction = (next: typeof action) => {
        setReason("");
        setAction(next);
    };
    const actionNeedsReason =
        action === "schedule-cancellation" ||
        action === "report-missing" ||
        action === "resolve-dispute";
    const actionBusy =
        reporting ||
        resolving ||
        retracting ||
        requestingCancellation ||
        withdrawingApplication;

    return (
        <section
            aria-label={approved ? "Payment agreement" : "Rental proposal"}
            className="w-full overflow-hidden rounded-2xl border border-primary/20 bg-card text-card-foreground shadow-sm"
        >
            <div className="flex flex-wrap items-center justify-between gap-5 bg-gradient-to-br from-primary/10 via-card to-card px-5 py-5 sm:px-6">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                        {approved ? "Approved application" : "Rental offer"}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                        {approved ? "First payment" : "Review the monthly rent"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {approved
                            ? hasExistingLease
                                ? "An existing lease has no payment record yet. Both sides must confirm the cash handover before it is marked paid."
                                : "The lease starts after payment is confirmed by both sides."
                            : "The security deposit stays at the listed amount."}
                    </p>
                    {approved && application.paymentDueAt && (
                        <p className="mt-2 text-xs font-semibold text-primary">
                            Payment deadline:{" "}
                            {new Date(application.paymentDueAt)
                                .toISOString()
                                .slice(0, 16)
                                .replace("T", " ")}{" "}
                            UTC
                        </p>
                    )}
                </div>
                <div className="min-w-44 rounded-xl border border-primary/20 bg-background/75 px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {approved ? "Due at move-in" : "Monthly rent"}
                    </p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                        {money(approved ? total : rent)}
                    </p>
                </div>
            </div>

            <div className="space-y-5 border-t border-border px-5 py-5 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Monthly rent
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                            {money(rent)}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                                / month
                            </span>
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Security deposit
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                            {money(deposit)}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                                fixed
                            </span>
                        </p>
                    </div>
                </div>

                {role === "manager" && !hasExistingLease && (
                    <div className="rounded-xl border border-border bg-muted/25 p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-36 flex-1">
                                <label
                                    htmlFor={`rent-${application.id}`}
                                    className="mb-1.5 block text-xs font-semibold text-foreground"
                                >
                                    Adjust monthly rent
                                </label>
                                <Input
                                    id={`rent-${application.id}`}
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={quote}
                                    disabled={methodLocked || disputed}
                                    onChange={(event) =>
                                        setDraft({
                                            base: rent,
                                            value: event.target.value,
                                        })
                                    }
                                    className="h-10 bg-background text-foreground"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 bg-background"
                                disabled={
                                    savingQuote ||
                                    methodLocked ||
                                    disputed ||
                                    !quote ||
                                    !Number.isFinite(Number(quote)) ||
                                    Number(quote) === rent
                                }
                                onClick={saveQuote}
                            >
                                Update offer{" "}
                                <ArrowRight className="ml-2 size-4" />
                            </Button>
                        </div>
                        {approved && (
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                After approval, the rent can only go down, to a
                                minimum of{" "}
                                {money(
                                    (application.originalMonthlyRent ?? rent) *
                                        0.75
                                )}
                                . The deposit does not change.
                            </p>
                        )}
                        {(methodLocked || disputed) && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                The offer is locked after a payment claim.
                                Resolve the claim before changing terms.
                            </p>
                        )}
                    </div>
                )}

                {approved && (
                    <div className="space-y-4 border-t border-border pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">
                                    Cash handover
                                </h4>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {role === "tenant"
                                        ? "Record the cash handover after paying the Manager directly."
                                        : "Cash is handed directly between Tenant and Manager."}
                                </p>
                            </div>
                            {application.settlementMethod === "Cash" && (
                                <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                    Cash selected
                                </span>
                            )}
                        </div>
                        {role === "tenant" ? (
                            <div className="grid gap-3">
                                <button
                                    type="button"
                                    disabled={changingMethod || methodLocked}
                                    onClick={selectCash}
                                    aria-pressed={
                                        application.settlementMethod === "Cash"
                                    }
                                    className={`flex min-w-0 items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed ${application.settlementMethod === "Cash" ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"}`}
                                >
                                    <Banknote className="mt-0.5 size-5 shrink-0 text-primary" />
                                    <span>
                                        <span className="block text-sm font-semibold text-foreground">
                                            Cash
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                            Confirm after handing over the
                                            agreed amount.
                                        </span>
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
                                <Wallet className="size-5 shrink-0 text-primary" />
                                <p className="text-sm text-foreground">
                                    {application.settlementMethod === "Cash"
                                        ? "Cash handover selected"
                                        : "Waiting for the tenant to select cash handover"}
                                </p>
                            </div>
                        )}

                        {application.settlementMethod === "Cash" && (
                            <div className="rounded-xl border border-border bg-background/50 p-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-primary" />
                                    <h4 className="text-sm font-semibold text-foreground">
                                        Confirmation progress
                                    </h4>
                                </div>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    <ConfirmationStep
                                        label="Tenant reported handover"
                                        confirmed={tenantConfirmed}
                                        active={role === "tenant"}
                                    />
                                    <ConfirmationStep
                                        label="Manager confirmed receipt"
                                        confirmed={managerConfirmed}
                                        active={role === "manager"}
                                    />
                                </div>
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                                    <p className="max-w-md text-xs leading-5 text-muted-foreground">
                                        Confirm only after the full{" "}
                                        {money(total)} changes hands. The
                                        manager can confirm receipt only after
                                        the tenant records handover.
                                    </p>
                                    <Button
                                        type="button"
                                        className="min-w-44"
                                        disabled={
                                            ownConfirmation ||
                                            confirming ||
                                            disputed ||
                                            (role === "manager" &&
                                                !tenantConfirmed)
                                        }
                                        onClick={confirm}
                                    >
                                        {ownConfirmation ? (
                                            <>
                                                <Check className="mr-2 size-4" />{" "}
                                                Your part is confirmed
                                            </>
                                        ) : role === "tenant" ? (
                                            "Confirm cash handed over"
                                        ) : (
                                            "Confirm cash received"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {disputed && (
                            <div
                                role="alert"
                                className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground"
                            >
                                <p className="flex items-center gap-2 font-semibold">
                                    <AlertTriangle className="size-4 text-amber-500" />{" "}
                                    Payment claim disputed
                                </p>
                                <p className="mt-1 leading-6 text-muted-foreground">
                                    Manager report:{" "}
                                    {application.paymentDisputeReason}
                                </p>
                                {role === "tenant" && (
                                    <p className="mt-2 leading-6 text-muted-foreground">
                                        The lease cannot start while this claim
                                        is unresolved. If you handed over the
                                        money, keep your evidence and contact
                                        the manager.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {approved && (
                    <div className="border-t border-border pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Need to stop or correct this payment?
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {role === "manager" &&
                                !hasExistingLease &&
                                !tenantConfirmed &&
                                !managerConfirmed &&
                                !disputed && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            beginAction("schedule-cancellation")
                                        }
                                    >
                                        Request cancellation
                                    </Button>
                                )}
                            {role === "manager" &&
                                tenantConfirmed &&
                                !managerConfirmed &&
                                !disputed && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-amber-500/40 text-foreground"
                                        onClick={() =>
                                            beginAction("report-missing")
                                        }
                                    >
                                        <AlertTriangle className="mr-2 size-4" />{" "}
                                        Cash not received
                                    </Button>
                                )}
                            {role === "manager" && disputed && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        beginAction("resolve-dispute")
                                    }
                                >
                                    Cash received / resolve report
                                </Button>
                            )}
                            {role === "tenant" &&
                                !hasExistingLease &&
                                !tenantConfirmed &&
                                !managerConfirmed &&
                                !disputed && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            beginAction("withdraw-application")
                                        }
                                    >
                                        Withdraw application
                                    </Button>
                                )}
                            {role === "tenant" &&
                                tenantConfirmed &&
                                !managerConfirmed && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => beginAction("retract")}
                                    >
                                        <Undo2 className="mr-2 size-4" />{" "}
                                        Retract mistaken cash claim
                                    </Button>
                                )}
                        </div>
                    </div>
                )}

                {action && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
                        <h4 className="text-sm font-semibold text-foreground">
                            {action === "report-missing"
                                ? "Report cash not received"
                                : action === "resolve-dispute"
                                  ? "Resolve the cash report"
                                  : action === "schedule-cancellation"
                                    ? "Request irreversible cancellation"
                                    : action === "retract"
                                      ? "Retract your cash confirmation"
                                      : "Withdraw your application"}
                        </h4>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {action === "report-missing"
                                ? "The tenant will be notified. The application stays approved but payment is frozen until the claim is resolved."
                                : action === "resolve-dispute"
                                  ? "Use this when the missing cash has been received or the report was a mistake. The tenant will be notified; you can then confirm receipt."
                                  : action === "retract"
                                    ? "Use this only if you marked cash as handed over by mistake. The manager will be notified."
                                    : action === "schedule-cancellation"
                                      ? "The system checks eligibility, immediately blocks payment, then declines the application after 48 hours. This request cannot be undone."
                                      : "The other party will be notified. No lease will be created from this application."}
                        </p>
                        {actionNeedsReason && (
                            <div className="mt-3">
                                <label
                                    htmlFor={`payment-reason-${application.id}`}
                                    className="mb-1 block text-xs font-medium text-foreground"
                                >
                                    Reason (10–500 characters)
                                </label>
                                <Textarea
                                    id={`payment-reason-${application.id}`}
                                    maxLength={500}
                                    value={reason}
                                    onChange={(event) =>
                                        setReason(event.target.value)
                                    }
                                    className="min-h-20 bg-background text-foreground"
                                    placeholder="Explain what happened so the other party can respond"
                                />
                                <p className="mt-1 text-right text-xs text-muted-foreground">
                                    {reason.trim().length}/500
                                </p>
                            </div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAction(null)}
                            >
                                Keep application
                            </Button>
                            <Button
                                type="button"
                                disabled={
                                    actionBusy ||
                                    (actionNeedsReason &&
                                        reason.trim().length < 10)
                                }
                                onClick={submitAction}
                            >
                                {action === "report-missing"
                                    ? "Submit report"
                                    : action === "resolve-dispute"
                                      ? "Resolve report"
                                      : action === "retract"
                                        ? "Retract confirmation"
                                        : action === "schedule-cancellation"
                                          ? "Lock cancellation request"
                                          : "Confirm withdrawal"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
