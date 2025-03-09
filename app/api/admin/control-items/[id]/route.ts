import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/db/clientpromise";
import { ObjectId } from "mongodb";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const data = await request.json();

    // Validate the incoming data
    if (!data.value) {
      return NextResponse.json(
        { error: "Missing value field" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("parkpoolx");
    const collection = db.collection("control-panel");

    // Update the item
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { value: data.value } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update control item" },
      { status: 500 }
    );
  }
}
