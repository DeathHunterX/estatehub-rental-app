// Components
import AdaptiveWrapper from "@/components/shared/wrapper/adaptive-wrapper";

// Constants
import { NAVBAR_HEIGHT } from "@/constants";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="h-full w-full">
            <AdaptiveWrapper>
                <main
                    className={`h-full flex w-full flex-col`}
                    style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}
                >
                    {children}
                </main>
            </AdaptiveWrapper>
        </div>
    );
};

export default Layout;
