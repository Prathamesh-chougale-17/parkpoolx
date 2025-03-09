"use client";
import React, { useState, useEffect } from "react";
import {
  getProviderRideRequests,
  updateRideRequestStatus,
} from "@/actions/carpool-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Car, Check, MapPin, X } from "lucide-react";
import { RideRequest } from "@/actions/carpool-actions";

export default function CarpoolProvider() {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const result = await getProviderRideRequests();
        if (result.requests) {
          setRequests(result.requests as RideRequest[]);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ride Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <RideRequestsList
          requests={requests}
          onAccept={handleAccept}
          onReject={handleReject}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}

// Component to display ride requests
function RideRequestsList({
  requests,
  onAccept,
  onReject,
  loading,
}: {
  requests: RideRequest[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
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
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>
                        {request.location.address ||
                          `(${request.location.lat.toFixed(
                            5
                          )}, ${request.location.lng.toFixed(5)})`}
                      </span>
                    </div>
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
                    <div className="flex items-center">
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
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
