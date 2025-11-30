import { NextResponse } from "next/server";
import GameData from "@/models/GameData";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

export async function POST(req, { params }) {
  await dbConnect();
  const { serverId } = params;
  const { commandId } = await req.json();

  const doc = await GameData.findOne({ serverId });
  if (!doc) return NextResponse.json({ success: false });

  const cmd = doc.commands.id(commandId);
  if (cmd) cmd.executed = true;

  await doc.save();

  return NextResponse.json({ success: true });
}
