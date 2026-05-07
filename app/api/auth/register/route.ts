import bcrypt from "bcrypt";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return Response.json({ error: "All fields required" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });

    return Response.json({ message: "User created" }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000)
      return Response.json({ error: "Email already in use" }, { status: 409 });
    console.error("[register error]", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
