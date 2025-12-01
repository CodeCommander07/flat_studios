import { NextResponse } from "next/server";
import GameData from "@/models/GameData";
import dbConnect from "@/utils/db";

export default async function POST(req, { params }) {
  await dbConnect();
  const { serverId } = params;

  const { message, author } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  let doc = await GameData.findOne({ serverId });
  if (!doc) doc = await GameData.create({ serverId });

  // 1️⃣ Add to chat log (dashboard history)
  doc.chat.push({
    playerId: "WEB",
    username: author || "Dashboard",
    chatMessage: message,
    type: "notification",
    time: new Date(),
  });

  // 2️⃣ Add to audit logs
  doc.audit.push({
    action: "notification",
    targetId: "ALL_PLAYERS",
    targetName: "All Players",
    moderatorId: "WEB",
    moderatorName: author || "Dashboard",
    reason: message,
    scope: "server",
    createdAt: new Date(),
  });

  // 3️⃣ Add to GAME QUEUE (this is what Roblox reads!)
  doc.messagesForGame = doc.messagesForGame || [];
  doc.messagesForGame.push({
    chatMessage: message,
    author: author || "Dashboard",
    time: new Date(),
  });

  await doc.save();

  return NextResponse.json({ success: true });
}
