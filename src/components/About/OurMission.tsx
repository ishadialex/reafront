import Image from "next/image";

const OurMission = () => {
  return (
    <section className="bg-white py-16 dark:bg-bg-color-dark md:py-20 lg:py-28">
      <div className="container">
        {/* Top Section - Two Columns */}
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="flex flex-wrap items-center gap-8 lg:gap-12">
          {/* Left Column - Text Content */}
          <div className="w-full lg:w-[calc(50%-1.5rem)]">
            <div className="mb-12 lg:mb-0">
              <p className="mb-4 text-sm uppercase tracking-wide text-body-color dark:text-body-color-dark">
                Our Mission
              </p>
              <h2 className="mb-8 text-3xl font-bold !leading-tight text-black dark:text-white sm:text-4xl md:text-[45px] lg:text-[42px] xl:text-[45px]">
                Capitalizing on <span className="text-primary">prime opportunities</span> within the Airbnb Arbitrage system
              </h2>

              <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
                At ALVARADO Associates, we are committed to revolutionizing the landscape of real estate investment through innovative Airbnb arbitrage solutions. With a mission to empower investors and unlock the full potential of short-term rentals, we offer a comprehensive platform designed to streamline the process of property acquisition, management, and revenue optimization.
              </p>

              <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
                Our journey began with a vision to democratize real estate investing, providing individuals and businesses with access to lucrative opportunities traditionally reserved for large-scale investors. Recognizing the untapped potential of short-term rentals in the sharing economy era, we set out to create a platform that bridges the gap between property owners, investors, and guests.
              </p>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="w-full lg:w-[calc(50%-1.5rem)] flex justify-center">
            <div className="relative w-full max-w-[394px] overflow-hidden rounded-lg" style={{ aspectRatio: '394/525' }}>
              <Image
                src="/images/about/about-mission.jpg"
                alt="Property building"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
        </div>

        {/* Bottom Section - Why Us */}
        {/* <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="mx-auto max-w-[800px]">
              <h2 className="mb-4 text-3xl font-bold !leading-tight text-black dark:text-white sm:text-4xl md:text-[45px] lg:text-[42px] xl:text-[45px]">
                What is Airbnb Arbitrage and why is Airbnb Arbitrage a gold mine, you ask?
              </h2>
              <h3 className="mb-8 text-2xl font-semibold text-black dark:text-white">
                Why Us?
              </h3>
              <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
                The greatest advantage lies in the fact that you can profit from property without having to purchase it. No hefty deposits or mortgages are necessary to begin! We're accustomed to the concept of major corporations managing assets rather than possessing them outright, resulting in highly lucrative enterprises.
              </p>
              <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
                Consider Uber, the leading taxi service globally, which doesn't own any vehicles.Or Facebook, the most prominent social media platform, which generates no content of its own.Similarly, Airbnb, the largest accommodation provider worldwide, doesn't own any real estate.
              </p>
              <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
                This strategy operates on the principle of control rather than ownership.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default OurMission;
