import { User } from "@/services/user";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json("Missing credentials", { status: 400 });
    }
    const user = await User.verifyCredentials(email, password);
    if (!user) {
      return NextResponse.json("Invalid credentials", { status: 401 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      "An error occurred during login. Please try again."
    );
  }
}
