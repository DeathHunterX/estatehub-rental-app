"use client";

import SettingsForm from "@/components/shared/forms/settings-form";
import { useGetAuthCurrentUserQuery } from "@/states/api";

const SettingsPage = () => {
    const { data: authUser, isLoading: isAuthLoading } =
        useGetAuthCurrentUserQuery();

    const initialData = {
        name: authUser?.user?.name,
        email: authUser?.user?.email,
        phoneNumber: authUser?.user?.phoneNumber || "",
    };

    if (isAuthLoading) {
        return <div>Loading...</div>;
    }

    return <SettingsForm initialData={initialData} userType="manager" />;
};

export default SettingsPage;
