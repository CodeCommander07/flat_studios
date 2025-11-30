import { NextResponse } from "next/server";
import GameData from "@/models/GameData";
import dbConnect from "@/lib/dbConnect";

export async function GET(req, { params }) {
  await dbConnect();
  const { serverId } = params;

  const doc = await GameData.findOne({ serverId });
  if (!doc) return NextResponse.json([]);

  return NextResponse.json(doc.commands.filter((c) => !c.executed));
}

export async function POST(req, { params }) {
  await dbConnect();
  const { serverId } = params;
  const body = await req.json();

  let doc = await GameData.findOne({ serverId });
  if (!doc) doc = await GameData.create({ serverId });

  doc.commands.push(body);
  await doc.save();

  return NextResponse.json({ success: true });
}
