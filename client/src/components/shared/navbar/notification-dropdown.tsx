"use client";

import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from "@/lib/api/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";

const NotificationDropdown = () => {
    const { data } = useGetNotificationsQuery(undefined, { pollingInterval: 30_000 });
    const notifications = data?.items ?? [];
    const [markRead] = useMarkNotificationReadMutation();
    const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllNotificationsReadMutation();
    const unread = data?.unreadCount ?? 0;
    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative rounded-md p-1 text-primary-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Bell className="size-5" />
                {unread > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{Math.min(unread, 9)}</span>}
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="flex max-h-[min(32rem,80vh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden bg-popover p-2 text-popover-foreground">
            <div className="shrink-0">
                <div className="flex items-start justify-between gap-3 px-2 py-2">
                    <div><p className="font-semibold">Notifications</p><p className="text-xs text-muted-foreground">Updates about your applications and leases</p></div>
                    <button type="button" onClick={() => void markAllRead()} disabled={unread === 0 || isMarkingAllRead} className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50">Read all</button>
                </div>
                <DropdownMenuSeparator />
            </div>
            <div className="min-h-0 overflow-y-auto">
                {notifications.length === 0 && <p className="px-3 py-5 text-center text-sm text-muted-foreground">No notifications yet.</p>}
                {notifications.map((item) => <button key={item.id} type="button" onClick={() => !item.readAt && markRead(item.id)} className={`flex w-full gap-3 rounded-md p-3 text-left hover:bg-accent ${item.readAt ? "opacity-70" : "bg-accent/40"}`}>
                    <Bell aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.body}</span><span className="mt-1 block text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span></span>
                </button>)}
            </div>
        </DropdownMenuContent>
    </DropdownMenu>;
};

export default NotificationDropdown;
