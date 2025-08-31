"use client";

import AppSidebar from "@/components/shared/sidebar/app-sidebar";
import AdaptiveWrapper from "@/components/shared/wrapper/adaptive-wrapper";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NAVBAR_HEIGHT } from "@/constants";
import { useGetAuthCurrentUserQuery } from "@/states/api";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const { data: authUser, isLoading: isAuthLoading } =
        useGetAuthCurrentUserQuery();
    const router = useRouter();
    const pathname = usePathname();

    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (authUser) {
            const userRole = authUser.user?.role?.toLowerCase();

            if (
                (userRole === "manager" && pathname.startsWith("/tenants")) ||
                (userRole === "tenant" && pathname.startsWith("/managers"))
            ) {
                router.push(
                    userRole === "manager"
                        ? "/managers/properties"
                        : "/tenants/residences",
                    { scroll: false }
                );
            } else {
                setIsLoading(false);
            }
        }
    }, [authUser, router, pathname]);

    if (isAuthLoading || isLoading) return <div>Loading...</div>;
    if (!authUser?.user?.role) return null;

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-primary-100 w-full">
                <AdaptiveWrapper>
                    <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
                        <main className="flex">
                            <AppSidebar
                                userType={
                                    authUser.user.role.toLowerCase() as
                                        | "manager"
                                        | "tenant"
                                }
                            />
                            <div className="flex-grow transition-all duration-300">
                                {children}
                            </div>
                        </main>
                    </div>
                </AdaptiveWrapper>
            </div>
        </SidebarProvider>
    );
};

export default DashboardLayout;
