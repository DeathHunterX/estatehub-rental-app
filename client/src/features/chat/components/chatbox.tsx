"use client";

// Libraries
import { CheckCheck, ChevronDown, ChevronUp, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Components
import PageSkeleton from "@/components/shared/page-skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// APIs
import { useGetAuthCurrentUserQuery, useGetChatQuery, useReadChatMutation, useSendMessageMutation } from "@/lib/api/api";

// State
import { setChatId } from "@/states";
import { useAppDispatch, useAppSelector } from "@/states/store";

// Libs
import { chatPartner } from "@/features/chat/lib/chat-behavior";

// Realtime
import { createSocket, getSocket } from "@/lib/socket/socket";

// Types
import { Message } from "@/types/prisma";

const messageTime = (date: Date | string) =>
    new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const ChatWindow = ({ chatId, mobileDashboardNav }: { chatId: number; mobileDashboardNav: boolean }) => {
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const dispatch = useAppDispatch();
    const [message, setMessage] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [partnerIsTyping, setPartnerIsTyping] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const nearBottomRef = useRef(true);
    const lastChatIdRef = useRef<number | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const partnerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastReadMessageIdRef = useRef<number | null>(null);

    const { data: authUser } = useGetAuthCurrentUserQuery(undefined, { skip: !accessToken });
    const { currentData: activeChat, isLoading: activeChatLoading } = useGetChatQuery(chatId, { skip: !chatId || !accessToken });
    const [sendMessage, { isLoading: isSendingMessage }] = useSendMessageMutation();
    const [readChat] = useReadChatMutation();
    const partner = activeChat && authUser?.user?.id ? chatPartner(activeChat, authUser.user.id) : null;
    const hasLoadedChat = Boolean(activeChat);
    const messageCount = activeChat?.messages.length ?? 0;
    const lastMessage = activeChat?.messages[messageCount - 1];
    const lastMessageId = lastMessage?.id;
    const lastMessageSenderId = lastMessage?.senderId;

    const scrollToBottom = () => {
        const container = messagesContainerRef.current;
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        nearBottomRef.current = true;
        setHasNewMessages(false);
    };

    useEffect(() => {
        if (!chatId || !activeChat || isMinimized) return;
        // Preserve the reader's position unless this chat just opened or was already at the bottom.
        const container = messagesContainerRef.current;
        if (!container) return;
        const firstOpen = lastChatIdRef.current !== chatId;
        if (firstOpen || nearBottomRef.current) {
            container.scrollTop = container.scrollHeight;
            nearBottomRef.current = true;
            setHasNewMessages(false);
        } else {
            setHasNewMessages(true);
        }
        lastChatIdRef.current = chatId;
    }, [chatId, activeChat, isMinimized]);

    useEffect(() => {
        // Mark a message read only after the recipient has viewed the bottom of this chat.
        if (chatId && hasLoadedChat && !isMinimized && nearBottomRef.current &&
            lastMessageId !== undefined && lastMessageSenderId !== authUser?.user?.id &&
            lastReadMessageIdRef.current !== lastMessageId) {
            lastReadMessageIdRef.current = lastMessageId;
            void readChat(chatId).unwrap().catch(() => { lastReadMessageIdRef.current = null; });
        }
    }, [chatId, hasLoadedChat, lastMessageId, lastMessageSenderId, authUser?.user?.id, isMinimized, readChat]);

    useEffect(() => {
        if (!chatId || !accessToken) return;
        const socket = createSocket(accessToken);
        const handleTyping = (data: { chatId: number; isTyping: boolean }) => {
            if (data.chatId !== chatId) return;
            setPartnerIsTyping(data.isTyping);
            if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
            if (data.isTyping) {
                partnerTypingTimeoutRef.current = setTimeout(() => setPartnerIsTyping(false), 4000);
            }
        };
        socket.on("typing", handleTyping);
        return () => {
            socket.off("typing", handleTyping);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
        };
    }, [chatId, accessToken]);

    const stopTyping = () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (chatId && partner) {
            getSocket()?.emit("typing", { chatId, receiverId: partner.id, isTyping: false });
        }
    };

    const handleMessageChange = (value: string) => {
        setMessage(value);
        if (!chatId || !partner) return;
        const socket = getSocket();
        if (!socket) return;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit("typing", { chatId, receiverId: partner.id, isTyping: Boolean(value.trim()) });
        if (value.trim()) typingTimeoutRef.current = setTimeout(stopTyping, 2000);
    };

    const handleSendMessage = async () => {
        const content = message.trim();
        if (!content || !chatId || !partner || isSendingMessage) return;
        try {
            await sendMessage({ chatId, message: content }).unwrap();
            setMessage("");
            stopTyping();
            getSocket()?.emit("sendMessage", { receiverId: partner.id, chatId });
            scrollToBottom();
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleClose = () => {
        stopTyping();
        dispatch(setChatId(null));
        setIsMinimized(false);
        lastChatIdRef.current = null;
    };

    const partnerName = partner?.name || "Conversation";
    const messages = activeChat?.messages ?? [];
    const lastOwnMessageId = [...messages].reverse().find(
        (item: Message) => item.senderId === authUser?.user?.id
    )?.id;

    return (
        <section aria-label={`Chat with ${partnerName}`} className={`fixed bottom-0 right-2 z-50 w-[min(24rem,calc(100vw-1rem))] sm:right-5 ${mobileDashboardNav ? "max-md:bottom-[calc(4rem+env(safe-area-inset-bottom))]" : ""}`}>
            <div className="flex flex-col overflow-hidden rounded-t-2xl border border-border bg-card text-card-foreground shadow-2xl">
                <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                    <Avatar className="size-9 border border-border">
                        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                            {partnerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-semibold">{partnerName}</h2>
                        <p className="text-xs text-muted-foreground">Your conversation</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label={isMinimized ? "Expand chat" : "Minimize chat"} onClick={() => {
                        if (isMinimized) nearBottomRef.current = true;
                        setIsMinimized((value) => !value);
                    }} className="size-8">
                        {isMinimized ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" aria-label="Close chat" onClick={handleClose} className="size-8"><X className="size-4" /></Button>
                </div>
                {!isMinimized && (
                    <>
                        <div ref={messagesContainerRef} onScroll={(event) => {
                            const target = event.currentTarget;
                            nearBottomRef.current = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
                            if (nearBottomRef.current) {
                                setHasNewMessages(false);
                                if (lastMessageId !== undefined && lastMessageSenderId !== authUser?.user?.id && lastReadMessageIdRef.current !== lastMessageId) {
                                    lastReadMessageIdRef.current = lastMessageId;
                                    void readChat(chatId).unwrap().catch(() => { lastReadMessageIdRef.current = null; });
                                }
                            }
                        }} className="relative flex h-80 flex-col gap-3 overflow-y-auto bg-muted/20 px-4 py-4" aria-live="polite">
                            {activeChatLoading ? (
                                <PageSkeleton variant="chat" />
                            ) : messages.length === 0 ? (
                                <p className="m-auto text-center text-sm text-muted-foreground">Start the conversation with a message.</p>
                            ) : messages.map((item: Message) => {
                                const isOwn = item.senderId === authUser?.user?.id;
                                return (
                                    <div key={item.id} className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                                        {!isOwn && <Avatar className="mb-4 size-7 shrink-0"><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{partnerName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>}
                                        <div className={`flex max-w-[78%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                                            <div className={`break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${isOwn ? "rounded-br-sm bg-secondary-600 text-white dark:bg-secondary-500 dark:text-primary-950" : "rounded-bl-sm border border-border bg-card text-card-foreground"}`}>{item.content}</div>
                                            <span className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                                                {messageTime(item.createdAt)}
                                                {isOwn && item.id === lastOwnMessageId && <><CheckCheck className="size-3" aria-hidden="true" /> Sent</>}
                                            </span>
                                        </div>
                                        {isOwn && <Avatar className="mb-4 size-7 shrink-0"><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{(authUser?.user?.name || "Y").charAt(0).toUpperCase()}</AvatarFallback></Avatar>}
                                    </div>
                                );
                            })}
                            {hasNewMessages && <Button type="button" size="sm" onClick={scrollToBottom} className="sticky bottom-2 mx-auto rounded-full bg-primary px-3 text-xs shadow-lg">New messages ↓</Button>}
                        </div>
                        <div className="flex min-h-7 items-center gap-1.5 border-t border-border px-4 pt-1 text-xs text-primary" aria-live="polite">
                            {partnerIsTyping && <><span>{partnerName} is typing</span><span aria-hidden="true" className="animate-pulse font-bold">...</span></>}
                        </div>
                        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
                            <Input value={message} onChange={(event) => handleMessageChange(event.target.value)} onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSendMessage(); }
                            }} placeholder="Type a message..." aria-label="Type a message" className="h-10 flex-1 rounded-full bg-muted/40 px-4" />
                            <Button type="button" size="icon" aria-label="Send message" onClick={handleSendMessage} disabled={!message.trim() || isSendingMessage} className="size-10 shrink-0 rounded-full bg-secondary-600 text-white hover:bg-secondary-500 dark:bg-secondary-500 dark:text-primary-950"><Send className="size-4" /></Button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

const ChatContainer = ({ mobileDashboardNav = false }: { mobileDashboardNav?: boolean }) => {
    const { chatId } = useAppSelector((state) => state.global);
    const { accessToken, userInfo, hydrated } = useAppSelector((state) => state.auth);
    return hydrated && accessToken && userInfo?.id && chatId ? <ChatWindow key={`${userInfo.id}-${chatId}`} chatId={chatId} mobileDashboardNav={mobileDashboardNav} /> : null;
};

export default ChatContainer;
