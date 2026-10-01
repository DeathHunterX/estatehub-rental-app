import { cleanParams, withToast } from "@/lib/utils";
import {
    Application,
    Chat,
    Lease,
    Manager,
    Message,
    Payment,
    Property,
    Tenant,
} from "@/types/prisma";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { FiltersState } from "@/states";
import {
    logout,
    renewSession,
    type SessionUser,
} from "@/states/slices/auth.slice";
import type {
    ManagerSigningProfile,
    SigningProfileUpdate,
} from "@/features/signing/types/signing-profile";
import type { AgreementDraft } from "@/features/leases/lib/lease-agreement-pdf";

type ApplicationListItem = Application & {
    firstPaymentAvailable: boolean;
    paymentRecordExists: boolean;
};

const rawBaseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as { auth: { accessToken: string | null } })
            .auth.accessToken;
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

type RefreshResponse = {
    success: boolean;
    data?: { accessToken: string; user: SessionUser };
};
let pendingRefresh: Promise<Awaited<ReturnType<typeof rawBaseQuery>>> | null =
    null;

// Share one refresh request across concurrent 401s; each caller retries its own request.
const baseQueryWithRefresh: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, apiContext, extraOptions) => {
    const token = (
        apiContext.getState() as { auth: { accessToken: string | null } }
    ).auth.accessToken;
    const result = await rawBaseQuery(args, apiContext, extraOptions);
    const url = typeof args === "string" ? args : args.url;
    if (result.error?.status !== 401 || !token || url.includes("/auth/"))
        return result;

    if (!pendingRefresh) {
        pendingRefresh = Promise.resolve(
            rawBaseQuery(
                {
                    url: "/auth/refresh-token",
                    method: "POST",
                    credentials: "include",
                },
                apiContext,
                extraOptions
            )
        );
        void pendingRefresh.finally(() => {
            pendingRefresh = null;
        });
    }
    const refreshed = await pendingRefresh;
    const payload = refreshed.data as RefreshResponse | undefined;
    const currentToken = (
        apiContext.getState() as { auth: { accessToken: string | null } }
    ).auth.accessToken;
    // A different login may have replaced the session while refresh was in flight.
    if (
        payload?.success &&
        payload.data?.accessToken &&
        payload.data.user &&
        currentToken === token
    ) {
        apiContext.dispatch(
            renewSession({
                accessToken: payload.data.accessToken,
                userInfo: payload.data.user,
            })
        );
        return rawBaseQuery(args, apiContext, extraOptions);
    }
    if (currentToken === token) apiContext.dispatch(logout());
    return result;
};

