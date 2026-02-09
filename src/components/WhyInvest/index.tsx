"use client";

const WhyInvest = () => {
  // Icon 1: Leverage/Growth
  const LeverageIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <path
        d="M8 32L15 22L22 27L32 12"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 12H32V18"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="22" r="2" fill="currentColor" />
      <circle cx="22" cy="27" r="2" fill="currentColor" />
    </svg>
  );

  // Icon 2: Cash Flow/Money
  const CashFlowIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <rect x="6" y="14" width="28" height="16" rx="2" strokeWidth="2" />
      <circle cx="20" cy="22" r="4" strokeWidth="2" />
      <path d="M10 10L30 10" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6L28 6" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 22H34" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 22H4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  // Icon 3: Property Ownership/House with Key
  const OwnershipIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <path
        d="M6 18L20 6L34 18V32C34 33.1046 33.1046 34 32 34H8C6.89543 34 6 33.1046 6 32V18Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="22" r="3" strokeWidth="2" />
      <path d="M20 25V28" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  // Icon 4: Hands-Off/Automation
  const HandsOffIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <circle cx="20" cy="20" r="14" strokeWidth="2" />
      <path
        d="M12 20L17 25L28 14"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Icon 5: Diversification/Shield
  const DiversificationIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <path
        d="M20 6L8 11V19C8 26 12 31 20 34C28 31 32 26 32 19V11L20 6Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 20L18 24L26 16"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const benefits = [
    {
      icon: <LeverageIcon />,
      title: "Leverage That Multiplies Your Returns",
      description:
        "Rather than purchasing properties outright, we take a smarter approach strategically utilizing mortgages to acquire high-performing Airbnb units in top-tier locations. This means we can control valuable real estate assets with significantly less upfront capital. By funding just a fraction of the property's value, you gain access to the full earning potential of the asset. This financial leverage not only amplifies your return on investment but also enables diversification across multiple properties, accelerating wealth creation and passive income generation. It's a powerful way to scale your portfolio without overextending your capital.",
    },
    {
      icon: <CashFlowIcon />,
      title: "Steady Monthly Cash Flow",
      description:
        "Our strategically selected, fully furnished Airbnb units are located in high-demand travel destinations known for strong year-round occupancy. These properties are professionally managed to ensure exceptional guest experiences and maintain high booking rates. Each month, the income generated from bookings is first used to cover the mortgage, property maintenance, and operational expenses. The remaining profit is then distributed directly to you, offering a stable, predictable source of passive income month after month. This model ensures you benefit from both consistent cash flow and long-term property appreciation without the day-to-day responsibilities.",
    },
    {
      icon: <OwnershipIcon />,
      title: "Real Ownership, Real Wealth",
      description:
        "Unlike traditional rental income models that feel like subsidizing someone else's property, our strategy is rooted in true asset ownership. With our mortgage-backed Airbnb investment model, you're not just generating monthly cash flow. You're actively building equity in appreciating real estate. Each payment chips away at the mortgage balance, steadily increasing your share of ownership. Over time, this transforms short-term gains into lasting wealth, secured by a physical, income-generating asset. This is how you turn passive income into real financial freedom anchored in property, powered by smart investment.",
    },
    {
      icon: <HandsOffIcon />,
      title: "A Truly Hands-Off Investment Experience",
      description:
        "From the initial search to ongoing operations, we provide a seamless and fully managed investment solution. Our team identifies high-performing short-term rental markets, acquires premium properties, and secures favorable mortgage terms on your behalf. We furnish each unit with stylish, Airbnb-optimized interiors and launch professionally crafted listings designed to maximize visibility and occupancy. But we don't stop there. Our operations team handles every aspect of guest management, from round-the-clock communication and smart pricing algorithms to thorough cleaning and ongoing maintenance. This end-to-end service allows you to enjoy passive monthly income and long-term asset growth without ever needing to be involved in the day-to-day. It's a stress-free, time-free investment designed for modern investors who want results without responsibilities.",
    },
    {
      icon: <DiversificationIcon />,
      title: "Bonus Benefit: Diversification And Risk Mitigation",
      description:
        "Real estate has long been regarded as one of the most reliable and stable asset classes, known for its ability to preserve and grow wealth over time. When paired with the dynamic and adaptable nature of the short-term rental market, your investment benefits from both steady long-term value and agile income potential. This dual advantage not only diversifies your portfolio but also helps shield it from the unpredictability and sharp fluctuations often seen in traditional investments such as stocks and cryptocurrencies. It's a strategic way to balance growth with security.",
    },
  ];

  return (
    <section className="relative bg-gray-dark py-10 md:py-12 lg:py-16">
      {/* Background overlay image */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="h-full w-full bg-gradient-to-b from-black/50 to-black/50"></div>
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-[900px] text-center md:mb-16 lg:mb-20">
          <h2 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl sm:leading-tight md:text-[45px] md:leading-tight">
            Why Invest In Mortgage-Backed
            <br />
            Airbnb Arbitrage?
          </h2>
          <p className="text-base leading-relaxed text-body-color-dark md:text-lg">
            At Golden Units, we offer a smarter way to invest in real estate. One that combines the security of property ownership with the high returns of short-term rentals. Here's why our mortgage-backed Airbnb arbitrage model stands out as one of the most attractive investment opportunities today.
          </p>
        </div>

        {/* Benefits Cards Grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {/* First 3 cards - each takes 2 columns (1/3 of width) */}
          {benefits.slice(0, 3).map((benefit, index) => (
            <div
              key={index}
              className="rounded-lg bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-gray-dark dark:shadow-two sm:p-8 lg:col-span-2"
            >
              {/* Icon */}
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary text-primary">
                {benefit.icon}
              </div>

              {/* Title */}
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
                {benefit.description}
              </p>
            </div>
          ))}

          {/* Last 2 cards - each takes 3 columns (1/2 of width) */}
          {benefits.slice(3).map((benefit, index) => (
            <div
              key={index + 3}
              className="rounded-lg bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-gray-dark dark:shadow-two sm:p-8 lg:col-span-3"
            >
              {/* Icon */}
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary text-primary">
                {benefit.icon}
              </div>

              {/* Title */}
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyInvest;
