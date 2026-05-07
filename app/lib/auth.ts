import jwt from "jsonwebtoken";

export function verifyToken(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) throw new Error("Unauthorized");
  return jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
}
