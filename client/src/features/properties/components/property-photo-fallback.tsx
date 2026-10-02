import { ImageOff } from "lucide-react";

export default function PropertyPhotoFallback() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted via-card to-muted p-3 text-center text-muted-foreground">
            <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background/70">
                <ImageOff className="size-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium">Photo unavailable</span>
        </div>
    );
}
