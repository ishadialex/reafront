import AboutHero from "@/components/About/AboutHero";
import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import OurMission from "@/components/About/OurMission";
import WhoWeAre from "@/components/About/WhoWeAre";
import Breadcrumb from "@/components/Common/Breadcrumb";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Page | Free Next.js Template for Startup and SaaS",
  description: "This is About Page for Startup Nextjs Template",
  // other metadata
};

const AboutPage = () => {
  return (
    <>
      {/* <Breadcrumb
        pageName="We are Different by Design"
        description="We invest on behalf of institutions and individuals worldwide to deliver strong, stable returns."
      /> */}
      <br />
       <AboutHero />
      {/* <WhoWeAre /> */}
      <OurMission />
      {/* <AboutSectionOne />
      <AboutSectionTwo /> */}
    </>
  );
};

export default AboutPage;
