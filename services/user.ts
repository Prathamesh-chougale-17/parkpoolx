import { compare } from "bcryptjs";
import clientPromise from "@/db/clientpromise";
import { ObjectId } from "mongodb";

export class User {
  /**
   * Find a user by email
   */
  static async findByEmail(email: string) {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_COLLECTION);

    const user = await db.collection("users").findOne({ email });
    return user;
  }

  /**
   * Find a user by ID
   */
  static async findById(id: string) {
    try {
      const client = await clientPromise;
      const db = client.db(process.env.DATABASE_COLLECTION);

      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(id) });
      return user;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      return null;
    }
  }

  /**
   * Verify user credentials
   */
  static async verifyCredentials(email: string, password: string) {
    const user = await this.findByEmail(email);

    if (!user) return null;

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) return null;

    // Return user without password
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || "user",
    };
  }
}
