"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

interface PropertyMapProps {
  title: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  image?: string;
  // You can add actual coordinates here
  // For now using default coordinates (you'll replace with actual property location)
  latitude?: number;
  longitude?: number;
}

export default function PropertyMap({
  title,
  price,
  bedrooms,
  bathrooms,
  image,
  latitude = -33.9249,
  longitude = 18.4241,
}: PropertyMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[400px] w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
    );
  }

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-2xl shadow-lg">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={icon}>
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
