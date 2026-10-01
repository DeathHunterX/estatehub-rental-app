"use client";

// Libraries
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "../form-field";

// APIs
import { useUpdateAuthCurrentUserMutation } from "@/lib/api/api";

// Validation
import { SettingsFormData, settingsSchema } from "@/lib/schemas";

const SettingsForm = ({ initialData, userType }: SettingsFormProps) => {
    const { theme, setTheme } = useTheme();
    const appearanceReady = useSyncExternalStore(() => () => {}, () => true, () => false);
    const reduceMotion = useSyncExternalStore(
        (notify) => {
            window.addEventListener("storage", notify);
            window.addEventListener("estatehub:motion-change", notify);
            return () => {
                window.removeEventListener("storage", notify);
                window.removeEventListener("estatehub:motion-change", notify);
            };
        },
        () => localStorage.getItem("estatehub:reduce-motion") === "true",
        () => false
    );
    const [editMode, setEditMode] = useState<boolean>(false);
    const [updateUser, { isLoading: isUpdating }] =
        useUpdateAuthCurrentUserMutation();

    const form = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: initialData,
    });
    const savedData = useRef(initialData);
    const isEditing = useRef(false);
    const { name, email, phoneNumber } = initialData;

    const updateMotion = (enabled: boolean) => {
        localStorage.setItem("estatehub:reduce-motion", String(enabled));
        document.documentElement.dataset.reduceMotion = String(enabled);
        window.dispatchEvent(new Event("estatehub:motion-change"));
    };

    useEffect(() => {
        savedData.current = { name, email, phoneNumber };
        if (!isEditing.current) form.reset(savedData.current);
    }, [name, email, phoneNumber, form]);

    const toggleEditMode = () => {
        if (editMode) {
            form.reset(savedData.current);
        }
        isEditing.current = !editMode;
        setEditMode((prev) => !prev);
    };

    async function onSubmit(data: SettingsFormData) {
        try {
            await updateUser(data).unwrap();
            savedData.current = data;
            form.reset(data);
            isEditing.current = false;
            toast.success("Profile updated successfully");
            setEditMode(false);
        } catch {
            toast.error("Could not save your profile. Please try again.");
        }
    }

    return (
        <div className="dashboard-container text-foreground">
            <div className="mb-5">
                <h1 className="text-xl font-semibold">{`${
                    userType.charAt(0).toUpperCase() + userType.slice(1)
                } Settings`}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {userType === "tenant"
                        ? "Manage your account details and preferences"
                        : "Manage your profile details and preferences"}
                </p>
            </div>

            <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8" aria-labelledby="appearance-heading">
                <h2 id="appearance-heading" className="text-lg font-semibold text-card-foreground">Appearance</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your choices are saved on this browser.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3" role="group" aria-label="Color theme">
                    {([
                        { value: "dark", label: "Dark", Icon: Moon },
                        { value: "light", label: "Light", Icon: Sun },
                        { value: "system", label: "System", Icon: Monitor },
                    ] as const).map(({ value, label, Icon }) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={appearanceReady && theme === value}
                            onClick={() => setTheme(value)}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${appearanceReady && theme === value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground"}`}
                        >
                            <Icon className="size-4" />{label}
                        </button>
                    ))}
                </div>
                <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
                    <span><span className="block font-medium text-foreground">Reduce motion</span><span className="block text-sm text-muted-foreground">Minimize animations and map movement.</span></span>
                    <input type="checkbox" checked={reduceMotion} onChange={(event) => updateMotion(event.target.checked)} className="size-5 accent-secondary-500" />
                </label>
            </section>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
                <Form {...form}>
                    <form
                        onSubmit={(event) => {
                            void form.handleSubmit(onSubmit)(event);
                        }}
                        className="space-y-6"
                    >
                        <CustomFormField
                            name="name"
                            label="Name"
                            type="text"
                            disabled={!editMode || isUpdating}
                            inputClassName="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground"
                        />
                        <CustomFormField
                            name="email"
                            label="Email"
                            type="email"
                            disabled={!editMode || isUpdating}
                            inputClassName="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground"
                        />
                        <CustomFormField
                            name="phoneNumber"
                            label="Phone Number"
                            type="tel"
                            disabled={!editMode || isUpdating}
                            inputClassName="h-11 border-input bg-background text-foreground placeholder:text-muted-foreground"
                        />

                        <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-6">
                            <Button
                                type="button"
                                onClick={toggleEditMode}
                                disabled={isUpdating}
                                className="border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                {editMode ? "Cancel" : "Edit"}
                            </Button>
                            {editMode && (
                                <Button
                                    type="submit"
                                    className="bg-secondary-500 text-primary-950 hover:bg-secondary-400"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? "Saving..." : "Save Changes"}
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default SettingsForm;
