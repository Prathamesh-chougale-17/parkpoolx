"use client";

import { useState, useEffect, useRef } from "react";
import { Location } from "@/actions/carpool-actions";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  Polyline,
} from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon issues - Remove shadow
const DefaultIcon = L.icon({
  iconUrl: "/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  // shadowUrl removed to eliminate shadow
});

const BlueIcon = L.icon({
  iconUrl: "/images/marker-icon-blue.png", // Using default marker from public folder
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const GreenIcon = L.icon({
  iconUrl: "/images/marker-icon-green.png", // Using default marker from public folder
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Make sure this runs only on client side
if (typeof window !== "undefined") {
  L.Marker.prototype.options.icon = DefaultIcon;
}

// Helper to format location display
const formatLocationDisplay = (location: Location): string => {
  if (location.address) return location.address;
  return `Location (${location.lat.toFixed(5)}, ${location.lng.toFixed(5)})`;
};

// Enhanced reverse geocoding function
const getAddressFromCoordinates = async (
  lat: number,
  lng: number
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch (error) {
    console.error("Error getting address:", error);
  }
  return `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
};

// Component that adjusts map bounds to include all markers
function MapBoundsController({ locations = [] }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    // Create bounds that include all locations
    const bounds = new L.LatLngBounds(
      locations.map((loc) => [loc.lat, loc.lng])
    );

    // Add some padding
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, locations]);

  return null;
}

// Component to handle map center changes
function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

// Map component that handles location selection
function LocationMarker({
  onLocationSelect,
}: {
  onLocationSelect: (location: Location) => void;
}) {
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      // Create a basic location object
      const location: Location = { lat, lng };

      // Get the address and set it
      location.address = await getAddressFromCoordinates(lat, lng);
      onLocationSelect(location);
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
  const [zoomLevel, setZoomLevel] = useState<number>(13);

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
      setZoomLevel(15); // Zoom in when location is selected
    }
  }, [location]);

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="h-[300px]">
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController center={mapCenter} zoom={zoomLevel} />

          {location && (
            <Marker position={[location.lat, location.lng]}>
              <Popup>{formatLocationDisplay(location)}</Popup>
            </Marker>
          )}

          <LocationMarker onLocationSelect={onLocationSelect} />
        </MapContainer>
      </div>

      <div className="bg-muted/50 p-3 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {location ? (
            <span>{formatLocationDisplay(location)}</span>
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

// Function to fetch realistic road routes using OSRM API
const fetchRoadRoute = async (
  points: Location[]
): Promise<[number, number][]> => {
  try {
    // OSRM API expects coordinates as lng,lat (not the usual lat,lng)
    const coordinates = points
      .map((point) => `${point.lng},${point.lat}`)
      .join(";");
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error("Route fetch failed");
    }

    const data = await response.json();
    if (!data.routes?.[0]?.geometry?.coordinates) {
      throw new Error("No route found");
    }

    // Convert from OSRM format [lng, lat] to Leaflet format [lat, lng]
    return data.routes[0].geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
    );
  } catch (error) {
    console.error("Error fetching road route:", error);
    // Fallback to straight lines
    return points.map((point) => [point.lat, point.lng]);
  }
};

// Optimized route function that now attempts to use road routes
const optimizeRoute = async (
  start: Location,
  end: Location,
  pickupPoints: Location[] = []
): Promise<{
  points: Location[];
  routePath: [number, number][];
}> => {
  if (pickupPoints.length === 0) {
    const route = [start, end];
    // Get the actual road route between start and end
    const routePath = await fetchRoadRoute(route);
    return { points: route, routePath };
  }

  // Simple greedy algorithm for route optimization
  let currentPoint = start;
  const route = [start];
  const unvisited = [...pickupPoints];

  // While there are unvisited pickup points
  while (unvisited.length > 0) {
    // Find the nearest unvisited point
    let nearestIdx = 0;
    let minDistance = calculateDistance(
      currentPoint.lat,
      currentPoint.lng,
      unvisited[0].lat,
      unvisited[0].lng
    );

    for (let i = 1; i < unvisited.length; i++) {
      const dist = calculateDistance(
        currentPoint.lat,
        currentPoint.lng,
        unvisited[i].lat,
        unvisited[i].lng
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    // Add the nearest point to our route
    currentPoint = unvisited[nearestIdx];
    route.push(currentPoint);

    // Remove from unvisited list
    unvisited.splice(nearestIdx, 1);
  }

  // Add the destination
  route.push(end);

  // Get the actual road route through all points
  const routePath = await fetchRoadRoute(route);
  return { points: route, routePath };
};

// Simple distance calculation using the Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Updated ProviderRouteMap component to use realistic routes
export const ProviderRouteMap = ({
  startLocation,
  endLocation,
  route,
  passengerLocations,
}: {
  startLocation?: Location;
  endLocation?: Location;
  route?: Location[];
  passengerLocations?: Location[];
}) => {
  // Collect all locations for bounds calculation
  const allLocations: Location[] = [];
  if (startLocation) allLocations.push(startLocation);
  if (endLocation) allLocations.push(endLocation);
  if (passengerLocations) allLocations.push(...passengerLocations);

  const [displayRoute, setDisplayRoute] = useState<Location[]>([]);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [totalDistance, setTotalDistance] = useState<number>(0);

  useEffect(() => {
    // Center on start location if available
    if (startLocation) {
      setMapCenter([startLocation.lat, startLocation.lng]);
    }

    // Create an optimized route if no explicit route is provided
    const loadRoute = async () => {
      if (route && route.length > 1) {
        setDisplayRoute(route);
        // Get road route for the provided route points
        const roadPath = await fetchRoadRoute(route);
        setRoutePath(roadPath);
        // Calculate the distance based on the fetched road route
        let distance = 0;
        for (let i = 0; i < roadPath.length - 1; i++) {
          distance += calculateDistance(
            roadPath[i][0],
            roadPath[i][1],
            roadPath[i + 1][0],
            roadPath[i + 1][1]
          );
        }
        setTotalDistance(distance);
      } else if (startLocation && endLocation) {
        const result = await optimizeRoute(
          startLocation,
          endLocation,
          passengerLocations
        );
        setDisplayRoute(result.points);
        setRoutePath(result.routePath);

        // Calculate total distance from the road path
        let distance = 0;
        for (let i = 0; i < result.routePath.length - 1; i++) {
          distance += calculateDistance(
            result.routePath[i][0],
            result.routePath[i][1],
            result.routePath[i + 1][0],
            result.routePath[i + 1][1]
          );
        }
        setTotalDistance(distance);
      }
    };

    loadRoute();
  }, [startLocation, endLocation, route, passengerLocations]);

  return (
    <div className="h-[400px] border rounded-md overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} zoom={zoomLevel} />

        {/* Add bounds controller to fit all markers */}
        {allLocations.length > 0 && (
          <MapBoundsController locations={allLocations} />
        )}

        {/* Start location */}
        {startLocation && (
          <Marker position={[startLocation.lat, startLocation.lng]}>
            <Popup>Start: {formatLocationDisplay(startLocation)}</Popup>
          </Marker>
        )}

        {/* End location */}
        {endLocation && (
          <Marker position={[endLocation.lat, endLocation.lng]} icon={BlueIcon}>
            <Popup>End: {formatLocationDisplay(endLocation)}</Popup>
          </Marker>
        )}

        {/* Passenger locations */}
        {passengerLocations &&
          passengerLocations.map((loc, idx) => (
            <Marker
              key={`passenger-${idx}`}
              position={[loc.lat, loc.lng]}
              icon={GreenIcon}
            >
              <Popup>Pickup: {formatLocationDisplay(loc)}</Popup>
            </Marker>
          ))}

        {/* Road route path */}
        {routePath.length > 1 && (
          <Polyline
            positions={routePath}
            color="blue"
            weight={3}
            opacity={0.7}
          />
        )}

        {/* Add markers for stops along the route for better visibility */}
        {displayRoute.length > 2 &&
          displayRoute.slice(1, -1).map((point, index) => (
            <Marker
              key={`route-stop-${index}`}
              position={[point.lat, point.lng]}
              icon={GreenIcon}
            >
              <Popup>
                Stop {index + 1}: {formatLocationDisplay(point)}
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {displayRoute.length > 2 && (
        <div className="bg-muted/50 p-2 text-xs">
          <p className="font-medium">Efficient route calculated</p>
          <p className="text-muted-foreground">
            {displayRoute.length - 2} pickup points • Total distance:{" "}
            {totalDistance.toFixed(1)} km
          </p>
        </div>
      )}
    </div>
  );
};

// Calculate the total distance of the route
const calculateTotalDistance = (route: Location[]): number => {
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += calculateDistance(
      route[i].lat,
      route[i].lng,
      route[i + 1].lat,
      route[i + 1].lng
    );
  }
  return totalDistance;
};

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
