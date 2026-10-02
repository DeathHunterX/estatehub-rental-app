"use client";

import { Check, ImagePlus, RotateCcw, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useAppSelector } from "@/states/store";

const discardPhoto = (url: string, token: string | null, keepalive = false) => {
    void fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")}/properties/photos`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ url }),
            keepalive,
        }
    ).catch(() => {
        /* Best-effort cleanup when leaving the form. */
    });
};

type PhotoItem = {
    id: string;
    preview: string;
    url?: string;
    file?: File;
    progress: number;
    status: "uploading" | "done" | "error";
    existing?: boolean;
    error?: string;
};

export const PropertyPhotoUploader = ({
    initialUrls = [],
    disabled = false,
    onUploadStateChange,
    savedRef,
}: {
    initialUrls?: string[];
    disabled?: boolean;
    onUploadStateChange?: (pending: boolean) => void;
    savedRef: React.RefObject<boolean>;
}) => {
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const { control } = useFormContext();
    const { field, fieldState } = useController({ name: "photoUrls", control });

    const [items, setItems] = useState<PhotoItem[]>(() =>
        initialUrls.map((url) => ({
            id: url,
            preview: url,
            url,
            progress: 100,
            status: "done",
            existing: true,
        }))
    );
    const [message, setMessage] = useState("");

    const requests = useRef(new Map<string, XMLHttpRequest>());
    const completed = useRef(initialUrls);
    const previews = useRef(new Set<string>());
    const uploaded = useRef(new Set<string>());
    const accessTokenRef = useRef(accessToken);
    useEffect(() => {
        accessTokenRef.current = accessToken;
    }, [accessToken]);

    useEffect(() => {
        const active = requests.current;
        const previewUrls = previews.current;
        const staged = uploaded.current;
        const discardUncommitted = () => {
            if (!savedRef.current)
                staged.forEach((url) =>
                    discardPhoto(url, accessTokenRef.current, true)
                );
        };
        window.addEventListener("pagehide", discardUncommitted);
        return () => {
            window.removeEventListener("pagehide", discardUncommitted);
            discardUncommitted();
            active.forEach((request) => request.abort());
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [savedRef]);

    useEffect(() => {
        onUploadStateChange?.(items.some((item) => item.status !== "done"));
    }, [items, onUploadStateChange]);

    // Keep staged uploads separate from saved property photos so abandoned files can be discarded.
    const upload = (item: PhotoItem) => {
        if (!item.file) return;
        const request = new XMLHttpRequest();
        requests.current.set(item.id, request);
        request.open(
            "POST",
            `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")}/properties/photos`
        );

        if (accessToken)
            request.setRequestHeader("Authorization", `Bearer ${accessToken}`);

        request.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.min(
                    95,
                    Math.round((event.loaded / event.total) * 95)
                );
                setItems((current) =>
                    current.map((photo) =>
                        photo.id === item.id ? { ...photo, progress } : photo
                    )
                );
            }
        };

        request.onload = () => {
            requests.current.delete(item.id);
            let url: string | undefined;
            let error = "Upload failed";
            try {
                const response = JSON.parse(request.responseText);
                url = response?.data?.url;
                error = response?.error?.message || error;
            } catch {
                /* Invalid server response */
            }
            if (request.status >= 200 && request.status < 300 && url) {
                uploaded.current.add(url);
                completed.current = [...completed.current, url];
                field.onChange(completed.current);
                setItems((current) =>
                    current.map((photo) =>
                        photo.id === item.id
                            ? { ...photo, url, progress: 100, status: "done" }
                            : photo
                    )
                );
            } else {
                setItems((current) =>
                    current.map((photo) =>
                        photo.id === item.id
                            ? { ...photo, status: "error", error }
                            : photo
                    )
                );
            }
        };

        request.onerror = () => {
            requests.current.delete(item.id);
            setItems((current) =>
                current.map((photo) =>
                    photo.id === item.id
                        ? { ...photo, status: "error", error: "Network error" }
                        : photo
                )
            );
        };

        const data = new FormData();
        data.append("photo", item.file);
        request.send(data);
    };

    const addFiles = (files: FileList | null) => {
        if (!files) return;

        setMessage("");
        for (const [index, file] of Array.from(files).entries()) {
            if (items.length + index >= 20) {
                setMessage("A property can have up to 20 photos.");
                break;
            }

            if (
                !["image/jpeg", "image/png"].includes(file.type) ||
                file.size > 5 * 1024 * 1024
            ) {
                setMessage("Use JPG or PNG images up to 5 MB each.");
                continue;
            }

            const item: PhotoItem = {
                id: crypto.randomUUID(),
                preview: URL.createObjectURL(file),
                file,
                progress: 0,
                status: "uploading",
            };

            previews.current.add(item.preview);
            setItems((current) => [...current, item]);
            upload(item);
        }
    };

    const remove = (item: PhotoItem) => {
        requests.current.get(item.id)?.abort();
        requests.current.delete(item.id);
        if (item.preview.startsWith("blob:")) {
            URL.revokeObjectURL(item.preview);
            previews.current.delete(item.preview);
        }
        if (item.url && uploaded.current.delete(item.url))
            discardPhoto(item.url, accessToken);
        completed.current = completed.current.filter((url) => url !== item.url);
        field.onChange(completed.current);
        setItems((current) => current.filter((photo) => photo.id !== item.id));
    };

    const uploading = items.some((item) => item.status === "uploading");
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <label className="text-sm font-medium">
                        Property photos
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                        JPG or PNG, up to 5 MB each. Photos upload individually.
                    </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                    <ImagePlus className="size-4" /> Add photos
                    <input
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        className="sr-only"
                        disabled={disabled}
                        onChange={(event) => {
                            addFiles(event.target.files);
                            event.target.value = "";
                        }}
                    />
                </label>
            </div>
            {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Add at least one photo to show your property.
                </p>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                    >
                        <Image
                            src={item.preview}
                            alt="Property preview"
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-contain"
                        />
                        <button
                            type="button"
                            aria-label="Remove photo"
                            onClick={() => remove(item)}
                            disabled={disabled}
                            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground hover:bg-background"
                        >
                            <X className="size-4" />
                        </button>
                        {!item.existing && item.status === "done" && (
                            <span
                                aria-label="Upload complete"
                                className="absolute bottom-2 right-2 z-10 rounded-full bg-emerald-600 p-1.5 text-white"
                            >
                                <Check className="size-4" />
                            </span>
                        )}
                        {!item.existing && (
                            <div className="absolute inset-x-2 bottom-2 rounded-lg bg-background/95 p-2 pr-10 text-xs text-foreground">
                                {item.status === "error" ? (
                                    <>
                                        <p className="mb-1 text-destructive">
                                            {item.error}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setItems((current) =>
                                                    current.map((photo) =>
                                                        photo.id === item.id
                                                            ? {
                                                                  ...photo,
                                                                  status: "uploading",
                                                                  progress: 0,
                                                                  error: undefined,
                                                              }
                                                            : photo
                                                    )
                                                );
                                                upload(item);
                                            }}
                                            className="flex items-center gap-1 text-destructive"
                                        >
                                            <RotateCcw className="size-3" />{" "}
                                            Retry upload
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span>
                                            {item.status === "done"
                                                ? "Uploaded 100%"
                                                : `Uploading ${item.progress}%`}
                                        </span>
                                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full transition-[width] ${item.status === "done" ? "bg-emerald-500" : "bg-primary"}`}
                                                style={{
                                                    width: `${item.progress}%`,
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {uploading && (
                <p className="text-xs text-muted-foreground" role="status">
                    Wait for every photo to show a green check before saving.
                </p>
            )}
            {(message || fieldState.error?.message) && (
                <p className="text-sm text-destructive" role="alert">
                    {message || fieldState.error?.message}
                </p>
            )}
        </div>
    );
};
