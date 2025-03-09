"use server";

import { auth } from "@/auth";
import clientPromise from "@/db/clientpromise";
import { ObjectId } from "mongodb";
import { z } from "zod";

// Schema for location data
const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
});

// Schema for ride request
const rideRequestSchema = z.object({
  providerId: z.string(),
  location: locationSchema,
  message: z.string().optional(),
});

export type Location = z.infer<typeof locationSchema>;
export type CarpoolProvider = {
  _id: string;
  userId: string;
  userName: string;
  departTimeFromHome: string;
  departureTimeFromOffice: string;
  seatsAvailable: number;
  startLocation?: Location;
  endLocation?: Location;
  route?: Location[];
  userDetails?: {
    name?: string;
    email?: string;
  };
};

export type RideRequest = {
  _id: string;
  providerId: string;
  seekerId: string;
  location: Location;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  message?: string;
  seekerDetails?: {
    name?: string;
    email?: string;
  };
  providerRequest: {
    departTimeFromHome: string;
    departureTimeFromOffice: string;
  };
};

// Get the user's carpool status
export async function getUserCarpoolStatus() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    const userRequest = await db
      .collection("parkingRequests")
      .findOne({ userId: session.user.id }, { sort: { createdAt: -1 } });

    if (!userRequest) {
      return { status: "not_found" };
    }

    return {
      status: userRequest.status,
      data: userRequest,
    };
  } catch (error) {
    console.error("Error fetching user carpool status:", error);
    return { error: "Failed to fetch carpool status" };
  }
}

// Get available carpool providers
export async function getAvailableCarpoolProviders(userLocation?: Location) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Find providers (users with approved parking requests and carpoolOffer=yes)
    const providers = await db
      .collection("parkingRequests")
      .aggregate([
        {
          $match: {
            status: "approved",
            carpoolOffer: "yes",
            seatsAvailable: { $gt: 0 },
          },
        },
        {
          $addFields: {
            userId: { $toObjectId: "$userId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $project: {
            _id: { $toString: "$_id" },
            userId: { $toString: "$userId" },
            departTimeFromHome: 1,
            departureTimeFromOffice: 1,
            seatsAvailable: 1,
            startLocation: 1,
            endLocation: 1,
            route: 1,
            "userDetails.name": 1,
            "userDetails.email": 1,
          },
        },
      ])
      .toArray();
    console.log(providers);

    if (userLocation) {
      // Sort providers by proximity to user if location provided
      // This is a simplified proximity calculation - in a real app would use more sophisticated algorithms
      return providers.sort((a, b) => {
        if (!a.startLocation || !b.startLocation) return 0;

        const distA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.startLocation.lat,
          a.startLocation.lng
        );

        const distB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.startLocation.lat,
          b.startLocation.lng
        );

        return distA - distB;
      });
    }

    return providers;
  } catch (error) {
    console.error("Error fetching available carpool providers:", error);
    throw new Error("Failed to fetch carpool providers");
  }
}

// Create a ride request
export async function createRideRequest(
  requestData: z.infer<typeof rideRequestSchema>
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Validate the request data
    const validatedData = rideRequestSchema.parse(requestData);

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Check if the provider exists and has available seats
    const provider = await db.collection("parkingRequests").findOne({
      _id: new ObjectId(validatedData.providerId),
      status: "approved",
      carpoolOffer: "yes",
      seatsAvailable: { $gt: 0 },
    });

    if (!provider) {
      return { error: "Ride provider not found or has no available seats" };
    }

    // Check if user already has a pending request with this provider
    const existingRequest = await db.collection("carpool").findOne({
      providerId: validatedData.providerId,
      seekerId: session.user.id,
      status: "pending",
    });

    if (existingRequest) {
      return { error: "You already have a pending request with this provider" };
    }

    // Create the ride request
    const rideRequest = {
      providerId: validatedData.providerId,
      seekerId: session.user.id,
      location: validatedData.location,
      message: validatedData.message || "",
      status: "pending",
      createdAt: new Date(),
      seekerDetails: {
        name: session.user.name,
        email: session.user.email,
      },
      providerRequest: {
        departTimeFromHome: provider.departTimeFromHome,
        departureTimeFromOffice: provider.departureTimeFromOffice,
      },
    };

    const result = await db.collection("carpool").insertOne(rideRequest);

    return {
      success: true,
      message: "Ride request sent successfully",
      requestId: result.insertedId.toString(),
    };
  } catch (error) {
    console.error("Error creating ride request:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid request data", details: error.errors };
    }
    return { error: "Failed to create ride request" };
  }
}

