"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSocket } from "@/services/socket";
import {
    useGetAuthCurrentUserQuery,
    useGetChatQuery,
    useReadChatMutation,
    useSendMessageMutation,
} from "@/states/api";
import { setChatId } from "@/states/index";
import { useAppDispatch, useAppSelector } from "@/states/store";
import { Message } from "@/types/prisma";
import { Maximize2, Minimize2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ChatContainer = () => {
    const { chatId } = useAppSelector((state) => state.global);
    const dispatch = useAppDispatch();
    const socket = getSocket();

    const [message, setMessage] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [isChatJustOpened, setIsChatJustOpened] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [savedScrollPosition, setSavedScrollPosition] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const { data: authUser } = useGetAuthCurrentUserQuery();
    const { data: activeChat, isLoading: activeChatLoading } = useGetChatQuery(
        chatId!,
        { skip: !chatId }
    );

    const [readChatMutation] = useReadChatMutation();

    const [sendMessageMutation, { isLoading: isSendingMessage }] =
        useSendMessageMutation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const saveScrollPosition = () => {
        if (messagesContainerRef.current) {
            setSavedScrollPosition(messagesContainerRef.current.scrollTop);
        }
    };

    const isNearBottom = () => {
        if (!messagesContainerRef.current) return false;
        const { scrollTop, scrollHeight, clientHeight } =
            messagesContainerRef.current;
        const threshold = 100; // pixels from bottom
        return scrollHeight - scrollTop - clientHeight < threshold;
    };

    // Track when chat is opened
    useEffect(() => {
        if (chatId) {
            setIsChatJustOpened(true);
            setHasNewMessages(false);
        }
    }, [chatId]);

    // Handle scroll behavior
    useEffect(() => {
        if (activeChat && !activeChatLoading) {
            if (isChatJustOpened) {
                // Only scroll to bottom if it's actually first open,
                // not just maximize/minimize
                setTimeout(() => {
                    scrollToBottom();
                    setIsChatJustOpened(false);
                }, 100);
            } else {
                if (isNearBottom()) {
                    scrollToBottom();
                } else {
                    setHasNewMessages(true);
                }
            }
        }
    }, [activeChat, activeChatLoading, isChatJustOpened, isMinimized]);

    // Restore after maximize when component has re-rendered
    useEffect(() => {
        if (!isMinimized && savedScrollPosition > 0) {
            const container = messagesContainerRef.current;
            if (container) {
                // wait for next paint to ensure DOM height is ready
                requestAnimationFrame(() => {
                    container.scrollTop = savedScrollPosition;
                });
            }
        }
    }, [isMinimized, savedScrollPosition]);

    // Reset new messages indicator when user scrolls to bottom
    useEffect(() => {
        const handleScroll = () => {
            if (isNearBottom()) {
                setHasNewMessages(false);
            }
        };

        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
            return () => container.removeEventListener("scroll", handleScroll);
        }
    }, []);

    const handleCloseChat = () => {
        dispatch(setChatId(null));
        setIsMinimized(false);
        setSavedScrollPosition(0);
    };

    const handleMinimize = () => {
        saveScrollPosition();
        setIsMinimized(true);
    };

    const handleMaximize = () => {
        setIsMinimized(false);
    };

    const handleSendMessage = async () => {
        if (message.trim() && chatId && socket) {
            try {
                // Send message to API first
                await sendMessageMutation({ chatId, message }).unwrap();

                // Clear input immediately for better UX
                setMessage("");

                // Emit socket event to notify other user
                socket.emit("sendMessage", {
                    receiverId: activeChat?.receiverId,
                    data: {
                        chatId,
                        message: message.trim(),
                        senderId: authUser?.user.id,
                    },
                });
            } catch (error) {
                console.error("Failed to send message:", error);
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Join chat room when chat is opened
    useEffect(() => {
        if (chatId && socket) {
            socket.emit("join-chat", chatId);

            // Listen for new messages
            socket.on("getMessage", (data) => {
                if (data.chatId === chatId) {
                    // Refetch chat data to get new messages
                    readChatMutation(chatId);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off("getMessage");
            }
        };
    }, [socket, chatId, readChatMutation]);

    if (!chatId) return null;

    const chatPartnerName =
        activeChat?.manager?.user?.name ||
        activeChat?.tenant?.user?.name ||
        "Unknown";

    const chatPartnerAvatar = "https://github.com/shadcn.png"; // You can replace this with actual avatar

    return (
        <div className="fixed bottom-0 right-4 w-80 z-50">
            {isMinimized ? (
                <div className="bg-white border border-gray-200 rounded-t-lg shadow-lg">
                    <div
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={handleMaximize}
                    >
                        <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={chatPartnerAvatar} />
                                <AvatarFallback>
                                    {chatPartnerName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                                {chatPartnerName}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMaximize}
                            className="h-6 w-6 p-0"
                        >
                            <Maximize2 size={14} />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-t-lg shadow-lg h-96 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={chatPartnerAvatar} />
                                <AvatarFallback>
                                    {chatPartnerName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold text-sm">
                                    {chatPartnerName}
                                </h3>
                                <p className="text-xs text-gray-500">Online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMinimize}
                                className="h-6 w-6 p-0"
                            >
                                <Minimize2 size={14} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCloseChat}
                                className="h-6 w-6 p-0"
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div
                        className="flex-1 overflow-y-auto p-3 space-y-3 relative"
                        ref={messagesContainerRef}
                    >
                        {activeChatLoading ? (
                            <div className="flex justify-center">
                                <p className="text-sm text-gray-500">
                                    Loading messages...
                                </p>
                            </div>
                        ) : activeChat && activeChat.messages.length > 0 ? (
                            activeChat.messages.map((msg: Message) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${
                                        msg.senderId === authUser?.user.id
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                            msg.senderId === authUser?.user.id
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-100 text-gray-900"
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-center">
                                <p className="text-sm text-gray-500">
                                    No messages yet
                                </p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />

                        {/* New Messages Indicator */}
                        {hasNewMessages && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                <Button
                                    onClick={scrollToBottom}
                                    size="sm"
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-lg"
                                >
                                    New messages ↓
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-gray-200">
                        <div className="flex gap-2">
                            <Input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                className="flex-1"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!message.trim() || isSendingMessage}
                                size="sm"
                                className="px-3 cursor-pointer"
                            >
                                <Send size={16} className="cursor-pointer" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatContainer;
