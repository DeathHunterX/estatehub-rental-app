import AdaptiveWrapper from "@/components/shared/wrapper/adaptive-wrapper";
import Landing from "./(nondashboard)/landing/page";

export default function Home() {
    return (
        <div className="h-full w-full">
            <AdaptiveWrapper>
                <main className={`h-full flex w-full flex-col`}>
                    <Landing />
                </main>
            </AdaptiveWrapper>
        </div>
    );
}
