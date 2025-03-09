"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  getAvailableCarpoolProviders,
  createRideRequest,
  getUserRideRequests,
  CarpoolProvider,
  RideRequest,
  Location,
} from "@/actions/carpool-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MapPin,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Dynamically import Leaflet components with SSR disabled
const LeafletComponents = dynamic(
  () =>
    import("@/components/car-pooling/leaflet-components").then(
      (mod) => mod.LeafletComponents
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] border rounded-md bg-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

export default function CarpoolSeeker({
  currentStatus,
}: {
  currentStatus: string;
}) {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [providers, setProviders] = useState<CarpoolProvider[]>([]);
  const [userRequests, setUserRequests] = useState<RideRequest[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<CarpoolProvider | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [activeTab, setActiveTab] = useState("find");

  useEffect(() => {
    // Get user's current location
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          fetchProviders(location);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get your location. Please enter it manually.");
          fetchProviders();
        }
      );
    } else {
      fetchProviders();
    }

    // Get user's ride requests
    fetchUserRequests();
  }, []);

  const fetchProviders = async (location?: Location) => {
    try {
      setProvidersLoading(true);
      const providersData = await getAvailableCarpoolProviders(location);
      setProviders(providersData as CarpoolProvider[]);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Failed to load available rides");
    } finally {
      setProvidersLoading(false);
    }
  };

  const fetchUserRequests = async () => {
    try {
      setRequestsLoading(true);
      const result = await getUserRideRequests();
      if (result.requests) {
        setUserRequests(result.requests as RideRequest[]);
      } else if (result.error) {
        console.error(result.error);
        toast.error("Failed to load your ride requests");
      }
    } catch (error) {
      console.error("Error fetching user requests:", error);
      toast.error("Failed to load your ride requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setUserLocation(location);
    fetchProviders(location);
  };

  const openRequestDialog = (provider: CarpoolProvider) => {
    setSelectedProvider(provider);
    setRequestDialogOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedProvider || !userLocation) {
      toast.error("Missing provider or location information");
      return;
    }

    try {
      const result = await createRideRequest({
        providerId: selectedProvider._id,
        location: userLocation,
        message: requestMessage,
      });

      if (result.success) {
        toast.success(result.message);
        setRequestDialogOpen(false);
        setRequestMessage("");
        fetchUserRequests(); // Refresh user requests
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error creating request:", error);
      toast.error("Failed to send ride request");
    }
  };

  // Check if the status is pending
  const isPending = currentStatus === "pending";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Find a Carpool Ride</CardTitle>
        <CardDescription>
          {isPending
            ? "While your parking request is pending, you can still look for carpool options"
            : "Discover available rides and request to join a carpool"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs
          defaultValue="find"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="px-6 pt-2">
            <TabsList className="mb-4">
              <TabsTrigger value="find">Find Rides</TabsTrigger>
              <TabsTrigger value="requests">Your Requests</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="find" className="space-y-6 p-6 pt-2">
            {isPending && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Parking Request Pending</p>
                  <p className="text-sm mt-1">
                    Your parking request is still being reviewed. You can still
                    search for carpooling options in the meantime.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Your Location</Label>
                <div className="mt-2">
                  <LeafletComponents
                    location={userLocation}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>
              </div>

              <div className="h-px bg-border my-6"></div>

              <div>
                <h3 className="text-lg font-medium mb-3">
                  Available Carpool Providers
                </h3>
                <ProvidersList
                  providers={providers}
                  loading={providersLoading}
                  onRequestRide={openRequestDialog}
                  userRequests={userRequests}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="p-6 pt-2">
            <RequestsList requests={userRequests} loading={requestsLoading} />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Ride Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request to Join Carpool</DialogTitle>
            <DialogDescription>
              Send a request to join this carpool. The driver will need to
              approve your request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedProvider && (
              <div className="flex items-center space-x-3 pb-2 border-b">
                <Avatar>
                  <AvatarFallback>
                    {selectedProvider.userDetails?.name?.[0] || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedProvider.userDetails?.name}
                  </p>
                  <div className="flex gap-1 items-center text-xs text-muted-foreground">
                    <Car className="h-3 w-3" />
                    <span>
                      {selectedProvider.seatsAvailable} seats available
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add any additional information for the driver..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Your Pickup Location</Label>
              {userLocation ? (
                <div className="bg-muted p-3 rounded-md flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {userLocation.address ||
                      `${userLocation.lat.toFixed(
                        5
                      )}, ${userLocation.lng.toFixed(5)}`}
                  </span>
                </div>
              ) : (
                <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
                  No location selected
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRequestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={!userLocation}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Component to display user's ride requests
function RequestsList({
  requests,
  loading,
}: {
  requests: RideRequest[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="text-center py-8">Loading your ride requests...</div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <Car className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-medium">No ride requests</h3>
        <p className="text-sm text-muted-foreground mt-2">
          You haven&apos;t made any ride requests yet
        </p>
      </div>
    );
  }

  // Group requests by status
  const pendingRequests = requests.filter((req) => req.status === "pending");
  const acceptedRequests = requests.filter((req) => req.status === "accepted");
  const rejectedRequests = requests.filter((req) => req.status === "rejected");

  return (
    <div className="space-y-6">
      {acceptedRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Confirmed Rides
          </h3>
          {acceptedRequests.map((request) => (
            <Card key={request._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">
                    {request.seekerDetails?.name}
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    Confirmed
                  </Badge>
                </div>
                <CardDescription>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Departs at {request.providerRequest?.departTimeFromHome}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="text-sm flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Your pickup location:</p>
                    <p className="text-muted-foreground">
                      {request.location.address ||
                        `(${request.location.lat.toFixed(
                          5
                        )}, ${request.location.lng.toFixed(5)})`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Requests
          </h3>
          {pendingRequests.map((request) => (
            <Card key={request._id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">
                    {request.seekerDetails?.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-800 border-amber-200"
                  >
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-2">
                  Request sent{" "}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
                {request.message && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm mt-2 italic">
                    &quot;{request.message}&quot;
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rejectedRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Declined Requests
          </h3>
          {rejectedRequests.map((request) => (
            <Card key={request._id} className="bg-muted/30">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">
                    {request.seekerDetails?.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-800 border-red-200"
                  >
                    Declined
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Request sent{" "}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Component for selecting a location on the map
// function LocationPicker({
//   location,
//   onLocationSelect,
// }: {
//   location: Location | null;
//   onLocationSelect: (location: Location) => void;
// }) {
//   const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]); // Default to London

//   useEffect(() => {
//     // Use browser geolocation to center the map if no location is set
//     if (!location && navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setMapCenter([position.coords.latitude, position.coords.longitude]);
//         },
//         (error) => {
//           console.error("Error getting location:", error);
//         }
//       );
//     } else if (location) {
//       setMapCenter([location.lat, location.lng]);
//     }
//   }, [location]);

//   return (
//     <div className="border rounded-md overflow-hidden">
//       <div className="h-[300px]">
//         <MapContainer
//           center={mapCenter}
//           zoom={13}
//           style={{ height: "100%", width: "100%" }}
//         >
//           <TileLayer
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           />

//           {location && (
//             <Marker position={[location.lat, location.lng]}>
//               <Popup>Your location</Popup>
//             </Marker>
//           )}

//           <LocationMarker onLocationSelect={onLocationSelect} />
//         </MapContainer>
//       </div>

//       <div className="bg-muted/50 p-3 text-sm">
//         <div className="flex items-center gap-2">
//           <MapPin className="h-4 w-4 text-muted-foreground" />
//           {location ? (
//             <span>
//               {location.address ||
//                 `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
//             </span>
//           ) : (
//             <span className="text-muted-foreground">
//               Click on the map to set your location
//             </span>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// Map component that handles location selection
// function LocationMarker({
//   onLocationSelect,
// }: {
//   onLocationSelect: (location: Location) => void;
// }) {
//   const map = useMapEvents({
//     click: (e) => {
//       const { lat, lng } = e.latlng;
//       onLocationSelect({
//         lat,
//         lng,
//       });
//     },
//   });

//   // Prevent the default map marker
//   map.dragging.disable();
//   map.touchZoom.disable();
//   map.doubleClickZoom.disable();
//   map.scrollWheelZoom.disable();

//   return null;
// }

// Component to display available providers
function ProvidersList({
  providers,
  loading,
  onRequestRide,
  userRequests,
}: {
  providers: CarpoolProvider[];
  loading: boolean;
  onRequestRide: (provider: CarpoolProvider) => void;
  userRequests: RideRequest[];
}) {
  if (loading) {
    return <div className="text-center py-8">Loading available rides...</div>;
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <Car className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-medium">No rides available</h3>
        <p className="text-sm text-muted-foreground mt-2">
          There are no carpool rides available at this time
        </p>
      </div>
    );
  }

  // Check if user has already requested a ride with each provider
  const hasRequestedFromProvider = (providerId: string) => {
    return userRequests.some(
      (req) =>
        req.providerId === providerId &&
        (req.status === "pending" || req.status === "accepted")
    );
  };

  return (
    <div className="space-y-4">
      {providers.map((provider) => {
        const hasRequested = hasRequestedFromProvider(provider._id);
        const request = userRequests.find(
          (req) => req.providerId === provider._id
        );

        return (
          <Card key={provider._id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {provider.userDetails?.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Arrives at {provider.departTimeFromHome}, Departs at{" "}
                {provider.departureTimeFromOffice}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline">
                      {provider.seatsAvailable} seats
                    </Badge>
                    {hasRequested && request?.status === "pending" && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200"
                      >
                        Request Pending
                      </Badge>
                    )}
                    {hasRequested && request?.status === "accepted" && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Request Accepted
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 border-t flex justify-end py-3">
              <Button
                variant={hasRequested ? "outline" : "default"}
                disabled={hasRequested}
                onClick={() => onRequestRide(provider)}
              >
                {hasRequested
                  ? request?.status === "accepted"
                    ? "Ride Confirmed"
                    : "Request Sent"
                  : "Request Ride"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
