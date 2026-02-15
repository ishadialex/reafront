"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in react-leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper to re-center the map when coords change
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

interface PropertyMapProps {
  title: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  image?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string; // location string used for geocoding
}

export default function PropertyMap({
  title,
  price,
  bedrooms,
  bathrooms,
  image,
  latitude,
  longitude,
  locationName,
}: PropertyMapProps) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null
  );
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Geocode whenever locationName changes and we don't have explicit coords
  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCoords({ lat: latitude, lng: longitude });
      return;
    }
    if (!locationName) return;

    let cancelled = false;
    setGeocoding(true);

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      })
      .catch(() => {/* silently fail */})
      .finally(() => { if (!cancelled) setGeocoding(false); });

    return () => { cancelled = true; };
  }, [locationName, latitude, longitude]);

  if (!mounted) {
    return (
      <div className="h-[400px] w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
    );
  }

  if (geocoding || !coords) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        <p className="text-sm text-body-color dark:text-body-color-dark">
          {geocoding ? "Loading map…" : "Location unavailable"}
        </p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-2xl shadow-lg">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <MapRecenter lat={coords.lat} lng={coords.lng} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coords.lat, coords.lng]} icon={icon}>
          <Popup>
            <div className="min-w-[200px]">
              {image && (
                <img
                  src={image}
                  alt={title}
                  className="mb-2 h-24 w-full rounded object-cover"
                />
              )}
              <h3 className="mb-1 font-bold text-black">{title}</h3>
              <p className="mb-2 text-lg font-bold text-primary">{price}</p>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>{bedrooms} BD</span>
                <span>{bathrooms} BA</span>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
