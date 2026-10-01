import { Button } from "@/components/ui/button";
import { useGetAuthCurrentUserQuery } from "@/lib/api/api";
import { useAppSelector } from "@/states/store";
import { useRouter } from "next/navigation";

const ContactWidget = ({ onOpenModal, propertyId, availability }: ContactWidgetProps) => {
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const { data: authUser } = useGetAuthCurrentUserQuery(undefined, { skip: !accessToken });
    const router = useRouter();
    const isManager = authUser?.user?.role?.toLowerCase() === "manager";

    const handleButtonClick = () => {
        if (authUser && !isManager) {
            onOpenModal();
        } else {
            router.push(`/sign-in?redirect=/search/${propertyId}`);
        }
    };
    return (
        <div className="h-fit rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:p-6 lg:block">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Interested in this home?</p>
                <h2 className="mt-2 text-xl font-bold">Make your next move</h2>
                <p className="mb-5 mt-2 text-sm leading-6 text-muted-foreground sm:mb-0 lg:mb-5">Send an application to the property manager and keep your rental search moving.</p>
            </div>
            <div className="sm:min-w-44 lg:min-w-0">
                <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleButtonClick}
                    disabled={isManager || availability === "Closed" || availability === "Occupied"}
                >
                    {availability === "Closed" ? "Listing closed" : availability === "Occupied" ? "Currently occupied" : isManager ? "Only tenants can apply" : authUser ? "Submit Application" : "Sign In to Apply"}
                </Button>
                {isManager && <p className="mt-3 text-xs text-muted-foreground">Applications are available to tenant accounts.</p>}
            </div>
        </div>
    );
};

export default ContactWidget;
