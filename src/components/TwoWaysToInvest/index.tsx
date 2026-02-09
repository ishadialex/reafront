"use client";

import Image from "next/image";
import Link from "next/link";
import { InvestmentOptionType } from "@/types/investmentOption";

interface TwoWaysToInvestProps {
  options: InvestmentOptionType[];
}

const TwoWaysToInvest = ({ options }: TwoWaysToInvestProps) => {
  if (options.length === 0) return null;

  return (
    <section className="relative bg-gray-2 py-10 dark:bg-bg-color-dark md:py-12 lg:py-16">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-[600px] text-center md:mb-16 lg:mb-20">
          <h2 className="mb-4 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight md:text-[45px] md:leading-tight">
            Two Ways to
            <br />
            Invest
          </h2>
        </div>

        {/* Investment Cards */}
        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
          {options.map((option, index) => (
            <div
              key={index}
              className="rounded-lg bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-gray-dark dark:shadow-two sm:p-8 md:p-10"
            >
              {/* Image */}
              <div className="mb-8 overflow-hidden rounded-lg">
                <div className="relative h-[200px] sm:h-[240px] md:h-[280px] w-full">
                  <Image
                    src={option.image}
                    alt={option.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="mb-4 text-2xl font-bold text-black dark:text-white">
                {option.title}
              </h3>

              {/* Investment Amount */}
              <div className="mb-6">
                <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                  Investments from
                </p>
                <p className="text-3xl font-bold text-black dark:text-white">
                  {option.minInvestment}
                </p>
              </div>

              {/* Description */}
              <p className="mb-8 text-base leading-relaxed text-body-color dark:text-body-color-dark">
                {option.description}
              </p>

              {/* CTA Button */}
              <Link
                href={option.link}
                className="inline-block rounded-full bg-black px-10 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                EXPLORE MORE
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TwoWaysToInvest;
