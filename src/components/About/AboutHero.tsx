import Image from "next/image";

const AboutHero = () => {
  return (
    <section className="bg-white py-16 dark:bg-gray-dark md:py-20 lg:py-28">
      <div className="container">
        {/* Top Section - Centered Heading and Description */}
        <div className="mx-auto mb-16 max-w-[900px] text-center">
          <h1 className="mb-6 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-[45px]">
            About ALVARADO Associates
          </h1>
          <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg md:text-xl">
            With a mission to empower investors and unlock the full potential of short-term rentals, we offer a comprehensive platform designed to streamline the process of property acquisition, management, and revenue optimization.
          </p>
        </div>

        {/* Why Us Section */}
        <div className="mx-auto mb-16 max-w-[1100px] text-center">
          <p className="mb-4 text-sm uppercase tracking-wider text-body-color dark:text-body-color-dark">
            Why Us?
          </p>
          <h2 className="mb-8 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-[42px]">
            What is Airbnb Arbitrage and why is Airbnb Arbitrage a{" "}
            <span className="text-red-600">Gold Mine</span>, you ask?
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg">
            <p>
              The greatest advantage lies in the fact that you can profit from property without having to purchase it. No hefty deposits or mortgages are necessary to begin! We're accustomed to the concept of major corporations managing assets rather than possessing them outright, resulting in highly lucrative enterprises.
            </p>
            <p>
              Consider Uber, the leading taxi service globally, which doesn't own any vehicles. Or Facebook, the most prominent social media platform, which generates no content of its own. Similarly, Airbnb, the largest accommodation provider worldwide, doesn't own any real estate.
            </p>
            <p>
              This strategy operates on the principle of control rather than ownership.
            </p>
          </div>
        </div>

        {/* Property Image */}
        <div className="mx-auto max-w-[1200px]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src="/images/about/about-hero.jpg"
              alt="Modern luxury property"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
