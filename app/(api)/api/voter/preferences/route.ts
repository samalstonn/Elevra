import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/prisma";
import {
  handleVoterError,
  requireVoterContext,
} from "@/lib/voter/context";
import { EmailMode } from "@prisma/client";

const payloadSchema = z.object({
  emailMode: z.enum(["immediate", "daily_digest", "off"]).optional(),
  notifyBio: z.boolean().optional(),
  notifyEducation: z.boolean().optional(),
  notifyPhoto: z.boolean().optional(),
  notifyCampaign: z.boolean().optional(),
  dailyDigestHour: z.number().int().min(0).max(23).optional(),
});

export async function GET() {
  try {
    const { preferences } = await requireVoterContext();
    return NextResponse.json({
      preferences: serialize(preferences),
    });
  } catch (error) {
    const { status, body } = handleVoterError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { voter } = await requireVoterContext();

    const data: Record<string, unknown> = {};
    if (parsed.data.emailMode) {
      data.emailMode = mapEmailMode(parsed.data.emailMode);
    }
    if (parsed.data.notifyBio !== undefined) data.notifyBio = parsed.data.notifyBio;
    if (parsed.data.notifyEducation !== undefined)
      data.notifyEducation = parsed.data.notifyEducation;
    if (parsed.data.notifyPhoto !== undefined) data.notifyPhoto = parsed.data.notifyPhoto;
    if (parsed.data.notifyCampaign !== undefined)
      data.notifyCampaign = parsed.data.notifyCampaign;
    if (parsed.data.dailyDigestHour !== undefined)
      data.dailyDigestHour = parsed.data.dailyDigestHour;

    const updated = await prisma.voterPreference.update({
      where: { voterId: voter.id },
      data,
    });

    return NextResponse.json({ preferences: serialize(updated) });
  } catch (error) {
    const { status, body } = handleVoterError(error);
    return NextResponse.json(body, { status });
  }
}

function mapEmailMode(value: "immediate" | "daily_digest" | "off"): EmailMode {
  switch (value) {
    case "immediate":
      return EmailMode.IMMEDIATE;
    case "daily_digest":
      return EmailMode.DAILY_DIGEST;
    case "off":
    default:
      return EmailMode.OFF;
  }
}

function serialize(pref: {
  emailMode: EmailMode;
  notifyBio: boolean;
  notifyEducation: boolean;
  notifyPhoto: boolean;
  notifyCampaign: boolean;
  dailyDigestHour: number | null;
  lastDigestSentAt: Date | null;
}) {
  return {
    emailMode: pref.emailMode,
    notifyBio: pref.notifyBio,
    notifyEducation: pref.notifyEducation,
    notifyPhoto: pref.notifyPhoto,
    notifyCampaign: pref.notifyCampaign,
    dailyDigestHour: pref.dailyDigestHour,
    lastDigestSentAt: pref.lastDigestSentAt,
  };
}
