"use client";

// Libraries
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

// Components
import PageSkeleton from "@/components/shared/page-skeleton";
import AppSidebar from "@/components/shared/sidebar/app-sidebar";
import MobileDashboardNav from "@/components/shared/sidebar/mobile-dashboard-nav";
import AdaptiveWrapper from "@/components/shared/wrapper/adaptive-wrapper";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

// APIs
import {
    useGetAuthCurrentUserQuery,
    useGetManagerSigningProfileQuery,
} from "@/lib/api/api";

// State
import { useAppSelector } from "@/states/store";
import { useAppDispatch } from "@/states/store";
import { logout } from "@/states/slices/auth.slice";

// Constants
import { NAVBAR_HEIGHT } from "@/constants";

// Libs
import { isManagerAgreementReady } from "@/features/signing/lib/manager-agreement";

const TabletSidebarBackdrop = () => {
    const { open, setOpen } = useSidebar();
    if (!open) return null;
    return (
        <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 z-30 hidden bg-black/55 md:block lg:hidden"
            style={{ top: `${NAVBAR_HEIGHT}px` }}
        />
    );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    // Global state
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const isSessionHydrated = useAppSelector((state) => state.auth.hydrated);
    const cachedUser = useAppSelector((state) => state.auth.userInfo);

    const router = useRouter();
    const pathname = usePathname();

    const dispatch = useAppDispatch();

    const {
        data: authUser,
        isLoading: isAuthLoading,
        isError: isAuthError,
        error: authError,
        refetch,
    } = useGetAuthCurrentUserQuery(undefined, { skip: !accessToken });

    const userRole = (authUser?.user?.role ?? cachedUser?.role)?.toLowerCase();
    const isAgreementRoute = pathname === "/managers/agreement-setup";
    const {
        data: signingProfile,
        isLoading: isAgreementLoading,
        isError: isAgreementError,
        refetch: refetchAgreement,
    } = useGetManagerSigningProfileQuery(undefined, {
        skip: !accessToken || !authUser || userRole !== "manager",
    });
    const agreementReady = isManagerAgreementReady(signingProfile);
    const isUnauthorized =
        authError &&
        "status" in authError &&
        (authError.status === 401 || authError.status === 403);
    const isWrongDashboard =
        (userRole === "manager" && pathname.startsWith("/tenants")) ||
        (userRole === "tenant" && pathname.startsWith("/managers"));

    useEffect(() => {
        if (!isSessionHydrated) return;
        if (!accessToken || isUnauthorized) {
            if (isUnauthorized) dispatch(logout());
            router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
            return;
        }
        if (authUser) {
            if (isWrongDashboard) {
                router.push(
                    userRole === "manager"
                        ? "/managers/properties"
                        : "/tenants/residences",
                    { scroll: false }
                );
            } else if (
                userRole === "manager" &&
                signingProfile !== undefined &&
                !isAgreementError
            ) {
                if (!agreementReady && !isAgreementRoute)
                    router.replace("/managers/agreement-setup", {
                        scroll: false,
                    });
                if (agreementReady && isAgreementRoute)
                    router.replace("/managers/properties", { scroll: false });
            }
        }
    }, [
        accessToken,
        authUser,
        isUnauthorized,
        isWrongDashboard,
        router,
        pathname,
        userRole,
        isSessionHydrated,
        dispatch,
        signingProfile,
        isAgreementError,
        agreementReady,
        isAgreementRoute,
    ]);

    if (!isSessionHydrated) return <PageSkeleton variant="workspace" />;
    if (!accessToken) return null;
    if (isAuthLoading) return <PageSkeleton variant="workspace" />;
    if (isUnauthorized || isWrongDashboard) return null;
    if (isAuthError) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <AdaptiveWrapper>
                    <div
                        className="mx-auto max-w-xl px-6 py-20 text-center"
                        style={{ paddingTop: `${NAVBAR_HEIGHT + 80}px` }}
                        role="status"
                    >
                        <h1 className="text-xl font-semibold">
                            Your workspace is temporarily unavailable
                        </h1>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Your session is still saved. Please try again when
                            the server reconnects.
                        </p>
                        <Button className="mt-6" onClick={() => refetch()}>
                            Try again
                        </Button>
                    </div>
                </AdaptiveWrapper>
            </div>
        );
    }
    if (!authUser?.user?.role || !userRole) return null;
    if (
        userRole === "manager" &&
        (isAgreementLoading || signingProfile === undefined) &&
        !isAgreementError
    ) {
        return <PageSkeleton variant="workspace" />;
    }
    if (userRole === "manager" && isAgreementError) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <div className="dashboard-container mx-auto max-w-xl text-center">
                    <h1 className="text-xl font-semibold">
                        Agreement setup is temporarily unavailable
                    </h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Your session is saved. Try again when the server
                        reconnects.
                    </p>
                    <Button className="mt-5" onClick={() => refetchAgreement()}>
                        Try again
                    </Button>
                </div>
            </div>
        );
    }
    if (
        userRole === "manager" &&
        ((!agreementReady && !isAgreementRoute) ||
            (agreementReady && isAgreementRoute))
    )
        return null;
    if (userRole === "manager" && isAgreementRoute) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <AdaptiveWrapper>
                    <main style={{ paddingTop: `${NAVBAR_HEIGHT + 24}px` }}>
                        {children}
                    </main>
                </AdaptiveWrapper>
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="dashboard-shell min-h-screen w-full bg-background text-foreground">
                <TabletSidebarBackdrop />
                <AdaptiveWrapper mobileDashboardNav>
                    <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
                        <main className="flex">
                            <AppSidebar
                                userType={userRole as "manager" | "tenant"}
                            />
                            <div className="min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] transition-all duration-300 md:pb-0">
                                {children}
                            </div>
                        </main>
                    </div>
                    <MobileDashboardNav
                        role={userRole as "manager" | "tenant"}
                    />
                </AdaptiveWrapper>
            </div>
        </SidebarProvider>
    );
};

export default DashboardLayout;
