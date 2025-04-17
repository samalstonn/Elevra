import { NextRequest, NextResponse } from "next/server";
import { Client } from "postmark";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const client = new Client(process.env.POSTMARK_API_TOKEN!);

  try {
    await client.sendEmail({
      From: "adam@elevracommunity.com", // Must be a verified sender in Postmark
      To: body.to,
      Subject: body.subject,
      HtmlBody: body.html,
      TrackOpens: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Postmark Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
