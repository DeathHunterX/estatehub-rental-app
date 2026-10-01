import type { ApplicationPaymentWindow } from "../../types/global";
import { ConflictError } from "../../errors/http-error";

export function assertPaymentWindowOpen(
    application: ApplicationPaymentWindow,
    now = new Date()
) {
    if (application.cancellationRequestedAt)
        throw new ConflictError(
            "Cancellation has been confirmed and payment is closed"
        );
    if (
        application.paymentDueAt &&
        application.paymentDueAt <= now &&
        !application.tenantConfirmedAt
    ) {
        throw new ConflictError("The payment deadline has passed");
    }
}
