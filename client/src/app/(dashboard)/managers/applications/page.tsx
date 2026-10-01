"use client";

// Libraries
import { Building2, CalendarClock, Check, Download, Inbox, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

// Components
import PageSkeleton from "@/components/shared/page-skeleton";
import ApplicationCard from "@/features/applications/components/application-card";
import { ApplicationPaymentActions } from "@/features/applications/components/application-payment-actions";
import Header from "@/components/shared/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// APIs
import {
    useGetApplicationsQuery,
    useGetAuthCurrentUserQuery,
    useUpdateApplicationStatusMutation,
    useCreateChatMutation,
    useReviewLeaseRenewalMutation,
} from "@/lib/api/api";

// State
import { setChatId } from "@/states";
import { useAppDispatch, useAppSelector } from "@/states/store";

// Libs
import { downloadLeaseSummary } from "@/lib/downloads";

const ApplicationsPage = () => {
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const [activeTab, setActiveTab] = useState("all");
    const [paymentDueDays, setPaymentDueDays] = useState<Record<number, number>>({});

    const {
        data: applications,
        isLoading,
        error,
        refetch,
    } = useGetApplicationsQuery(
        {
            userId: authUser?.user?.id,
            userType: "manager",
        },
        {
            skip: !authUser?.user?.id,
            pollingInterval: 30_000,
            refetchOnFocus: true,
        }
    );

    const [updateApplicationStatus] = useUpdateApplicationStatusMutation();
    const [createChat] = useCreateChatMutation();
    const [reviewRenewal] = useReviewLeaseRenewalMutation();
    const dispatch = useAppDispatch();
    const chatSessionVersion = useAppSelector((state) => state.global.chatSessionVersion);

    const handleContactUser = async (tenantUserId: string) => {
        const sessionVersion = chatSessionVersion;
        try {
            const chat = await createChat({ receiverId: tenantUserId }).unwrap();
            dispatch(setChatId({ chatId: chat.id, sessionVersion }));
        } catch {
            toast.error("Could not open chat");
        }
    };

    const handleStatusChange = async (
        applicationId: number,
        status: string
    ) => {
        try {
            await updateApplicationStatus({ id: applicationId, status, ...(status === "Approved" ? { paymentDueDays: paymentDueDays[applicationId] ?? 14 } : {}) }).unwrap();
        } catch { /* API mutation displays the error */ }
    };

    if (!authUser?.user?.id || isLoading) return <PageSkeleton variant="cards" />;
    if (error || !applications) return (
        <div className="dashboard-container">
            <Header title="Applications" subtitle="View and manage applications for your properties" />
            <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-card-foreground">
                <p className="font-semibold">Applications could not be loaded</p>
                <p className="mt-2 text-sm text-muted-foreground">Please check your connection and try again.</p>
                <Button className="mt-5" onClick={() => refetch()}>Try again</Button>
            </div>
        </div>
    );

    const filteredApplications = applications.filter((application) => {
        if (activeTab === "all") return true;

        return application.status.toLowerCase() === activeTab.toLowerCase();
    });

    return (
        <div className="dashboard-container">
            <Header
                title="Applications"
                subtitle="View and manage applications for your properties"
            />
            <Link href="/managers/payments" className="mb-5 inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/20"><CalendarClock className="size-4 text-primary" /> Manage payment deadlines</Link>
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full my-5"
            >
                <TabsList className="flex w-full justify-start gap-1 overflow-x-auto">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="paid">Paid</TabsTrigger>
                    <TabsTrigger value="denied">Denied</TabsTrigger>
                    <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
                </TabsList>

                {["all", "pending", "approved", "paid", "denied", "withdrawn"].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-5 w-full">
                        {filteredApplications.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-card-foreground">
                                <Inbox className="mx-auto size-10 text-muted-foreground" />
                                <h2 className="mt-4 text-lg font-semibold">{applications.length === 0 ? "No applications yet" : `No ${tab} applications`}</h2>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                    {applications.length === 0
                                        ? "Applications from renters will appear here after they apply to one of your properties."
                                        : "Applications in this status will appear here when they are available."}
                                </p>
                                {applications.length === 0 ? (
                                    <Link href="/managers/properties" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">View properties</Link>
                                ) : (
                                    <Button type="button" variant="outline" className="mt-5" onClick={() => setActiveTab("all")}>View all applications</Button>
                                )}
                            </div>
                        )}
                        {filteredApplications
                            .filter(
                                (application) =>
                                    tab === "all" ||
                                    application.status.toLowerCase() === tab
                            )
                            .map((application) => (
                                <ApplicationCard
                                    key={application.id}
                                    application={application}
                                    userType="manager"
                                >
                                    <Button variant="outline" asChild className="gap-2 bg-background text-foreground hover:bg-accent hover:text-accent-foreground">
                                        <Link href={`/managers/properties/${application.property.id}`} scroll={false}><Building2 className="size-4" /> Property details</Link>
                                    </Button>
                                    {application.status !== "Denied" && <Button variant="outline" className="gap-2 bg-background text-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => handleContactUser(application.tenantUserId)}><MessageCircle className="size-4" /> Message applicant</Button>}
                                    {(application.status === "Paid" || application.status === "Approved") && application.lease && <Button variant="outline" className="gap-2 bg-background text-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => downloadLeaseSummary(application.lease!, application.property.name, application.name)}><Download className="size-4" /> Lease summary</Button>}
                                    {application.status === "Pending" && <>
                                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                                            <span id={`payment-term-${application.id}`} className="font-medium">Payment due after</span>
                                            <Select value={String(paymentDueDays[application.id] ?? 14)} onValueChange={(value) => setPaymentDueDays((current) => ({ ...current, [application.id]: Number(value) }))}>
                                                <SelectTrigger aria-labelledby={`payment-term-${application.id}`} className="w-28 bg-background"><SelectValue /></SelectTrigger>
                                                <SelectContent>{Array.from({ length: 15 }, (_, index) => index + 7).map((days) => <SelectItem key={days} value={String(days)}>{days} days</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleStatusChange(application.id, "Approved")}><Check className="size-4" /> Approve</Button>
                                        <Button variant="outline" className="gap-2 border-red-500/40 text-red-700 hover:bg-red-500/10 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200" onClick={() => handleStatusChange(application.id, "Denied")}><X className="size-4" /> Deny</Button>
                                    </>}
                                    {application.status === "Approved" && application.paymentDueAt && <p className="w-full text-sm text-muted-foreground">Payment due {new Date(application.paymentDueAt).toISOString().slice(0, 16).replace("T", " ")} UTC</p>}
                                    {application.status === "Approved" && !application.firstPaymentAvailable && !application.paymentRecordExists && !application.cancellationExecuteAt && <p role="status" className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground">Payment deadline passed. The server will close this application automatically.</p>}
                                    {application.status === "Approved" && application.cancellationExecuteAt && <div role="status" className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground"><p className="font-semibold">Cancellation locked by the system</p><p className="mt-1 text-muted-foreground">Application will be declined {new Date(application.cancellationExecuteAt).toISOString().slice(0, 16).replace("T", " ")} UTC. This request cannot be undone.</p>{application.cancellationReason && <p className="mt-2 whitespace-pre-wrap [overflow-wrap:anywhere]">Reason: {application.cancellationReason}</p>}</div>}
                                    {(application.status === "Pending" || application.firstPaymentAvailable) && <ApplicationPaymentActions application={application} deposit={application.lease?.deposit ?? application.originalDeposit ?? application.property.securityDeposit} rentOverride={application.lease?.rent} role="manager" />}
                                    {application.lease?.renewalStatus === "Requested" && <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3 text-sm"><span className="mr-auto">Tenant requested a lease renewal</span><Button type="button" onClick={async () => { try { await reviewRenewal({ id: application.lease!.id, status: "Approved", months: 12 }).unwrap(); toast.success("Renewal approved for 12 months"); } catch { toast.error("Could not approve renewal"); } }}>Approve 12 months</Button><Button type="button" variant="outline" onClick={async () => { try { await reviewRenewal({ id: application.lease!.id, status: "Denied" }).unwrap(); toast.success("Renewal declined"); } catch { toast.error("Could not decline renewal"); } }}>Decline</Button></div>}
                                </ApplicationCard>
                            ))}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default ApplicationsPage;
