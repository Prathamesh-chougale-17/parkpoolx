import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/db/clientpromise";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("parkpoolx");
    const collection = db.collection("control-panel");

    // Fetch all items from the collection
    const items = await collection.find({}).toArray();

    // Separate items into general settings and parking slots
    const generalItems = items.filter((item) => item.type === "general");
    const parkingSlots = items.filter((item) => item.type === "parking-slot");

    return NextResponse.json({ generalItems, parkingSlots });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch control items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate the incoming data
    if (!data.key || !data.value || !data.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("parkpoolx");
    const collection = db.collection("control-panel");

    // Check if key already exists for the given type
    const existing = await collection.findOne({
      key: data.key,
      type: data.type,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Key already exists" },
        { status: 400 }
      );
    }

    // Insert the new item
    const result = await collection.insertOne(data);
    const insertedItem = {
      ...data,
      _id: result.insertedId.toString(),
    };

    return NextResponse.json(insertedItem, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create control item" },
      { status: 500 }
    );
  }
}
