import { connectDB } from "@/app/lib/db";
import Task from "@/app/models/Task";
import { verifyToken } from "@/app/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = verifyToken(req);
    const tasks = await Task.find({ userId: user.id }).sort({ createdAt: -1 });
    return Response.json(tasks);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = verifyToken(req);
    const body = await req.json();

    if (!body.title)
      return Response.json({ error: "Title is required" }, { status: 400 });

    const task = await Task.create({ ...body, userId: user.id });
    return Response.json(task, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
