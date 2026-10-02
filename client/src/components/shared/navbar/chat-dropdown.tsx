"use client";

// Libraries
import React, { useState } from "react";

// Components
import PageSkeleton from "@/components/shared/page-skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Libs
import {
    chatActivityTime,
    chatPartner,
} from "@/features/chat/lib/chat-behavior";

// APIs
import { useGetAuthCurrentUserQuery, useGetChatsQuery } from "@/lib/api/api";

// States
import { setChatId } from "@/states/index";
import { useAppDispatch, useAppSelector } from "@/states/store";

interface ChatDropdownProps {
    trigger: React.ReactNode;
}

const ChatDropdown = ({ trigger }: ChatDropdownProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const { data: chats, isLoading } = useGetChatsQuery();
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const dispatch = useAppDispatch();
    const chatSessionVersion = useAppSelector(
        (state) => state.global.chatSessionVersion
    );
    const userId = authUser?.user?.id;
    const filteredChats = chats
        ?.filter(
            (chat) =>
                !userId ||
                chatPartner(chat, userId)
                    .name.toLowerCase()
                    .includes(search.trim().toLowerCase())
        )
        .sort(
            (left, right) =>
                new Date(chatActivityTime(right)).getTime() -
                new Date(chatActivityTime(left)).getTime()
        );
    const isUnread = (chat: NonNullable<typeof chats>[number]) => {
        if (
            !userId ||
            !chat.lastMessage ||
            chat.lastMessage.senderId === userId
        )
            return false;
        const lastReadAt =
            chat.tenantUserId === userId
                ? chat.tenantLastReadAt
                : chat.managerLastReadAt;
        return (
            !lastReadAt ||
            new Date(chat.lastMessage.createdAt) > new Date(lastReadAt)
        );
    };
    const hasUnread = chats?.some(isUnread);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                aria-label="Open messages"
                className="relative hidden rounded-md p-1 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white md:inline-flex"
            >
                {trigger}
                {hasUnread && (
                    <span
                        aria-label="Unread messages"
                        className="absolute right-0 top-0 size-2 rounded-full bg-secondary-500 ring-2 ring-primary-700"
                    />
                )}
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-xl border-border bg-popover p-0 text-popover-foreground shadow-xl"
            >
                <div className="border-b border-border px-4 py-4">
                    <h2 className="text-base font-semibold">Messages</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Your recent conversations
                    </p>
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search conversations"
                        aria-label="Search conversations"
                        className="mt-3 rounded-full bg-muted/40 px-4"
                    />
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                    {isLoading && <PageSkeleton variant="chat" />}
                    {!isLoading && filteredChats?.length === 0 && (
                        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                            {search
                                ? "No matching conversations."
                                : "No conversations yet."}
                        </p>
                    )}
                    {filteredChats?.map((chat) => {
                        const partner = userId
                            ? chatPartner(chat, userId)
                            : null;
                        const lastMessage = chat.lastMessage;
                        const unread = isUnread(chat);
                        return (
                            <button
                                key={chat.id}
                                type="button"
                                onClick={() => {
                                    dispatch(
                                        setChatId({
                                            chatId: chat.id,
                                            sessionVersion: chatSessionVersion,
                                        })
                                    );
                                    setOpen(false);
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                            >
                                <Avatar className="size-10 shrink-0">
                                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                                        {(partner?.name || "C")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center justify-between gap-2">
                                        <span
                                            className={`truncate text-sm ${unread ? "font-semibold" : "font-medium"}`}
                                        >
                                            {partner?.name || "Conversation"}
                                        </span>
                                        <span className="shrink-0 text-[11px] text-muted-foreground">
                                            {new Date(
                                                chatActivityTime(chat)
                                            ).toLocaleTimeString([], {
                                                hour: "numeric",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </span>
                                    <span className="mt-0.5 flex items-center gap-2">
                                        <span
                                            className={`truncate text-xs ${unread ? "font-medium text-foreground" : "text-muted-foreground"}`}
                                        >
                                            {lastMessage?.content ||
                                                "Start the conversation"}
                                        </span>
                                        {unread && (
                                            <span
                                                className="ml-auto size-2 shrink-0 rounded-full bg-secondary-500"
                                                aria-label="Unread message"
                                            />
                                        )}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ChatDropdown;
