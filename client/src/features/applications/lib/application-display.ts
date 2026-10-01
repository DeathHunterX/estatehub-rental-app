type Contact = { name?: string | null; email?: string | null; phoneNumber?: string | null };
type ApplicationContactSource = {
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    message?: string | null;
    tenant?: { user?: Contact | null } | null;
    manager?: { user?: Contact | null } | null;
};

export const applicationContact = (application: ApplicationContactSource, viewer: "manager" | "renter") => {
    const profile = viewer === "manager" ? application.tenant?.user : application.manager?.user;
    return {
        name: (viewer === "manager" ? application.name : profile?.name)?.trim() || "Not provided",
        email: (viewer === "manager" ? application.email : profile?.email)?.trim() || "Not provided",
        phone: (viewer === "manager" ? application.phoneNumber : profile?.phoneNumber)?.trim() || "Not provided",
        message: application.message?.trim() || null,
    };
};
