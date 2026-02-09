"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the map component with SSR disabled
const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
  ),
});

// This would typically come from a database or API
// For now, we'll use the same data structure as the listings page
interface PropertyFeatures {
  intercom?: string[];
  interiorDetails?: string[];
  outdoorDetails?: string[];
  utilities?: string[];
  otherFeatures?: string[];
}

interface Property {
  id: number;
  title: string;
  price: string;
  location: string;
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  parking: number;
  status: string;
  area: string;
  type: string;
  lotSize?: string;
  rooms?: number;
  customId?: string;
  available?: string;
  floors?: number;
  features?: PropertyFeatures;
  latitude?: number;
  longitude?: number;
}

// Mock data - in a real app, this would be fetched based on the ID
const propertyData: Record<number, Property> = {
  1: {
    id: 1,
    title: "Cycladic home in Fira, Greece",
    price: "$25,000",
    location: "Fira, Santorini, Greece",
    description: "Exclusively Marketed by Pam Golding Properties\n\nWelcome to this beautifully designed 4-bedroom home in the sought-after Olijvenhof Estate, Somerset West. Nestled near award-winning wine farms and scenic cycling and walking routes, this home offers the perfect balance of modern elegance and tranquil living.\n\nStep inside to an open-plan living area where Engineered Oak flooring creates a seamless and minimalistic atmosphere. A wood-burning fireplace adds warmth to the living room, which flows effortlessly into the kitchen and dining area—ideal for entertaining.\n\nThe kitchen, a sophisticated blend of wood and marble finishes, is both stylish and functional, with a separate scullery leading to a double garage with direct access. A walk in pantry is a welcome extra feature in this already immaculate work space.\n\nThe home boasts four spacious bedrooms, two of which are en-suite. The main suite is a true retreat, complete with a wood-burning fireplace and a luxurious marble-finished bathroom.\n\nEnjoy year-round outdoor living in the north-facing entertainment area, featuring breathtaking Helderberg Mountain views, a heated pool, and a modern covered braai area—perfect for relaxing or hosting guests.\n\nThis home is equipped with an Inverter system and solar.\n\nA harmonious blend of luxury, comfort, and convenience, this home is ready to welcome its new owners.\n\nContact us today to arrange a viewing!",
    images: [
      "/images/how-it-works/property-1.jpg",
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-3.jpg",
    ],
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    status: "For Rent",
    area: "2,500 sq ft",
    type: "Villa",
    lotSize: "503 ft²",
    rooms: 4,
    customId: "1658",
    available: "Yes",
    floors: 1,
    latitude: 36.4167,
    longitude: 25.4333,
    features: {
      intercom: ["Pergola"],
      interiorDetails: [
        "Bar",
        "Equipped Kitchen",
        "Fireplace",
        "Garage",
        "Gym",
        "Jacuzzi",
        "Kitchen island",
        "Laundry",
        "Media Room",
      ],
      outdoorDetails: [
        "Back yard",
        "Garage Attached",
        "Hot Bath",
        "Outdoor Pool",
        "Parking",
        "Terrace",
      ],
      utilities: ["Central Air", "Electricity", "Natural Gas", "Ventilation", "Water"],
      otherFeatures: [
        "Dining room",
        "Electric vehicle charging",
        "Outdoor pool",
        "Parking",
        "Security",
        "Sewer",
        "Smoke detectors",
        "Washing machine",
        "WiFi",
      ],
    },
  },
  2: {
    id: 2,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Downtown Area, City Center",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. This property offers excellent returns and is located in a prime area with high tourist traffic. The property comes fully furnished and ready for immediate rental.",
    images: [
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-1.jpg",
      "/images/how-it-works/property-3.jpg",
    ],
    bedrooms: 4,
    bathrooms: 2,
    parking: 1,
    status: "For Sale",
    area: "3,200 sq ft",
    type: "Apartment",
    latitude: 40.7580,
    longitude: -73.9855,
  },
  3: {
    id: 3,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Suburban District, North Side",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. Ideal for investors looking for steady rental income with minimal hassle. The property is well-maintained and comes with modern appliances.",
    images: [
      "/images/how-it-works/property-3.jpg",
      "/images/how-it-works/property-1.jpg",
      "/images/how-it-works/property-2.jpg",
    ],
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    status: "For Rent",
    area: "1,800 sq ft",
    type: "Condo",
    latitude: 42.0883,
    longitude: -87.6832,
  },
  4: {
    id: 4,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Waterfront Area, East Bay",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. This stunning waterfront property offers breathtaking views and luxury amenities. Perfect for high-end short-term rentals.",
    images: [
      "/images/how-it-works/property-1.jpg",
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-3.jpg",
    ],
    bedrooms: 5,
    bathrooms: 3,
    parking: 2,
    status: "For Sale",
    area: "4,500 sq ft",
    type: "Villa",
    latitude: 37.8088,
    longitude: -122.2775,
  },
  5: {
    id: 5,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Seattle Washintington, USA",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. Located in a charming historic district, this property combines old-world charm with modern conveniences. Excellent for cultural tourism.",
    images: [
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-3.jpg",
      "/images/how-it-works/property-1.jpg",
    ],
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    status: "For Rent",
    area: "2,200 sq ft",
    type: "Townhouse",
    latitude: 47.6062,
    longitude: -122.3321,
  },
  6: {
    id: 6,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Business District, Central Hub",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. Prime location for business travelers and tourists alike. Modern design with top-tier amenities and excellent connectivity.",
    images: [
      "/images/how-it-works/property-3.jpg",
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-1.jpg",
    ],
    bedrooms: 4,
    bathrooms: 3,
    parking: 1,
    status: "For Sale",
    area: "3,800 sq ft",
    type: "Penthouse",
    latitude: 40.7074,
    longitude: -74.0113,
  },
};

