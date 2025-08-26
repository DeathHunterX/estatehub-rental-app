import CallToActionSection from "./_components/call-to-action-section";
import DiscoverSection from "./_components/discover-section";
import FeaturesSection from "./_components/features-section";
import FooterSection from "./_components/footer-section";
import HeroSection from "./_components/hero-section";

const LandingPage = () => {
    return (
        <div>
            <HeroSection />
            <FeaturesSection />
            <DiscoverSection />
            <CallToActionSection />
            <FooterSection />
        </div>
    );
};

export default LandingPage;
