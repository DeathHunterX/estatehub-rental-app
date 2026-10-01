import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar";
import { NAVBAR_HEIGHT } from "@/constants";
import { cn } from "@/lib/utils";
import { dashboardNavigation } from "@/lib/dashboard-navigation";
import {
    Menu,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AppSidebar = ({ userType }: AppSidebarProps) => {
    const pathname = usePathname();
    const {
        toggleSidebar,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
    } = useSidebar();
    const expanded = isMobile ? openMobile : open;

    const navLinks = dashboardNavigation[userType];
    return (
        <Sidebar
            collapsible="icon"
            className="fixed left-0 z-40 border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl"
            style={{
                top: `${NAVBAR_HEIGHT}px`,
                height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            }}
        >
            <SidebarHeader className="relative border-b border-sidebar-border px-2 pb-3 pt-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div
                            className={cn(
                                "flex min-h-11 w-full items-center",
                                expanded
                                    ? "justify-between px-3"
                                    : "justify-center"
                            )}
                        >
                            {expanded ? (
                                <>
                                    <div className="min-w-0">
                                        <span className="block text-sm font-bold tracking-tight text-sidebar-foreground">
                                            EstateHub
                                        </span>
                                        <span className="block text-xs text-sidebar-foreground/70">
                                            {userType === "manager"
                                                ? "Manager workspace"
                                                : "Renter workspace"}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Collapse sidebar"
                                        className="absolute -right-6 top-2 z-10 flex size-8 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-sidebar-ring"
                                        onClick={() => toggleSidebar()}
                                    >
                                        <ArrowLeft className="size-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    aria-label="Expand sidebar"
                                    className="rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-sidebar-ring"
                                    onClick={() => toggleSidebar()}
                                >
                                    <Menu className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 pb-5 pt-7">
                <SidebarMenu className="gap-1.5">
                    {navLinks.map((link) => {
                        const isActive =
                            pathname === link.href ||
                            pathname.startsWith(`${link.href}/`);

                        return (
                            <SidebarMenuItem key={link.href}>
                                <SidebarMenuButton
                                    asChild
                                    className={cn(
                                        "h-11 rounded-xl px-3 text-sidebar-foreground transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold ring-1 ring-sidebar-border before:absolute before:left-0 before:h-6 before:w-1 before:rounded-r-full before:bg-secondary-500"
                                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                        !expanded &&
                                            "mx-auto !size-10 !justify-center !p-0"
                                    )}
                                    isActive={isActive}
                                    tooltip={link.label}
                                >
                                    <Link
                                        href={link.href}
                                        aria-label={link.label}
                                        className="flex items-center gap-3"
                                        scroll={false}
                                        onClick={() => {
                                            if (isMobile) setOpenMobile(false);
                                            else if (window.innerWidth < 1024)
                                                setOpen(false);
                                        }}
                                    >
                                        <link.icon
                                            className={cn(
                                                "size-5 shrink-0",
                                                isActive && "text-secondary-400"
                                            )}
                                        />
                                        <span className="font-medium group-data-[collapsible=icon]:hidden">
                                            {link.label}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter
                className={cn(
                    "border-t border-sidebar-border px-4 py-4 text-xs text-sidebar-foreground/70",
                    !expanded && "items-center px-1"
                )}
            >
                {expanded ? "EstateHub workspace" : "EH"}
            </SidebarFooter>
        </Sidebar>
    );
};

export default AppSidebar;
