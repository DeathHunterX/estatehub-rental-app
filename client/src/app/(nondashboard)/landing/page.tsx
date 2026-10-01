import CallToActionSection from "./_components/call-to-action-section";
import DiscoverSection from "./_components/discover-section";
import FeaturesSection from "./_components/features-section";
import FooterSection from "./_components/footer-section";
import HeroSection from "./_components/hero-section";
import AudienceSection from "./_components/audience-section";
import FaqSection from "./_components/faq-section";
import DestinationsSection from "./_components/destinations-section";

const LandingPage = () => {
    return (
        <div>
            <HeroSection />
            <FeaturesSection />
            <DiscoverSection />
            <DestinationsSection />
            <AudienceSection />
            <FaqSection />
            <CallToActionSection />
            <FooterSection />
        </div>
    );
};

export default LandingPage;
