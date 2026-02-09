import Breadcrumb from "@/components/Common/Breadcrumb";
import Contact from "@/components/Contact";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Alvarado Associates - Get in Touch",
  description: "Have questions about real estate investing? Contact Alvarado Associates today. Our team of investment experts is ready to help you achieve your financial goals.",
  // other metadata
};

const ContactPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="Contact Page"
        description="Have questions ? We’re here to help. Reach out to us via phone, email."
      />

      <Contact />
    </>
  );
};

export default ContactPage;
