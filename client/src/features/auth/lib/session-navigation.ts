type AccountSummary = {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    image?: string | null;
};

export const destinationAfterSignIn = (role: string | null | undefined) =>
    role?.toLowerCase() === "manager" ? "/managers/properties" : "/";

export const resolveNavigationSession = (
    accessToken: string | null,
    freshAccount: AccountSummary | null | undefined,
    cachedAccount: AccountSummary | null
) => ({
    isAuthenticated: Boolean(accessToken),
    account: accessToken ? freshAccount ?? cachedAccount : null,
});
