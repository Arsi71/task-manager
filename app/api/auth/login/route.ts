import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password)
      return Response.json({ error: "Email and password required" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user)
      return Response.json({ error: "User not found" }, { status: 404 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return Response.json({ error: "Invalid password" }, { status: 401 });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    return Response.json({ token, name: user.name });
  } catch (e: unknown) {
    console.error("[login error]", e);
    if ((e as { code?: number }).code === 8000)
      return Response.json({ error: "Database permission error — check Atlas user roles" }, { status: 500 });
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
