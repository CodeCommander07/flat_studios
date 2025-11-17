import dbConnect from "@/utils/db";
import ModLog from "@/models/ModLog";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  await dbConnect();

  const log = await ModLog.create(req.body);

  res.status(200).json({ success: true, log });
}
