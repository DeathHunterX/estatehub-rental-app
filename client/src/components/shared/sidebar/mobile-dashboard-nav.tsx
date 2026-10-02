"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    dashboardNavigation,
    type DashboardNavItem,
    type DashboardRole,
} from "@/lib/dashboard-navigation";

import { cn } from "@/lib/utils";

export default function MobileDashboardNav({ role }: { role: DashboardRole }) {
    const pathname = usePathname();
    const links = dashboardNavigation[role];
    const midpoint = Math.ceil(links.length / 2);
    const centerHref =
        role === "manager" ? "/managers/properties/new" : "/search";
    const centerLabel =
        role === "manager" ? "Add new property" : "Search properties";
    const CenterIcon = role === "manager" ? Plus : Search;

    const renderLink = ({ href, label, icon: Icon }: DashboardNavItem) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
            <Tooltip key={href}>
                <TooltipTrigger asChild>
                    <Link
                        href={href}
                        aria-label={label}
                        aria-current={active ? "page" : undefined}
                        title={label}
                        className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-xl text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                            active && "bg-sidebar-accent text-secondary-400"
                        )}
                    >
                        <Icon aria-hidden="true" className="size-5" />
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                    {label}
                </TooltipContent>
            </Tooltip>
        );
    };

    return (
        <nav
            aria-label="Dashboard navigation"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[0_-10px_30px_rgba(0,0,0,0.2)] backdrop-blur-md md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex h-16 items-center px-2">
                <div className="flex min-w-0 flex-1 items-center justify-around">
                    {links.slice(0, midpoint).map(renderLink)}
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href={centerHref}
                            aria-label={centerLabel}
                            title={centerLabel}
                            className="mx-1 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-500 text-primary-950 shadow-lg shadow-secondary-500/20 transition-colors hover:bg-secondary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
                        >
                            <CenterIcon aria-hidden="true" className="size-6" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                        {centerLabel}
                    </TooltipContent>
                </Tooltip>
                <div className="flex min-w-0 flex-1 items-center justify-around">
                    {links.slice(midpoint).map(renderLink)}
                </div>
            </div>
        </nav>
    );
}