export const api = createApi({
    baseQuery: baseQueryWithRefresh,

    reducerPath: "api",
    tagTypes: [
        "Managers",
        "Tenants",
        "Properties",
        "PropertyDetails",
        "Leases",
        "Payments",
        "Applications",
        "Chats",
        "SigningProfile",
        "Notifications",
    ],
    endpoints: (builder) => ({
        // user related endpoints
        getAuthCurrentUser: builder.query<Tenant | Manager, void>({
            query: () => ({
                url: "/user/me",
                method: "GET",
            }),
            transformResponse: (response: {
                success: boolean;
                data: Tenant | Manager;
            }) => response.data,
        }),
        updateAuthCurrentUser: builder.mutation<
            Tenant | Manager,
            Partial<Tenant | Manager>
        >({
            query: (updatedUserData) => ({
                url: `/user/me`,
                method: "PUT",
                body: updatedUserData,
            }),
            transformResponse: (response: {
                success: boolean;
                data: Tenant | Manager;
            }) => response.data,
            invalidatesTags: (result) => [
                { type: "Managers", id: result?.id },
                { type: "Tenants", id: result?.id },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Current user updated successfully.",
                    error: "Failed to update current user.",
                });
            },
        }),

        // property related endpoints
        createProperty: builder.mutation<Property, FormData>({
            query: (propertyData) => ({
                url: "/properties",
                method: "POST",
                body: propertyData,
            }),
            transformResponse: (response: {
                success: boolean;
                data: Property;
            }) => response.data,
            invalidatesTags: (result) => [
                { type: "Properties", id: result?.id },
                { type: "Managers", id: result?.manger?.id },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Property created successfully.",
                    error: "Failed to create property.",
                });
            },
        }),
        getProperties: builder.query<
            Property[],
            Partial<FiltersState> & { favoriteIds?: string[]; silent?: boolean }
        >({
            query: (filters) => {
                const params = cleanParams({
                    location: filters.location,
                    favoriteIds: filters.favoriteIds?.join(","),
                    priceMin: filters.priceRange?.[0],
                    priceMax: filters.priceRange?.[1],
                    beds: filters.beds,
                    baths: filters.baths,
                    propertyType: filters.propertyType,
                    squareFeetMin: filters.squareFeet?.[0],
                    squareFeetMax: filters.squareFeet?.[1],
                    amenities: filters.amenities,
                    availableFrom: filters.availableFrom,
                    latitude: filters.latitude,
                    longitude: filters.longitude,
                });
                return {
                    url: "properties",
                    params,
                };
            },
            transformResponse: (response: {
                success: boolean;
                data: Property[];
            }) => response.data,
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({
                              type: "Properties" as const,
                              id,
                          })),
                          { type: "Properties", id: "LIST" },
                      ]
                    : [{ type: "Properties", id: "LIST" }],
            async onQueryStarted(filters, { queryFulfilled }) {
                if (filters.silent) return;
                await withToast(queryFulfilled, {
                    error: "Failed to load properties.",
                });
            },
        }),

        getProperty: builder.query<
            Property & {
                availability?: "Free" | "Waiting" | "Occupied" | "Closed";
            },
            number
        >({
            query: (propertyId) => ({
                url: `/properties/${propertyId}`,
                method: "GET",
            }),
            transformResponse: (response: {
                success: boolean;
                data: Property & {
                    availability?: "Free" | "Waiting" | "Occupied" | "Closed";
                };
            }) => response.data,
            providesTags: (result, error, id) => [
                { type: "PropertyDetails", id },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load property.",
                });
            },
        }),

        // Tenant related endpoints
        getTenant: builder.query<Tenant, string>({
            query: (userId) => ({
                url: `/tenants/${userId}`,
                method: "GET",
            }),
            transformResponse: (response: { success: boolean; data: Tenant }) =>
                response.data,
            providesTags: (result) => [{ type: "Tenants", id: result?.id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load tenant profile.",
                });
            },
        }),
        getCurrentResidences: builder.query<Property[], string>({
            query: (userId) => ({
                url: `/tenants/${userId}/current-residences`,
                method: "GET",
            }),
            transformResponse: (response: {
                success: boolean;
                data: Property[];
            }) => response.data,
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({
                              type: "Properties" as const,
                              id,
                          })),
                          { type: "Properties", id: "LIST" },
                      ]
                    : [{ type: "Properties", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load current residences.",
                });
            },
        }),

        addFavoriteProperty: builder.mutation<
            Tenant,
            { tenantId: string; propertyId: number }
        >({
            query: ({ tenantId, propertyId }) => ({
                url: `/tenants/${tenantId}/favorites/${propertyId}`,
                method: "POST",
            }),
            transformResponse: (response: { success: boolean; data: Tenant }) =>
                response.data,
            invalidatesTags: (result) => [
                { type: "Tenants", id: result?.id },
                { type: "Properties", id: "LIST" },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Added to favorites successfully.",
                    error: "Failed to add favorite property.",
                });
            },
        }),
        removeFavoriteProperty: builder.mutation<
            Tenant,
            { tenantId: string; propertyId: number }
        >({
            query: ({ tenantId, propertyId }) => ({
                url: `/tenants/${tenantId}/favorites/${propertyId}`,
                method: "DELETE",
            }),
            transformResponse: (response: { success: boolean; data: Tenant }) =>
                response.data,
            invalidatesTags: (result) => [
                { type: "Tenants", id: result?.id },
                { type: "Properties", id: "LIST" },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Removed from favorites successfully.",
                    error: "Failed to remove favorite property.",
                });
            },
        }),

        // manager related endpoints
        getManagerProperties: builder.query<Property[], string>({
            query: (userId) => ({
                url: `/managers/${userId}/properties`,
                method: "GET",
            }),
            transformResponse: (response: {
                success: boolean;
                data: Property[];
            }) => response.data,
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({
                              type: "Properties" as const,
                              id,
                          })),
                          { type: "Properties", id: "LIST" },
                      ]
                    : [{ type: "Properties", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load manager properties.",
                });
            },
        }),
        getManagerSigningProfile: builder.query<
            ManagerSigningProfile | null,
            void
        >({
            query: () => "/managers/signing-profile",
            transformResponse: (response: {
                success: boolean;
                data: ManagerSigningProfile | null;
            }) => response.data,
            providesTags: ["SigningProfile"],
        }),
        updateManagerSigningProfile: builder.mutation<
            ManagerSigningProfile,
            SigningProfileUpdate
        >({
            query: (body) => ({
                url: "/managers/signing-profile",
                method: "PUT",
                body,
            }),
            transformResponse: (response: {
                success: boolean;
                data: ManagerSigningProfile;
            }) => response.data,
            invalidatesTags: ["SigningProfile"],
        }),

        // lease related endpoints
        getLeases: builder.query<Lease[], string>({
            query: () => ({
                url: "/leases",
                method: "GET",
            }),
            transformResponse: (response: {
                success: boolean;
                data: Lease[];
            }) => response.data,
            providesTags: ["Leases"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load leases.",
                });
            },
        }),
        getLeaseAgreementDraft: builder.query<AgreementDraft, number>({
            query: (leaseId) => `/leases/${leaseId}/agreement-draft`,
            transformResponse: (response: {
                success: boolean;
                data: AgreementDraft;
            }) => response.data,
            providesTags: ["Leases"],
        }),
        getPropertyLeases: builder.query<Lease[], number>({
            query: (propertyId) => ({
                url: `/properties/${propertyId}/leases`,
                method: "GET",
            }),
            transformResponse: (response: {
                success: boolean;
                data: Lease[];
            }) => response.data,
            providesTags: ["Leases"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load property leases.",
                });
            },
        }),
        getPayments: builder.query<Payment[], number>({
            query: (leaseId) => ({
                url: `/leases/${leaseId}/payments`,
                method: "GET",
            }),
            transformResponse: (response: {
                success: boolean;
                data: Payment[];
            }) => response.data,
            providesTags: ["Payments"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load payments.",
                });
            },
        }),
        updateProperty: builder.mutation<
            Property,
            { id: number; data: FormData }
        >({
            query: ({ id, data }) => ({
                url: `/properties/${id}`,
                method: "PATCH",
                body: data,
            }),
            transformResponse: (response: {
                success: boolean;
                data: Property;
            }) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: "PropertyDetails", id },
                { type: "Properties", id },
                { type: "Properties", id: "LIST" },
                "Applications",
                "Notifications",
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Property updated successfully.",
                    error: "Failed to update property.",
                });
            },
        }),
        getPropertyPayments: builder.query<Payment[], number>({
            query: (propertyId) => `/properties/${propertyId}/payments`,
            transformResponse: (response: {
                success: boolean;
                data: Payment[];
            }) => response.data,
            providesTags: ["Payments"],
        }),

        updatePropertyListingStatus: builder.mutation<
            Property,
            { id: number; status: "Free" | "Closed" }
        >({
            query: ({ id, status }) => ({
                url: `/properties/${id}/listing-status`,
                method: "PATCH",
                body: { status },
            }),
            transformResponse: (response: { data: Property }) => response.data,
            invalidatesTags: ["Properties", "PropertyDetails"],
        }),
        archiveProperty: builder.mutation<Property, number>({
            query: (id) => ({
                url: `/properties/${id}/archive`,
                method: "POST",
            }),
            transformResponse: (response: { data: Property }) => response.data,
            invalidatesTags: ["Properties", "PropertyDetails"],
        }),

        // application related endpoints
        getApplications: builder.query<
            ApplicationListItem[],
            {
                userId?: string;
                userType?: "tenant" | "manager";
            }
        >({
            query: (params) => {
                const queryParams = new URLSearchParams();

                if (params.userId) {
                    queryParams.append("userId", params.userId.toString());
                }

                if (params.userType) {
                    queryParams.append("userType", params.userType);
                }

                return `applications?${queryParams.toString()}`;
            },
            transformResponse: (response: {
                success: boolean;
                data: ApplicationListItem[];
            }) => response.data,
            providesTags: ["Applications"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load applications.",
                });
            },
        }),

        updateApplicationStatus: builder.mutation<
            Application & { lease?: Lease },
            {
                id: number;
                status: string;
                reason?: string;
                paymentDueDays?: number;
            }
        >({
            query: ({ id, status, reason, paymentDueDays }) => ({
                url: `/applications/${id}/status`,
                method: "PATCH",
                body: { status, reason, paymentDueDays },
            }),
            transformResponse: (response: {
                success: boolean;
                data: Application & { lease?: Lease };
            }) => response.data,
            invalidatesTags: [
                "Applications",
                "Leases",
                "Properties",
                "PropertyDetails",
                "Notifications",
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Application status updated successfully.",
                    error: "Failed to update application status.",
                });
            },
        }),
        scheduleLegacyPaymentDeadline: builder.mutation<
            Application,
            { id: number; paymentDueDays: number }
        >({
            query: ({ id, paymentDueDays }) => ({
                url: `/applications/${id}/payment-deadline`,
                method: "PATCH",
                body: { paymentDueDays },
            }),
            transformResponse: (response: { data: Application }) =>
                response.data,
            invalidatesTags: ["Applications", "Notifications"],
        }),
        createApplication: builder.mutation<Application, Partial<Application>>({
            query: (newApplicationData) => ({
                url: "/applications",
                method: "POST",
                body: newApplicationData,
            }),
            transformResponse: (response: {
                success: boolean;
                data: Application;
            }) => response.data,
            invalidatesTags: ["Applications"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Application submitted successfully.",
                    error: "Failed to create application.",
                });
            },
        }),
        updateApplicationQuote: builder.mutation<
            Application,
            { id: number; monthlyRent: number }
        >({
            query: ({ id, monthlyRent }) => ({
                url: `/applications/${id}/quote`,
                method: "PATCH",
                body: { monthlyRent },
            }),
            transformResponse: (response: { data: Application }) =>
                response.data,
            invalidatesTags: ["Applications"],
        }),
        chooseSettlementMethod: builder.mutation<
            Application,
            { id: number; method: "Cash" }
        >({
            query: ({ id, method }) => ({
                url: `/applications/${id}/settlement-method`,
                method: "PATCH",
                body: { method },
            }),
            transformResponse: (response: { data: Application }) =>
                response.data,
            invalidatesTags: ["Applications"],
        }),
        confirmCashSettlement: builder.mutation<
            Application,
            { id: number; amount: number }
        >({
            query: ({ id, amount }) => ({
                url: `/applications/${id}/confirm-cash`,
                method: "POST",
                body: { amount },
            }),
            transformResponse: (response: { data: Application }) =>
                response.data,
            invalidatesTags: [
                "Applications",
                "Leases",
                "Payments",
                "Properties",
                "PropertyDetails",
                "Notifications",
            ],
        }),
        reportCashNotReceived: builder.mutation<
            Application,
            { id: number; reason: string }
        >({
            query: ({ id, reason }) => ({
                url: `/applications/${id}/cash-not-received`,
                method: "POST",
                body: { reason },
            }),
            transformResponse: (response: { data: Application }) =>
                response.data,
            invalidatesTags: ["Applications", "Notifications"],
        }),
        resolveCashDispute: builder.mutation<
            Application,
            { id: number; reason: string }
        >({
            query: ({ id, reason }) => ({
                url: `/applications/${id}/resolve-cash-dispute`,
                method: "POST",
                body: { reason },
            }),
            transformResponse: (response: { data: Application }) =>
                response.data,
            invalidatesTags: ["Applications", "Notifications"],
        }),
        retractCashConfirmation: builder.mutation<Application, number>({
            query: (id) => ({
                url: `/applications/${id}/retract-cash`,
                method: "POST",
            }),
            transformResponse: (response: { data: Application }) =>
                response.data,
            invalidatesTags: ["Applications", "Notifications"],
        }),
        withdrawApplication: builder.mutation<Application, number>({
            query: (id) => ({
                url: `/applications/${id}/withdraw`,
                method: "POST",
            }),
            transformResponse: (response: { data: Application }) =>
                response.data,
            invalidatesTags: [
                "Applications",
                "Notifications",
                "Properties",
                "PropertyDetails",
            ],
        }),
        requestApplicationCancellation: builder.mutation<
            Application,
            { id: number; reason: string }
        >({
            query: ({ id, reason }) => ({
                url: `/applications/${id}/cancellation`,
                method: "POST",
                body: { reason },
            }),
            transformResponse: (response: { data: Application }) =>
                response.data,
            invalidatesTags: ["Applications", "Notifications"],
        }),
        requestLeaseRenewal: builder.mutation<Lease, number>({
            query: (id) => ({ url: `/leases/${id}/renewal`, method: "POST" }),
            transformResponse: (response: { data: Lease }) => response.data,
            invalidatesTags: ["Leases", "Applications", "Notifications"],
        }),
        reviewLeaseRenewal: builder.mutation<
            Lease,
            { id: number; status: "Approved" | "Denied"; months?: number }
        >({
            query: ({ id, ...body }) => ({
                url: `/leases/${id}/renewal`,
                method: "PATCH",
                body,
            }),
            transformResponse: (response: { data: Lease }) => response.data,
            invalidatesTags: ["Leases", "Applications", "Notifications"],
        }),
        getNotifications: builder.query<
            {
                items: Array<{
                id: number;
                title: string;
                body: string;
                kind: string;
                readAt: string | null;
                createdAt: string;
                }>;
                unreadCount: number;
            },
            void
        >({
            query: () => "/notifications",
            transformResponse: (response: {
                data: Array<{
                    id: number;
                    title: string;
                    body: string;
                    kind: string;
                    readAt: string | null;
                    createdAt: string;
                }>;
                unreadCount: number;
            }) => ({ items: response.data, unreadCount: response.unreadCount }),
            providesTags: ["Notifications"],
        }),
        markNotificationRead: builder.mutation<void, number>({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: "PATCH",
            }),
            invalidatesTags: ["Notifications"],
        }),
        markAllNotificationsRead: builder.mutation<void, void>({
            query: () => ({
                url: "/notifications/read-all",
                method: "PATCH",
            }),
            invalidatesTags: ["Notifications"],
        }),

        // Chat related endpoints
        getChats: builder.query<Chat[], void>({
            query: () => ({
                url: "/chats",
                method: "GET",
            }),
            transformResponse: (response: { success: boolean; data: Chat[] }) =>
                response.data,
            providesTags: [{ type: "Chats", id: "LIST" }],
        }),
        createChat: builder.mutation<Chat, { receiverId: string }>({
            query: (body) => ({ url: "/chats", method: "POST", body }),
            transformResponse: (response: { success: boolean; data: Chat }) =>
                response.data,
            invalidatesTags: [{ type: "Chats", id: "LIST" }],
        }),
        getChat: builder.query<Chat, number>({
            query: (chatId) => ({
                url: `/chats/${chatId}`,
                method: "GET",
            }),
            transformResponse: (response: { success: boolean; data: Chat }) =>
                response.data,
            providesTags: (result) => [{ type: "Chats", id: result?.id }],
        }),
        sendMessage: builder.mutation<
            Message,
            { chatId: number; message: string }
        >({
            query: ({ chatId, message }) => ({
                url: `/messages/${chatId}`,
                method: "POST",
                body: { content: message },
            }),
            transformResponse: (response: {
                success: boolean;
                data: Message;
            }) => response.data,
            invalidatesTags: (result) => [
                { type: "Chats", id: result?.chatId },
                { type: "Chats", id: "LIST" },
            ],
        }),
        readChat: builder.mutation<Chat, number>({
            query: (chatId) => ({
                url: `/chats/read/${chatId}`,
                method: "PUT",
            }),
            transformResponse: (response: { success: boolean; data: Chat }) =>
                response.data,
            invalidatesTags: (result) => [
                { type: "Chats", id: result?.id },
                { type: "Chats", id: "LIST" },
            ],
        }),
    }),
});

