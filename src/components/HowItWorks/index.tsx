"use client";

import Image from "next/image";
import Link from "next/link";

const HowItWorks = () => {
  return (
    <section className="relative bg-gray-dark py-10 md:py-12 lg:py-16">
      <div className="container">
        <div className="-mx-4 flex flex-wrap items-center">
          {/* Left Content */}
          <div className="w-full px-4 lg:w-1/2">
            <div className="mb-12 lg:mb-0">
              <h2 className="mb-8 text-3xl font-bold leading-tight text-white sm:text-4xl sm:leading-tight md:text-[45px] md:leading-tight">
                How <br />
                It Works
              </h2>

              <div className="mb-8 text-base leading-relaxed text-body-color-dark md:text-lg">
                <p className="mb-6">
                  Most wealthy individuals build and grow their wealth through real estate and for good reason.
                  Studies show that 90% of today's millionaires got rich by investing in property. Why? Because
                  real estate is stable, profitable, and one of the smartest ways to grow long term wealth.
                </p>

                <p className="mb-6">
                  That's exactly why Golden Units was founded.
                </p>

                <p className="mb-6">
                  We're not just another real estate company. We specialize in helping everyday people, even
                  those with no prior experience, invest in high performing short term rental properties across the
                  globe.
                </p>

                <p className="mb-6">
                  Through our mortgage backed Airbnb arbitrage model, investors can get started with as little as
                  10% to 30% of the property value. We secure favorable mortgage terms to cover the rest, and
                  then fully furnish, list, and manage the property. The income from guests is used to pay down
                  the mortgage while investors earn monthly profits.
                </p>

                <p>
                  It's a simple, hands free way to tap into real estate wealth without needing to manage
                  anything yourself.
                </p>
              </div>

              <Link
                href="/about"
                className="inline-block rounded-full bg-white px-10 py-4 text-base font-semibold text-black duration-300 ease-in-out hover:bg-white/90"
              >
                READ MORE
              </Link>
            </div>
          </div>

          {/* Right Images Grid */}
          <div className="w-full px-4 lg:w-1/2">
            <div className="flex flex-wrap gap-4">
              {/* Large image on left */}
              <div className="w-full sm:w-[calc(50%-8px)]">
                <div className="relative h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden rounded-lg bg-gray-800">
                  <Image
                    src="/images/how-it-works/property-1.jpg"
                    alt="Modern kitchen and dining area"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Two stacked images on right */}
              <div className="flex w-full flex-col gap-4 sm:w-[calc(50%-8px)]">
                <div className="relative h-[140px] sm:h-[192px] md:h-[242px] overflow-hidden rounded-lg bg-gray-800">
                  <Image
                    src="/images/how-it-works/property-2.jpg"
                    alt="Luxury bedroom with city view"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="relative h-[140px] sm:h-[192px] md:h-[242px] overflow-hidden rounded-lg bg-gray-800">
                  <Image
                    src="/images/how-it-works/property-3.jpg"
                    alt="Modern living room"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
