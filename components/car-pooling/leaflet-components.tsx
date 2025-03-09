"use client";

import { useState, useEffect } from "react";
import { Location } from "@/actions/carpool-actions";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon issues
const DefaultIcon = L.icon({
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Make sure this runs only on client side
if (typeof window !== "undefined") {
  L.Marker.prototype.options.icon = DefaultIcon;
}

// Map component that handles location selection
function LocationMarker({
  onLocationSelect,
}: {
  onLocationSelect: (location: Location) => void;
}) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({
        lat,
        lng,
      });
    },
  });

  map.locate();

  return null;
}

// Component for selecting a location on the map
function LocationPicker({
  location,
  onLocationSelect,
}: {
  location: Location | null;
  onLocationSelect: (location: Location) => void;
}) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]); // Default to London

  useEffect(() => {
    // Use browser geolocation to center the map if no location is set
    if (!location && typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else if (location) {
      setMapCenter([location.lat, location.lng]);
    }
  }, [location]);

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="h-[300px]">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {location && (
            <Marker position={[location.lat, location.lng]}>
              <Popup>Your location</Popup>
            </Marker>
          )}

          <LocationMarker onLocationSelect={onLocationSelect} />
        </MapContainer>
      </div>

      <div className="bg-muted/50 p-3 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {location ? (
            <span>
              {location.address ||
                `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Click on the map to set your location
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Export the components
export const LeafletComponents = ({
  location,
  onLocationSelect,
}: {
  location: Location | null;
  onLocationSelect: (location: Location) => void;
}) => {
  return (
    <LocationPicker location={location} onLocationSelect={onLocationSelect} />
  );
};

// Import MapPin for the location picker
import { MapPin } from "lucide-react";