// Get ride requests for provider
export async function getProviderRideRequests() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Get the user's parking request ID
    const parkingRequest = await db.collection("parkingRequests").findOne({
      userId: session.user.id,
      status: "approved",
    });

    if (!parkingRequest) {
      return { error: "You are not an approved carpool provider" };
    }

    // Get all ride requests for this provider
    const requests = await db
      .collection("carpool")
      .aggregate([
        {
          $match: {
            providerId: parkingRequest._id.toString(),
          },
        },
        {
          $addFields: {
            seekerId: { $toObjectId: "$seekerId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "seekerId",
            foreignField: "_id",
            as: "seekerDetails",
          },
        },
        { $unwind: "$seekerDetails" },
        {
          $project: {
            _id: { $toString: "$_id" },
            seekerId: { $toString: "$seekerId" },
            location: 1,
            status: 1,
            createdAt: 1,
            message: 1,
            "seekerDetails.name": 1,
            "seekerDetails.email": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    // Return the provider's route information along with requests
    return {
      requests,
      providerData: {
        startLocation: parkingRequest.startLocation,
        endLocation: parkingRequest.endLocation,
        route: parkingRequest.route || [],
      },
    };
  } catch (error) {
    console.error("Error fetching ride requests:", error);
    return { error: "Failed to fetch ride requests" };
  }
}

// Update ride request status (accept/reject)
export async function updateRideRequestStatus(
  requestId: string,
  status: "accepted" | "rejected"
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Get the user's parking request
    const parkingRequest = await db.collection("parkingRequests").findOne({
      userId: session.user.id,
      status: "approved",
    });

    if (!parkingRequest) {
      return { error: "You are not an approved carpool provider" };
    }

    // Find the ride request
    const rideRequest = await db.collection("carpool").findOne({
      _id: new ObjectId(requestId),
      providerId: parkingRequest._id.toString(),
    });

    if (!rideRequest) {
      return { error: "Ride request not found" };
    }

    // Update the request status
    await db
      .collection("carpool")
      .updateOne({ _id: new ObjectId(requestId) }, { $set: { status } });

    // If accepted:
    // 1. Decrement available seats
    // 2. Remove all other pending requests from this seeker
    if (status === "accepted") {
      // Decrement available seats
      await db
        .collection("parkingRequests")
        .updateOne(
          { _id: parkingRequest._id },
          { $inc: { seatsAvailable: -1 } }
        );

      // Remove other pending requests from this seeker
      await db.collection("carpool").deleteMany({
        seekerId: rideRequest.seekerId,
        _id: { $ne: new ObjectId(requestId) },
        status: "pending",
      });
    }

    return {
      success: true,
      message: `Ride request ${
        status === "accepted" ? "accepted" : "rejected"
      } successfully`,
    };
  } catch (error) {
    console.error("Error updating ride request:", error);
    return { error: "Failed to update ride request" };
  }
}

// Set provider route
export async function setProviderRoute(
  startLocation: Location,
  endLocation: Location,
  routePoints?: Location[]
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Update the user's parking request with route information
    await db.collection("parkingRequests").updateOne(
      { userId: session.user.id, status: "approved" },
      {
        $set: {
          startLocation,
          endLocation,
          route: routePoints || [],
        },
      }
    );

    return { success: true, message: "Route updated successfully" };
  } catch (error) {
    console.error("Error setting provider route:", error);
    return { error: "Failed to update route" };
  }
}

// Get user's ride requests
export async function getUserRideRequests() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Get all ride requests made by this user
    const requests = await db
      .collection("carpool")
      .aggregate([
        {
          $match: {
            seekerId: session.user.id,
          },
        },

        {
          $project: {
            _id: { $toString: "$_id" },
            providerId: { $toString: "$providerId" },
            location: 1,
            status: 1,
            createdAt: 1,
            message: 1,
            "seekerDetails.name": 1,
            "seekerDetails.email": 1,
            "providerRequest.departTimeFromHome": 1,
            "providerRequest.departureTimeFromOffice": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    // Check if there's an accepted request, then remove other pending requests
    const hasAccepted = requests.some((req) => req.status === "accepted");

    if (hasAccepted) {
      // Remove other pending requests if one is accepted
      await db.collection("carpool").deleteMany({
        seekerId: session.user.id,
        status: "pending",
      });

      // Filter out the pending requests from the response as well
      const filteredRequests = requests.filter(
        (req) => req.status !== "pending"
      );
      return { requests: filteredRequests };
    }

    return { requests };
  } catch (error) {
    console.error("Error fetching user ride requests:", error);
    return { error: "Failed to fetch ride requests" };
  }
}

// Helper function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lat2 - lat1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
