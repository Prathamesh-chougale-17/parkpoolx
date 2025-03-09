"use server";

import { auth } from "@/auth";
import clientPromise from "@/db/clientpromise";
import { ObjectId } from "mongodb";

export interface ParkingRequest {
  _id: ObjectId;
  userId: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  slotNumber?: string;
  createdAt: Date;
  userDetails?: {
    name?: string;
    email?: string;
  };
}

export async function getUserAllocationStatus() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);
    const userRequest = await db.collection("parkingRequests").findOne(
      {
        userId: session.user.id,
      },
      {
        sort: { createdAt: -1 },
      }
    );

    if (!userRequest) {
      return { status: "not_found" };
    }

    return {
      status: userRequest.status,
      slotNumber: userRequest.slotNumber,
    };
  } catch (error) {
    console.error("Error fetching user allocation status:", error);
    return { error: "Failed to fetch allocation status" };
  }
}

export async function getAllAllocations(searchQuery = "") {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // First get user details that match the search query
    let matchingUserIds: string[] = [];

    let query = {};

    if (searchQuery === "") {
      const matchingUsers = await db.collection("users").find({}).toArray();
      matchingUserIds = matchingUsers.map((user) => user._id.toString());

      query = {
        status: "approved",
        userId: { $in: matchingUserIds },
      };
    } else {
      const matchingUsers = await db
        .collection("users")
        .find({
          name: { $regex: searchQuery, $options: "i" },
        })
        .toArray();

      matchingUserIds = matchingUsers.map((user) => user._id.toString());
      query = {
        status: "approved",
        ...(searchQuery && matchingUserIds.length > 0
          ? { userId: { $in: matchingUserIds } }
          : {
              name: { $regex: searchQuery, $options: "i" },
              email: { $regex: searchQuery, $options: "i" },
            }),
      };
    }

    // Prepare the query for parking requests

    const allocations = await db
      .collection("parkingRequests")
      .find(query)
      .toArray();

    // Get additional user details from users collection
    const enhancedAllocations = await Promise.all(
      allocations.map(async (allocation) => {
        const userDetails = await db
          .collection("users")
          .findOne(
            { _id: new ObjectId(allocation.userId.toString()) },
            { projection: { name: 1, email: 1 } }
          );

        return {
          ...allocation,
          userDetails: userDetails,
        };
      })
    );

    return { allocations: enhancedAllocations };
  } catch (error) {
    console.error("Error fetching allocations:", error);
    return { error: "Failed to fetch allocations" };
  }
}
