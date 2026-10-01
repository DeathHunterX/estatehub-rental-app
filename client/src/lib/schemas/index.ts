import { AmenityEnum, HighlightEnum, PropertyTypeEnum } from "@/constants";
import { APPLICATION_MESSAGE_MAX_CHARACTERS, APPLICATION_MESSAGE_MAX_WORDS, countApplicationWords } from "@/features/applications/lib/application-message";
import * as z from "zod";

export const propertySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    pricePerMonth: z.coerce
        .number()
        .positive()
        .min(0)
        .int()
        .transform((val) => val.toString()),
    securityDeposit: z.coerce
        .number()
        .positive()
        .min(0)
        .int()
        .transform((val) => val.toString()),
    applicationFee: z.coerce
        .number()
        .positive()
        .min(0)
        .int()
        .transform((val) => val.toString()),
    isPetsAllowed: z.boolean(),
    isParkingIncluded: z.boolean(),
    photoUrls: z.array(z.url()).max(20, "A property can have up to 20 photos"),
    amenities: z.array(z.nativeEnum(AmenityEnum)).min(1, "Choose at least one amenity"),
    highlights: z.array(z.nativeEnum(HighlightEnum)).min(1, "Choose at least one highlight"),
    beds: z.coerce
        .number()
        .positive()
        .min(0)
        .max(10)
        .int()
        .transform((val) => val.toString()),
    baths: z.coerce
        .number()
        .positive()
        .min(0)
        .max(10)
        .int()
        .transform((val) => val.toString()),
    squareFeet: z.coerce
        .number()
        .int()
        .positive()
        .transform((val) => val.toString()),
    propertyType: z.nativeEnum(PropertyTypeEnum),
    address: z.string().min(1, "Address is required"),
    subdistrict: z.string(),
    district: z.string(),
    city: z.string().min(1, "City is required"),
    state: z.string(),
    country: z.string().min(1, "Country is required"),
    postalCode: z.string(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const applicationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    message: z.string()
        .max(APPLICATION_MESSAGE_MAX_CHARACTERS, "Keep your message under 1,000 characters")
        .refine((value) => countApplicationWords(value) <= APPLICATION_MESSAGE_MAX_WORDS, "Keep your message to 150 words or fewer")
        .optional(),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

export const settingsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
