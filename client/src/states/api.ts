import { cleanParams, withToast } from "@/lib/utils";
import {
    Application,
    Lease,
    Manager,
    Payment,
    Property,
    Tenant,
} from "@/types/prisma";
import {
    createApi,
    fetchBaseQuery,
    FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import { FiltersState } from ".";

export const api = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("accessToken");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),

    reducerPath: "api",
    tagTypes: [
        "Managers",
        "Tenants",
        "Properties",
        "PropertyDetails",
        "Leases",
        "Payments",
        "Applications",
    ],
    endpoints: (builder) => ({
        // user related endpoints
        getAuthCurrentUser: builder.query<Tenant | Manager, void>({
            query: () => ({
                url: "/user/me",
                method: "GET",
            }),
            transformResponse: (
                response: {
                    success: boolean;
                    data: Tenant | Manager;
                },
                meta: FetchBaseQueryMeta
            ) => {
                if (meta?.response?.status === 401) {
                    localStorage.removeItem("accessToken");
                }
                return response.data;
            },
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch current user.",
                });
            },
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
            Partial<FiltersState> & { favoriteIds?: string[] }
        >({
            query: (filters) => {
                const params = cleanParams({
                    location: filters.location,
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
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load properties.",
                });
            },
        }),

        getProperty: builder.query<Property, number>({
            query: (propertyId) => ({
                url: `/properties/${propertyId}`,
                method: "GET",
            }),
            transformResponse: (response: {
                success: boolean;
                data: Property;
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

        // application related endpoints
        getApplications: builder.query<
            Application[],
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
                data: Application[];
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
            }
        >({
            query: ({ id, status }) => ({
                url: `/applications/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            transformResponse: (response: {
                success: boolean;
                data: Application & { lease?: Lease };
            }) => response.data,
            invalidatesTags: ["Applications", "Leases"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Application status updated successfully.",
                    error: "Failed to update application status.",
                });
            },
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
            }) => response,
            invalidatesTags: ["Applications"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Application submitted successfully.",
                    error: "Failed to create application.",
                });
            },
        }),
    }),
});

export const {
    // user related endpoints
    useGetAuthCurrentUserQuery,
    useUpdateAuthCurrentUserMutation,
    // property related endpoints
    useCreatePropertyMutation,
    useGetPropertiesQuery,
    useGetPropertyQuery,
    // tenant related endpoints
    useGetTenantQuery,
    useGetCurrentResidencesQuery,
    useAddFavoritePropertyMutation,
    useRemoveFavoritePropertyMutation,
    // manager related endpoints
    useGetManagerPropertiesQuery,
    // lease related endpoints
    useGetLeasesQuery,
    useGetPropertyLeasesQuery,
    useGetPaymentsQuery,
    // application related endpoints
    useGetApplicationsQuery,
    useUpdateApplicationStatusMutation,
    useCreateApplicationMutation,
} = api;