export const {
    // user related endpoints
    useGetAuthCurrentUserQuery,
    useUpdateAuthCurrentUserMutation,
    // property related endpoints
    useCreatePropertyMutation,
    useUpdatePropertyMutation,
    useGetPropertiesQuery,
    useGetPropertyQuery,
    // tenant related endpoints
    useGetTenantQuery,
    useGetCurrentResidencesQuery,
    useAddFavoritePropertyMutation,
    useRemoveFavoritePropertyMutation,
    // manager related endpoints
    useGetManagerPropertiesQuery,
    useGetManagerSigningProfileQuery,
    useUpdateManagerSigningProfileMutation,
    // lease related endpoints
    useGetLeasesQuery,
    useLazyGetLeaseAgreementDraftQuery,
    useGetPropertyLeasesQuery,
    useGetPaymentsQuery,
    useGetPropertyPaymentsQuery,
    useUpdatePropertyListingStatusMutation,
    useArchivePropertyMutation,
    // application related endpoints
    useGetApplicationsQuery,
    useUpdateApplicationStatusMutation,
    useScheduleLegacyPaymentDeadlineMutation,
    useCreateApplicationMutation,
    useUpdateApplicationQuoteMutation,
    useChooseSettlementMethodMutation,
    useConfirmCashSettlementMutation,
    useReportCashNotReceivedMutation,
    useResolveCashDisputeMutation,
    useRetractCashConfirmationMutation,
    useWithdrawApplicationMutation,
    useRequestApplicationCancellationMutation,
    useRequestLeaseRenewalMutation,
    useReviewLeaseRenewalMutation,
    useGetNotificationsQuery,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation,
    // chat related endpoints
    useGetChatsQuery,
    useCreateChatMutation,
    useGetChatQuery,
    useSendMessageMutation,
    useReadChatMutation,
} = api;
