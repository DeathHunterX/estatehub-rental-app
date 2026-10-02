import AdaptiveWrapper from "@/components/shared/wrapper/adaptive-wrapper";
import { NAVBAR_HEIGHT } from "@/constants";
import Landing from "./(nondashboard)/landing/page";

export default function Home() {
    return (
        <div className="h-full w-full">
            <AdaptiveWrapper>
                <main
                    className="flex h-full w-full flex-col"
                    style={{ paddingTop: NAVBAR_HEIGHT }}
                >
                    <Landing />
                </main>
            </AdaptiveWrapper>
        </div>
    );
}
