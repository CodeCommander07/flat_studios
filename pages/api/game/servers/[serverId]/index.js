import { NextResponse } from "next/server";
import GameData from "@/models/GameData";
import dbConnect from "@/lib/dbConnect";

export async function GET(req, { params }) {
  await dbConnect();
  const { serverId } = params;

  const doc = await GameData.findOne({ serverId });
  if (!doc) return NextResponse.json(null);

  return NextResponse.json(doc);
}
