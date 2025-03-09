"use client";
import React, { useState, useEffect } from "react";
import {
  getProviderRideRequests,
  updateRideRequestStatus,
  setProviderRoute,
  Location,
} from "@/actions/carpool-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Car, Check, MapPin, X, Map as MapIcon } from "lucide-react";
import { RideRequest } from "@/actions/carpool-actions";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dynamically import the map component to avoid SSR issues
const ProviderRouteMap = dynamic(
  () =>
    import("@/components/car-pooling/leaflet-components").then(
      (mod) => mod.ProviderRouteMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] border rounded-md bg-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

export default function CarpoolProvider() {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RideRequest | null>(
    null
  );
  const [isViewingMap, setIsViewingMap] = useState(false);
  const [providerRoute, setProviderRoute] = useState<{
    startLocation?: Location;
    endLocation?: Location;
    route?: Location[];
  }>({});

  useEffect(() => {
    async function fetchRequests() {
      try {
        const result = await getProviderRideRequests();
        if (result.requests) {
          setRequests(result.requests as RideRequest[]);

          // Get the first accepted request location for route display
          const acceptedRequests = result.requests.filter(
            (req) => req.status === "accepted"
          );

          if (result.providerData) {
            // Assuming providerData contains route information
            const { startLocation, endLocation, route } = result.providerData;
            setProviderRoute({
              startLocation,
              endLocation,
              route,
            });
          }
        } else if (result.error) {
          console.error(result.error);
        }
      } catch (error) {
        console.error("Error fetching ride requests:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, []);

  async function handleAccept(requestId: string) {
    try {
      await updateRideRequestStatus(requestId, "accepted");
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === requestId ? { ...req, status: "accepted" } : req
        )
      );
    } catch (error) {
      console.error("Error accepting ride request:", error);
    }
  }

  async function handleReject(requestId: string) {
    try {
      await updateRideRequestStatus(requestId, "rejected");
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === requestId ? { ...req, status: "rejected" } : req
        )
      );
    } catch (error) {
      console.error("Error rejecting ride request:", error);
    }
  }

  function handleViewLocation(request: RideRequest) {
    setSelectedRequest(request);
    setIsViewingMap(true);
  }

  // Get passenger locations from accepted requests
  const passengerLocations = requests
    .filter((req) => req.status === "accepted")
    .map((req) => req.location);

  // Add this helper function inside the component
  function formatLocation(location?: Location): string {
    if (!location) return "Unknown location";
    return (
      location.address ||
      `Location at ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
    );
  }

  return (
    <>
      <Tabs defaultValue="requests">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Ride Requests</TabsTrigger>
          <TabsTrigger value="route">Your Route</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Ride Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <RideRequestsList
                requests={requests}
                onAccept={handleAccept}
                onReject={handleReject}
                onViewLocation={handleViewLocation}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="route">
          <Card>
            <CardHeader>
              <CardTitle>Your Carpool Route</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ProviderRouteMap
                  startLocation={providerRoute.startLocation}
                  endLocation={providerRoute.endLocation}
                  route={providerRoute.route}
                  passengerLocations={passengerLocations}
                />

                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">
                    Passenger Pickup Points
                  </h3>
                  {passengerLocations.length > 0 ? (
                    <div className="space-y-2">
                      {passengerLocations.map((loc, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 bg-muted/50 p-3 rounded-md"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground mt-2" />
                          <span>
                            View on Google Maps{" "}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="link"
                                className="cursor-pointer"
                                size="sm"
                              >
                                View
                              </Button>
                            </a>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No passengers added to your route yet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog to show request location on map */}
      <Dialog open={isViewingMap} onOpenChange={setIsViewingMap}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.seekerDetails?.name}'s Location
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {selectedRequest && (
              <div className="space-y-4">
                <ProviderRouteMap
                  startLocation={providerRoute.startLocation}
                  endLocation={providerRoute.endLocation}
                  route={providerRoute.route}
                  passengerLocations={[selectedRequest.location]}
                />
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{formatLocation(selectedRequest.location)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Component to display ride requests
function RideRequestsList({
  requests,
  onAccept,
  onReject,
  onViewLocation,
  loading,
}: {
  requests: RideRequest[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onViewLocation: (request: RideRequest) => void;
  loading: boolean;
}) {
  if (loading) {
    return <div className="text-center py-8">Loading ride requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <Car className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-medium">No ride requests yet</h3>
        <p className="text-sm text-muted-foreground mt-2">
          When someone requests to join your carpool, they will appear here
        </p>
      </div>
    );
  }

  const pendingRequests = requests.filter((req) => req.status === "pending");
  const otherRequests = requests.filter((req) => req.status !== "pending");

  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Pending Requests</h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/50 p-4 rounded-lg border gap-4"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {request.seekerDetails?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.seekerDetails?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.seekerDetails?.email}
                    </p>
                    {request.message && (
                      <p className="text-sm mt-1 italic">
                        &quot;{request.message}&quot;
                      </p>
                    )}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs flex items-center mt-1"
                      onClick={() => onViewLocation(request)}
                    >
                      <MapIcon className="h-3 w-3 mr-1" />
                      View pickup location
                    </Button>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3 sm:mt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(request._id)}
                    className="flex-1 sm:flex-none"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAccept(request._id)}
                    className="flex-1 sm:flex-none"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Past Requests</h3>
          <div className="space-y-2">
            {otherRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {request.seekerDetails?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {request.seekerDetails?.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          request.status === "accepted"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {request.status === "accepted"
                          ? "Accepted"
                          : "Rejected"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {request.status === "accepted" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewLocation(request)}
                  >
                    <MapIcon className="h-4 w-4 mr-1" />
                    View Location
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
