import { Suspense } from "react";
import Brands from "@/components/Brands";
import ScrollUp from "@/components/Common/ScrollUp";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import WhyInvest from "@/components/WhyInvest";
import TwoWaysToInvest from "@/components/TwoWaysToInvest";
import Team from "@/components/Team";
import Testimonials from "@/components/Testimonials";
import Video from "@/components/Video";
import InvestmentsSkeleton from "@/components/TwoWaysToInvest/InvestmentsSkeleton";
import TeamSkeleton from "@/components/Team/TeamSkeleton";
import TestimonialsSkeleton from "@/components/Testimonials/TestimonialsSkeleton";
import { Metadata } from "next";
import { getTeamMembers, getTestimonials, getInvestmentOptions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Free Next.js Template for Startup and SaaS",
  description: "This is Home for Startup Nextjs Template",
};

async function InvestmentsSection() {
  const options = await getInvestmentOptions();
  return <TwoWaysToInvest options={options} />;
}

async function TeamSection() {
  const members = await getTeamMembers();
  return <Team members={members} />;
}

async function TestimonialsSection() {
  const testimonials = await getTestimonials();
  return <Testimonials testimonials={testimonials} />;
}

export default function Home() {
  return (
    <>
      <ScrollUp />
      <Hero />
      <HowItWorks />
      <WhyInvest />
      <Suspense fallback={<InvestmentsSkeleton />}>
        <InvestmentsSection />
      </Suspense>
      <Suspense fallback={<TeamSkeleton />}>
        <TeamSection />
      </Suspense>
      <Video />
      <Brands />
      <Suspense fallback={<TestimonialsSkeleton />}>
        <TestimonialsSection />
      </Suspense>
    </>
  );
}
