"use server";

import { z } from "zod";
import clientPromise from "@/db/clientpromise";
import { auth } from "@/auth";

// Form schema using zod
const parkingFormSchema = z
  .object({
    departTimeFromHome: z
      .string({
        required_error: "Please select an arrival time.",
      })
      .min(1, "Please select an arrival time."),
    departureTimeFromOffice: z
      .string({
        required_error: "Please select a departure time.",
      })
      .min(1, "Please select a departure time."),
    carpoolOffer: z
      .string({
        required_error:
          "Please indicate if you'd like to offer a carpool ride.",
      })
      .min(1, "Please select an option."),
    seatsAvailable: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.carpoolOffer === "yes") {
        const seats = data.seatsAvailable;
        if (!seats || seats === "") return false;
        const numSeats = parseInt(seats, 10);
        return !isNaN(numSeats) && numSeats > 0;
      }
      return true;
    },
    {
      message: "Please enter a valid number of seats greater than 0.",
      path: ["seatsAvailable"],
    }
  )
  .refine(
    (data) => {
      if (data.departTimeFromHome && data.departureTimeFromOffice) {
        return data.departureTimeFromOffice > data.departTimeFromHome;
      }
      return true;
    },
    {
      message: "Departure time must be after arrival time.",
      path: ["departureTimeFromOffice"],
    }
  );

type ParkingFormValues = z.infer<typeof parkingFormSchema>;

export async function submitParkingRequest(data: ParkingFormValues) {
  try {
    // Validate the data
    const validatedData = parkingFormSchema.parse(data);
    const User = await auth();
    if (!User) {
      return {
        success: false,
        message: "User not authenticated. Please log in to continue.",
      };
    }
    // Connect to the database
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    // Check if the user has already booked a parking slot for the day
    const existingRequest = await db.collection("parkingRequests").findOne({
      userId: User.user.id,
    });

    if (existingRequest) {
      return {
        success: false,
        message: "You have already requested a parking slot.",
      };
    }
    // Add timestamp and status to the data
    const documentToInsert = {
      ...validatedData,
      userId: User.user.id,
      seatsAvailable:
        validatedData.seatsAvailable !== ""
          ? Number(validatedData.seatsAvailable)
          : 0,
      createdAt: new Date(),
      status: "pending", // Default status for new requests
    };

    // Insert the data into the parkingRequests collection
    await db.collection("parkingRequests").insertOne(documentToInsert);

    return { success: true, message: "Parking slot requested successfully!" };
  } catch (error) {
    console.error("Error submitting parking request:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed",
        errors: error.errors,
      };
    }

    return {
      success: false,
      message: "Failed to request parking slot. Please try again.",
    };
  }
}
