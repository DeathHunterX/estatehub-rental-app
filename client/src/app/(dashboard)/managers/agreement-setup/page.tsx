import SigningSetup from "../../../../features/signing/components/signing-setup";

export default function ManagerAgreementSetupPage() {
    return (
        <div className="dashboard-container mx-auto max-w-4xl">
            <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-foreground sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">First step for managers</p>
                <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Prepare your lease agreement</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Complete this setup before adding a property or approving a tenant application. Your signature is encrypted in this browser before it is saved.</p>
            </div>
            <SigningSetup />
        </div>
    );
}
