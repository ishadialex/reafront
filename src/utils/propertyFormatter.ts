/**
 * Property formatting utilities for consistent API response transformation
 */

// API response types
export interface ApiPropertyResponse {
  id: number;
  title?: string;
  name?: string;
  price?: string;
  minInvestment?: number;
  description?: string;
  imageUrl?: string;
  images?: string[];
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  status?: string;
  location?: string;
  address?: string;
  area?: string;
  size?: string;
  type?: string;
  propertyType?: string;
  lotSize?: string;
  rooms?: number;
  customId?: string;
  available?: string;
  floors?: number;
  features?: PropertyFeatures;
  latitude?: number;
  longitude?: number;
  expectedROI?: number;
}

export interface PropertyFeatures {
  intercom?: string[];
  interiorDetails?: string[];
  outdoorDetails?: string[];
  utilities?: string[];
  otherFeatures?: string[];
}

export interface FormattedProperty {
  id: number;
  title: string;
  price: string;
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  parking: number;
  status: string;
  minInvestment?: number;
  expectedROI?: number;
  imageUrl?: string;
}

export interface FormattedPropertyDetails extends FormattedProperty {
  location: string;
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

// Default fallback images
const FALLBACK_IMAGES = [
  "/images/how-it-works/property-1.jpg",
  "/images/how-it-works/property-2.jpg",
  "/images/how-it-works/property-3.jpg",
];

/**
 * Helper function to extract images from API property data
 */
function extractImages(apiProperty: ApiPropertyResponse): string[] {
  if (apiProperty.imageUrl) {
    return [apiProperty.imageUrl];
  }
  
  if (apiProperty.images && Array.isArray(apiProperty.images) && apiProperty.images.length > 0) {
    return apiProperty.images;
  }
  
  return FALLBACK_IMAGES;
}

/**
 * Format basic property data from API response
 */
export function formatPropertyData(apiProperty: ApiPropertyResponse): FormattedProperty {
  const images = extractImages(apiProperty);

  return {
    id: apiProperty.id,
    title: apiProperty.title || apiProperty.name || "Property",
    price: apiProperty.price || (apiProperty.minInvestment ? `$${apiProperty.minInvestment.toLocaleString()}` : "$0"),
    description: apiProperty.description || "Investment property opportunity",
    images: images,
    bedrooms: apiProperty.bedrooms || 0,
    bathrooms: apiProperty.bathrooms || 0,
    parking: apiProperty.parking || 0,
    status: apiProperty.status || "Available",
    minInvestment: apiProperty.minInvestment,
    expectedROI: apiProperty.expectedROI,
    imageUrl: apiProperty.imageUrl,
  };
}

/**
 * Format detailed property data from API response (for property details page)
 */
export function formatPropertyDetails(apiProperty: ApiPropertyResponse): FormattedPropertyDetails {
  const baseProperty = formatPropertyData(apiProperty);

  return {
    ...baseProperty,
    location: apiProperty.location || apiProperty.address || "Location not specified",
    area: apiProperty.area || apiProperty.size || "N/A",
    type: apiProperty.type || apiProperty.propertyType || "Property",
    lotSize: apiProperty.lotSize,
    rooms: apiProperty.rooms || apiProperty.bedrooms,
    customId: apiProperty.customId || String(apiProperty.id),
    available: apiProperty.available || "Yes",
    floors: apiProperty.floors || 1,
    features: apiProperty.features,
    latitude: apiProperty.latitude || 40.7128,
    longitude: apiProperty.longitude || -74.0060,
  };
}
