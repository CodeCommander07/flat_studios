import { NextResponse } from "next/server";
import GameData from "@/models/GameData";
import dbConnect from "@/lib/dbConnect";

export async function GET(req, { params }) {
  await dbConnect();
  const { serverId } = params;

  const doc = await GameData.findOne({ serverId });
  if (!doc) return NextResponse.json([]);

  const messages = doc.chat.filter((m) => m.type === "notification");

  // Clear notifications after sending
  doc.chat = doc.chat.filter((m) => m.type !== "notification");
  await doc.save();

  return NextResponse.json(messages);
}
