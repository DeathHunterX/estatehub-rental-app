"use client";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SettingsFormData, settingsSchema } from "@/lib/schemas";
import { useUpdateAuthCurrentUserMutation } from "@/states/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { toast } from "react-hot-toast";
import { CustomFormField } from "../form-field";

const SettingsForm = ({ initialData, userType }: SettingsFormProps) => {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [updateUser, { isLoading: isUpdating }] =
        useUpdateAuthCurrentUserMutation();

    const form = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: initialData,
    });

    const toggleEditMode = () => {
        setEditMode((prev) => !prev);

        if (!editMode) {
            form.reset(initialData);
        }
    };

    async function onSubmit(data: SettingsFormData) {
        await updateUser(data);
        toast.success("Profile updated successfully");
        setEditMode(false);
    }

    return (
        <div className="pt-8 pb-5 px-8">
            <div className="mb-5">
                <h1 className="text-xl font-semibold">{`${
                    userType.charAt(0).toUpperCase() + userType.slice(1)
                } Settings`}</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {userType === "tenant"
                        ? "Manage your account details and preferences"
                        : "Manage your profile details and preferences"}
                </p>
            </div>

            <div className="bg-white rounded-xl p-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <CustomFormField
                            name="name"
                            label="Name"
                            type="text"
                            disabled={!editMode || isUpdating}
                        />
                        <CustomFormField
                            name="email"
                            label="Email"
                            type="email"
                            disabled={!editMode || isUpdating}
                        />
                        <CustomFormField
                            name="phoneNumber"
                            label="Phone Number"
                            type="text"
                            disabled={!editMode || isUpdating}
                        />

                        <div className="pt-4 flex justify-between">
                            <Button
                                type="button"
                                onClick={toggleEditMode}
                                disabled={isUpdating}
                                className="bg-secondary-500 text-white hover:bg-secondary-600"
                            >
                                {editMode ? "Cancel" : "Edit"}
                            </Button>
                            {editMode && (
                                <Button
                                    type="submit"
                                    className="bg-primary-700 text-white hover:bg-primary-800"
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
