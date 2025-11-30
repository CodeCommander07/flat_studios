import { NextResponse } from "next/server";
import GameData from "@/models/GameData";
import dbConnect from "@/lib/dbConnect";

export async function GET(req, { params }) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("type") || "both";
  const { serverId } = params;

  const doc = await GameData.findOne({ serverId });
  if (!doc) return NextResponse.json([]);

  if (filter === "join")
    return NextResponse.json(doc.logs.filter((l) => l.type === "join"));

  if (filter === "leave")
    return NextResponse.json(doc.logs.filter((l) => l.type === "leave"));

  return NextResponse.json(doc.logs);
}

export async function POST(req, { params }) {
  await dbConnect();
  const { serverId } = params;
  const body = await req.json();

  let doc = await GameData.findOne({ serverId });
  if (!doc) doc = await GameData.create({ serverId });

  doc.logs.push(body);
  await doc.save();

  return NextResponse.json({ success: true });
}
