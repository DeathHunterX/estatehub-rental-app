"use client";

// Libraries
import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
    LayoutDashboard,
    LogOut,
    MessageCircle,
    Plus,
    Search,
    Settings2,
} from "lucide-react";

// Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChatDropdown from "./chat-dropdown";
import NotificationDropdown from "./notification-dropdown";

// Constants
import { NAVBAR_HEIGHT } from "@/constants";

// Libs
import { resolveNavigationSession } from "@/features/auth/lib/session-navigation";
import { isManagerAgreementReady } from "@/features/signing/lib/manager-agreement";

// APIs
import {
    api,
    useGetAuthCurrentUserQuery,
    useGetManagerSigningProfileQuery,
} from "@/lib/api/api";
import { useSignOutMutation } from "@/lib/api/auth-api.slice";

// State
import { logout } from "@/states/slices/auth.slice";
import { useAppDispatch, useAppSelector } from "@/states/store";

const Navbar = () => {
    // Session restoration can finish before a streamed navbar hydrates.
    const clientReady = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
    const savedAccessToken = useAppSelector((state) => state.auth.accessToken);
    const sessionHydrated = useAppSelector((state) => state.auth.hydrated);
    const savedUser = useAppSelector((state) => state.auth.userInfo);
    const accessToken = clientReady ? savedAccessToken : null;
    const cachedUser = clientReady ? savedUser : null;
    const sessionReady = clientReady && sessionHydrated;
    const { data: queriedUser, error: accountError } =
        useGetAuthCurrentUserQuery(undefined, {
            skip: !accessToken,
        });
    const { isAuthenticated, account } = resolveNavigationSession(
        accessToken,
        queriedUser?.user,
        cachedUser
    );
    const accountRole = account?.role?.toLowerCase();
    const dispatch = useAppDispatch();
    const [signOut] = useSignOutMutation();
    // const socket = getSocket();

    const router = useRouter();
    const pathname = usePathname();

    const isDashboardPage =
        pathname.includes("/managers") || pathname.includes("/tenants");
    const { data: signingProfile } = useGetManagerSigningProfileQuery(
        undefined,
        {
            skip: !accessToken || accountRole !== "manager" || !isDashboardPage,
        }
    );
    const showDashboardAction =
        isDashboardPage &&
        accountRole &&
        (accountRole !== "manager" || isManagerAgreementReady(signingProfile));

    useEffect(() => {
        if (
            accessToken &&
            accountError &&
            "status" in accountError &&
            (accountError.status === 401 || accountError.status === 403)
        ) {
            dispatch(logout());
            dispatch(api.util.resetApiState());
        }
    }, [accessToken, accountError, dispatch]);

    const handleSignOut = () => {
        dispatch(logout());
        dispatch(api.util.resetApiState());
        void signOut()
            .unwrap()
            .catch(() => {
                // The local session is already cleared if the server is unavailable.
            });
        toast.success("Signed out successfully.");
        router.replace("/");
    };

    return (
        <div
            className="fixed top-0 left-0 w-full z-50 shadow-xl"
            style={{ height: `${NAVBAR_HEIGHT}px` }}
        >
            <div className="flex justify-between items-center w-full gap-1 bg-primary-700 px-3 py-3 text-white sm:gap-2 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-2 md:gap-6">
                    <Link
                        href="/"
                        className="cursor-pointer hover:!text-primary-300"
                        scroll={false}
                    >
                        <div className="flex items-center gap-3">
                            <Image
                                src="/logo.svg"
                                alt="EstateHub"
                                width={24}
                                height={24}
                                className="size-6"
                            />
                            <div className="text-xl font-bold">
                                ESTATE
                                <span className="text-secondary-500 font-light hover:!text-secondary-300">
                                    HUB
                                </span>
                            </div>
                        </div>
                    </Link>

                    {showDashboardAction && (
                        <Button
                            variant="secondary"
                            className="hidden md:inline-flex md:ml-4 border border-secondary-300/60 bg-secondary-500 font-semibold text-primary-950 shadow-[0_4px_20px_rgba(235,134,134,0.25)] hover:bg-secondary-400 hover:text-primary-950 focus-visible:ring-2 focus-visible:ring-white"
                            onClick={() =>
                                router.push(
                                    accountRole === "manager"
                                        ? "/managers/properties/new"
                                        : "/search"
                                )
                            }
                        >
                            {accountRole === "manager" ? (
                                <>
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden md:block ml-2">
                                        Add New Property
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    <span className="hidden md:block ml-2">
                                        Search Properties
                                    </span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
                {!isDashboardPage && (
                    <p className="hidden text-primary-200 lg:block">
                        Discover your perfect rental apartment with our advanced
                        search
                    </p>
                )}

                <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-5">
                    {sessionReady &&
                        (isAuthenticated ? (
                            <>
                                <NotificationDropdown />
                                <ChatDropdown
                                    trigger={
                                        <MessageCircle className="size-6 text-primary-200 transition-colors hover:text-white" />
                                    }
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        aria-label={`Open account menu for ${account?.name || "your account"}`}
                                        className="rounded-full p-1 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white data-[state=open]:bg-white/15"
                                    >
                                        <Avatar className="size-8">
                                            <AvatarImage
                                                src={
                                                    account?.image || undefined
                                                }
                                            />
                                            <AvatarFallback className="bg-secondary-500 font-bold text-primary-950">
                                                {(
                                                    account?.name?.charAt(0) ||
                                                    "U"
                                                ).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        sideOffset={10}
                                        className="w-[min(17rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl"
                                    >
                                        <DropdownMenuLabel className="flex items-center gap-2.5 rounded-lg bg-muted/55 px-3 py-2.5 font-normal">
                                            <Avatar className="size-9 shrink-0">
                                                <AvatarImage
                                                    src={
                                                        account?.image ||
                                                        undefined
                                                    }
                                                />
                                                <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                                                    {(
                                                        account?.name?.charAt(
                                                            0
                                                        ) || "U"
                                                    ).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-semibold text-foreground">
                                                    {account?.name ||
                                                        "Your account"}
                                                </span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {account?.email ||
                                                        `${accountRole || "Member"} account`}
                                                </span>
                                                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-primary">
                                                    {accountRole || "Member"}
                                                </span>
                                            </span>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-border" />
                                        {accountRole && (
                                            <DropdownMenuItem
                                                className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5 text-foreground focus:!bg-accent focus:!text-accent-foreground"
                                                onClick={() =>
                                                    router.push(
                                                        accountRole ===
                                                            "manager"
                                                            ? "/managers/properties"
                                                            : "/tenants/favorites",
                                                        { scroll: false }
                                                    )
                                                }
                                            >
                                                <LayoutDashboard className="size-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    Dashboard
                                                </span>
                                            </DropdownMenuItem>
                                        )}
                                        {accountRole && (
                                            <DropdownMenuItem
                                                className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5 text-foreground focus:!bg-accent focus:!text-accent-foreground"
                                                onClick={() =>
                                                    router.push(
                                                        accountRole ===
                                                            "manager"
                                                            ? "/managers/settings"
                                                            : "/tenants/settings",
                                                        { scroll: false }
                                                    )
                                                }
                                            >
                                                <Settings2 className="size-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    Settings
                                                </span>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator className="bg-border" />
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5 text-destructive focus:!bg-destructive/10 focus:!text-destructive"
                                            onClick={handleSignOut}
                                        >
                                            <LogOut className="size-4" />
                                            <span className="font-medium">
                                                Sign out
                                            </span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Link href="/sign-in">
                                    <Button
                                        variant="outline"
                                        className="rounded-lg border-white bg-transparent text-white hover:border-white hover:bg-white/15 hover:text-white"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="hidden lg:block"
                                >
                                    <Button
                                        variant="secondary"
                                        className="text-white bg-secondary-600 hover:bg-white hover:text-primary-700 rounded-lg dark:bg-secondary-400 dark:text-secondary-950 dark:hover:bg-white dark:hover:text-secondary-950"
                                    >
                                        Sign Up
                                    </Button>
                                </Link>
                            </>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
