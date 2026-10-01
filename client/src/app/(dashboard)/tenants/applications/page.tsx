"use client";

// Libraries
import { toast } from "react-hot-toast";
import { CalendarClock, CircleCheckBig, Clock, Search, XCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

// Components
import PageSkeleton from "@/components/shared/page-skeleton";
import ApplicationCard from "@/features/applications/components/application-card";
import TenantAgreementButton from "@/features/leases/components/tenant-agreement-button";
import Header from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// APIs
import {
    useGetApplicationsQuery,
    useGetAuthCurrentUserQuery,
    useRequestLeaseRenewalMutation,
    useWithdrawApplicationMutation,
} from "@/lib/api/api";

// Libs
import { filterTenantApplications } from "@/features/applications/lib/tenant-application-view";

const ApplicationPage = () => {
    const [activeStatus, setActiveStatus] = useState("All");
    const [propertySearch, setPropertySearch] = useState("");
    const [requestRenewal] = useRequestLeaseRenewalMutation();
    const [withdrawApplication, { isLoading: withdrawing }] = useWithdrawApplicationMutation();
    const [withdrawId, setWithdrawId] = useState<number | null>(null);
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthCurrentUserQuery();
    const {
        data: applications,
        isLoading,
        isError,
        refetch,
    } = useGetApplicationsQuery({
        userId: authUser?.user.id,
        userType: "tenant",
    }, { skip: !authUser?.user.id, pollingInterval: 30_000, refetchOnFocus: true });

    if (isAuthLoading || isLoading) return <PageSkeleton variant="cards" />;
    if (isError || !applications) return <div className="dashboard-container"><Header title="Applications" subtitle="Track and manage your property rental applications" /><div className="rounded-2xl border border-border bg-card p-6 text-card-foreground"><p>Could not load applications.</p><Button className="mt-3" variant="outline" onClick={() => refetch()}>Try again</Button></div></div>;

    const statusOptions = ["All", "Pending", "Approved", "Paid", "Denied", "Withdrawn"];
    const filteredApplications = filterTenantApplications(applications, activeStatus, propertySearch);

    return (
        <div className="dashboard-container">
            <Header
                title="Applications"
                subtitle="Track and manage your property rental applications"
            />
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search applications by property" placeholder="Search property name" value={propertySearch} onChange={(event) => setPropertySearch(event.target.value)} className="h-10 bg-card pl-9 text-foreground" /></div>
                <Button variant="outline" asChild><Link href="/tenants/payments"><CalendarClock className="mr-2 size-4" /> Manage payments</Link></Button>
            </div>
            <div role="group" aria-label="Filter applications by status" className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {statusOptions.map((status) => <button key={status} type="button" aria-pressed={activeStatus === status} onClick={() => setActiveStatus(status)} className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${activeStatus === status ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-accent"}`}>{status} <span className="ml-1 text-xs opacity-75">{status === "All" ? applications.length : applications.filter((item) => item.status === status).length}</span></button>)}
            </div>
            <div className="w-full">
                {filteredApplications.map((application) => (
                    <ApplicationCard
                        key={application.id}
                        application={application}
                        userType="renter"
                    >
                        <div className="flex w-full flex-wrap items-center justify-between gap-3">
                            {application.status === "Paid" ? (
                                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                    <CircleCheckBig className="w-5 h-5 mr-2" />
                                    The property is being rented by you until{" "}
                                    {new Date(
                                        application.lease?.endDate
                                    ).toLocaleDateString()}
                                </div>
                            ) : application.status === "Approved" && application.paymentRecordExists ? (
                                <div className="text-sm font-medium text-foreground">A payment record exists for this lease. Check its status in your billing history.</div>
                            ) : application.status === "Approved" && application.cancellationExecuteAt ? (
                                <div className="text-sm font-medium text-amber-700 dark:text-amber-300">Cancellation scheduled; payment is closed</div>
                            ) : application.status === "Approved" && !application.firstPaymentAvailable ? (
                                <div className="text-sm font-medium text-amber-700 dark:text-amber-300">Payment deadline passed; application status will update automatically</div>
                            ) : application.status === "Approved" ? (
                                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Approved, awaiting payment confirmation</div>
                            ) : application.status === "Pending" ? (
                                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                                    <Clock className="w-5 h-5 mr-2" />
                                    Your application is pending approval. If the price changes, you can withdraw it.
                                </div>
                            ) : application.status === "Withdrawn" ? (
                                <div className="text-sm text-muted-foreground">You withdrew this application</div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
                                    <XCircle className="w-5 h-5 mr-2" />
                                    Your application has been denied
                                </div>
                            )}

                            {(application.status === "Paid" || application.status === "Approved") && application.lease && <TenantAgreementButton leaseId={application.lease.id} />}
                            {application.lease && application.paymentRecordExists && <Button asChild type="button" variant="outline"><Link href={`/tenants/residences/${application.propertyId}`}>View billing history</Link></Button>}
                            {application.status === "Approved" && !application.paymentRecordExists && !application.paidAt && <Button asChild type="button" className="gap-2"><Link href="/tenants/payments"><CalendarClock className="size-4" /> Manage payment</Link></Button>}
                            {application.lease && (application.lease as typeof application.lease & { renewalAvailable?: boolean }).renewalAvailable && <Button type="button" variant="outline" onClick={async () => { try { await requestRenewal(application.lease!.id).unwrap(); toast.success("Renewal request sent"); } catch { toast.error("Could not request renewal"); } }}>Request renewal</Button>}
                            {application.lease?.renewalStatus === "Requested" && <span className="text-sm text-muted-foreground">Renewal request awaiting manager review</span>}
                            {application.status === "Pending" && <Button type="button" variant="outline" onClick={() => setWithdrawId(application.id)}>Withdraw application</Button>}
                        </div>
                        {withdrawId === application.id && <div className="w-full rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm"><p className="font-semibold text-foreground">Withdraw this application?</p><p className="mt-1 text-muted-foreground">The manager will be notified. You can apply again later if the property is still available.</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setWithdrawId(null)}>Keep application</Button><Button type="button" disabled={withdrawing} onClick={async () => { try { await withdrawApplication(application.id).unwrap(); setWithdrawId(null); toast.success("Application withdrawn"); } catch { toast.error("Could not withdraw application"); } }}>Confirm withdrawal</Button></div></div>}
                        {application.status === "Approved" && application.cancellationExecuteAt && <div role="status" className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground"><p className="font-semibold">Cancellation confirmed by the system</p><p className="mt-1 text-muted-foreground">The manager requested cancellation. The application will be declined {new Date(application.cancellationExecuteAt).toISOString().slice(0, 16).replace("T", " ")} UTC. Payment is closed.</p>{application.cancellationReason && <p className="mt-2 whitespace-pre-wrap [overflow-wrap:anywhere]">Reason: {application.cancellationReason}</p>}</div>}
                    </ApplicationCard>
                ))}
                {applications.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-card-foreground">
                        <p className="font-semibold">You have no applications yet.</p>
                        <Button className="mt-4" asChild><Link href="/search">Explore properties</Link></Button>
                    </div>
                )}
                {applications.length > 0 && filteredApplications.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-card-foreground"><p className="font-semibold">No matching applications</p><p className="mt-1 text-sm text-muted-foreground">Try another status or property name.</p><Button className="mt-4" variant="outline" onClick={() => { setActiveStatus("All"); setPropertySearch(""); }}>Clear filters</Button></div>}
            </div>
        </div>
    );
};

export default ApplicationPage;
