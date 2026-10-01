import { ChevronDown } from "lucide-react";

const questions = [
    {
        question: "Can I browse homes without an account?",
        answer: "Yes. You can search and view property details before signing in. An account is needed when you want to apply or save favorites.",
    },
    {
        question: "How do I apply for a property?",
        answer: "Open a property, sign in as a renter, and send your application from its details page. You can review its status in your dashboard.",
    },
    {
        question: "Can I list a property as a manager?",
        answer: "Yes. Choose the manager role when creating an account, then add and manage properties from your dashboard.",
    },
];

const FaqSection = () => (
    <section className="bg-card px-6 py-20 text-card-foreground sm:px-8 lg:py-28" id="faq">
        <div className="mx-auto max-w-4xl">
            <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-primary">Good to know</p>
            <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight sm:text-4xl">Questions before you begin?</h2>
            <div className="mt-10 space-y-3">
                {questions.map((item) => (
                    <details key={item.question} className="group rounded-xl border border-border bg-background px-5 py-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                            {item.question}
                            <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="mt-3 pr-8 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                    </details>
                ))}
            </div>
        </div>
    </section>
);

export default FaqSection;
