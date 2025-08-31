"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useGetAuthCurrentUserQuery, useGetChatsQuery } from "@/states/api";
import { setChatId } from "@/states/index";
import { useAppDispatch } from "@/states/store";
import { ExpandIcon } from "lucide-react";
import React, { Fragment, useState } from "react";

interface ChatDropdownProps {
    trigger: React.ReactNode;
}

const ChatDropdown = ({ trigger }: ChatDropdownProps) => {
    const { data: chats, isLoading: chatsLoading } = useGetChatsQuery();
    const { data: authUser } = useGetAuthCurrentUserQuery();

    const [isChatDropdownOpen, setIsChatDropdownOpen] =
        useState<boolean>(false);

    const dispatch = useAppDispatch();

    const handleOpenChat = (id: number) => {
        dispatch(setChatId(id));
        setIsChatDropdownOpen(false);
    };

    return (
        <Fragment>
            <Popover
                open={isChatDropdownOpen}
                onOpenChange={setIsChatDropdownOpen}
            >
                <PopoverTrigger>{trigger}</PopoverTrigger>
                <PopoverContent>
                    <div className="">
                        <div className="flex flex-row justify-between items-center">
                            <h3 className="text-lg font-semibold">Messages</h3>
                            <ExpandIcon size={16} />
                        </div>

                        <div className="mt-2">
                            <Input
                                className="rounded-full w-full"
                                placeholder="Search..."
                            />
                        </div>

                        <div className="py-2">
                            {chatsLoading && <p>Loading chats...</p>}
                            {chats?.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="flex flex-row items-center gap-2 hover:bg-muted p-2 rounded-md cursor-pointer"
                                    onClick={() => handleOpenChat(chat.id)}
                                >
                                    <Avatar>
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            {authUser?.user.role === "Tenant"
                                                ? chat.manager.user.name
                                                : chat.tenant.user.name ||
                                                  "Unknown"}
                                        </h3>
                                        <div className="flex flex-row items-center gap-2">
                                            <p className="text-sm text-muted-foreground">
                                                {chat.lastMessage?.content ??
                                                    "No messages yet"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {chat.updatedAt
                                                    ? new Date(
                                                          chat.updatedAt
                                                      ).toLocaleTimeString()
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </Fragment>
    );
};

export default ChatDropdown;
