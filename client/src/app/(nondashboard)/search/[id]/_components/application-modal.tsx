import { CustomFormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ApplicationFormData, applicationSchema } from "@/lib/schemas";
import {
    useCreateApplicationMutation,
    useGetAuthCurrentUserQuery,
} from "@/states/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

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

    const onSubmit = async (data: ApplicationFormData) => {
        if (!authUser || authUser.user?.role.toLowerCase() !== "tenant") {
            console.error(
                "You must be logged in as a tenant to submit an application"
            );
            return;
        }

        const response = await createApplication({
            ...data,
            applicationDate: new Date().toISOString(),
            status: "Pending",
            propertyId: propertyId,
            tenantUserId: authUser.user.id,
        }).unwrap();

        if (response.success) {
            toast.success("Application submitted successfully");
            onClose();
        } else {
            toast.error("Failed to submit application");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white">
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
                            type="text"
                            placeholder="Enter your phone number"
                            disabled={isLoading}
                        />
                        <CustomFormField
                            name="message"
                            label="Message (Optional)"
                            type="textarea"
                            placeholder="Enter any additional information"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            className="bg-primary-700 text-white w-full"
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
