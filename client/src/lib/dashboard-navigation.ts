import { Building, CalendarClock, FileText, Heart, Home, Settings, type LucideIcon } from "lucide-react";

export type DashboardRole = "manager" | "tenant";
export type DashboardNavItem = { href: string; label: string; icon: LucideIcon };

export const dashboardNavigation: Record<DashboardRole, DashboardNavItem[]> = {
    manager: [
        { icon: Building, label: "Properties", href: "/managers/properties" },
        { icon: FileText, label: "Applications", href: "/managers/applications" },
        { icon: CalendarClock, label: "Payments", href: "/managers/payments" },
        { icon: Settings, label: "Settings", href: "/managers/settings" },
    ],
    tenant: [
        { icon: Heart, label: "Favorites", href: "/tenants/favorites" },
        { icon: FileText, label: "Applications", href: "/tenants/applications" },
        { icon: CalendarClock, label: "Payments", href: "/tenants/payments" },
        { icon: Home, label: "Residences", href: "/tenants/residences" },
        { icon: Settings, label: "Settings", href: "/tenants/settings" },
    ],
};