export default function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const propertyId = parseInt(id);
  const property = propertyData[propertyId];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (!property) {
    return (
      <section className="relative z-10 overflow-hidden bg-white pb-12 pt-36 dark:bg-gray-dark md:pb-20 lg:pb-28 lg:pt-40">
        <div className="container mx-auto text-center">
          <h1 className="mb-4 text-3xl font-bold text-black dark:text-white">
            Property Not Found
          </h1>
          <Link
            href="/listings"
            className="text-primary hover:underline"
          >
            Back to Listings
          </Link>
        </div>
      </section>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const selectImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <section className="relative z-10 bg-white pb-12 pt-36 dark:bg-gray-dark md:pb-20 lg:pb-28 lg:pt-40">
      <div className="container mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-body-color transition-colors hover:text-primary dark:text-body-color-dark dark:hover:text-primary"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back to Properties</span>
          </Link>
        </div>

        {/* Status Badges and Title */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg">
                {property.status}
              </span>
              <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg dark:bg-white dark:text-black">
                {property.type}
              </span>
            </div>

            {/* Price Badge */}
            <div className="rounded-xl bg-primary px-4 py-2 shadow-lg">
              <p className="text-xs font-medium text-white opacity-90">Starts from</p>
              <p className="text-lg font-bold text-white md:text-xl">{property.price}</p>
            </div>
          </div>

          <h1 className="mb-3 text-3xl font-bold text-black dark:text-white md:text-4xl lg:text-5xl">
            {property.title}
          </h1>
          <div className="flex items-start gap-2 text-body-color dark:text-body-color-dark">
            <svg
              className="mt-1 h-5 w-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-base md:text-lg">{property.location}</span>
          </div>
        </div>

        {/* Main Image Gallery - Full Width Hero Section */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-dark">
          {/* Large Image */}
          <div className="relative h-[400px] w-full overflow-hidden md:h-[500px] lg:h-[600px]">
            <Image
              src={property.images[currentImageIndex]}
              alt={`${property.title} - Image ${currentImageIndex + 1}`}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />

            {/* Navigation Arrows */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-110 hover:bg-white hover:shadow-xl active:scale-95 md:left-6 md:p-4"
                  aria-label="Previous image"
                >
                  <svg
                    className="h-6 w-6 text-black md:h-7 md:w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-110 hover:bg-white hover:shadow-xl active:scale-95 md:right-6 md:p-4"
                  aria-label="Next image"
                >
                  <svg
                    className="h-6 w-6 text-black md:h-7 md:w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 rounded-lg bg-black/70 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium text-white md:text-base">
                {currentImageIndex + 1} / {property.images.length}
              </span>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-700 md:p-6">
            <div className="flex gap-3 overflow-x-auto md:gap-4">
              {property.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => selectImage(index)}
                  className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 md:h-24 md:w-32 ${
                    currentImageIndex === index
                      ? "ring-4 ring-primary"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview and Contact Form Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Side - Overview and Description */}
          <div className="lg:col-span-2">
            {/* Overview Section */}
            <div className="mb-8 rounded-2xl bg-white p-4 shadow-lg dark:bg-gray-dark md:p-8">
              <h2 className="mb-3 text-lg font-bold text-black dark:text-white md:mb-6 md:text-2xl">
                Overview
              </h2>
              <div className="grid grid-cols-5 gap-2 md:gap-6">
                {/* Bedrooms */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:mb-3 md:h-14 md:w-14">
                    <svg
                      className="h-4 w-4 text-primary md:h-7 md:w-7"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <span className="mb-0.5 text-base font-bold text-black dark:text-white md:mb-1 md:text-2xl">
                    {property.bedrooms}
                  </span>
                  <span className="text-[10px] leading-tight text-body-color dark:text-body-color-dark md:text-sm">
                    Bedrooms
                  </span>
                </div>

                {/* Rooms */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:mb-3 md:h-14 md:w-14">
                    <svg
                      className="h-4 w-4 text-primary md:h-7 md:w-7"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <span className="mb-0.5 text-base font-bold text-black dark:text-white md:mb-1 md:text-2xl">
                    {property.bedrooms + 1}
                  </span>
                  <span className="text-[10px] leading-tight text-body-color dark:text-body-color-dark md:text-sm">
                    Rooms
                  </span>
                </div>

                {/* Bathrooms */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:mb-3 md:h-14 md:w-14">
                    <svg
                      className="h-4 w-4 text-primary md:h-7 md:w-7"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 00-3.903 4.879L2 14v2a2 2 0 002 2h12a2 2 0 002-2v-2l-2.097-5.121A4 4 0 0012 4H8zm2 5a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="mb-0.5 text-base font-bold text-black dark:text-white md:mb-1 md:text-2xl">
                    {property.bathrooms}
                  </span>
                  <span className="text-[10px] leading-tight text-body-color dark:text-body-color-dark md:text-sm">
                    Bathrooms
                  </span>
                </div>

                {/* Garages */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:mb-3 md:h-14 md:w-14">
                    <svg
                      className="h-4 w-4 text-primary md:h-7 md:w-7"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                    </svg>
                  </div>
                  <span className="mb-0.5 text-base font-bold text-black dark:text-white md:mb-1 md:text-2xl">
                    {property.parking}
                  </span>
                  <span className="text-[10px] leading-tight text-body-color dark:text-body-color-dark md:text-sm">
                    Garages
                  </span>
                </div>

                {/* Area */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:mb-3 md:h-14 md:w-14">
                    <svg
                      className="h-4 w-4 text-primary md:h-7 md:w-7"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <span className="mb-0.5 text-base font-bold text-black dark:text-white md:mb-1 md:text-2xl">
                    {property.area.split(" ")[0]}
                  </span>
                  <span className="text-[10px] leading-tight text-body-color dark:text-body-color-dark md:text-sm">
                    {property.area.split(" ").slice(1).join(" ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="rounded-2xl bg-white shadow-lg dark:bg-gray-dark">
              {/* Description Header */}
              <button
                onClick={() => setOpenSection(openSection === "description" ? null : "description")}
                className="flex w-full items-center justify-between p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 md:p-8"
              >
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  Description
                </h2>
                <svg
                  className={`h-6 w-6 text-black transition-transform duration-300 dark:text-white ${
                    openSection === "description" ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Description Content */}
              {openSection === "description" && (
                <div className="border-t border-gray-200 px-6 pb-6 dark:border-gray-700 md:px-8 md:pb-8">
                  <div className="space-y-4 pt-6 leading-relaxed text-body-color dark:text-body-color-dark">
                    {property.description.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="mt-8 rounded-2xl bg-white shadow-lg dark:bg-gray-dark">
              {/* Details Header */}
              <button
                onClick={() => setOpenSection(openSection === "details" ? null : "details")}
                className="flex w-full items-center justify-between p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 md:p-8"
              >
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  Details
                </h2>
                <svg
                  className={`h-6 w-6 text-black transition-transform duration-300 dark:text-white ${
                    openSection === "details" ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Details Content */}
              {openSection === "details" && (
                <div className="border-t border-gray-200 px-6 pb-6 dark:border-gray-700 md:px-8 md:pb-8">
                  <div className="grid gap-6 pt-6 md:grid-cols-2 md:gap-x-12 md:gap-y-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Property ID */}
                      <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                        <span className="font-semibold text-black dark:text-white">
                          Property Id:
                        </span>
                        <span className="text-body-color dark:text-body-color-dark">
                          {property.id}
                        </span>
                      </div>

                      {/* Property Lot Size */}
                      {property.lotSize && (
                        <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                          <span className="font-semibold text-black dark:text-white">
                            Property Lot Size:
                          </span>
                          <span className="text-body-color dark:text-body-color-dark">
                            {property.lotSize}
                          </span>
                        </div>
                      )}

                      {/* Bedrooms */}
                      <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                        <span className="font-semibold text-black dark:text-white">
                          Bedrooms:
                        </span>
                        <span className="text-body-color dark:text-body-color-dark">
                          {property.bedrooms}
                        </span>
                      </div>

                      {/* Custom ID */}
                      {property.customId && (
                        <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                          <span className="font-semibold text-black dark:text-white">
                            Custom ID:
                          </span>
                          <span className="text-body-color dark:text-body-color-dark">
                            {property.customId}
                          </span>
                        </div>
                      )}

                      {/* Available */}
                      {property.available && (
                        <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                          <span className="font-semibold text-black dark:text-white">
                            Available:
                          </span>
                          <span className="text-body-color dark:text-body-color-dark">
                            {property.available}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Price */}
                      <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                        <span className="font-semibold text-black dark:text-white">
                          Starts from:
                        </span>
                        <span className="text-body-color dark:text-body-color-dark">
                          {property.price}
                        </span>
                      </div>

                      {/* Rooms */}
                      {property.rooms && (
                        <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                          <span className="font-semibold text-black dark:text-white">
                            Rooms:
                          </span>
                          <span className="text-body-color dark:text-body-color-dark">
                            {property.rooms}
                          </span>
                        </div>
                      )}

                      {/* Bathrooms */}
                      <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                        <span className="font-semibold text-black dark:text-white">
                          Bathrooms:
                        </span>
                        <span className="text-body-color dark:text-body-color-dark">
                          {property.bathrooms}
                        </span>
                      </div>

                      {/* Parking Spaces */}
                      <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                        <span className="font-semibold text-black dark:text-white">
                          Parking Spaces:
                        </span>
                        <span className="text-body-color dark:text-body-color-dark">
                          {property.parking}
                        </span>
                      </div>

                      {/* Floors */}
                      {property.floors && (
                        <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                          <span className="font-semibold text-black dark:text-white">
                            Floors No:
                          </span>
                          <span className="text-body-color dark:text-body-color-dark">
                            {property.floors}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Features Section */}
            {property.features && (
              <div className="mt-8 rounded-2xl bg-white shadow-lg dark:bg-gray-dark">
                {/* Features Header */}
                <button
                  onClick={() => setOpenSection(openSection === "features" ? null : "features")}
                  className="flex w-full items-center justify-between p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 md:p-8"
                >
                  <h2 className="text-2xl font-bold text-black dark:text-white">
                    Features
                  </h2>
                  <svg
                    className={`h-6 w-6 text-black transition-transform duration-300 dark:text-white ${
                      openSection === "features" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Features Content */}
                {openSection === "features" && (
                  <div className="border-t border-gray-200 px-6 pb-6 dark:border-gray-700 md:px-8 md:pb-8">
                    <div className="space-y-6 pt-6">
                      {/* Intercom */}
                      {property.features.intercom && property.features.intercom.length > 0 && (
                        <div>
                          <h3 className="mb-3 text-lg font-semibold text-black dark:text-white">
                            Intercom
                          </h3>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {property.features.intercom.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <svg
                                  className="h-5 w-5 flex-shrink-0 text-primary"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-body-color dark:text-body-color-dark">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interior Details */}
                      {property.features.interiorDetails && property.features.interiorDetails.length > 0 && (
                        <div>
                          <h3 className="mb-3 text-lg font-semibold text-black dark:text-white">
                            Interior Details
                          </h3>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {property.features.interiorDetails.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <svg
                                  className="h-5 w-5 flex-shrink-0 text-primary"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-body-color dark:text-body-color-dark">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Outdoor Details */}
                      {property.features.outdoorDetails && property.features.outdoorDetails.length > 0 && (
                        <div>
                          <h3 className="mb-3 text-lg font-semibold text-black dark:text-white">
                            Outdoor Details
                          </h3>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {property.features.outdoorDetails.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <svg
                                  className="h-5 w-5 flex-shrink-0 text-primary"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-body-color dark:text-body-color-dark">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Utilities */}
                      {property.features.utilities && property.features.utilities.length > 0 && (
                        <div>
                          <h3 className="mb-3 text-lg font-semibold text-black dark:text-white">
                            Utilities
                          </h3>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {property.features.utilities.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <svg
                                  className="h-5 w-5 flex-shrink-0 text-primary"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-body-color dark:text-body-color-dark">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Features */}
                      {property.features.otherFeatures && property.features.otherFeatures.length > 0 && (
                        <div>
                          <h3 className="mb-3 text-lg font-semibold text-black dark:text-white">
                            Other Features
                          </h3>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {property.features.otherFeatures.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <svg
                                  className="h-5 w-5 flex-shrink-0 text-primary"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-body-color dark:text-body-color-dark">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Map Section */}
            <div className="mt-8 rounded-2xl bg-white shadow-lg dark:bg-gray-dark">
              {/* Map Header */}
              <div className="p-6 md:p-8">
                <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
                  Location
                </h2>
                <PropertyMap
                  title={property.title}
                  price={property.price}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  image={property.images[0]}
                  latitude={property.latitude}
                  longitude={property.longitude}
                />
                <p className="mt-4 flex items-start gap-2 text-body-color dark:text-body-color-dark">
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-base">{property.location}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 self-start">
              <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark md:p-8">
                {/* Agent Profile */}
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="mb-4 h-20 w-20 overflow-hidden rounded-full">
                    <Image
                      src="/images/team/member-1.jpg"
                      alt="Investment Analyst"
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="mb-1 text-xl font-bold text-black dark:text-white">
                    Addins Misna
                  </h3>
                  <p className="text-sm text-body-color dark:text-body-color-dark">
                    Investment Analyst
                  </p>
                </div>

                {/* Contact Form */}
                <form className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black placeholder-gray-500 transition focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black placeholder-gray-500 transition focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <input
                      type="tel"
                      placeholder="Your Phone"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black placeholder-gray-500 transition focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={4}
                      defaultValue={`I'm interested in [${property.title}]`}
                      className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black placeholder-gray-500 transition focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="ease-in-up shadow-btn hover:shadow-btn-hover w-full rounded-lg bg-black px-8 py-4 text-center text-base font-semibold text-white transition duration-300 hover:bg-black/90 dark:bg-primary dark:hover:bg-primary/90"
                  >
                    Send Email
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
