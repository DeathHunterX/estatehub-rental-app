// Libraries
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

// Components
import { CustomFormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

// APIs
import {
    useCreateApplicationMutation,
    useGetAuthCurrentUserQuery,
} from "@/lib/api/api";

// Validation
import { ApplicationFormData, applicationSchema } from "@/lib/schemas";

// Libs
import {
    APPLICATION_MESSAGE_MAX_CHARACTERS,
    APPLICATION_MESSAGE_MAX_WORDS,
    countApplicationWords,
    limitApplicationMessage,
} from "@/features/applications/lib/application-message";

const ApplicationModal = ({
    isOpen,
    onClose,
    propertyId,
}: ApplicationModalProps) => {
    const [createApplication, { isLoading }] = useCreateApplicationMutation();
    const { data: authUser } = useGetAuthCurrentUserQuery();

    const form = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            message: "",
        },
    });
    const messageWordCount = countApplicationWords(
        useWatch({ control: form.control, name: "message" }) ?? ""
    );

    const onSubmit = async (data: ApplicationFormData) => {
        if (!authUser || authUser.user?.role.toLowerCase() !== "tenant") {
            console.error(
                "You must be logged in as a tenant to submit an application"
            );
            return;
        }

        try {
            await createApplication({
                ...data,
                propertyId,
            }).unwrap();
            onClose();
        } catch {
            /* API mutation displays the error */
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-border bg-card text-card-foreground">
                <DialogHeader className="mb-4">
                    <DialogTitle>
                        Submit Application for this Property
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        <CustomFormField
                            name="name"
                            label="Name"
                            type="text"
                            placeholder="Enter your full name"
                            disabled={isLoading}
                        />
                        <CustomFormField
                            name="email"
                            label="Email"
                            type="email"
                            placeholder="Enter your email address"
                            disabled={isLoading}
                        />
                        <CustomFormField
                            name="phoneNumber"
                            label="Phone Number"
                            type="tel"
                            placeholder="Enter your phone number"
                            disabled={isLoading}
                        />
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(event) =>
                                                field.onChange(
                                                    limitApplicationMessage(
                                                        event.target.value
                                                    )
                                                )
                                            }
                                            maxLength={
                                                APPLICATION_MESSAGE_MAX_CHARACTERS
                                            }
                                            rows={5}
                                            placeholder="Tell the manager a little about yourself"
                                            disabled={isLoading}
                                            aria-describedby="application-message-count"
                                            className="h-32 max-h-32 resize-none overflow-y-auto border-input bg-background p-4 text-foreground placeholder:text-muted-foreground [field-sizing:fixed]"
                                        />
                                    </FormControl>
                                    <p
                                        id="application-message-count"
                                        className="text-right text-xs text-muted-foreground"
                                    >
                                        {messageWordCount}/
                                        {APPLICATION_MESSAGE_MAX_WORDS} words
                                    </p>
                                    <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full bg-secondary-500 text-primary-950 hover:bg-secondary-400"
                            disabled={isLoading}
                        >
                            {isLoading ? "Submitting..." : "Submit Application"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationModal;
