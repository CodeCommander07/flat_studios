import { NextResponse } from "next/server";
import GameData from "@/models/GameData";
import dbConnect from "@/lib/dbConnect";

export async function GET(req, { params }) {
  await dbConnect();
  const { serverId } = params;

  const doc = await GameData.findOne({ serverId });
  if (!doc) return NextResponse.json([]);

  const sorted = [...doc.audit].sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json(sorted);
}

export async function POST(req, { params }) {
  await dbConnect();
  const { serverId } = params;
  const body = await req.json();

  let doc = await GameData.findOne({ serverId });
  if (!doc) doc = await GameData.create({ serverId });

  doc.audit.push({
    action: body.action,
    targetId: body.targetId,
    targetName: body.targetName,
    moderatorId: body.moderatorId,
    moderatorName: body.moderatorName,
    reason: body.reason,
    scope: body.scope,
    banType: body.banType,
    createdAt: new Date()
  });

  await doc.save();
  return NextResponse.json({ success: true });
}
