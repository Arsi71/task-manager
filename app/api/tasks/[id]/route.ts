import { connectDB } from "@/app/lib/db";
import Task from "@/app/models/Task";
import { verifyToken } from "@/app/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = verifyToken(req);
    const { id } = await params;
    const body = await req.json();

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: user.id },
      body,
      { new: true }
    );

    if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
    return Response.json(task);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = verifyToken(req);
    const { id } = await params;

    const task = await Task.findOneAndDelete({ _id: id, userId: user.id });
    if (!task) return Response.json({ error: "Task not found" }, { status: 404 });

    return Response.json({ message: "Deleted" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
