"use client";

import PageSkeleton from "@/components/shared/page-skeleton";
import SettingsForm from "@/components/shared/forms/settings-form";

import { useGetAuthCurrentUserQuery } from "@/lib/api/api";

const SettingsPage = () => {
    const { data: authUser, isLoading: isAuthLoading } =
        useGetAuthCurrentUserQuery();

    const initialData = {
        name: authUser?.user?.name,
        email: authUser?.user?.email,
        phoneNumber: authUser?.user?.phoneNumber || "",
    };

    if (isAuthLoading) {
        return <PageSkeleton variant="form" />;
    }

    return <SettingsForm initialData={initialData} userType="tenant" />;
};

export default SettingsPage;
